/**
 * Billing Settings Component
 * Comprehensive subscription and payment management interface
 */

// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Settings,
  Shield,
  Receipt,
  Zap,
  Crown,
  Star,
  Info,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';

// Components
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressBar from '@/components/ui/ProgressBar';
import Tooltip from '@/components/ui/Tooltip';

// Hooks
import { useSubscription } from '@/hooks/useSubscription';
import { usePayments } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';

// Services
import { stripeService } from '@/services/stripe';
import { subscriptionService } from '@/services/subscription';

// Types
interface BillingSettingsProps {
  onPlanChange?: (newPlan: string) => void;
}

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

const BillingSettings: React.FC<BillingSettingsProps> = ({ onPlanChange }) => {
  // State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<string>('');
  
  // Hooks
  const { user } = useAuth();
  const { 
    subscription, 
    updateSubscription, 
    cancelSubscription, 
    isLoading: subscriptionLoading 
  } = useSubscription();
  const { 
    paymentMethods, 
    invoices, 
    addPaymentMethod, 
    removePaymentMethod, 
    setDefaultPaymentMethod,
    downloadInvoice,
    isLoading: paymentsLoading 
  } = usePayments();
  
  // Plans configuration
  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: billingInterval === 'month' ? 29.99 : 299.99,
      interval: billingInterval,
      description: 'Perfect for getting started with AI-powered writing',
      current: subscription?.tier === 'basic',
      features: [
        { name: '75,000 words per month', included: true },
        { name: '500 AI generations', included: true },
        { name: '10 exports per month', included: true },
        { name: '5 books maximum', included: true },
        { name: 'Claude AI model', included: true },
        { name: 'Basic support', included: true },
        { name: 'Market research', included: false },
        { name: 'Collaboration tools', included: false },
        { name: 'Revenue sharing', included: false },
        { name: 'Priority support', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingInterval === 'month' ? 49.99 : 499.99,
      interval: billingInterval,
      description: 'Advanced features for serious writers and content creators',
      popular: true,
      current: subscription?.tier === 'pro',
      features: [
        { name: '100,000 words per month', included: true },
        { name: '1,000 AI generations', included: true },
        { name: '25 exports per month', included: true },
        { name: '15 books maximum', included: true },
        { name: 'Claude + GPT-4 models', included: true },
        { name: 'Market research tools', included: true },
        { name: 'Collaboration features', included: true },
        { name: 'Basic support', included: true },
        { name: 'Revenue sharing', included: false },
        { name: 'Priority support', included: false }
      ]
    },
    {
      id: 'author',
      name: 'Author',
      price: billingInterval === 'month' ? 99.99 : 999.99,
      interval: billingInterval,
      description: 'Complete publishing platform for professional authors',
      current: subscription?.tier === 'author',
      features: [
        { name: '150,000 words per month', included: true },
        { name: '2,500 AI generations', included: true },
        { name: '100 exports per month', included: true },
        { name: '50 books maximum', included: true },
        { name: 'All AI models + custom', included: true },
        { name: 'Advanced market research', included: true },
        { name: 'Full collaboration suite', included: true },
        { name: 'Revenue sharing (70/30)', included: true },
        { name: 'Priority support', included: true },
        { name: 'Custom integrations', included: true }
      ]
    }
  ];
  
  // Handle plan change
  const handlePlanChange = async (planId: string) => {
    setProcessingAction('plan_change');
    setIsLoading(true);
    
    try {
      await updateSubscription(planId);
      setShowPlanModal(false);
      onPlanChange?.(planId);
    } catch (error) {
      console.error('Plan change failed:', error);
    } finally {
      setIsLoading(false);
      setProcessingAction('');
    }
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = async (immediate = false) => {
    setProcessingAction('cancel');
    setIsLoading(true);
    
    try {
      await cancelSubscription(immediate);
      setShowCancelModal(false);
    } catch (error) {
      console.error('Cancellation failed:', error);
    } finally {
      setIsLoading(false);
      setProcessingAction('');
    }
  };
  
  // Handle payment method addition
  const handleAddPaymentMethod = async () => {
    setProcessingAction('add_payment');
    setIsLoading(true);
    
    try {
      await addPaymentMethod();
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Payment method addition failed:', error);
    } finally {
      setIsLoading(false);
      setProcessingAction('');
    }
  };
  
  // Get usage percentage
  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'trialing': return 'text-blue-600 dark:text-blue-400';
      case 'past_due': return 'text-red-600 dark:text-red-400';
      case 'cancelled': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'trialing': return Clock;
      case 'past_due': return AlertCircle;
      case 'cancelled': return X;
      default: return Info;
    }
  };
  
  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Billing & Subscription
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>
      
      {/* Current Subscription */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Subscription
          </h3>
          
          {subscription && (
            <div className="flex items-center space-x-2">
              {React.createElement(getStatusIcon(subscription.status), {
                className: `w-5 h-5 ${getStatusColor(subscription.status)}`
              })}
              <span className={`font-medium capitalize ${getStatusColor(subscription.status)}`}>
                {subscription.status}
              </span>
            </div>
          )}
        </div>
        
        {subscription ? (
          <div className="space-y-6">
            {/* Plan Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  {subscription.tier === 'author' ? (
                    <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : subscription.tier === 'pro' ? (
                    <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {subscription.tier} Plan
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ${plans.find(p => p.id === subscription.tier)?.price || 0}/month
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Next Billing
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {subscription.currentPeriodEnd ? 
                      new Date(subscription.currentPeriodEnd).toLocaleDateString() : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Total Spent
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ${subscription.totalSpent?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Usage Overview */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                Current Usage
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Words</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {(subscription.usage?.wordQuotaUsed || 0).toLocaleString()} / {(subscription.usage?.wordQuotaLimit || 0).toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar 
                    value={getUsagePercentage(
                      subscription.usage?.wordQuotaUsed || 0,
                      subscription.usage?.wordQuotaLimit || 0
                    )}
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI Generations</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {subscription.usage?.aiGenerationsUsed || 0} / {subscription.usage?.aiGenerationsLimit || 0}
                    </span>
                  </div>
                  <ProgressBar 
                    value={getUsagePercentage(
                      subscription.usage?.aiGenerationsUsed || 0,
                      subscription.usage?.aiGenerationsLimit || 0
                    )}
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Exports</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {subscription.usage?.exportsUsed || 0} / {subscription.usage?.exportsLimit || 0}
                    </span>
                  </div>
                  <ProgressBar 
                    value={getUsagePercentage(
                      subscription.usage?.exportsUsed || 0,
                      subscription.usage?.exportsLimit || 0
                    )}
                    className="h-2"
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Usage resets on {subscription.usage?.resetDate ? 
                  new Date(subscription.usage.resetDate).toLocaleDateString() : 
                  'N/A'
                }
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setShowPlanModal(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Change Plan</span>
              </Button>
              
              <Button
                onClick={() => setShowPaymentModal(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment Methods</span>
              </Button>
              
              <Button
                onClick={() => setShowCancelModal(true)}
                variant="outline"
                className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
                <span>Cancel Subscription</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Active Subscription
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose a plan to start creating amazing books with AI assistance
            </p>
            <Button
              onClick={() => setShowPlanModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Choose a Plan
            </Button>
          </div>
        )}
      </Card>
      
      {/* Payment Methods */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payment Methods
          </h3>
          <Button
            onClick={() => setShowPaymentModal(true)}
            variant="outline"
            size="sm"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        </div>
        
        {paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      •••• •••• •••• {method.last4}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {method.brand.toUpperCase()} • Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                  {method.isDefault && (
                    <Badge variant="success">Default</Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultPaymentMethod(method.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePaymentMethod(method.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No payment methods added yet
            </p>
          </div>
        )}
      </Card>
      
      {/* Billing History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Billing History
          </h3>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>
        
        {invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {invoice.description}
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={invoice.status === 'paid' ? 'success' : 
                                invoice.status === 'pending' ? 'warning' : 'error'}
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadInvoice(invoice.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No billing history available
            </p>
          </div>
        )}
      </Card>
      
      {/* Plan Selection Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="Choose Your Plan"
        size="xl"
      >
        <div className="space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm ${billingInterval === 'month' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingInterval === 'year' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingInterval === 'year' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              Yearly
            </span>
            {billingInterval === 'year' && (
              <Badge variant="success" className="ml-2">Save 17%</Badge>
            )}
          </div>
          
          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-lg border-2 transition-all ${
                  plan.popular
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : plan.current
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="primary">Most Popular</Badge>
                  </div>
                )}
                
                {plan.current && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="success">Current Plan</Badge>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /{plan.interval}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {plan.description}
                  </p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      {feature.included ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={`text-sm ${
                        feature.included 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handlePlanChange(plan.id)}
                  disabled={plan.current || isLoading}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                  }`}
                  variant={plan.popular ? 'primary' : 'secondary'}
                >
                  {plan.current ? 'Current Plan' : 
                   isLoading && processingAction === 'plan_change' ? 'Processing...' : 
                   subscription?.tier && plans.findIndex(p => p.id === subscription.tier) > plans.findIndex(p => p.id === plan.id) ? 'Downgrade' : 'Upgrade'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
      
      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Are you sure you want to cancel?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You'll lose access to all premium features and your books will be limited to read-only mode.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => handleCancelSubscription(false)}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading && processingAction === 'cancel' ? 'Processing...' : 'Cancel at Period End'}
            </Button>
            <Button
              onClick={() => handleCancelSubscription(true)}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
            >
              Cancel Immediately
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BillingSettings;