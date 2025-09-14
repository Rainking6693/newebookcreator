/**
 * Market Research Dashboard Component
 * Comprehensive market analysis and trend research tools
 */

// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Search, 
  Target, 
  BarChart3, 
  PieChart, 
  Globe, 
  BookOpen,
  DollarSign,
  Users,
  Star,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  RefreshCw,
  Lightbulb,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';

// Components
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressBar from '@/components/ui/ProgressBar';

// Charts
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Hooks
import { useMarketResearch } from '@/hooks/useMarketResearch';
import { useSubscription } from '@/hooks/useSubscription';

// Types
interface MarketResearchDashboardProps {
  genre?: string;
  initialTopic?: string;
}

interface TrendData {
  topic: string;
  growth: number;
  volume: number;
  competition: string;
  opportunity: number;
}

interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: number;
  cpc: number;
  trend: number;
}

interface CompetitorData {
  title: string;
  author: string;
  rating: number;
  reviews: number;
  price: number;
  rank: number;
  category: string;
}

const MarketResearchDashboard: React.FC<MarketResearchDashboardProps> = ({
  genre = 'mystery',
  initialTopic = ''
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'trends' | 'keywords' | 'competitors' | 'opportunities'>('trends');
  const [searchTopic, setSearchTopic] = useState(initialTopic);
  const [selectedGenre, setSelectedGenre] = useState(genre);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(false);
  
  // Hooks
  const { 
    trendData, 
    keywordData, 
    competitorData, 
    opportunities,
    analyzeTrends,
    researchKeywords,
    analyzeCompetitors,
    identifyOpportunities,
    isResearching
  } = useMarketResearch();
  
  const { subscription } = useSubscription();
  
  // Mock data for demonstration
  const mockTrendData = [
    { month: 'Jan', mystery: 85, selfHelp: 92, total: 88 },
    { month: 'Feb', mystery: 88, selfHelp: 95, total: 91 },
    { month: 'Mar', mystery: 92, selfHelp: 89, total: 90 },
    { month: 'Apr', mystery: 95, selfHelp: 93, total: 94 },
    { month: 'May', mystery: 89, selfHelp: 97, total: 93 },
    { month: 'Jun', mystery: 93, selfHelp: 94, total: 93 }
  ];
  
  const mockKeywords: KeywordData[] = [
    { keyword: 'cozy mystery', searchVolume: 8900, competition: 65, cpc: 1.25, trend: 12 },
    { keyword: 'detective novel', searchVolume: 12400, competition: 78, cpc: 1.45, trend: 8 },
    { keyword: 'mystery thriller', searchVolume: 15600, competition: 82, cpc: 1.67, trend: 15 },
    { keyword: 'amateur sleuth', searchVolume: 3200, competition: 45, cpc: 0.89, trend: 22 },
    { keyword: 'police procedural', searchVolume: 6700, competition: 71, cpc: 1.34, trend: 5 }
  ];
  
  const mockCompetitors: CompetitorData[] = [
    { title: 'The Thursday Murder Club', author: 'Richard Osman', rating: 4.2, reviews: 45623, price: 9.99, rank: 1, category: 'Cozy Mystery' },
    { title: 'Still Life', author: 'Louise Penny', rating: 4.4, reviews: 23456, price: 8.99, rank: 3, category: 'Detective Fiction' },
    { title: 'The Sweetness at the Bottom of the Pie', author: 'Alan Bradley', rating: 4.1, reviews: 18934, price: 7.99, rank: 5, category: 'Mystery' },
    { title: 'Agatha Raisin and the Quiche of Death', author: 'M.C. Beaton', rating: 4.0, reviews: 15678, price: 6.99, rank: 8, category: 'Cozy Mystery' }
  ];
  
  const mockOpportunities = [
    {
      type: 'trending_topic',
      title: 'Eco-Mystery Novels',
      description: 'Environmental themes in mystery fiction are trending with 45% growth',
      potential: 'high',
      difficulty: 'medium',
      timeframe: 'short-term'
    },
    {
      type: 'keyword_gap',
      title: 'Small Town Mysteries',
      description: 'High search volume but low competition for small town mystery settings',
      potential: 'high',
      difficulty: 'low',
      timeframe: 'immediate'
    },
    {
      type: 'market_gap',
      title: 'Tech-Savvy Elderly Detectives',
      description: 'Underserved niche combining technology with traditional cozy mystery',
      potential: 'medium',
      difficulty: 'low',
      timeframe: 'medium-term'
    }
  ];
  
  // Handle research
  const handleResearch = async () => {
    if (!searchTopic.trim()) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        analyzeTrends(selectedGenre, timeframe),
        researchKeywords(searchTopic, selectedGenre),
        analyzeCompetitors(selectedGenre, searchTopic),
        identifyOpportunities(selectedGenre, { topic: searchTopic })
      ]);
    } catch (error) {
      console.error('Research failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if user can access market research
  const canAccessMarketResearch = () => {
    return subscription?.features?.marketResearch || subscription?.tier === 'pro' || subscription?.tier === 'author';
  };
  
  // Color scheme for charts
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Market Research
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover trends, analyze competition, and find opportunities in your genre
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={handleResearch}
            disabled={isLoading || !searchTopic.trim() || !canAccessMarketResearch()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Researching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Research
              </>
            )}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Access Control */}
      {!canAccessMarketResearch() && (
        <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">
                Market Research Requires Pro Plan
              </h3>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Upgrade to Pro or Author tier to access comprehensive market research tools, 
                trend analysis, and competitive insights.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
                onClick={() => window.location.href = '/app/settings/billing'}
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Search Controls */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Research Topic
            </label>
            <Input
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="e.g., cozy mystery, detective fiction, small town mystery"
              disabled={!canAccessMarketResearch()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genre
            </label>
            <Select
              value={selectedGenre}
              onChange={setSelectedGenre}
              options={[
                { value: 'mystery', label: 'Mystery' },
                { value: 'self-help', label: 'Self-Help' }
              ]}
              disabled={!canAccessMarketResearch()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timeframe
            </label>
            <Select
              value={timeframe}
              onChange={setTimeframe}
              options={[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: '1y', label: 'Last year' }
              ]}
              disabled={!canAccessMarketResearch()}
            />
          </div>
        </div>
      </Card>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'keywords', label: 'Keywords', icon: Target },
            { id: 'competitors', label: 'Competitors', icon: Users },
            { id: 'opportunities', label: 'Opportunities', icon: Lightbulb }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              disabled={!canAccessMarketResearch()}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Content */}
      {canAccessMarketResearch() ? (
        <div className="space-y-6">
          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Trend Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Market Growth
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        +12.5%
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <ArrowUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      <span>+2.3% from last month</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Search Volume
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        2.4M
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      <span>Monthly searches</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Competition Level
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        Medium
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                      <Target className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressBar value={65} className="h-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">65% competitive</p>
                  </div>
                </Card>
              </div>
              
              {/* Trend Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Genre Trends Over Time
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="mystery" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Mystery"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="selfHelp" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Self-Help"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
          
          {/* Keywords Tab */}
          {activeTab === 'keywords' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Keyword Opportunities
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Keyword
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Search Volume
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Competition
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Trend
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Opportunity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockKeywords.map((keyword, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {keyword.keyword}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {keyword.searchVolume.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <ProgressBar value={keyword.competition} className="w-16 h-2" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {keyword.competition}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1">
                              <ArrowUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600 dark:text-green-400">
                                +{keyword.trend}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={keyword.competition < 50 ? 'success' : keyword.competition < 75 ? 'warning' : 'error'}
                            >
                              {keyword.competition < 50 ? 'High' : keyword.competition < 75 ? 'Medium' : 'Low'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
          
          {/* Competitors Tab */}
          {activeTab === 'competitors' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Competing Books
                </h3>
                <div className="space-y-4">
                  {mockCompetitors.map((competitor, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-bold text-sm">
                            #{competitor.rank}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {competitor.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              by {competitor.author}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {competitor.rating}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {competitor.reviews.toLocaleString()} reviews
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="font-medium text-gray-900 dark:text-white">
                            ${competitor.price}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {competitor.category}
                          </p>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
          
          {/* Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockOpportunities.map((opportunity, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        <Badge 
                          variant={
                            opportunity.potential === 'high' ? 'success' : 
                            opportunity.potential === 'medium' ? 'warning' : 'secondary'
                          }
                        >
                          {opportunity.potential} potential
                        </Badge>
                      </div>
                      <Badge variant="outline">
                        {opportunity.timeframe}
                      </Badge>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {opportunity.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {opportunity.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Difficulty: </span>
                        <span className={`font-medium ${
                          opportunity.difficulty === 'low' ? 'text-green-600 dark:text-green-400' :
                          opportunity.difficulty === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {opportunity.difficulty}
                        </span>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        Explore
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Market Research Available with Pro Plan
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Unlock powerful market research tools to discover trends, analyze competition, 
            and find profitable opportunities in your genre.
          </p>
          <Button 
            onClick={() => window.location.href = '/app/settings/billing'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Upgrade to Pro
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarketResearchDashboard;