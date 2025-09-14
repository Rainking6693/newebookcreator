interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface StripeService {
  createPaymentMethod: (token: string) => Promise<StripePaymentMethod>;
  attachPaymentMethod: (paymentMethodId: string, customerId: string) => Promise<void>;
  detachPaymentMethod: (paymentMethodId: string) => Promise<void>;
  updateDefaultPaymentMethod: (customerId: string, paymentMethodId: string) => Promise<void>;
  createSubscription: (customerId: string, priceId: string) => Promise<any>;
  updateSubscription: (subscriptionId: string, priceId: string) => Promise<any>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
}

// Mock Stripe service implementation
class MockStripeService implements StripeService {
  async createPaymentMethod(token: string): Promise<StripePaymentMethod> {
    // Simulate Stripe API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: `pm_${Date.now()}`,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
      },
    };
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Attached payment method ${paymentMethodId} to customer ${customerId}`);
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Detached payment method ${paymentMethodId}`);
  }

  async updateDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Updated default payment method for customer ${customerId} to ${paymentMethodId}`);
  }

  async createSubscription(customerId: string, priceId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: `sub_${Date.now()}`,
      customer: customerId,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
    };
  }

  async updateSubscription(subscriptionId: string, priceId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: subscriptionId,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Cancelled subscription ${subscriptionId}`);
  }
}

export const stripeService = new MockStripeService();