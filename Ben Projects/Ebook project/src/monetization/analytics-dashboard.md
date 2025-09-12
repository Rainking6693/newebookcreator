# Analytics Dashboard & Business Intelligence

## Business Metrics Dashboard

### Key Performance Indicators (KPIs)
```javascript
const businessKPIs = {
  // Revenue Metrics
  monthlyRecurringRevenue: {
    calculation: 'SUM(active_subscriptions.monthly_price)',
    target: 50000, // $50k MRR by month 12
    current: 0,
    trend: 'up'
  },
  
  averageRevenuePerUser: {
    calculation: 'total_revenue / total_users',
    target: 75, // $75 ARPU
    current: 0,
    trend: 'stable'
  },
  
  customerLifetimeValue: {
    calculation: 'ARPU / churn_rate',
    target: 900, // $900 CLV
    current: 0,
    trend: 'up'
  },
  
  // User Metrics
  monthlyActiveUsers: {
    calculation: 'COUNT(DISTINCT users_active_last_30_days)',
    target: 10000,
    current: 0,
    trend: 'up'
  },
  
  churnRate: {
    calculation: 'cancelled_subscriptions / total_subscriptions',
    target: 0.05, // 5% monthly churn
    current: 0,
    trend: 'down'
  },
  
  // Product Metrics
  booksCompleted: {
    calculation: 'COUNT(books WHERE status = "completed")',
    target: 1000, // 1000 completed books by month 12
    current: 0,
    trend: 'up'
  },
  
  averageCompletionTime: {
    calculation: 'AVG(completion_date - creation_date)',
    target: 45, // 45 days average
    current: 0,
    trend: 'down'
  },
  
  // AI Usage Metrics
  aiGenerationCost: {
    calculation: 'SUM(ai_api_costs)',
    target: 5000, // $5k monthly AI costs
    current: 0,
    trend: 'controlled'
  },
  
  costPerGeneration: {
    calculation: 'total_ai_costs / total_generations',
    target: 0.15, // $0.15 per generation
    current: 0,
    trend: 'down'
  }
};
```

### Real-Time Analytics Engine
```javascript
class AnalyticsEngine {
  constructor() {
    this.metrics = new Map();
    this.subscribers = new Map();
    this.updateInterval = 60000; // 1 minute updates
  }
  
  async calculateRealTimeMetrics() {
    const metrics = {
      // Current active users
      activeUsers: await this.getActiveUsers(),
      
      // Revenue metrics
      todayRevenue: await this.getTodayRevenue(),
      monthToDateRevenue: await this.getMonthToDateRevenue(),
      
      // Usage metrics
      aiGenerationsToday: await this.getAIGenerationsToday(),
      booksCreatedToday: await this.getBooksCreatedToday(),
      
      // Performance metrics
      averageResponseTime: await this.getAverageResponseTime(),
      errorRate: await this.getErrorRate(),
      
      // User engagement
      averageSessionDuration: await this.getAverageSessionDuration(),
      pagesPerSession: await this.getPagesPerSession()
    };
    
    // Update cached metrics
    this.metrics.set('realtime', {
      ...metrics,
      lastUpdated: new Date()
    });
    
    // Notify subscribers
    this.notifySubscribers('realtime', metrics);
    
    return metrics;
  }
  
  async getActiveUsers() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    return await Analytics.distinct('userId', {
      timestamp: { $gte: fifteenMinutesAgo },
      eventType: { $in: ['page_view', 'ai_generation', 'content_edit'] }
    }).length;
  }
  
  async getTodayRevenue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const payments = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: 'succeeded'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    return payments[0]?.total || 0;
  }
  
  async getAIGenerationsToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await Analytics.countDocuments({
      eventType: 'ai_generation',
      timestamp: { $gte: today }
    });
  }
}
```

## User Analytics Dashboard

### User Behavior Tracking
```javascript
const userAnalytics = {
  async trackUserEvent(userId, eventType, eventData) {
    const event = {
      userId: new ObjectId(userId),
      eventType,
      eventData,
      timestamp: new Date(),
      sessionId: eventData.sessionId,
      metadata: {
        userAgent: eventData.userAgent,
        ipAddress: eventData.ipAddress,
        platform: eventData.platform
      }
    };
    
    await Analytics.create(event);
    
    // Update real-time metrics if needed
    if (this.isRealTimeEvent(eventType)) {
      await this.updateRealTimeMetrics(eventType, eventData);
    }
  },
  
  async getUserJourney(userId, timeframe = '30d') {
    const startDate = this.getTimeframeStart(timeframe);
    
    const journey = await Analytics.find({
      userId: new ObjectId(userId),
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });
    
    return {
      events: journey,
      summary: this.analyzeJourney(journey),
      milestones: this.identifyMilestones(journey),
      dropoffPoints: this.identifyDropoffPoints(journey)
    };
  },
  
  async getCohortAnalysis(cohortType = 'monthly') {
    const cohorts = await this.generateCohorts(cohortType);
    const analysis = [];
    
    for (const cohort of cohorts) {
      const retention = await this.calculateCohortRetention(cohort);
      analysis.push({
        cohort: cohort.period,
        size: cohort.users.length,
        retention: retention
      });
    }
    
    return analysis;
  },
  
  analyzeJourney(events) {
    const summary = {
      totalEvents: events.length,
      uniqueSessions: new Set(events.map(e => e.sessionId)).size,
      firstEvent: events[0]?.timestamp,
      lastEvent: events[events.length - 1]?.timestamp,
      eventTypes: this.groupEventsByType(events),
      conversionEvents: this.identifyConversions(events)
    };
    
    summary.sessionDuration = summary.lastEvent && summary.firstEvent ?
      summary.lastEvent - summary.firstEvent : 0;
    
    return summary;
  }
};
```

### Funnel Analysis
```javascript
const funnelAnalytics = {
  // Define conversion funnels
  funnels: {
    userOnboarding: [
      'landing_page_view',
      'signup_started',
      'email_verified',
      'onboarding_completed',
      'first_book_created'
    ],
    
    bookCreation: [
      'book_creation_started',
      'genre_selected',
      'outline_created',
      'first_chapter_generated',
      'book_completed'
    ],
    
    subscription: [
      'pricing_page_view',
      'plan_selected',
      'payment_info_entered',
      'subscription_created',
      'first_payment_successful'
    ]
  },
  
  async analyzeFunnel(funnelName, timeframe = '30d') {
    const funnel = this.funnels[funnelName];
    if (!funnel) throw new Error('Funnel not found');
    
    const startDate = this.getTimeframeStart(timeframe);
    const analysis = [];
    
    for (let i = 0; i < funnel.length; i++) {
      const step = funnel[i];
      const previousStep = i > 0 ? funnel[i - 1] : null;
      
      // Get users who completed this step
      const stepUsers = await this.getUsersAtStep(step, startDate);
      
      // Get users who completed previous step (for conversion rate)
      const previousStepUsers = previousStep ? 
        await this.getUsersAtStep(previousStep, startDate) : null;
      
      const stepAnalysis = {
        step,
        stepNumber: i + 1,
        users: stepUsers.length,
        conversionRate: previousStepUsers ? 
          (stepUsers.length / previousStepUsers.length) * 100 : 100,
        dropoffRate: previousStepUsers ? 
          ((previousStepUsers.length - stepUsers.length) / previousStepUsers.length) * 100 : 0
      };
      
      analysis.push(stepAnalysis);
    }
    
    return {
      funnel: funnelName,
      timeframe,
      steps: analysis,
      overallConversion: analysis.length > 0 ? 
        (analysis[analysis.length - 1].users / analysis[0].users) * 100 : 0
    };
  },
  
  async getUsersAtStep(eventType, startDate) {
    return await Analytics.distinct('userId', {
      eventType,
      timestamp: { $gte: startDate }
    });
  }
};
```

## Revenue Analytics

### Revenue Tracking & Forecasting
```javascript
const revenueAnalytics = {
  async getRevenueBreakdown(timeframe = '12m') {
    const startDate = this.getTimeframeStart(timeframe);
    
    const breakdown = {
      subscriptionRevenue: await this.getSubscriptionRevenue(startDate),
      revenueShareRevenue: await this.getRevenueShareRevenue(startDate),
      oneTimeRevenue: await this.getOneTimeRevenue(startDate),
      totalRevenue: 0
    };
    
    breakdown.totalRevenue = 
      breakdown.subscriptionRevenue + 
      breakdown.revenueShareRevenue + 
      breakdown.oneTimeRevenue;
    
    return breakdown;
  },
  
  async getSubscriptionRevenue(startDate) {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
          type: 'subscription',
          status: 'succeeded'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ];
    
    const result = await Payment.aggregate(pipeline);
    return result[0]?.total || 0;
  },
  
  async forecastRevenue(months = 12) {
    // Get historical data for forecasting
    const historicalData = await this.getMonthlyRevenue(months);
    
    if (historicalData.length < 3) {
      return { error: 'Insufficient historical data for forecasting' };
    }
    
    // Simple linear regression for forecasting
    const forecast = this.calculateLinearForecast(historicalData, months);
    
    return {
      historical: historicalData,
      forecast: forecast,
      confidence: this.calculateForecastConfidence(historicalData),
      assumptions: [
        'Linear growth trend continues',
        'No major market changes',
        'Current pricing strategy maintained'
      ]
    };
  },
  
  async getMonthlyRevenue(months) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'succeeded'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ];
    
    return await Payment.aggregate(pipeline);
  }
};
```

## AI Usage Analytics

### AI Performance Metrics
```javascript
const aiAnalytics = {
  async getAIUsageMetrics(timeframe = '30d') {
    const startDate = this.getTimeframeStart(timeframe);
    
    const metrics = {
      totalGenerations: await this.getTotalGenerations(startDate),
      averageGenerationTime: await this.getAverageGenerationTime(startDate),
      modelUsageBreakdown: await this.getModelUsageBreakdown(startDate),
      costAnalysis: await this.getCostAnalysis(startDate),
      qualityMetrics: await this.getQualityMetrics(startDate),
      userSatisfaction: await this.getUserSatisfaction(startDate)
    };
    
    return metrics;
  },
  
  async getModelUsageBreakdown(startDate) {
    const pipeline = [
      {
        $match: {
          eventType: 'ai_generation',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$eventData.model',
          count: { $sum: 1 },
          totalTokens: { $sum: '$eventData.tokensUsed' },
          totalCost: { $sum: '$eventData.cost' },
          averageResponseTime: { $avg: '$eventData.responseTime' }
        }
      }
    ];
    
    return await Analytics.aggregate(pipeline);
  },
  
  async getCostAnalysis(startDate) {
    const pipeline = [
      {
        $match: {
          eventType: 'ai_generation',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          totalCost: { $sum: '$eventData.cost' },
          totalGenerations: { $sum: 1 },
          averageCostPerGeneration: { $avg: '$eventData.cost' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ];
    
    const dailyCosts = await Analytics.aggregate(pipeline);
    
    return {
      dailyBreakdown: dailyCosts,
      totalCost: dailyCosts.reduce((sum, day) => sum + day.totalCost, 0),
      averageDailyCost: dailyCosts.length > 0 ? 
        dailyCosts.reduce((sum, day) => sum + day.totalCost, 0) / dailyCosts.length : 0,
      costTrend: this.calculateCostTrend(dailyCosts)
    };
  },
  
  async getQualityMetrics(startDate) {
    const pipeline = [
      {
        $match: {
          eventType: 'content_quality_score',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          averageQualityScore: { $avg: '$eventData.qualityScore' },
          averageReadabilityScore: { $avg: '$eventData.readabilityScore' },
          totalAssessments: { $sum: 1 }
        }
      }
    ];
    
    const result = await Analytics.aggregate(pipeline);
    return result[0] || {
      averageQualityScore: 0,
      averageReadabilityScore: 0,
      totalAssessments: 0
    };
  }
};
```

## Performance Monitoring

### System Performance Dashboard
```javascript
const performanceMonitoring = {
  async getSystemMetrics() {
    const metrics = {
      responseTime: await this.getAverageResponseTime(),
      errorRate: await this.getErrorRate(),
      uptime: await this.getUptime(),
      throughput: await this.getThroughput(),
      resourceUsage: await this.getResourceUsage()
    };
    
    return metrics;
  },
  
  async getAverageResponseTime(timeframe = '1h') {
    const startDate = this.getTimeframeStart(timeframe);
    
    const pipeline = [
      {
        $match: {
          eventType: 'api_request',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$eventData.endpoint',
          averageResponseTime: { $avg: '$eventData.responseTime' },
          requestCount: { $sum: 1 }
        }
      }
    ];
    
    return await Analytics.aggregate(pipeline);
  },
  
  async getErrorRate(timeframe = '1h') {
    const startDate = this.getTimeframeStart(timeframe);
    
    const totalRequests = await Analytics.countDocuments({
      eventType: 'api_request',
      timestamp: { $gte: startDate }
    });
    
    const errorRequests = await Analytics.countDocuments({
      eventType: 'api_request',
      timestamp: { $gte: startDate },
      'eventData.statusCode': { $gte: 400 }
    });
    
    return totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
  },
  
  async alertOnThresholds() {
    const metrics = await this.getSystemMetrics();
    const alerts = [];
    
    // Check response time threshold
    if (metrics.responseTime > 2000) { // 2 seconds
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Average response time is ${metrics.responseTime}ms`,
        threshold: 2000
      });
    }
    
    // Check error rate threshold
    if (metrics.errorRate > 5) { // 5%
      alerts.push({
        type: 'reliability',
        severity: 'critical',
        message: `Error rate is ${metrics.errorRate}%`,
        threshold: 5
      });
    }
    
    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
    
    return alerts;
  }
};
```

## Custom Analytics Queries

### Query Builder Interface
```javascript
const customAnalytics = {
  async buildCustomQuery(queryConfig) {
    const {
      metrics,
      dimensions,
      filters,
      timeframe,
      groupBy
    } = queryConfig;
    
    let pipeline = [];
    
    // Add time filter
    if (timeframe) {
      pipeline.push({
        $match: {
          timestamp: {
            $gte: this.getTimeframeStart(timeframe.period),
            $lte: timeframe.end || new Date()
          }
        }
      });
    }
    
    // Add custom filters
    if (filters && filters.length > 0) {
      const filterMatch = {};
      filters.forEach(filter => {
        filterMatch[filter.field] = this.buildFilterCondition(filter);
      });
      pipeline.push({ $match: filterMatch });
    }
    
    // Add grouping
    if (groupBy && groupBy.length > 0) {
      const groupId = {};
      groupBy.forEach(field => {
        groupId[field] = `$${field}`;
      });
      
      const groupStage = {
        $group: {
          _id: groupId,
          ...this.buildMetricsAggregation(metrics)
        }
      };
      
      pipeline.push(groupStage);
    }
    
    // Execute query
    const results = await Analytics.aggregate(pipeline);
    
    return {
      query: queryConfig,
      results,
      executedAt: new Date(),
      resultCount: results.length
    };
  },
  
  buildMetricsAggregation(metrics) {
    const aggregation = {};
    
    metrics.forEach(metric => {
      switch (metric.type) {
        case 'count':
          aggregation[metric.name] = { $sum: 1 };
          break;
        case 'sum':
          aggregation[metric.name] = { $sum: `$${metric.field}` };
          break;
        case 'average':
          aggregation[metric.name] = { $avg: `$${metric.field}` };
          break;
        case 'max':
          aggregation[metric.name] = { $max: `$${metric.field}` };
          break;
        case 'min':
          aggregation[metric.name] = { $min: `$${metric.field}` };
          break;
      }
    });
    
    return aggregation;
  }
};
```

---

*Analytics Dashboard System Version 1.0*
*Last Updated: January 15, 2024*
*Next Phase: Integration with frontend dashboard components*