import { useState, useEffect } from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  tier?: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  trialEnd?: string;
  currentPeriodEnd?: string;
  totalSpent?: number;
  features: string[];
  limits: {
    booksPerMonth: number;
    chaptersPerBook: number;
    wordsPerChapter: number;
  };
}

interface UseSubscriptionReturn {
  currentPlan: SubscriptionPlan | null;
  subscription: SubscriptionPlan | null; // Alias for currentPlan
  usage: {
    booksGenerated: number;
    chaptersGenerated: number;
    wordsGenerated: number;
  };
  isLoading: boolean;
  canGenerate: boolean;
  upgradeRequired: boolean;
  upgradePlan: (planId: string) => Promise<void>;
  updateSubscription: (planId: string) => Promise<void>;
  cancelSubscription: (immediate?: boolean) => Promise<void>;
}

const mockPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    tier: 'basic',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    totalSpent: 87.00,
    features: ['5 Books/month', 'Basic templates', 'EPUB export'],
    limits: {
      booksPerMonth: 5,
      chaptersPerBook: 20,
      wordsPerChapter: 3000
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 59,
    tier: 'professional',
    status: 'active',
    features: ['15 Books/month', 'Advanced templates', 'All formats', 'Priority support'],
    limits: {
      booksPerMonth: 15,
      chaptersPerBook: 50,
      wordsPerChapter: 7000
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    tier: 'enterprise',
    status: 'active',
    features: ['Unlimited books', 'Custom templates', 'All formats', '24/7 support', 'API access'],
    limits: {
      booksPerMonth: 999,
      chaptersPerBook: 999,
      wordsPerChapter: 10000
    }
  }
];

export const useSubscription = (): UseSubscriptionReturn => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [usage, setUsage] = useState({
    booksGenerated: 2,
    chaptersGenerated: 15,
    wordsGenerated: 45000
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading current subscription
    const timer = setTimeout(() => {
      setCurrentPlan(mockPlans[0]); // Default to starter plan
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const canGenerate = currentPlan ? usage.booksGenerated < currentPlan.limits.booksPerMonth : false;
  const upgradeRequired = !canGenerate && currentPlan?.id !== 'enterprise';

  const upgradePlan = async (planId: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newPlan = mockPlans.find(plan => plan.id === planId);
      if (newPlan) {
        setCurrentPlan(newPlan);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (planId: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newPlan = mockPlans.find(plan => plan.id === planId);
      if (newPlan) {
        setCurrentPlan(newPlan);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (immediate?: boolean): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentPlan,
    subscription: currentPlan, // Alias for backward compatibility
    usage,
    isLoading,
    canGenerate,
    upgradeRequired,
    upgradePlan,
    updateSubscription,
    cancelSubscription
  };
};