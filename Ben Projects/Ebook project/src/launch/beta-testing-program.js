/**
 * Beta Testing Program
 * Comprehensive beta user management, feedback collection, and testing coordination
 */

import { User } from '../models/User.js';
import { BetaTester } from '../models/BetaTester.js';
import { Feedback } from '../models/Feedback.js';
import { Analytics } from '../models/Analytics.js';
import CommunicationSupportService from '../integrations/communication-support.js';

class BetaTestingProgram {
  constructor() {
    this.communicationService = new CommunicationSupportService();
    
    this.betaConfig = {
      maxBetaUsers: 100,
      testingPeriod: 30, // days
      feedbackRequirements: {
        minSessions: 5,
        minFeedbackItems: 3,
        minBooksCreated: 1
      },
      incentives: {
        freeMonths: 3,
        earlyAccessFeatures: true,
        betaBadge: true,
        prioritySupport: true
      }
    };
    
    this.testingPhases = {
      alpha: {
        name: 'Alpha Testing',
        duration: 14,
        userLimit: 25,
        features: ['core_functionality', 'basic_ai_generation'],
        focus: 'Core functionality and basic user flows'
      },
      beta: {
        name: 'Beta Testing',
        duration: 30,
        userLimit: 75,
        features: ['all_features', 'advanced_ai', 'collaboration'],
        focus: 'Full feature testing and user experience'
      },
      prelaunch: {
        name: 'Pre-launch',
        duration: 14,
        userLimit: 100,
        features: ['production_ready'],
        focus: 'Final testing and performance validation'
      }
    };
    
    this.feedbackCategories = {
      usability: 'User Experience & Interface',
      functionality: 'Feature Functionality',
      performance: 'Performance & Speed',
      bugs: 'Bugs & Issues',
      suggestions: 'Feature Suggestions',
      content_quality: 'AI Content Quality',
      onboarding: 'Onboarding Experience'
    };
  }
  
  // Beta User Recruitment
  async recruitBetaUsers(targetCount = 100, criteria = {}) {
    console.log(`🎯 Recruiting ${targetCount} beta users...`);
    
    try {
      const recruitmentCampaign = {
        id: `beta-recruitment-${Date.now()}`,
        targetCount,
        criteria: {
          demographics: criteria.demographics || ['writers', 'content_creators', 'authors'],
          experience: criteria.experience || ['beginner', 'intermediate', 'advanced'],
          platforms: criteria.platforms || ['web', 'mobile'],
          commitment: criteria.commitment || 'high'
        },
        channels: [
          'email_list',
          'social_media',
          'writing_communities',
          'referrals',
          'content_marketing'
        ],
        timeline: {
          start: new Date(),
          end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
        }
      };
      
      // Create recruitment landing page content
      const landingPageContent = await this.createRecruitmentContent();
      
      // Set up tracking for recruitment metrics
      await this.setupRecruitmentTracking(recruitmentCampaign.id);
      
      // Launch recruitment campaigns
      const campaignResults = await this.launchRecruitmentCampaigns(recruitmentCampaign);
      
      return {
        campaign: recruitmentCampaign,
        landingPage: landingPageContent,
        results: campaignResults
      };
      
    } catch (error) {
      console.error('Beta user recruitment failed:', error);
      throw error;
    }
  }
  
  async createRecruitmentContent() {
    return {
      headline: 'Join Our Exclusive Beta Program - Shape the Future of AI-Powered Writing',
      subheadline: 'Get early access to revolutionary AI writing tools and help us build the perfect platform for authors',
      
      benefits: [
        '3 months free access to all premium features',
        'Direct influence on product development',
        'Exclusive beta tester badge and recognition',
        'Priority customer support',
        'Early access to new features',
        'Networking with fellow beta writers'
      ],
      
      requirements: [
        'Commit to 2-4 hours of testing per week',
        'Provide detailed feedback on your experience',
        'Create at least one complete book during beta',
        'Participate in weekly feedback sessions',
        'Test new features as they\'re released'
      ],
      
      timeline: [
        { phase: 'Application', duration: '2 weeks', description: 'Submit application and get selected' },
        { phase: 'Onboarding', duration: '1 week', description: 'Complete setup and initial training' },
        { phase: 'Testing', duration: '4 weeks', description: 'Active testing and feedback' },
        { phase: 'Wrap-up', duration: '1 week', description: 'Final feedback and transition' }
      ],
      
      applicationForm: {
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Full Name' },
          { name: 'email', type: 'email', required: true, label: 'Email Address' },
          { name: 'writing_experience', type: 'select', required: true, label: 'Writing Experience',
            options: ['Beginner (0-1 years)', 'Intermediate (2-5 years)', 'Advanced (5+ years)', 'Professional Author'] },
          { name: 'genres', type: 'multiselect', required: true, label: 'Preferred Genres',
            options: ['Mystery', 'Self-Help', 'Fiction', 'Non-Fiction', 'Business', 'Romance', 'Sci-Fi', 'Other'] },
          { name: 'current_tools', type: 'text', required: false, label: 'Current Writing Tools' },
          { name: 'motivation', type: 'textarea', required: true, label: 'Why do you want to join our beta program?' },
          { name: 'availability', type: 'select', required: true, label: 'Weekly Availability',
            options: ['2-4 hours', '4-6 hours', '6-8 hours', '8+ hours'] },
          { name: 'feedback_experience', type: 'select', required: false, label: 'Previous Beta Testing Experience',
            options: ['None', 'Some', 'Extensive'] }
        ]
      }
    };
  }
  
  async launchRecruitmentCampaigns(campaign) {
    const results = {
      emailCampaign: await this.launchEmailCampaign(campaign),
      socialMedia: await this.launchSocialMediaCampaign(campaign),
      contentMarketing: await this.launchContentMarketingCampaign(campaign),
      partnerships: await this.launchPartnershipCampaign(campaign)
    };
    
    return results;
  }
  
  async launchEmailCampaign(campaign) {
    // Email existing subscribers about beta program
    const emailContent = {
      subject: '🚀 Exclusive Invitation: Join Our AI Writing Beta Program',
      template: 'beta-recruitment',
      data: {
        benefits: campaign.criteria,
        application_url: `${process.env.FRONTEND_URL}/beta/apply`,
        deadline: campaign.timeline.end.toLocaleDateString()
      }
    };
    
    // Send to segmented email list
    const emailResults = await this.communicationService.sendEmail(
      'beta-recruitment-list@ai-ebook-platform.com',
      emailContent.template,
      emailContent.data
    );
    
    return {
      channel: 'email',
      sent: true,
      estimatedReach: 5000,
      expectedConversion: '2-5%'
    };
  }
  
  async launchSocialMediaCampaign(campaign) {
    const socialContent = {
      platforms: ['twitter', 'linkedin', 'facebook', 'reddit'],
      posts: [
        {
          platform: 'twitter',
          content: '🎯 Calling all writers! Join our exclusive beta program and get early access to revolutionary AI writing tools. Shape the future of content creation! #AIWriting #BetaTest #WritingCommunity',
          hashtags: ['#AIWriting', '#BetaTest', '#WritingTools', '#Authors']
        },
        {
          platform: 'linkedin',
          content: 'We\'re looking for passionate writers to join our beta testing program. Get exclusive access to cutting-edge AI writing technology and help us build the perfect platform for content creators.',
          targeting: ['writers', 'content creators', 'authors', 'marketers']
        }
      ]
    };
    
    return {
      channel: 'social_media',
      platforms: socialContent.platforms,
      estimatedReach: 15000,
      expectedConversion: '1-3%'
    };
  }
  
  async launchContentMarketingCampaign(campaign) {
    const contentPieces = [
      {
        type: 'blog_post',
        title: 'The Future of AI-Assisted Writing: What Our Beta Testers Are Discovering',
        description: 'Behind-the-scenes look at our beta program and early results'
      },
      {
        type: 'video',
        title: 'Beta Tester Spotlight: How AI is Transforming the Writing Process',
        description: 'Interviews with current beta testers about their experience'
      },
      {
        type: 'webinar',
        title: 'Live Demo: AI Writing Tools in Action + Beta Program Q&A',
        description: 'Interactive session showcasing features and answering questions'
      }
    ];
    
    return {
      channel: 'content_marketing',
      pieces: contentPieces.length,
      estimatedReach: 8000,
      expectedConversion: '3-7%'
    };
  }
  
  async launchPartnershipCampaign(campaign) {
    const partnerships = [
      {
        partner: 'Writing Communities',
        type: 'community_partnership',
        reach: 25000,
        description: 'Partner with writing forums and communities for beta recruitment'
      },
      {
        partner: 'Writing Influencers',
        type: 'influencer_partnership',
        reach: 50000,
        description: 'Collaborate with writing influencers for beta program promotion'
      },
      {
        partner: 'Writing Courses',
        type: 'educational_partnership',
        reach: 10000,
        description: 'Partner with online writing courses for student recruitment'
      }
    ];
    
    return {
      channel: 'partnerships',
      partnerships: partnerships.length,
      totalReach: partnerships.reduce((sum, p) => sum + p.reach, 0),
      expectedConversion: '5-10%'
    };
  }
  
  // Beta User Management
  async processBetaApplication(applicationData) {
    try {
      // Score application based on criteria
      const score = await this.scoreApplication(applicationData);
      
      // Create beta tester record
      const betaTester = await BetaTester.create({
        email: applicationData.email,
        name: applicationData.name,
        writingExperience: applicationData.writing_experience,
        preferredGenres: applicationData.genres,
        motivation: applicationData.motivation,
        availability: applicationData.availability,
        applicationScore: score,
        status: score >= 70 ? 'accepted' : 'pending',
        appliedAt: new Date(),
        phase: 'application'
      });
      
      // Send response email
      if (betaTester.status === 'accepted') {
        await this.sendAcceptanceEmail(betaTester);
      } else {
        await this.sendPendingEmail(betaTester);
      }
      
      // Track application
      await this.trackEvent('beta_application_submitted', {
        email: applicationData.email,
        score: score,
        status: betaTester.status
      });
      
      return betaTester;
      
    } catch (error) {
      console.error('Beta application processing failed:', error);
      throw error;
    }
  }
  
  async scoreApplication(application) {
    let score = 0;
    
    // Writing experience (0-25 points)
    const experienceScores = {
      'Beginner (0-1 years)': 10,
      'Intermediate (2-5 years)': 20,
      'Advanced (5+ years)': 25,
      'Professional Author': 25
    };
    score += experienceScores[application.writing_experience] || 0;
    
    // Availability (0-20 points)
    const availabilityScores = {
      '2-4 hours': 15,
      '4-6 hours': 20,
      '6-8 hours': 20,
      '8+ hours': 18 // Too much might indicate lack of focus
    };
    score += availabilityScores[application.availability] || 0;
    
    // Motivation quality (0-25 points)
    const motivationLength = application.motivation.length;
    if (motivationLength > 200) score += 25;
    else if (motivationLength > 100) score += 20;
    else if (motivationLength > 50) score += 15;
    else score += 10;
    
    // Genre diversity (0-15 points)
    const genreCount = application.genres.length;
    if (genreCount >= 3) score += 15;
    else if (genreCount === 2) score += 10;
    else score += 5;
    
    // Beta testing experience (0-15 points)
    const betaExperienceScores = {
      'None': 5,
      'Some': 10,
      'Extensive': 15
    };
    score += betaExperienceScores[application.feedback_experience] || 5;
    
    return Math.min(score, 100);
  }
  
  async sendAcceptanceEmail(betaTester) {
    await this.communicationService.sendEmail(
      betaTester.email,
      'beta-acceptance',
      {
        name: betaTester.name,
        onboarding_url: `${process.env.FRONTEND_URL}/beta/onboarding`,
        slack_invite: `${process.env.BETA_SLACK_INVITE}`,
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    );
  }
  
  async sendPendingEmail(betaTester) {
    await this.communicationService.sendEmail(
      betaTester.email,
      'beta-pending',
      {
        name: betaTester.name,
        next_steps: 'We\'ll notify you if a spot becomes available',
        waitlist_position: await this.getWaitlistPosition(betaTester._id)
      }
    );
  }
  
  // Beta Testing Coordination
  async startBetaPhase(phase, participants) {
    console.log(`🚀 Starting ${phase} phase with ${participants.length} participants...`);
    
    try {
      const phaseConfig = this.testingPhases[phase];
      
      // Create beta phase record
      const betaPhase = {
        phase,
        config: phaseConfig,
        participants: participants.map(p => p._id),
        startDate: new Date(),
        endDate: new Date(Date.now() + phaseConfig.duration * 24 * 60 * 60 * 1000),
        status: 'active',
        objectives: await this.getPhaseObjectives(phase),
        testingTasks: await this.getTestingTasks(phase)
      };
      
      // Update participant status
      await BetaTester.updateMany(
        { _id: { $in: participants.map(p => p._id) } },
        { 
          phase: phase,
          phaseStartDate: betaPhase.startDate,
          status: 'active_testing'
        }
      );
      
      // Send phase kickoff emails
      for (const participant of participants) {
        await this.sendPhaseKickoffEmail(participant, betaPhase);
      }
      
      // Set up phase monitoring
      await this.setupPhaseMonitoring(betaPhase);
      
      // Schedule phase activities
      await this.schedulePhaseActivities(betaPhase);
      
      return betaPhase;
      
    } catch (error) {
      console.error('Beta phase start failed:', error);
      throw error;
    }
  }
  
  async getPhaseObjectives(phase) {
    const objectives = {
      alpha: [
        'Test core user registration and onboarding flow',
        'Validate basic book creation and editing functionality',
        'Test AI content generation with mystery and self-help genres',
        'Identify critical bugs and usability issues',
        'Gather feedback on overall user experience'
      ],
      beta: [
        'Test all premium features and subscription tiers',
        'Validate advanced AI features and content quality',
        'Test collaboration and sharing features',
        'Evaluate market research and analytics tools',
        'Test export functionality across all formats',
        'Stress test performance with realistic usage'
      ],
      prelaunch: [
        'Final validation of all user workflows',
        'Performance testing under production load',
        'Security and privacy compliance verification',
        'Payment processing and billing validation',
        'Customer support process testing',
        'Final UI/UX polish and optimization'
      ]
    };
    
    return objectives[phase] || [];
  }
  
  async getTestingTasks(phase) {
    const tasks = {
      alpha: [
        {
          name: 'Complete User Onboarding',
          description: 'Register, complete profile, and explore dashboard',
          priority: 'high',
          estimatedTime: '30 minutes'
        },
        {
          name: 'Create First Book',
          description: 'Create a new book project and add initial content',
          priority: 'high',
          estimatedTime: '45 minutes'
        },
        {
          name: 'Test AI Generation',
          description: 'Use AI assistant to generate content for your book',
          priority: 'high',
          estimatedTime: '60 minutes'
        },
        {
          name: 'Provide Feedback',
          description: 'Submit detailed feedback on your experience',
          priority: 'high',
          estimatedTime: '30 minutes'
        }
      ],
      beta: [
        {
          name: 'Test All Features',
          description: 'Explore and test all available platform features',
          priority: 'high',
          estimatedTime: '2 hours'
        },
        {
          name: 'Create Complete Book',
          description: 'Write and complete a full book using the platform',
          priority: 'high',
          estimatedTime: '10 hours'
        },
        {
          name: 'Test Collaboration',
          description: 'Share your book and collaborate with other beta testers',
          priority: 'medium',
          estimatedTime: '1 hour'
        },
        {
          name: 'Export Testing',
          description: 'Export your book in all available formats',
          priority: 'high',
          estimatedTime: '30 minutes'
        }
      ],
      prelaunch: [
        {
          name: 'End-to-End Testing',
          description: 'Complete full user journey from signup to book publication',
          priority: 'high',
          estimatedTime: '3 hours'
        },
        {
          name: 'Performance Testing',
          description: 'Test platform performance during peak usage',
          priority: 'high',
          estimatedTime: '1 hour'
        },
        {
          name: 'Final Feedback',
          description: 'Provide comprehensive feedback for launch readiness',
          priority: 'high',
          estimatedTime: '45 minutes'
        }
      ]
    };
    
    return tasks[phase] || [];
  }
  
  // Feedback Collection
  async collectFeedback(betaTesterId, feedbackData) {
    try {
      const feedback = await Feedback.create({
        betaTesterId,
        category: feedbackData.category,
        title: feedbackData.title,
        description: feedbackData.description,
        severity: feedbackData.severity || 'medium',
        feature: feedbackData.feature,
        rating: feedbackData.rating,
        suggestions: feedbackData.suggestions || [],
        screenshots: feedbackData.screenshots || [],
        browserInfo: feedbackData.browserInfo,
        deviceInfo: feedbackData.deviceInfo,
        submittedAt: new Date()
      });
      
      // Categorize and prioritize feedback
      await this.categorizeFeedback(feedback);
      
      // Notify relevant team members
      await this.notifyTeamOfFeedback(feedback);
      
      // Update beta tester engagement
      await this.updateTesterEngagement(betaTesterId, 'feedback_submitted');
      
      return feedback;
      
    } catch (error) {
      console.error('Feedback collection failed:', error);
      throw error;
    }
  }
  
  async categorizeFeedback(feedback) {
    // Auto-categorize based on keywords and content
    const categories = {
      bug: ['error', 'broken', 'crash', 'not working', 'issue'],
      usability: ['confusing', 'difficult', 'unclear', 'hard to find'],
      performance: ['slow', 'loading', 'timeout', 'lag'],
      feature_request: ['would like', 'suggestion', 'add', 'improve'],
      content_quality: ['ai generated', 'content', 'quality', 'accuracy']
    };
    
    const description = feedback.description.toLowerCase();
    let detectedCategory = 'general';
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        detectedCategory = category;
        break;
      }
    }
    
    await Feedback.findByIdAndUpdate(feedback._id, {
      autoCategory: detectedCategory,
      priority: this.calculateFeedbackPriority(feedback)
    });
  }
  
  calculateFeedbackPriority(feedback) {
    let priority = 'medium';
    
    // High priority for bugs and critical issues
    if (feedback.severity === 'high' || feedback.category === 'bugs') {
      priority = 'high';
    }
    
    // High priority for frequently reported issues
    // (This would check against existing feedback in production)
    
    // Low priority for minor suggestions
    if (feedback.category === 'suggestions' && feedback.severity === 'low') {
      priority = 'low';
    }
    
    return priority;
  }
  
  // Beta Program Analytics
  async getBetaProgramAnalytics() {
    try {
      const analytics = {
        overview: await this.getBetaOverview(),
        engagement: await this.getBetaEngagement(),
        feedback: await this.getFeedbackAnalytics(),
        performance: await this.getBetaPerformance(),
        completion: await this.getCompletionRates()
      };
      
      return analytics;
      
    } catch (error) {
      console.error('Beta analytics failed:', error);
      throw error;
    }
  }
  
  async getBetaOverview() {
    const totalTesters = await BetaTester.countDocuments();
    const activeTesters = await BetaTester.countDocuments({ status: 'active_testing' });
    const completedTesters = await BetaTester.countDocuments({ status: 'completed' });
    
    return {
      total: totalTesters,
      active: activeTesters,
      completed: completedTesters,
      completionRate: totalTesters > 0 ? (completedTesters / totalTesters) * 100 : 0
    };
  }
  
  async getBetaEngagement() {
    const engagementData = await BetaTester.aggregate([
      {
        $group: {
          _id: null,
          avgSessionsPerUser: { $avg: '$sessionCount' },
          avgFeedbackPerUser: { $avg: '$feedbackCount' },
          avgBooksCreated: { $avg: '$booksCreated' }
        }
      }
    ]);
    
    return engagementData[0] || {
      avgSessionsPerUser: 0,
      avgFeedbackPerUser: 0,
      avgBooksCreated: 0
    };
  }
  
  async getFeedbackAnalytics() {
    const feedbackStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    
    const totalFeedback = await Feedback.countDocuments();
    const criticalIssues = await Feedback.countDocuments({ severity: 'high' });
    
    return {
      total: totalFeedback,
      critical: criticalIssues,
      byCategory: feedbackStats,
      responseRate: await this.calculateFeedbackResponseRate()
    };
  }
  
  async calculateFeedbackResponseRate() {
    const totalTesters = await BetaTester.countDocuments({ status: { $ne: 'pending' } });
    const testersWithFeedback = await BetaTester.countDocuments({ feedbackCount: { $gt: 0 } });
    
    return totalTesters > 0 ? (testersWithFeedback / totalTesters) * 100 : 0;
  }
  
  // Beta Program Completion
  async completeBetaProgram() {
    console.log('🎯 Completing Beta Testing Program...');
    
    try {
      const completionReport = {
        summary: await this.generateBetaSummary(),
        feedback: await this.compileFeedbackReport(),
        recommendations: await this.generateLaunchRecommendations(),
        metrics: await this.getBetaProgramAnalytics(),
        testimonials: await this.collectTestimonials(),
        improvements: await this.documentImprovements()
      };
      
      // Transition beta testers to launch users
      await this.transitionBetaTesters();
      
      // Send completion emails
      await this.sendBetaCompletionEmails();
      
      return completionReport;
      
    } catch (error) {
      console.error('Beta program completion failed:', error);
      throw error;
    }
  }
  
  async generateBetaSummary() {
    const analytics = await this.getBetaProgramAnalytics();
    
    return {
      duration: '6 weeks',
      participants: analytics.overview.total,
      completionRate: analytics.overview.completionRate,
      feedbackItems: analytics.feedback.total,
      criticalIssuesResolved: analytics.feedback.critical,
      keyAchievements: [
        'Validated core user workflows',
        'Identified and fixed critical bugs',
        'Optimized AI content generation',
        'Improved user onboarding experience',
        'Enhanced platform performance'
      ]
    };
  }
  
  async transitionBetaTesters() {
    // Give beta testers their promised benefits
    const betaTesters = await BetaTester.find({ status: 'completed' });
    
    for (const tester of betaTesters) {
      // Create user account with benefits
      const user = await User.create({
        email: tester.email,
        profile: {
          firstName: tester.name.split(' ')[0],
          lastName: tester.name.split(' ').slice(1).join(' ')
        },
        betaTester: true,
        benefits: {
          freeMonths: this.betaConfig.incentives.freeMonths,
          betaBadge: true,
          prioritySupport: true
        }
      });
      
      // Send transition email
      await this.communicationService.sendEmail(
        tester.email,
        'beta-to-launch-transition',
        {
          name: tester.name,
          benefits: user.benefits,
          login_url: `${process.env.FRONTEND_URL}/login`
        }
      );
    }
  }
  
  // Utility Methods
  async trackEvent(eventType, eventData) {
    try {
      await Analytics.create({
        eventType: `beta_${eventType}`,
        eventData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track beta event:', error);
    }
  }
  
  async getWaitlistPosition(betaTesterId) {
    const waitlistCount = await BetaTester.countDocuments({
      status: 'pending',
      appliedAt: { $lt: (await BetaTester.findById(betaTesterId)).appliedAt }
    });
    
    return waitlistCount + 1;
  }
  
  async updateTesterEngagement(betaTesterId, action) {
    const updateFields = {};
    
    switch (action) {
      case 'session_started':
        updateFields.$inc = { sessionCount: 1 };
        updateFields.lastActiveAt = new Date();
        break;
      case 'feedback_submitted':
        updateFields.$inc = { feedbackCount: 1 };
        break;
      case 'book_created':
        updateFields.$inc = { booksCreated: 1 };
        break;
    }
    
    await BetaTester.findByIdAndUpdate(betaTesterId, updateFields);
  }
}

export default BetaTestingProgram;