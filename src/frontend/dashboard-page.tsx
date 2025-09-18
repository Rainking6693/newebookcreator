/**
 * Dashboard Page Component
 * Main dashboard with analytics, recent books, and quick actions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Plus,
  BarChart3,
  Clock,
  Target,
  Zap,
  Award
} from 'lucide-react';

// Components
import StatsCard from '@/components/dashboard/StatsCard';
import RecentBooks from '@/components/dashboard/RecentBooks';
import UsageChart from '@/components/dashboard/UsageChart';
import QuickActions from '@/components/dashboard/QuickActions';
import ProgressRing from '@/components/ui/ProgressRing';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useDashboardData } from '@/hooks/useDashboardData';

// Services
import { analyticsService } from '@/services/analytics';
import { bookService } from '@/services/books';

// Types
interface DashboardStats {
  totalBooks: number;
  wordsWritten: number;
  booksCompleted: number;
  revenue: number;
  aiGenerations: number;
  averageRating: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { 
    stats, 
    recentBooks, 
    usageData, 
    isLoading,
    refreshData 
  } = useDashboardData();
  
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Check if this is a new user
  useEffect(() => {
    if (user && stats) {
      const isNewUser = stats.totalBooks === 0 && !localStorage.getItem('welcome_dismissed');
      setShowWelcome(isNewUser);
    }
  }, [user, stats]);
  
  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('welcome_dismissed', 'true');
  };
  
  // Calculate usage percentages
  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  };
  
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Message for New Users */}
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">
              Welcome to AI Ebook Platform, {user?.profile?.firstName}! 🎉
            </h2>
            <p className="text-blue-100 mb-4">
              You're all set to start creating amazing books with AI assistance. 
              Let's get you started with your first project!
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="secondary" 
                onClick={() => window.location.href = '/app/books/new'}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Book
              </Button>
              <Button 
                variant="ghost" 
                onClick={dismissWelcome}
                className="text-white border-white hover:bg-white hover:text-blue-600"
              >
                Dismiss
              </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        </motion.div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {user?.profile?.firstName}! Here's your writing progress.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {/* Timeframe Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeframe === period
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
          
          <Button onClick={refreshData} variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Books"
          value={stats?.totalBooks || 0}
          change={stats?.booksChange || 0}
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Words Written"
          value={stats?.wordsWritten || 0}
          change={stats?.wordsChange || 0}
          icon={TrendingUp}
          color="green"
          format="number"
        />
        <StatsCard
          title="Books Completed"
          value={stats?.booksCompleted || 0}
          change={stats?.completedChange || 0}
          icon={Award}
          color="purple"
        />
        <StatsCard
          title="AI Generations"
          value={stats?.aiGenerations || 0}
          change={stats?.generationsChange || 0}
          icon={Zap}
          color="yellow"
        />
      </div>
      
      {/* Usage Overview */}
      {subscription && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Usage Overview - {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Word Quota */}
            <div className="text-center">
              <ProgressRing
                percentage={getUsagePercentage(
                  subscription.usage?.wordQuotaUsed || 0,
                  subscription.usage?.wordQuotaLimit || 0
                )}
                size={80}
                strokeWidth={8}
                className={getUsageColor(getUsagePercentage(
                  subscription.usage?.wordQuotaUsed || 0,
                  subscription.usage?.wordQuotaLimit || 0
                ))}
              />
              <h4 className="font-medium text-gray-900 dark:text-white mt-2">
                Word Quota
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {(subscription.usage?.wordQuotaUsed || 0).toLocaleString()} / {(subscription.usage?.wordQuotaLimit || 0).toLocaleString()}
              </p>
            </div>
            
            {/* AI Generations */}
            <div className="text-center">
              <ProgressRing
                percentage={getUsagePercentage(
                  subscription.usage?.aiGenerationsUsed || 0,
                  subscription.usage?.aiGenerationsLimit || 0
                )}
                size={80}
                strokeWidth={8}
                className={getUsageColor(getUsagePercentage(
                  subscription.usage?.aiGenerationsUsed || 0,
                  subscription.usage?.aiGenerationsLimit || 0
                ))}
              />
              <h4 className="font-medium text-gray-900 dark:text-white mt-2">
                AI Generations
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subscription.usage?.aiGenerationsUsed || 0} / {subscription.usage?.aiGenerationsLimit || 0}
              </p>
            </div>
            
            {/* Exports */}
            <div className="text-center">
              <ProgressRing
                percentage={getUsagePercentage(
                  subscription.usage?.exportsUsed || 0,
                  subscription.usage?.exportsLimit || 0
                )}
                size={80}
                strokeWidth={8}
                className={getUsageColor(getUsagePercentage(
                  subscription.usage?.exportsUsed || 0,
                  subscription.usage?.exportsLimit || 0
                ))}
              />
              <h4 className="font-medium text-gray-900 dark:text-white mt-2">
                Exports
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subscription.usage?.exportsUsed || 0} / {subscription.usage?.exportsLimit || 0}
              </p>
            </div>
          </div>
          
          {/* Reset Date */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Usage resets on {new Date(subscription.usage?.resetDate || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </Card>
      )}
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Books */}
        <div className="lg:col-span-2">
          <RecentBooks 
            books={recentBooks} 
            onBookClick={(bookId) => window.location.href = `/app/books/${bookId}`}
          />
        </div>
        
        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
      
      {/* Usage Chart */}
      {usageData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Writing Activity
          </h3>
          <UsageChart data={usageData} timeframe={timeframe} />
        </Card>
      )}
      
      {/* Revenue Sharing (Author Tier Only) */}
      {subscription?.tier === 'author' && subscription.features?.revenueSharing && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Sharing
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/app/revenue'}
            >
              View Details
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats?.revenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats?.pendingRevenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payout</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalSales || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Goals and Achievements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Goals & Achievements
        </h3>
        
        <div className="space-y-4">
          {/* Daily Writing Goal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Daily Writing Goal</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats?.todayWords || 0} / 1000 words
                </p>
              </div>
            </div>
            <ProgressRing
              percentage={Math.min(((stats?.todayWords || 0) / 1000) * 100, 100)}
              size={40}
              strokeWidth={4}
              className="text-blue-500"
            />
          </div>
          
          {/* Weekly Goal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Award className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Weekly Goal</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats?.weekWords || 0} / 7000 words
                </p>
              </div>
            </div>
            <ProgressRing
              percentage={Math.min(((stats?.weekWords || 0) / 7000) * 100, 100)}
              size={40}
              strokeWidth={4}
              className="text-green-500"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;