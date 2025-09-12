# Revenue Sharing System - Hybrid Payment Model

## Revenue Sharing Overview

### Hybrid Model Strategy
Our innovative revenue sharing system combines upfront subscription fees with performance-based revenue sharing, aligning platform success with author success.

```
Revenue Model Components:
├── Upfront Subscription Fee (Monthly)
│   ├── Basic: $29.99/month
│   ├── Pro: $49.99/month
│   └── Author: $99.99/month
│
└── Revenue Sharing (Optional)
    ├── Author Keeps: 70% of net sales
    ├── Platform Takes: 30% of net sales
    ├── Minimum Payout: $100
    └── Payment Schedule: Monthly
```

### Value Proposition
- **For Authors**: Lower upfront costs, higher earning potential
- **For Platform**: Recurring revenue + performance-based income
- **Market Differentiation**: Unique model in AI writing space

## Revenue Sharing Architecture

### Database Schema
```javascript
const revenueShareSchema = {
  userId: ObjectId,
  bookId: ObjectId,
  enabled: { type: Boolean, default: false },
  
  // Agreement Details
  agreement: {
    signedAt: Date,
    version: String, // Terms version
    authorPercentage: { type: Number, default: 70 },
    platformPercentage: { type: Number, default: 30 },
    minimumPayout: { type: Number, default: 100 },
    currency: { type: String, default: 'USD' }
  },
  
  // Sales Tracking
  sales: [{
    saleId: String, // External platform sale ID
    platform: String, // 'amazon', 'direct', 'other'
    saleDate: Date,
    grossAmount: Number,
    platformFees: Number, // Amazon's cut, etc.
    netAmount: Number, // After platform fees
    authorEarnings: Number, // 70% of net
    platformEarnings: Number, // 30% of net
    currency: String,
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'disputed', 'refunded'],
      default: 'pending'
    },
    metadata: {
      orderId: String,
      customerLocation: String,
      bookFormat: String // ebook, paperback, etc.
    }
  }],
  
  // Payout Tracking
  payouts: [{
    payoutId: String,
    amount: Number,
    currency: String,
    payoutDate: Date,
    method: String, // 'stripe', 'paypal', 'bank_transfer'
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    salesIncluded: [String], // Array of saleIds
    fees: Number, // Payment processing fees
    netAmount: Number // Amount after fees
  }],
  
  // Analytics
  analytics: {
    totalSales: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalPaidOut: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
    averageSaleAmount: { type: Number, default: 0 },
    lastSaleDate: Date,
    lastPayoutDate: Date
  },
  
  // Tax Information
  taxInfo: {
    w9Submitted: { type: Boolean, default: false },
    w9SubmittedAt: Date,
    taxId: String, // Encrypted
    businessType: String,
    requiresWithholding: { type: Boolean, default: false },
    withholdingRate: { type: Number, default: 0 }
  }
};
```

### Revenue Sharing Service
```javascript
class RevenueShareService {
  async enableRevenueSharing(userId, bookId, agreementData) {
    try {
      // Validate user eligibility
      const user = await User.findById(userId);
      const subscription = await Subscription.findOne({ userId, status: 'active' });
      
      if (!subscription || subscription.tier !== 'author') {
        throw new Error('Revenue sharing requires Author tier subscription');
      }
      
      // Create revenue sharing agreement
      const revenueShare = await RevenueShare.create({
        userId,
        bookId,
        enabled: true,
        agreement: {
          signedAt: new Date(),
          version: '1.0',
          ...agreementData
        }
      });
      
      // Update book metadata
      await Book.findByIdAndUpdate(bookId, {
        'publishing.revenueSharing.enabled': true,
        'publishing.revenueSharing.agreementId': revenueShare._id
      });
      
      // Send confirmation email
      await this.sendRevenueShareConfirmation(user, revenueShare);
      
      return revenueShare;
      
    } catch (error) {
      console.error('Revenue sharing enablement failed:', error);
      throw error;
    }
  }
  
  async recordSale(bookId, saleData) {
    const revenueShare = await RevenueShare.findOne({ 
      bookId, 
      enabled: true 
    });
    
    if (!revenueShare) {
      return null; // No revenue sharing for this book
    }
    
    // Calculate earnings split
    const netAmount = saleData.grossAmount - (saleData.platformFees || 0);
    const authorEarnings = netAmount * (revenueShare.agreement.authorPercentage / 100);
    const platformEarnings = netAmount * (revenueShare.agreement.platformPercentage / 100);
    
    const sale = {
      saleId: saleData.saleId,
      platform: saleData.platform,
      saleDate: new Date(saleData.saleDate),
      grossAmount: saleData.grossAmount,
      platformFees: saleData.platformFees || 0,
      netAmount,
      authorEarnings,
      platformEarnings,
      currency: saleData.currency || 'USD',
      status: 'confirmed',
      metadata: saleData.metadata || {}
    };
    
    // Add sale to revenue share record
    await RevenueShare.findByIdAndUpdate(revenueShare._id, {
      $push: { sales: sale },
      $inc: {
        'analytics.totalSales': netAmount,
        'analytics.totalEarnings': authorEarnings,
        'analytics.pendingEarnings': authorEarnings
      },
      'analytics.lastSaleDate': sale.saleDate
    });
    
    // Check if payout threshold reached
    await this.checkPayoutThreshold(revenueShare._id);
    
    return sale;
  }
  
  async checkPayoutThreshold(revenueShareId) {
    const revenueShare = await RevenueShare.findById(revenueShareId);
    
    if (revenueShare.analytics.pendingEarnings >= revenueShare.agreement.minimumPayout) {
      await this.initiatePayout(revenueShareId);
    }
  }
  
  async initiatePayout(revenueShareId) {
    const revenueShare = await RevenueShare.findById(revenueShareId);
    const user = await User.findById(revenueShare.userId);
    
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
    
    try {
      // Process payout via Stripe
      const payout = await this.processStripePayout(user, totalAmount);
      
      // Record payout
      const payoutRecord = {
        payoutId: payout.id,
        amount: totalAmount,
        currency: 'USD',
        payoutDate: new Date(),
        method: 'stripe',
        status: 'processing',
        salesIncluded: unpaidSales.map(sale => sale.saleId),
        fees: payout.fees || 0,
        netAmount: totalAmount - (payout.fees || 0)
      };
      
      await RevenueShare.findByIdAndUpdate(revenueShareId, {
        $push: { payouts: payoutRecord },
        $inc: {
          'analytics.pendingEarnings': -totalAmount,
          'analytics.totalPaidOut': totalAmount
        },
        'analytics.lastPayoutDate': new Date()
      });
      
      // Send payout notification
      await this.sendPayoutNotification(user, payoutRecord);
      
      return payoutRecord;
      
    } catch (error) {
      console.error('Payout processing failed:', error);
      throw error;
    }
  }
}
```

## Sales Integration System

### Multi-Platform Sales Tracking
```javascript
const salesIntegration = {
  // Amazon KDP Integration (Future)
  async syncAmazonSales(userId) {
    // This would integrate with Amazon's API when available
    const amazonSales = await this.fetchAmazonSales(userId);
    
    for (const sale of amazonSales) {
      await this.processSale({
        platform: 'amazon',
        saleId: sale.orderId,
        bookId: sale.asin, // Would map to our bookId
        grossAmount: sale.royalty,
        platformFees: sale.amazonFee,
        saleDate: sale.saleDate,
        metadata: {
          orderId: sale.orderId,
          customerLocation: sale.customerLocation,
          bookFormat: sale.format
        }
      });
    }
  },
  
  // Direct Sales (Our Platform)
  async recordDirectSale(bookId, purchaseData) {
    const sale = {
      platform: 'direct',
      saleId: purchaseData.paymentIntentId,
      bookId,
      grossAmount: purchaseData.amount,
      platformFees: purchaseData.stripeFee,
      saleDate: new Date(),
      metadata: {
        customerId: purchaseData.customerId,
        bookFormat: purchaseData.format
      }
    };
    
    await revenueShareService.recordSale(bookId, sale);
  },
  
  // Manual Sales Entry
  async recordManualSale(userId, saleData) {
    // Validate user permission
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Validate book ownership
    const book = await Book.findOne({ 
      _id: saleData.bookId, 
      userId 
    });
    if (!book) throw new Error('Book not found or not owned by user');
    
    const sale = {
      ...saleData,
      platform: saleData.platform || 'manual',
      saleId: saleData.saleId || this.generateSaleId(),
      saleDate: new Date(saleData.saleDate || Date.now())
    };
    
    await revenueShareService.recordSale(saleData.bookId, sale);
  }
};
```

## Payout Processing System

### Stripe Connect Integration
```javascript
const payoutProcessor = {
  async setupStripeConnect(userId) {
    const user = await User.findById(userId);
    
    // Create Stripe Connect account
    const account = await stripe.accounts.create({
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
    
    // Save account ID
    await User.findByIdAndUpdate(userId, {
      'payoutInfo.stripeAccountId': account.id,
      'payoutInfo.setupComplete': false
    });
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/settings/payouts?refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/settings/payouts?success=true`,
      type: 'account_onboarding'
    });
    
    return {
      accountId: account.id,
      onboardingUrl: accountLink.url
    };
  },
  
  async processStripePayout(user, amount) {
    if (!user.payoutInfo?.stripeAccountId) {
      throw new Error('Stripe Connect account not set up');
    }
    
    // Check account status
    const account = await stripe.accounts.retrieve(user.payoutInfo.stripeAccountId);
    if (!account.charges_enabled) {
      throw new Error('Stripe account not fully set up');
    }
    
    // Create transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: user.payoutInfo.stripeAccountId,
      description: `Revenue share payout for ${user.email}`,
      metadata: {
        userId: user._id.toString(),
        type: 'revenue_share'
      }
    });
    
    return {
      id: transfer.id,
      amount: amount,
      fees: 0, // Stripe Connect fees are handled automatically
      status: 'processing'
    };
  }
};
```

## Tax Compliance System

### 1099 Generation and Reporting
```javascript
const taxCompliance = {
  async collect1099Info(userId, taxData) {
    const user = await User.findById(userId);
    
    // Validate required information
    const requiredFields = ['taxId', 'businessType', 'address'];
    const missingFields = requiredFields.filter(field => !taxData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Encrypt sensitive data
    const encryptedTaxId = await this.encryptTaxId(taxData.taxId);
    
    // Update user tax information
    await User.findByIdAndUpdate(userId, {
      'taxInfo.taxId': encryptedTaxId,
      'taxInfo.businessType': taxData.businessType,
      'taxInfo.address': taxData.address,
      'taxInfo.w9Submitted': true,
      'taxInfo.w9SubmittedAt': new Date()
    });
    
    // Update all revenue share records
    await RevenueShare.updateMany(
      { userId },
      {
        'taxInfo.w9Submitted': true,
        'taxInfo.w9SubmittedAt': new Date(),
        'taxInfo.businessType': taxData.businessType
      }
    );
  },
  
  async generate1099Forms(taxYear) {
    const cutoffDate = new Date(`${taxYear}-12-31`);
    const minimumReporting = 600; // $600 minimum for 1099 reporting
    
    // Find all users who earned over $600 in the tax year
    const eligibleUsers = await RevenueShare.aggregate([
      {
        $match: {
          'payouts.payoutDate': {
            $gte: new Date(`${taxYear}-01-01`),
            $lte: cutoffDate
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalEarnings: {
            $sum: {
              $sum: '$payouts.amount'
            }
          }
        }
      },
      {
        $match: {
          totalEarnings: { $gte: minimumReporting }
        }
      }
    ]);
    
    const forms = [];
    
    for (const userEarnings of eligibleUsers) {
      const user = await User.findById(userEarnings._id);
      const revenueShares = await RevenueShare.find({ userId: userEarnings._id });
      
      const form1099 = {
        taxYear,
        recipientTaxId: await this.decryptTaxId(user.taxInfo.taxId),
        recipientName: `${user.profile.firstName} ${user.profile.lastName}`,
        recipientAddress: user.taxInfo.address,
        payerTaxId: process.env.COMPANY_TAX_ID,
        payerName: 'AI Ebook Platform Inc.',
        payerAddress: process.env.COMPANY_ADDRESS,
        totalEarnings: userEarnings.totalEarnings,
        formType: '1099-NEC',
        box1: userEarnings.totalEarnings // Nonemployee compensation
      };
      
      forms.push(form1099);
    }
    
    return forms;
  },
  
  async submitToIRS(forms) {
    // This would integrate with IRS e-filing system
    // For now, generate files for manual submission
    const submissionData = {
      submissionId: this.generateSubmissionId(),
      submissionDate: new Date(),
      formCount: forms.length,
      totalAmount: forms.reduce((sum, form) => sum + form.totalEarnings, 0),
      forms
    };
    
    // Save submission record
    await TaxSubmission.create(submissionData);
    
    return submissionData;
  }
};
```

## Revenue Analytics & Reporting

### Author Dashboard Analytics
```javascript
const revenueAnalytics = {
  async getAuthorDashboard(userId, timeframe = '12m') {
    const revenueShares = await RevenueShare.find({ userId });
    const startDate = this.getTimeframeStart(timeframe);
    
    const analytics = {
      overview: await this.getOverviewMetrics(userId, startDate),
      salesTrends: await this.getSalesTrends(userId, startDate),
      bookPerformance: await this.getBookPerformance(userId, startDate),
      payoutHistory: await this.getPayoutHistory(userId, startDate),
      projections: await this.getEarningsProjections(userId)
    };
    
    return analytics;
  },
  
  async getOverviewMetrics(userId, startDate) {
    const pipeline = [
      { $match: { userId: new ObjectId(userId) } },
      { $unwind: '$sales' },
      { $match: { 'sales.saleDate': { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$sales.netAmount' },
          totalEarnings: { $sum: '$sales.authorEarnings' },
          salesCount: { $sum: 1 },
          averageSale: { $avg: '$sales.netAmount' }
        }
      }
    ];
    
    const result = await RevenueShare.aggregate(pipeline);
    
    return result[0] || {
      totalSales: 0,
      totalEarnings: 0,
      salesCount: 0,
      averageSale: 0
    };
  },
  
  async getSalesTrends(userId, startDate) {
    const pipeline = [
      { $match: { userId: new ObjectId(userId) } },
      { $unwind: '$sales' },
      { $match: { 'sales.saleDate': { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$sales.saleDate' },
            month: { $month: '$sales.saleDate' }
          },
          sales: { $sum: '$sales.netAmount' },
          earnings: { $sum: '$sales.authorEarnings' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];
    
    return await RevenueShare.aggregate(pipeline);
  },
  
  async getEarningsProjections(userId) {
    const historicalData = await this.getSalesTrends(userId, this.getTimeframeStart('6m'));
    
    if (historicalData.length < 3) {
      return { insufficient_data: true };
    }
    
    // Simple linear projection based on recent trends
    const recentMonths = historicalData.slice(-3);
    const averageMonthlyEarnings = recentMonths.reduce((sum, month) => sum + month.earnings, 0) / recentMonths.length;
    
    return {
      nextMonth: averageMonthlyEarnings,
      next3Months: averageMonthlyEarnings * 3,
      nextYear: averageMonthlyEarnings * 12,
      confidence: this.calculateProjectionConfidence(historicalData)
    };
  }
};
```

## Platform Revenue Analytics

### Business Intelligence Dashboard
```javascript
const platformAnalytics = {
  async getRevenueShareMetrics(timeframe = '12m') {
    const startDate = this.getTimeframeStart(timeframe);
    
    const metrics = {
      totalRevenue: await this.getTotalPlatformRevenue(startDate),
      revenueShareRevenue: await this.getRevenueShareRevenue(startDate),
      subscriptionRevenue: await this.getSubscriptionRevenue(startDate),
      authorPayouts: await this.getTotalAuthorPayouts(startDate),
      participationRate: await this.getRevenueShareParticipation(),
      topPerformingBooks: await this.getTopPerformingBooks(startDate)
    };
    
    return metrics;
  },
  
  async getRevenueShareRevenue(startDate) {
    const pipeline = [
      { $unwind: '$sales' },
      { $match: { 'sales.saleDate': { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalPlatformEarnings: { $sum: '$sales.platformEarnings' },
          totalSales: { $sum: '$sales.netAmount' },
          salesCount: { $sum: 1 }
        }
      }
    ];
    
    const result = await RevenueShare.aggregate(pipeline);
    return result[0] || { totalPlatformEarnings: 0, totalSales: 0, salesCount: 0 };
  },
  
  async getRevenueShareParticipation() {
    const totalAuthors = await User.countDocuments({ 
      'subscription.tier': 'author' 
    });
    
    const participatingAuthors = await RevenueShare.countDocuments({ 
      enabled: true 
    });
    
    return {
      totalEligible: totalAuthors,
      participating: participatingAuthors,
      participationRate: totalAuthors > 0 ? (participatingAuthors / totalAuthors) * 100 : 0
    };
  }
};
```

---

*Revenue Sharing System Version 1.0*
*Last Updated: January 15, 2024*
*Next Phase: Integration testing and compliance validation*