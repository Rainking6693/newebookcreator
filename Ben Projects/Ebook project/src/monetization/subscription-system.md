# Subscription Tier Management System

## Subscription Model Overview

### Three-Tier Strategy
Our subscription model is designed to serve different user segments while maximizing revenue and user satisfaction. Each tier provides clear value progression and encourages upgrades.

```
Basic Tier ($29.99/month)
├── Target: Aspiring authors, hobbyists
├── Word Limit: 75,000 words/month
├── Features: Core AI generation, basic templates
└── Value Prop: Affordable entry point

Pro Tier ($49.99/month) [MOST POPULAR]
├── Target: Serious writers, self-help coaches
├── Word Limit: 100,000 words/month
├── Features: Advanced AI, market research, collaboration
└── Value Prop: Professional writing tools

Author Tier ($99.99/month)
├── Target: Professional authors, businesses
├── Word Limit: 150,000 words/month
├── Features: Everything + revenue sharing, priority support
└── Value Prop: Complete publishing solution
```

## Subscription Management Architecture

### Database Schema
```javascript
const subscriptionSchema = {
  userId: ObjectId,
  tier: {
    type: String,
    enum: ['basic', 'pro', 'author'],
    default: 'basic'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'trialing', 'paused'],
    default: 'trialing'
  },
  billing: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean,
    trialEnd: Date,
    paymentMethodId: String
  },
  usage: {
    wordQuotaUsed: { type: Number, default: 0 },
    wordQuotaLimit: Number,
    aiGenerationsUsed: { type: Number, default: 0 },
    aiGenerationsLimit: Number,
    exportsUsed: { type: Number, default: 0 },
    exportsLimit: Number,
    resetDate: Date
  },
  features: {
    aiModels: [String],
    templates: [String],
    marketResearch: Boolean,
    collaboration: Boolean,
    prioritySupport: Boolean,
    revenueSharing: Boolean,
    customBranding: Boolean
  },
  history: [{
    action: String, // upgrade, downgrade, cancel, reactivate
    fromTier: String,
    toTier: String,
    timestamp: Date,
    reason: String
  }]
};
```

### Tier Configuration System
```javascript
const tierConfigurations = {
  basic: {
    name: 'Basic',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    features: {
      wordLimit: 75000,
      aiGenerationsLimit: 500,
      exportsLimit: 10,
      aiModels: ['claude'],
      templates: ['basic_mystery', 'basic_selfhelp'],
      marketResearch: false,
      collaboration: false,
      prioritySupport: false,
      revenueSharing: false,
      customBranding: false,
      analytics: 'basic'
    },
    limits: {
      booksPerMonth: 5,
      chaptersPerBook: 50,
      collaboratorsPerBook: 0,
      exportFormats: ['pdf', 'docx'],
      supportResponseTime: '48 hours'
    }
  },
  
  pro: {
    name: 'Pro',
    price: 49.99,
    currency: 'USD',
    interval: 'month',
    popular: true,
    features: {
      wordLimit: 100000,
      aiGenerationsLimit: 1000,
      exportsLimit: 25,
      aiModels: ['claude', 'gpt4'],
      templates: ['all_mystery', 'all_selfhelp', 'advanced_templates'],
      marketResearch: true,
      collaboration: true,
      prioritySupport: false,
      revenueSharing: false,
      customBranding: false,
      analytics: 'advanced'
    },
    limits: {
      booksPerMonth: 15,
      chaptersPerBook: 100,
      collaboratorsPerBook: 3,
      exportFormats: ['pdf', 'docx', 'epub'],
      supportResponseTime: '24 hours'
    }
  },
  
  author: {
    name: 'Author',
    price: 99.99,
    currency: 'USD',
    interval: 'month',
    features: {
      wordLimit: 150000,
      aiGenerationsLimit: 2500,
      exportsLimit: 100,
      aiModels: ['claude', 'gpt4', 'custom'],
      templates: ['all_templates', 'custom_templates'],
      marketResearch: true,
      collaboration: true,
      prioritySupport: true,
      revenueSharing: true,
      customBranding: true,
      analytics: 'professional'
    },
    limits: {
      booksPerMonth: 50,
      chaptersPerBook: 200,
      collaboratorsPerBook: 10,
      exportFormats: ['pdf', 'docx', 'epub', 'html', 'print'],
      supportResponseTime: '4 hours'
    }
  }
};
```

## Subscription Lifecycle Management

### Subscription Creation Flow
```javascript
const subscriptionManager = {
  async createSubscription(userId, tierName, paymentMethodId, promoCode = null) {
    try {
      // 1. Validate user and tier
      const user = await User.findById(userId);
      const tier = tierConfigurations[tierName];
      
      if (!user || !tier) {
        throw new Error('Invalid user or tier');
      }
      
      // 2. Apply promotional pricing if applicable
      const pricing = await this.calculatePricing(tier, promoCode);
      
      // 3. Create Stripe customer if needed
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          metadata: { userId: userId.toString() }
        });
        stripeCustomerId = customer.id;
        await User.findByIdAndUpdate(userId, { stripeCustomerId });
      }
      
      // 4. Attach payment method
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });
      
      // 5. Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: pricing.stripePriceId }],
        default_payment_method: paymentMethodId,
        trial_period_days: 14, // 14-day free trial
        metadata: {
          userId: userId.toString(),
          tier: tierName
        }
      });
      
      // 6. Create internal subscription record
      const subscription = await this.createInternalSubscription({
        userId,
        tier: tierName,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        status: 'trialing',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEnd: new Date(stripeSubscription.trial_end * 1000)
      });
      
      // 7. Initialize usage tracking
      await this.initializeUsageTracking(subscription);
      
      // 8. Send welcome email
      await this.sendWelcomeEmail(user, subscription);
      
      return subscription;
      
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw error;
    }
  },
  
  async calculatePricing(tier, promoCode) {
    let price = tier.price;
    let discount = 0;
    
    if (promoCode) {
      const promo = await this.validatePromoCode(promoCode);
      if (promo.valid) {
        discount = promo.discountAmount;
        price = Math.max(0, price - discount);
      }
    }
    
    return {
      originalPrice: tier.price,
      finalPrice: price,
      discount,
      stripePriceId: tier.stripePriceId
    };
  }
};
```

### Usage Tracking System
```javascript
const usageTracker = {
  async trackUsage(userId, usageType, amount = 1) {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      throw new Error('No active subscription found');
    }
    
    const usageField = this.getUsageField(usageType);
    const limitField = this.getLimitField(usageType);
    
    // Check if usage would exceed limit
    const currentUsage = subscription.usage[usageField] || 0;
    const limit = subscription.usage[limitField];
    
    if (currentUsage + amount > limit) {
      throw new Error(`Usage limit exceeded for ${usageType}`);
    }
    
    // Update usage
    await Subscription.findByIdAndUpdate(subscription._id, {
      $inc: { [`usage.${usageField}`]: amount }
    });
    
    // Check if approaching limit (80% threshold)
    const newUsage = currentUsage + amount;
    if (newUsage / limit >= 0.8) {
      await this.sendUsageWarning(userId, usageType, newUsage, limit);
    }
    
    return {
      usageType,
      currentUsage: newUsage,
      limit,
      percentageUsed: (newUsage / limit) * 100
    };
  },
  
  async resetMonthlyUsage(subscriptionId) {
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1); // First day of next month
    
    await Subscription.findByIdAndUpdate(subscriptionId, {
      'usage.wordQuotaUsed': 0,
      'usage.aiGenerationsUsed': 0,
      'usage.exportsUsed': 0,
      'usage.resetDate': resetDate
    });
  },
  
  async getUsageAnalytics(userId, timeframe = '30d') {
    const subscription = await this.getUserSubscription(userId);
    const analytics = await Analytics.aggregate([
      {
        $match: {
          userId: new ObjectId(userId),
          timestamp: {
            $gte: this.getTimeframeStart(timeframe)
          }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          totalWords: { $sum: '$eventData.wordCount' }
        }
      }
    ]);
    
    return {
      currentPeriod: subscription.usage,
      historical: analytics,
      projectedUsage: this.calculateProjectedUsage(analytics),
      recommendations: this.generateUsageRecommendations(subscription, analytics)
    };
  }
};
```

## Subscription Upgrade/Downgrade System

### Tier Change Management
```javascript
const tierManager = {
  async upgradeTier(userId, newTier, immediate = false) {
    const currentSubscription = await this.getUserSubscription(userId);
    const newTierConfig = tierConfigurations[newTier];
    
    if (!currentSubscription || !newTierConfig) {
      throw new Error('Invalid subscription or tier');
    }
    
    // Calculate prorated pricing
    const proratedAmount = await this.calculateProration(
      currentSubscription,
      newTierConfig,
      immediate
    );
    
    try {
      // Update Stripe subscription
      const stripeSubscription = await stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [{
            id: currentSubscription.stripeItemId,
            price: newTierConfig.stripePriceId
          }],
          proration_behavior: immediate ? 'create_prorations' : 'none',
          billing_cycle_anchor: immediate ? undefined : 'unchanged'
        }
      );
      
      // Update internal subscription
      await Subscription.findByIdAndUpdate(currentSubscription._id, {
        tier: newTier,
        'features': newTierConfig.features,
        'usage.wordQuotaLimit': newTierConfig.features.wordLimit,
        'usage.aiGenerationsLimit': newTierConfig.features.aiGenerationsLimit,
        'usage.exportsLimit': newTierConfig.features.exportsLimit,
        $push: {
          history: {
            action: 'upgrade',
            fromTier: currentSubscription.tier,
            toTier: newTier,
            timestamp: new Date(),
            immediate,
            proratedAmount
          }
        }
      });
      
      // Send confirmation email
      await this.sendTierChangeConfirmation(userId, 'upgrade', newTier);
      
      return {
        success: true,
        newTier,
        proratedAmount,
        effectiveDate: immediate ? new Date() : new Date(stripeSubscription.current_period_end * 1000)
      };
      
    } catch (error) {
      console.error('Tier upgrade failed:', error);
      throw error;
    }
  },
  
  async downgradeTier(userId, newTier, immediate = false) {
    const currentSubscription = await this.getUserSubscription(userId);
    const newTierConfig = tierConfigurations[newTier];
    
    // Check if current usage exceeds new tier limits
    const usageCheck = await this.checkUsageCompatibility(
      currentSubscription,
      newTierConfig
    );
    
    if (!usageCheck.compatible) {
      return {
        success: false,
        error: 'Current usage exceeds new tier limits',
        conflicts: usageCheck.conflicts,
        recommendations: usageCheck.recommendations
      };
    }
    
    // Process downgrade (similar to upgrade but with different logic)
    // Downgrades typically take effect at the end of the current billing period
    const effectiveDate = immediate ? new Date() : 
      new Date(currentSubscription.currentPeriodEnd);
    
    await this.scheduleDowngrade(currentSubscription, newTier, effectiveDate);
    
    return {
      success: true,
      newTier,
      effectiveDate,
      refundAmount: immediate ? await this.calculateRefund(currentSubscription, newTierConfig) : 0
    };
  }
};
```

## Billing & Payment Management

### Payment Processing
```javascript
const billingManager = {
  async processPayment(subscriptionId, amount, description) {
    const subscription = await Subscription.findById(subscriptionId);
    
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: subscription.billing.stripeCustomerId,
        payment_method: subscription.billing.paymentMethodId,
        confirmation_method: 'automatic',
        confirm: true,
        description,
        metadata: {
          subscriptionId: subscriptionId.toString(),
          userId: subscription.userId.toString()
        }
      });
      
      // Record payment in database
      await this.recordPayment({
        userId: subscription.userId,
        subscriptionId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        status: paymentIntent.status,
        description
      });
      
      return paymentIntent;
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      await this.handlePaymentFailure(subscription, error);
      throw error;
    }
  },
  
  async handlePaymentFailure(subscription, error) {
    // Update subscription status
    await Subscription.findByIdAndUpdate(subscription._id, {
      status: 'past_due'
    });
    
    // Send payment failure notification
    await this.sendPaymentFailureNotification(subscription.userId, error);
    
    // Schedule retry attempts
    await this.schedulePaymentRetry(subscription);
  },
  
  async generateInvoice(subscriptionId, items) {
    const subscription = await Subscription.findById(subscriptionId);
    const user = await User.findById(subscription.userId);
    
    const invoice = {
      invoiceNumber: this.generateInvoiceNumber(),
      userId: subscription.userId,
      subscriptionId,
      billingPeriod: {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd
      },
      items,
      subtotal: items.reduce((sum, item) => sum + item.amount, 0),
      tax: 0, // Calculate based on user location
      total: 0, // Will be calculated
      currency: 'USD',
      status: 'draft',
      createdAt: new Date()
    };
    
    invoice.tax = await this.calculateTax(invoice.subtotal, user.billingAddress);
    invoice.total = invoice.subtotal + invoice.tax;
    
    return invoice;
  }
};
```

## Subscription Analytics & Reporting

### Business Metrics
```javascript
const subscriptionAnalytics = {
  async generateMRRReport(timeframe = '12m') {
    const pipeline = [
      {
        $match: {
          status: { $in: ['active', 'trialing'] },
          createdAt: { $gte: this.getTimeframeStart(timeframe) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            tier: '$tier'
          },
          count: { $sum: 1 },
          revenue: { $sum: '$billing.amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ];
    
    const results = await Subscription.aggregate(pipeline);
    
    return {
      monthlyRecurringRevenue: this.calculateMRR(results),
      growthRate: this.calculateGrowthRate(results),
      churnRate: await this.calculateChurnRate(timeframe),
      tierDistribution: this.calculateTierDistribution(results)
    };
  },
  
  async calculateChurnRate(timeframe = '30d') {
    const startDate = this.getTimeframeStart(timeframe);
    const endDate = new Date();
    
    const startingSubscriptions = await Subscription.countDocuments({
      createdAt: { $lt: startDate },
      status: 'active'
    });
    
    const churnedSubscriptions = await Subscription.countDocuments({
      status: 'cancelled',
      updatedAt: { $gte: startDate, $lte: endDate }
    });
    
    return startingSubscriptions > 0 ? 
      (churnedSubscriptions / startingSubscriptions) * 100 : 0;
  },
  
  async getUserLifetimeValue(userId) {
    const payments = await Payment.find({ userId });
    const subscription = await Subscription.findOne({ userId });
    
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const monthsActive = subscription ? 
      this.calculateMonthsActive(subscription.createdAt) : 0;
    
    return {
      totalRevenue: totalPaid,
      monthsActive,
      averageMonthlyRevenue: monthsActive > 0 ? totalPaid / monthsActive : 0,
      projectedLTV: this.projectLifetimeValue(subscription)
    };
  }
};
```

## Free Trial Management

### Trial System
```javascript
const trialManager = {
  async startTrial(userId, tierName = 'pro') {
    const user = await User.findById(userId);
    const tier = tierConfigurations[tierName];
    
    // Check if user has already used trial
    const previousTrial = await Subscription.findOne({
      userId,
      'billing.trialEnd': { $exists: true }
    });
    
    if (previousTrial) {
      throw new Error('User has already used their free trial');
    }
    
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial
    
    const subscription = await Subscription.create({
      userId,
      tier: tierName,
      status: 'trialing',
      billing: {
        trialEnd,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnd
      },
      usage: {
        wordQuotaLimit: tier.features.wordLimit,
        aiGenerationsLimit: tier.features.aiGenerationsLimit,
        exportsLimit: tier.features.exportsLimit
      },
      features: tier.features
    });
    
    // Schedule trial end reminder emails
    await this.scheduleTrialReminders(userId, trialEnd);
    
    return subscription;
  },
  
  async scheduleTrialReminders(userId, trialEnd) {
    const reminders = [
      { days: 7, template: 'trial_halfway' },
      { days: 3, template: 'trial_ending_soon' },
      { days: 1, template: 'trial_ending_tomorrow' },
      { days: 0, template: 'trial_ended' }
    ];
    
    reminders.forEach(reminder => {
      const sendDate = new Date(trialEnd);
      sendDate.setDate(sendDate.getDate() - reminder.days);
      
      this.scheduleEmail(userId, reminder.template, sendDate);
    });
  }
};
```

---

*Subscription System Version 1.0*
*Last Updated: January 15, 2024*
*Next Phase: Revenue sharing system implementation*