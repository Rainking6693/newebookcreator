interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  stripePriceId: string;
}

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
}

interface SubscriptionService {
  getPlans: () => Promise<SubscriptionPlan[]>;
  getCurrentSubscription: (userId: string) => Promise<Subscription | null>;
  createSubscription: (userId: string, planId: string) => Promise<Subscription>;
  updateSubscription: (subscriptionId: string, planId: string) => Promise<Subscription>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
  reactivateSubscription: (subscriptionId: string) => Promise<Subscription>;
}

const mockPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'monthly',
    features: [
      '5 Books per month',
      'Basic templates',
      'EPUB export',
      'Email support',
    ],
    stripePriceId: 'price_starter_monthly',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 59,
    interval: 'monthly',
    features: [
      '15 Books per month',
      'Advanced templates',
      'All export formats',
      'Priority support',
      'Custom branding',
    ],
    stripePriceId: 'price_professional_monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    interval: 'monthly',
    features: [
      'Unlimited books',
      'Custom templates',
      'All export formats',
      '24/7 support',
      'API access',
      'White-label solution',
    ],
    stripePriceId: 'price_enterprise_monthly',
  },
];

class MockSubscriptionService implements SubscriptionService {
  async getPlans(): Promise<SubscriptionPlan[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockPlans;
  }

  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock current subscription
    return {
      id: 'sub_mock_123',
      planId: 'starter',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async createSubscription(userId: string, planId: string): Promise<Subscription> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: `sub_${Date.now()}`,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async updateSubscription(subscriptionId: string, planId: string): Promise<Subscription> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: subscriptionId,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Subscription ${subscriptionId} cancelled`);
  }

  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: subscriptionId,
      planId: 'starter', // Default plan
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }
}

export const subscriptionService = new MockSubscriptionService();