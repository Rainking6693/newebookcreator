/**
 * Subscription Service
 * Handles subscription management, billing, and usage tracking
 */

import Stripe from 'stripe';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { Analytics } from '../models/Analytics.js';

class SubscriptionService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    this.tiers = {
      basic: {
        name: 'Basic',
        price: 29.99,
        stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
        features: {
          wordLimit: 75000,
          aiGenerationsLimit: 500,
          exportsLimit: 10,
          booksLimit: 5,
          aiModels: ['claude'],
          marketResearch: false,
          collaboration: false,
          prioritySupport: false,
          revenueSharing: false
        }
      },
      pro: {
        name: 'Pro',
        price: 49.99,
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
        features: {
          wordLimit: 100000,
          aiGenerationsLimit: 1000,
          exportsLimit: 25,
          booksLimit: 15,
          aiModels: ['claude', 'gpt4'],
          marketResearch: true,
          collaboration: true,
          prioritySupport: false,
          revenueSharing: false
        }
      },
      author: {
        name: 'Author',
        price: 99.99,
        stripePriceId: process.env.STRIPE_AUTHOR_PRICE_ID,
        features: {
          wordLimit: 150000,
          aiGenerationsLimit: 2500,
          exportsLimit: 100,
          booksLimit: 50,
          aiModels: ['claude', 'gpt4', 'custom'],
          marketResearch: true,
          collaboration: true,
          prioritySupport: true,
          revenueSharing: true
        }
      }
    };
  }
  
  // Subscription Creation
  async createSubscription(userId, tierName, paymentMethodId, promoCode = null) {
    try {
      const user = await User.findById(userId);
      const tier = this.tiers[tierName];
      
      if (!user || !tier) {
        throw new Error('Invalid user or subscription tier');
      }
      
      // Check if user already has an active subscription
      const existingSubscription = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trialing'] }
      });
      
      if (existingSubscription) {
        throw new Error('User already has an active subscription');
      }
      
      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          metadata: { userId: userId.toString() }
        });
        
        stripeCustomerId = customer.id;
        await User.findByIdAndUpdate(userId, { stripeCustomerId });
      }
      
      // Attach payment method
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });
      
      // Apply promo code if provided
      let couponId = null;
      if (promoCode) {
        const coupon = await this.validatePromoCode(promoCode);
        couponId = coupon.id;
      }
      
      // Create Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: tier.stripePriceId }],
        default_payment_method: paymentMethodId,
        trial_period_days: 14, // 14-day free trial
        coupon: couponId,
        metadata: {
          userId: userId.toString(),
          tier: tierName
        }
      });
      
      // Create internal subscription record
      const subscription = await Subscription.create({
        userId,
        tier: tierName,
        status: 'trialing',
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        features: tier.features,
        usage: {
          wordQuotaUsed: 0,
          wordQuotaLimit: tier.features.wordLimit,
          aiGenerationsUsed: 0,
          aiGenerationsLimit: tier.features.aiGenerationsLimit,
          exportsUsed: 0,
          exportsLimit: tier.features.exportsLimit,
          resetDate: new Date(stripeSubscription.current_period_end * 1000)
        }
      });
      
      // Update user subscription reference
      await User.findByIdAndUpdate(userId, {
        'subscription.tier': tierName,
        'subscription.status': 'trialing'
      });
      
      // Track analytics
      await this.trackEvent(userId, 'subscription_created', {
        tier: tierName,
        trialDays: 14,
        price: tier.price
      });
      
      return subscription;
      
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw error;
    }
  }
  
  // Subscription Updates
  async updateSubscription(userId, newTier, immediate = false) {
    try {
      const subscription = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trialing'] }
      });
      
      if (!subscription) {
        throw new Error('No active subscription found');
      }
      
      const currentTier = this.tiers[subscription.tier];
      const targetTier = this.tiers[newTier];
      
      if (!targetTier) {
        throw new Error('Invalid subscription tier');
      }
      
      // Check if it's an upgrade or downgrade
      const isUpgrade = targetTier.price > currentTier.price;
      
      // Update Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [{
            id: subscription.stripeItemId,
            price: targetTier.stripePriceId
          }],
          proration_behavior: immediate ? 'create_prorations' : 'none',
          billing_cycle_anchor: immediate ? undefined : 'unchanged'
        }
      );
      
      // Calculate prorated amount
      const proratedAmount = immediate ? await this.calculateProration(subscription, targetTier) : 0;
      
      // Update internal subscription
      const updatedSubscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          $set: {
            tier: newTier,
            features: targetTier.features,
            'usage.wordQuotaLimit': targetTier.features.wordLimit,
            'usage.aiGenerationsLimit': targetTier.features.aiGenerationsLimit,
            'usage.exportsLimit': targetTier.features.exportsLimit
          },
          $push: {
            history: {
              action: isUpgrade ? 'upgrade' : 'downgrade',
              fromTier: subscription.tier,
              toTier: newTier,
              timestamp: new Date(),
              immediate,
              proratedAmount
            }
          }
        },
        { new: true }
      );
      
      // Update user subscription reference
      await User.findByIdAndUpdate(userId, {
        'subscription.tier': newTier
      });
      
      // Track analytics
      await this.trackEvent(userId, isUpgrade ? 'subscription_upgraded' : 'subscription_downgraded', {
        fromTier: subscription.tier,
        toTier: newTier,
        immediate,
        proratedAmount
      });
      
      return updatedSubscription;
      
    } catch (error) {
      console.error('Subscription update failed:', error);
      throw error;
    }
  }
  
  async cancelSubscription(userId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trialing'] }
      });
      
      if (!subscription) {
        throw new Error('No active subscription found');
      }
      
      // Update Stripe subscription
      if (cancelAtPeriodEnd) {
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
        
        // Update internal subscription
        await Subscription.findByIdAndUpdate(subscription._id, {
          $set: {
            cancelAtPeriodEnd: true,
            canceledAt: new Date()
          }
        });
        
      } else {
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        
        // Update internal subscription
        await Subscription.findByIdAndUpdate(subscription._id, {
          $set: {
            status: 'cancelled',
            canceledAt: new Date()
          }
        });
        
        // Update user subscription reference
        await User.findByIdAndUpdate(userId, {
          'subscription.status': 'cancelled'
        });
      }
      
      // Track analytics
      await this.trackEvent(userId, 'subscription_cancelled', {
        tier: subscription.tier,
        cancelAtPeriodEnd,
        reason: 'user_requested'
      });
      
      return { success: true, cancelAtPeriodEnd };
      
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      throw error;
    }
  }
  
  // Usage Tracking
  async trackUsage(userId, usageType, amount = 1) {
    try {
      const subscription = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trialing'] }
      });
      
      if (!subscription) {
        throw new Error('No active subscription found');
      }
      
      const usageField = `${usageType}Used`;
      const limitField = `${usageType}Limit`;
      
      const currentUsage = subscription.usage[usageField] || 0;
      const limit = subscription.usage[limitField] || 0;
      
      // Check if usage would exceed limit
      if (currentUsage + amount > limit) {
        throw new Error(`${usageType} quota exceeded. Current: ${currentUsage}, Limit: ${limit}`);
      }
      
      // Update usage
      const updatedSubscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          $inc: { [`usage.${usageField}`]: amount }
        },
        { new: true }
      );
      
      const newUsage = updatedSubscription.usage[usageField];
      
      // Send warning if approaching limit (80% threshold)
      if (newUsage / limit >= 0.8 && currentUsage / limit < 0.8) {
        await this.sendUsageWarning(userId, usageType, newUsage, limit);
      }
      
      // Track analytics
      await this.trackEvent(userId, 'usage_tracked', {
        usageType,
        amount,
        newTotal: newUsage,
        limit,
        percentageUsed: (newUsage / limit) * 100
      });
      
      return {
        usageType,
        currentUsage: newUsage,
        limit,
        remaining: limit - newUsage,
        percentageUsed: (newUsage / limit) * 100
      };
      
    } catch (error) {
      console.error('Usage tracking failed:', error);
      throw error;
    }
  }
  
  async getUsageStats(userId, period = '30d') {
    try {
      const subscription = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trialing'] }
      });
      
      if (!subscription) {
        throw new Error('No active subscription found');
      }
      
      // Get current usage
      const currentUsage = {
        wordQuota: {
          used: subscription.usage.wordQuotaUsed || 0,
          limit: subscription.usage.wordQuotaLimit || 0,
          percentage: ((subscription.usage.wordQuotaUsed || 0) / (subscription.usage.wordQuotaLimit || 1)) * 100
        },
        aiGenerations: {
          used: subscription.usage.aiGenerationsUsed || 0,
          limit: subscription.usage.aiGenerationsLimit || 0,
          percentage: ((subscription.usage.aiGenerationsUsed || 0) / (subscription.usage.aiGenerationsLimit || 1)) * 100
        },
        exports: {
          used: subscription.usage.exportsUsed || 0,
          limit: subscription.usage.exportsLimit || 0,
          percentage: ((subscription.usage.exportsUsed || 0) / (subscription.usage.exportsLimit || 1)) * 100
        }
      };
      
      // Get historical usage
      const startDate = this.getTimeframeStart(period);
      const historicalUsage = await Analytics.aggregate([
        {
          $match: {
            userId,
            timestamp: { $gte: startDate },
            eventType: 'usage_tracked'
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              usageType: '$eventData.usageType'
            },
            totalAmount: { $sum: '$eventData.amount' }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);
      
      return {
        current: currentUsage,
        historical: historicalUsage,
        resetDate: subscription.usage.resetDate,
        tier: subscription.tier
      };
      
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      throw error;
    }
  }
  
  async resetMonthlyUsage(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Calculate next reset date
      const nextResetDate = new Date(subscription.usage.resetDate);
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
      
      // Reset usage counters
      await Subscription.findByIdAndUpdate(subscriptionId, {
        $set: {
          'usage.wordQuotaUsed': 0,
          'usage.aiGenerationsUsed': 0,
          'usage.exportsUsed': 0,
          'usage.resetDate': nextResetDate
        }
      });
      
      // Track analytics
      await this.trackEvent(subscription.userId, 'usage_reset', {
        tier: subscription.tier,
        resetDate: nextResetDate
      });
      
      return { success: true, nextResetDate };
      
    } catch (error) {
      console.error('Usage reset failed:', error);
      throw error;
    }
  }
  
  // Billing and Payments
  async processPayment(subscriptionId, amount, description) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: subscription.stripeCustomerId,
        payment_method: subscription.defaultPaymentMethod,
        confirmation_method: 'automatic',
        confirm: true,
        description,
        metadata: {
          subscriptionId: subscriptionId.toString(),
          userId: subscription.userId.toString()
        }
      });
      
      // Record payment
      const payment = await Payment.create({
        userId: subscription.userId,
        subscriptionId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency: 'usd',
        status: paymentIntent.status,
        description,
        metadata: {
          tier: subscription.tier
        }
      });
      
      // Track analytics
      await this.trackEvent(subscription.userId, 'payment_processed', {
        amount,
        tier: subscription.tier,
        paymentIntentId: paymentIntent.id
      });
      
      return payment;
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }
  
  async handlePaymentFailure(subscriptionId, error) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        return;
      }
      
      // Update subscription status
      await Subscription.findByIdAndUpdate(subscriptionId, {
        $set: {
          status: 'past_due',
          lastPaymentError: error.message
        }
      });
      
      // Update user subscription reference
      await User.findByIdAndUpdate(subscription.userId, {
        'subscription.status': 'past_due'
      });
      
      // Track analytics
      await this.trackEvent(subscription.userId, 'payment_failed', {
        tier: subscription.tier,
        error: error.message
      });
      
      // Send notification email
      await this.sendPaymentFailureNotification(subscription.userId, error);
      
    } catch (err) {
      console.error('Failed to handle payment failure:', err);
    }
  }
  
  // Webhook Handlers
  async handleStripeWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
          
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object);
          break;
          
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
      
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }
  
  async handleSubscriptionUpdated(stripeSubscription) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });
    
    if (subscription) {
      await Subscription.findByIdAndUpdate(subscription._id, {
        $set: {
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
        }
      });
      
      // Update user subscription reference
      await User.findByIdAndUpdate(subscription.userId, {
        'subscription.status': stripeSubscription.status
      });
    }
  }
  
  async handlePaymentSucceeded(invoice) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });
    
    if (subscription) {
      // Update subscription status
      await Subscription.findByIdAndUpdate(subscription._id, {
        $set: {
          status: 'active',
          lastPaymentDate: new Date()
        },
        $unset: {
          lastPaymentError: 1
        }
      });
      
      // Update user subscription reference
      await User.findByIdAndUpdate(subscription.userId, {
        'subscription.status': 'active'
      });
      
      // Track analytics
      await this.trackEvent(subscription.userId, 'payment_succeeded', {
        amount: invoice.amount_paid / 100,
        tier: subscription.tier
      });
    }
  }
  
  // Utility Methods
  async validatePromoCode(promoCode) {
    try {
      const coupon = await this.stripe.coupons.retrieve(promoCode);
      
      if (!coupon.valid) {
        throw new Error('Invalid promo code');
      }
      
      return coupon;
      
    } catch (error) {
      throw new Error('Invalid promo code');
    }
  }
  
  async calculateProration(subscription, newTier) {
    const currentTier = this.tiers[subscription.tier];
    const priceDifference = newTier.price - currentTier.price;
    
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const periodStart = new Date(subscription.currentPeriodStart);
    
    const totalPeriodDays = (periodEnd - periodStart) / (1000 * 60 * 60 * 24);
    const remainingDays = (periodEnd - now) / (1000 * 60 * 60 * 24);
    
    const proratedAmount = (priceDifference * remainingDays) / totalPeriodDays;
    
    return Math.max(0, proratedAmount);
  }
  
  getTimeframeStart(period) {
    const now = new Date();
    
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
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
  
  async sendUsageWarning(userId, usageType, currentUsage, limit) {
    // Implementation would send email notification
    console.log(`Usage warning for user ${userId}: ${usageType} at ${currentUsage}/${limit}`);
  }
  
  async sendPaymentFailureNotification(userId, error) {
    // Implementation would send email notification
    console.log(`Payment failure notification for user ${userId}: ${error.message}`);
  }
}

export default SubscriptionService;