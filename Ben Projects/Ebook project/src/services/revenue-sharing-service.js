/**
 * Revenue Sharing Service
 * Handles revenue sharing agreements, sales tracking, and payouts
 */

import Stripe from 'stripe';
import { RevenueShare } from '../models/RevenueShare.js';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { Analytics } from '../models/Analytics.js';
import crypto from 'crypto';

class RevenueShareService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.defaultSplit = {
      authorPercentage: 70,
      platformPercentage: 30
    };
    this.minimumPayout = 100; // $100 minimum payout
    this.payoutSchedule = 'monthly'; // monthly, weekly, or on-demand
  }
  
  // Revenue Sharing Agreement Management
  async enableRevenueSharing(userId, bookId, agreementData = {}) {
    try {
      // Validate user eligibility (Author tier required)
      const user = await User.findById(userId).populate('subscription');
      
      if (!user.subscription || user.subscription.tier !== 'author') {
        throw new Error('Revenue sharing requires Author tier subscription');
      }
      
      // Validate book ownership
      const book = await Book.findOne({ _id: bookId, userId });
      if (!book) {
        throw new Error('Book not found or access denied');
      }
      
      // Check if revenue sharing already enabled
      const existingAgreement = await RevenueShare.findOne({ userId, bookId });
      if (existingAgreement && existingAgreement.enabled) {
        throw new Error('Revenue sharing already enabled for this book');
      }
      
      // Set up Stripe Connect account if needed
      if (!user.payoutInfo?.stripeAccountId) {
        const connectAccount = await this.setupStripeConnect(userId);
        user.payoutInfo = {
          stripeAccountId: connectAccount.accountId,
          setupComplete: false
        };
        await user.save();
      }
      
      // Create or update revenue sharing agreement
      const agreement = {
        signedAt: new Date(),
        version: '1.0',
        authorPercentage: agreementData.authorPercentage || this.defaultSplit.authorPercentage,
        platformPercentage: agreementData.platformPercentage || this.defaultSplit.platformPercentage,
        minimumPayout: agreementData.minimumPayout || this.minimumPayout,
        currency: 'USD'
      };
      
      const revenueShare = await RevenueShare.findOneAndUpdate(
        { userId, bookId },
        {
          userId,
          bookId,
          enabled: true,
          agreement,
          analytics: {
            totalSales: 0,
            totalEarnings: 0,
            totalPaidOut: 0,
            pendingEarnings: 0
          }
        },
        { upsert: true, new: true }
      );
      
      // Update book metadata
      await Book.findByIdAndUpdate(bookId, {
        'publishing.revenueSharing.enabled': true,
        'publishing.revenueSharing.agreementId': revenueShare._id,
        'publishing.revenueSharing.authorPercentage': agreement.authorPercentage
      });
      
      // Track analytics
      await this.trackEvent(userId, 'revenue_sharing_enabled', {
        bookId,
        authorPercentage: agreement.authorPercentage,
        minimumPayout: agreement.minimumPayout
      });
      
      return revenueShare;
      
    } catch (error) {
      console.error('Revenue sharing enablement failed:', error);
      throw error;
    }
  }
  
  async disableRevenueSharing(userId, bookId) {
    try {
      const revenueShare = await RevenueShare.findOne({ userId, bookId });
      
      if (!revenueShare) {
        throw new Error('Revenue sharing agreement not found');
      }
      
      // Check for pending earnings
      if (revenueShare.analytics.pendingEarnings > 0) {
        throw new Error('Cannot disable revenue sharing with pending earnings. Please wait for payout or contact support.');
      }
      
      // Disable revenue sharing
      await RevenueShare.findByIdAndUpdate(revenueShare._id, {
        enabled: false,
        disabledAt: new Date()
      });
      
      // Update book metadata
      await Book.findByIdAndUpdate(bookId, {
        'publishing.revenueSharing.enabled': false
      });
      
      // Track analytics
      await this.trackEvent(userId, 'revenue_sharing_disabled', {
        bookId,
        totalEarnings: revenueShare.analytics.totalEarnings
      });
      
      return { success: true, message: 'Revenue sharing disabled successfully' };
      
    } catch (error) {
      console.error('Revenue sharing disable failed:', error);
      throw error;
    }
  }
  
  // Sales Tracking
  async recordSale(saleData) {
    try {
      const { bookId, platform, grossAmount, platformFees = 0, metadata = {} } = saleData;
      
      // Find revenue sharing agreement
      const revenueShare = await RevenueShare.findOne({ 
        bookId, 
        enabled: true 
      });
      
      if (!revenueShare) {
        return null; // No revenue sharing for this book
      }
      
      // Calculate earnings split
      const netAmount = grossAmount - platformFees;
      const authorEarnings = netAmount * (revenueShare.agreement.authorPercentage / 100);
      const platformEarnings = netAmount * (revenueShare.agreement.platformPercentage / 100);
      
      // Create sale record
      const sale = {
        saleId: saleData.saleId || this.generateSaleId(),
        platform: platform || 'direct',
        saleDate: new Date(saleData.saleDate || Date.now()),
        grossAmount,
        platformFees,
        netAmount,
        authorEarnings,
        platformEarnings,
        currency: saleData.currency || 'USD',
        status: 'confirmed',
        metadata
      };
      
      // Add sale to revenue share record
      await RevenueShare.findByIdAndUpdate(revenueShare._id, {
        $push: { sales: sale },
        $inc: {
          'analytics.totalSales': netAmount,
          'analytics.totalEarnings': authorEarnings,
          'analytics.pendingEarnings': authorEarnings
        },
        'analytics.lastSaleDate': sale.saleDate,
        'analytics.averageSaleAmount': await this.calculateAverageSaleAmount(revenueShare._id, netAmount)
      });
      
      // Check if payout threshold reached
      await this.checkPayoutThreshold(revenueShare._id);
      
      // Track analytics
      await this.trackEvent(revenueShare.userId, 'sale_recorded', {
        bookId,
        platform,
        grossAmount,
        authorEarnings,
        saleId: sale.saleId
      });
      
      return sale;
      
    } catch (error) {
      console.error('Sale recording failed:', error);
      throw error;
    }
  }
  
  async recordManualSale(userId, saleData) {
    try {
      // Validate user ownership of book
      const book = await Book.findOne({ 
        _id: saleData.bookId, 
        userId 
      });
      
      if (!book) {
        throw new Error('Book not found or access denied');
      }
      
      // Add user verification to sale data
      const verifiedSaleData = {
        ...saleData,
        saleId: saleData.saleId || this.generateSaleId(),
        platform: saleData.platform || 'manual',
        metadata: {
          ...saleData.metadata,
          recordedBy: userId,
          recordedAt: new Date()
        }
      };
      
      return await this.recordSale(verifiedSaleData);
      
    } catch (error) {
      console.error('Manual sale recording failed:', error);
      throw error;
    }
  }
  
  // Payout Management
  async checkPayoutThreshold(revenueShareId) {
    try {
      const revenueShare = await RevenueShare.findById(revenueShareId);
      
      if (!revenueShare) {
        return;
      }
      
      if (revenueShare.analytics.pendingEarnings >= revenueShare.agreement.minimumPayout) {
        await this.initiatePayout(revenueShareId);
      }
      
    } catch (error) {
      console.error('Payout threshold check failed:', error);
    }
  }
  
  async initiatePayout(revenueShareId) {
    try {
      const revenueShare = await RevenueShare.findById(revenueShareId);
      const user = await User.findById(revenueShare.userId);
      
      if (!user.payoutInfo?.stripeAccountId) {
        throw new Error('Stripe Connect account not set up');
      }
      
      // Verify Stripe account is ready for payouts
      const account = await this.stripe.accounts.retrieve(user.payoutInfo.stripeAccountId);
      if (!account.payouts_enabled) {
        throw new Error('Stripe account not enabled for payouts');
      }
      
      // Get unpaid sales
      const unpaidSales = revenueShare.sales.filter(sale => 
        sale.status === 'confirmed' && 
        !revenueShare.payouts.some(payout => 
          payout.salesIncluded.includes(sale.saleId)
        )
      );
      
      const totalAmount = unpaidSales.reduce((sum, sale) => sum + sale.authorEarnings, 0);
      
      if (totalAmount < revenueShare.agreement.minimumPayout) {
        return null; // Below minimum payout threshold
      }
      
      // Create Stripe transfer
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        destination: user.payoutInfo.stripeAccountId,
        description: `Revenue share payout for ${user.email}`,
        metadata: {
          userId: user._id.toString(),
          revenueShareId: revenueShareId.toString(),
          bookId: revenueShare.bookId.toString()
        }
      });
      
      // Record payout
      const payoutRecord = {
        payoutId: transfer.id,
        amount: totalAmount,
        currency: 'USD',
        payoutDate: new Date(),
        method: 'stripe_transfer',
        status: 'processing',
        salesIncluded: unpaidSales.map(sale => sale.saleId),
        fees: 0, // Stripe Connect fees are handled automatically
        netAmount: totalAmount
      };
      
      // Update revenue share record
      await RevenueShare.findByIdAndUpdate(revenueShareId, {
        $push: { payouts: payoutRecord },
        $inc: {
          'analytics.pendingEarnings': -totalAmount,
          'analytics.totalPaidOut': totalAmount
        },
        'analytics.lastPayoutDate': new Date()
      });
      
      // Track analytics
      await this.trackEvent(revenueShare.userId, 'payout_initiated', {
        amount: totalAmount,
        payoutId: transfer.id,
        salesCount: unpaidSales.length
      });
      
      // Send notification email
      await this.sendPayoutNotification(user, payoutRecord);
      
      return payoutRecord;
      
    } catch (error) {
      console.error('Payout initiation failed:', error);
      throw error;
    }
  }
  
  async processScheduledPayouts() {
    try {
      // Find all revenue shares with pending earnings above threshold
      const eligiblePayouts = await RevenueShare.find({
        enabled: true,
        'analytics.pendingEarnings': { $gte: this.minimumPayout }
      });
      
      const results = [];
      
      for (const revenueShare of eligiblePayouts) {
        try {
          const payout = await this.initiatePayout(revenueShare._id);
          if (payout) {
            results.push({
              userId: revenueShare.userId,
              bookId: revenueShare.bookId,
              amount: payout.amount,
              status: 'success'
            });
          }
        } catch (error) {
          results.push({
            userId: revenueShare.userId,
            bookId: revenueShare.bookId,
            error: error.message,
            status: 'failed'
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Scheduled payout processing failed:', error);
      throw error;
    }
  }
  
  // Stripe Connect Setup
  async setupStripeConnect(userId) {
    try {
      const user = await User.findById(userId);
      
      // Create Stripe Connect account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: user.country || 'US',
        email: user.email,
        capabilities: {
          transfers: { requested: true }
        },
        business_type: 'individual',
        individual: {
          first_name: user.profile.firstName,
          last_name: user.profile.lastName,
          email: user.email
        }
      });
      
      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/settings/payouts?refresh=true`,
        return_url: `${process.env.FRONTEND_URL}/settings/payouts?success=true`,
        type: 'account_onboarding'
      });
      
      return {
        accountId: account.id,
        onboardingUrl: accountLink.url
      };
      
    } catch (error) {
      console.error('Stripe Connect setup failed:', error);
      throw error;
    }
  }
  
  // Analytics and Reporting
  async getRevenueShareAnalytics(userId, bookId = null, timeframe = '12m') {
    try {
      const query = { userId };
      if (bookId) query.bookId = bookId;
      
      const revenueShares = await RevenueShare.find(query);
      
      if (revenueShares.length === 0) {
        return {
          totalEarnings: 0,
          totalPaidOut: 0,
          pendingEarnings: 0,
          salesCount: 0,
          books: []
        };
      }
      
      const analytics = {
        totalEarnings: 0,
        totalPaidOut: 0,
        pendingEarnings: 0,
        salesCount: 0,
        averageSaleAmount: 0,
        books: []
      };
      
      for (const revenueShare of revenueShares) {
        analytics.totalEarnings += revenueShare.analytics.totalEarnings || 0;
        analytics.totalPaidOut += revenueShare.analytics.totalPaidOut || 0;
        analytics.pendingEarnings += revenueShare.analytics.pendingEarnings || 0;
        analytics.salesCount += revenueShare.sales.length;
        
        // Get book details
        const book = await Book.findById(revenueShare.bookId).select('title genre');
        
        analytics.books.push({
          bookId: revenueShare.bookId,
          title: book?.title || 'Unknown',
          genre: book?.genre || 'Unknown',
          earnings: revenueShare.analytics.totalEarnings || 0,
          paidOut: revenueShare.analytics.totalPaidOut || 0,
          pending: revenueShare.analytics.pendingEarnings || 0,
          salesCount: revenueShare.sales.length,
          lastSale: revenueShare.analytics.lastSaleDate,
          lastPayout: revenueShare.analytics.lastPayoutDate
        });
      }
      
      analytics.averageSaleAmount = analytics.salesCount > 0 ? 
        analytics.totalEarnings / analytics.salesCount : 0;
      
      return analytics;
      
    } catch (error) {
      console.error('Revenue share analytics failed:', error);
      throw error;
    }
  }
  
  async getSalesHistory(userId, bookId, limit = 50, offset = 0) {
    try {
      const revenueShare = await RevenueShare.findOne({ userId, bookId });
      
      if (!revenueShare) {
        return { sales: [], total: 0 };
      }
      
      const sales = revenueShare.sales
        .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
        .slice(offset, offset + limit);
      
      return {
        sales,
        total: revenueShare.sales.length,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < revenueShare.sales.length
        }
      };
      
    } catch (error) {
      console.error('Sales history retrieval failed:', error);
      throw error;
    }
  }
  
  async getPayoutHistory(userId, limit = 20, offset = 0) {
    try {
      const revenueShares = await RevenueShare.find({ userId });
      
      let allPayouts = [];
      
      for (const revenueShare of revenueShares) {
        const book = await Book.findById(revenueShare.bookId).select('title');
        
        const payouts = revenueShare.payouts.map(payout => ({
          ...payout.toObject(),
          bookTitle: book?.title || 'Unknown',
          bookId: revenueShare.bookId
        }));
        
        allPayouts.push(...payouts);
      }
      
      // Sort by payout date
      allPayouts.sort((a, b) => new Date(b.payoutDate) - new Date(a.payoutDate));
      
      const paginatedPayouts = allPayouts.slice(offset, offset + limit);
      
      return {
        payouts: paginatedPayouts,
        total: allPayouts.length,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < allPayouts.length
        }
      };
      
    } catch (error) {
      console.error('Payout history retrieval failed:', error);
      throw error;
    }
  }
  
  // Utility Methods
  generateSaleId() {
    return `sale_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  async calculateAverageSaleAmount(revenueShareId, newSaleAmount) {
    const revenueShare = await RevenueShare.findById(revenueShareId);
    const totalSales = revenueShare.sales.length + 1; // Including new sale
    const currentTotal = (revenueShare.analytics.averageSaleAmount || 0) * (totalSales - 1);
    
    return (currentTotal + newSaleAmount) / totalSales;
  }
  
  async trackEvent(userId, eventType, eventData) {
    try {
      await Analytics.create({
        userId,
        eventType,
        eventData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
  
  async sendPayoutNotification(user, payoutRecord) {
    // Implementation would send email notification
    console.log(`Payout notification sent to ${user.email}: $${payoutRecord.amount}`);
  }
}

export default RevenueShareService;