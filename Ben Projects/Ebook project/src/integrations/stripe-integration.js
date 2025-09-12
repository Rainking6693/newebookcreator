/**
 * Stripe Integration Service
 * Complete payment processing, subscription management, and webhook handling
 */

import Stripe from 'stripe';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { Analytics } from '../models/Analytics.js';

class StripeIntegration {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Price IDs for different plans
    this.priceIds = {
      basic_monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
      basic_yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
      pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
      author_monthly: process.env.STRIPE_AUTHOR_MONTHLY_PRICE_ID,
      author_yearly: process.env.STRIPE_AUTHOR_YEARLY_PRICE_ID
    };
    
    this.plans = {
      basic: {
        name: 'Basic',
        features: {
          wordLimit: 75000,
          aiGenerationsLimit: 500,
          exportsLimit: 10,
          booksLimit: 5
        }
      },
      pro: {
        name: 'Pro',
        features: {
          wordLimit: 100000,
          aiGenerationsLimit: 1000,
          exportsLimit: 25,
          booksLimit: 15
        }
      },
      author: {
        name: 'Author',
        features: {
          wordLimit: 150000,
          aiGenerationsLimit: 2500,
          exportsLimit: 100,
          booksLimit: 50
        }
      }
    };
  }
  
  // Customer Management
  async createCustomer(user) {
    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        metadata: {
          userId: user._id.toString(),
          signupDate: new Date().toISOString()
        }
      });
      
      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customer.id
      });
      
      return customer;
      
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }
  
  async updateCustomer(customerId, updates) {
    try {
      return await this.stripe.customers.update(customerId, updates);
    } catch (error) {
      console.error('Failed to update Stripe customer:', error);
      throw error;
    }
  }
  
  // Payment Methods
  async createSetupIntent(customerId) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });
      
      return setupIntent;
      
    } catch (error) {
      console.error('Failed to create setup intent:', error);
      throw error;
    }
  }
  
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      
      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
      
    } catch (error) {
      console.error('Failed to attach payment method:', error);
      throw error;
    }
  }
  
  async detachPaymentMethod(paymentMethodId) {
    try {
      return await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      console.error('Failed to detach payment method:', error);
      throw error;
    }
  }
  
  async listPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      return paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        isDefault: false // Will be set based on customer's default payment method
      }));
      
    } catch (error) {
      console.error('Failed to list payment methods:', error);
      throw error;
    }
  }
  
  // Subscription Management
  async createSubscription(customerId, priceId, paymentMethodId, options = {}) {
    try {
      const subscriptionData = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: options.userId || '',
          planType: options.planType || ''
        }
      };
      
      // Add trial period if specified
      if (options.trialDays) {
        subscriptionData.trial_period_days = options.trialDays;
      }
      
      // Add coupon if provided
      if (options.couponId) {
        subscriptionData.coupon = options.couponId;
      }
      
      // Set default payment method if provided
      if (paymentMethodId) {
        subscriptionData.default_payment_method = paymentMethodId;
      }
      
      const subscription = await this.stripe.subscriptions.create(subscriptionData);
      
      return subscription;
      
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }
  
  async updateSubscription(subscriptionId, updates) {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, updates);
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }
  
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      if (cancelAtPeriodEnd) {
        return await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      } else {
        return await this.stripe.subscriptions.cancel(subscriptionId);
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }
  
  async changePlan(subscriptionId, newPriceId, prorationBehavior = 'create_prorations') {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      return await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId
        }],
        proration_behavior: prorationBehavior
      });
      
    } catch (error) {
      console.error('Failed to change plan:', error);
      throw error;
    }
  }
  
  // Invoice Management
  async retrieveInvoice(invoiceId) {
    try {
      return await this.stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      console.error('Failed to retrieve invoice:', error);
      throw error;
    }
  }
  
  async listInvoices(customerId, limit = 10) {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit
      });
      
      return invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        description: invoice.description || `Invoice for ${invoice.lines.data[0]?.description || 'subscription'}`,
        downloadUrl: invoice.invoice_pdf,
        hostedUrl: invoice.hosted_invoice_url
      }));
      
    } catch (error) {
      console.error('Failed to list invoices:', error);
      throw error;
    }
  }
  
  async downloadInvoice(invoiceId) {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice.invoice_pdf;
    } catch (error) {
      console.error('Failed to get invoice download URL:', error);
      throw error;
    }
  }
  
  // Payment Processing
  async createPaymentIntent(amount, currency = 'usd', customerId, metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });
      
      return paymentIntent;
      
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  }
  
  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });
    } catch (error) {
      console.error('Failed to confirm payment intent:', error);
      throw error;
    }
  }
  
  // Webhook Handling
  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      
      console.log(`Processing webhook event: ${event.type}`);
      
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
          
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
          
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event.data.object);
          break;
          
        case 'setup_intent.succeeded':
          await this.handleSetupIntentSucceeded(event.data.object);
          break;
          
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
      
      return { received: true };
      
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }
  
  async handleSubscriptionCreated(subscription) {
    try {
      const userId = subscription.metadata.userId;
      if (!userId) return;
      
      const planType = this.getPlanTypeFromPriceId(subscription.items.data[0].price.id);
      
      await Subscription.create({
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        tier: planType,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        features: this.plans[planType].features,
        usage: {
          wordQuotaUsed: 0,
          wordQuotaLimit: this.plans[planType].features.wordLimit,
          aiGenerationsUsed: 0,
          aiGenerationsLimit: this.plans[planType].features.aiGenerationsLimit,
          exportsUsed: 0,
          exportsLimit: this.plans[planType].features.exportsLimit,
          resetDate: new Date(subscription.current_period_end * 1000)
        }
      });
      
      // Update user subscription reference
      await User.findByIdAndUpdate(userId, {
        'subscription.tier': planType,
        'subscription.status': subscription.status
      });
      
      // Track analytics
      await this.trackEvent(userId, 'subscription_created', {
        tier: planType,
        subscriptionId: subscription.id
      });
      
    } catch (error) {
      console.error('Failed to handle subscription created:', error);
    }
  }
  
  async handleSubscriptionUpdated(subscription) {
    try {
      const dbSubscription = await Subscription.findOne({
        stripeSubscriptionId: subscription.id
      });
      
      if (!dbSubscription) return;
      
      const planType = this.getPlanTypeFromPriceId(subscription.items.data[0].price.id);
      
      await Subscription.findByIdAndUpdate(dbSubscription._id, {
        tier: planType,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        features: this.plans[planType].features,
        'usage.wordQuotaLimit': this.plans[planType].features.wordLimit,
        'usage.aiGenerationsLimit': this.plans[planType].features.aiGenerationsLimit,
        'usage.exportsLimit': this.plans[planType].features.exportsLimit
      });
      
      // Update user subscription reference
      await User.findByIdAndUpdate(dbSubscription.userId, {
        'subscription.tier': planType,
        'subscription.status': subscription.status
      });
      
      // Track analytics
      await this.trackEvent(dbSubscription.userId, 'subscription_updated', {
        tier: planType,
        status: subscription.status,
        subscriptionId: subscription.id
      });
      
    } catch (error) {
      console.error('Failed to handle subscription updated:', error);
    }
  }
  
  async handleSubscriptionDeleted(subscription) {
    try {
      const dbSubscription = await Subscription.findOne({
        stripeSubscriptionId: subscription.id
      });
      
      if (!dbSubscription) return;
      
      await Subscription.findByIdAndUpdate(dbSubscription._id, {
        status: 'cancelled',
        canceledAt: new Date()
      });
      
      // Update user subscription reference
      await User.findByIdAndUpdate(dbSubscription.userId, {
        'subscription.status': 'cancelled'
      });
      
      // Track analytics
      await this.trackEvent(dbSubscription.userId, 'subscription_cancelled', {
        subscriptionId: subscription.id,
        reason: 'stripe_deletion'
      });
      
    } catch (error) {
      console.error('Failed to handle subscription deleted:', error);
    }
  }
  
  async handlePaymentSucceeded(invoice) {
    try {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription
      });
      
      if (!subscription) return;
      
      // Record payment
      await Payment.create({
        userId: subscription.userId,
        subscriptionId: subscription._id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'succeeded',
        description: invoice.description || 'Subscription payment',
        paidAt: new Date(invoice.status_transitions.paid_at * 1000)
      });
      
      // Update subscription status
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'active',
        lastPaymentDate: new Date()
      });
      
      // Update user subscription reference
      await User.findByIdAndUpdate(subscription.userId, {
        'subscription.status': 'active'
      });
      
      // Track analytics
      await this.trackEvent(subscription.userId, 'payment_succeeded', {
        amount: invoice.amount_paid / 100,
        invoiceId: invoice.id
      });
      
    } catch (error) {
      console.error('Failed to handle payment succeeded:', error);
    }
  }
  
  async handlePaymentFailed(invoice) {
    try {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription
      });
      
      if (!subscription) return;
      
      // Record failed payment
      await Payment.create({
        userId: subscription.userId,
        subscriptionId: subscription._id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: 'failed',
        description: invoice.description || 'Subscription payment',
        failureReason: invoice.last_finalization_error?.message || 'Payment failed'
      });
      
      // Update subscription status
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'past_due',
        lastPaymentError: invoice.last_finalization_error?.message || 'Payment failed'
      });
      
      // Update user subscription reference
      await User.findByIdAndUpdate(subscription.userId, {
        'subscription.status': 'past_due'
      });
      
      // Track analytics
      await this.trackEvent(subscription.userId, 'payment_failed', {
        amount: invoice.amount_due / 100,
        invoiceId: invoice.id,
        reason: invoice.last_finalization_error?.message
      });
      
      // Send notification email (implement separately)
      await this.sendPaymentFailedNotification(subscription.userId, invoice);
      
    } catch (error) {
      console.error('Failed to handle payment failed:', error);
    }
  }
  
  async handleTrialWillEnd(subscription) {
    try {
      const dbSubscription = await Subscription.findOne({
        stripeSubscriptionId: subscription.id
      });
      
      if (!dbSubscription) return;
      
      // Track analytics
      await this.trackEvent(dbSubscription.userId, 'trial_will_end', {
        subscriptionId: subscription.id,
        trialEnd: new Date(subscription.trial_end * 1000)
      });
      
      // Send notification email (implement separately)
      await this.sendTrialEndingNotification(dbSubscription.userId, subscription);
      
    } catch (error) {
      console.error('Failed to handle trial will end:', error);
    }
  }
  
  // Utility Methods
  getPlanTypeFromPriceId(priceId) {
    const priceMapping = {
      [this.priceIds.basic_monthly]: 'basic',
      [this.priceIds.basic_yearly]: 'basic',
      [this.priceIds.pro_monthly]: 'pro',
      [this.priceIds.pro_yearly]: 'pro',
      [this.priceIds.author_monthly]: 'author',
      [this.priceIds.author_yearly]: 'author'
    };
    
    return priceMapping[priceId] || 'basic';
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
  
  async sendPaymentFailedNotification(userId, invoice) {
    // Implement email notification
    console.log(`Payment failed notification for user ${userId}, invoice ${invoice.id}`);
  }
  
  async sendTrialEndingNotification(userId, subscription) {
    // Implement email notification
    console.log(`Trial ending notification for user ${userId}, subscription ${subscription.id}`);
  }
  
  // Coupon and Discount Management
  async createCoupon(options) {
    try {
      return await this.stripe.coupons.create(options);
    } catch (error) {
      console.error('Failed to create coupon:', error);
      throw error;
    }
  }
  
  async validateCoupon(couponId) {
    try {
      const coupon = await this.stripe.coupons.retrieve(couponId);
      return coupon.valid;
    } catch (error) {
      return false;
    }
  }
  
  // Usage-based billing (for future features)
  async recordUsage(subscriptionItemId, quantity, timestamp = null) {
    try {
      return await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action: 'increment'
        }
      );
    } catch (error) {
      console.error('Failed to record usage:', error);
      throw error;
    }
  }
  
  // Connect for revenue sharing (Author tier)
  async createConnectAccount(userId, email) {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'US', // Default, should be configurable
        email,
        capabilities: {
          transfers: { requested: true }
        },
        metadata: {
          userId: userId.toString()
        }
      });
      
      return account;
      
    } catch (error) {
      console.error('Failed to create Connect account:', error);
      throw error;
    }
  }
  
  async createAccountLink(accountId, refreshUrl, returnUrl) {
    try {
      return await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
      });
    } catch (error) {
      console.error('Failed to create account link:', error);
      throw error;
    }
  }
  
  async createTransfer(amount, destination, metadata = {}) {
    try {
      return await this.stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination,
        metadata
      });
    } catch (error) {
      console.error('Failed to create transfer:', error);
      throw error;
    }
  }
}

export default StripeIntegration;