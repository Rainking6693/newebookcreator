/**
 * Goal-Based Onboarding Flow and Assessment System
 * Personalizes user experience based on goals, experience, and preferences
 */

export const onboardingFlow = {
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to AI Ebook Platform',
      type: 'introduction',
      content: {
        heading: 'Turn Your Ideas Into Published Books',
        subheading: 'AI-powered writing assistance for mystery novels and self-help books',
        features: [
          'AI-generated content with your creative direction',
          'Market research and trend analysis',
          'Professional formatting and export',
          'Revenue sharing opportunities'
        ],
        cta: 'Get Started',
        estimatedTime: '2 minutes'
      }
    },
    
    {
      id: 'goals',
      title: 'What\'s Your Writing Goal?',
      type: 'selection',
      required: true,
      content: {
        question: 'What brings you to our platform today?',
        options: [
          {
            id: 'first_book',
            title: 'Write My First Book',
            description: 'I\'ve always wanted to write a book but need guidance',
            icon: '📚',
            followUp: ['genre_selection', 'experience_level']
          },
          {
            id: 'scale_business',
            title: 'Scale My Expertise',
            description: 'I want to turn my knowledge into a published book',
            icon: '🚀',
            followUp: ['business_type', 'target_audience']
          },
          {
            id: 'passive_income',
            title: 'Generate Passive Income',
            description: 'I want to create books that generate ongoing revenue',
            icon: '💰',
            followUp: ['genre_selection', 'time_commitment']
          },
          {
            id: 'share_story',
            title: 'Share My Story',
            description: 'I have experiences and wisdom to share with others',
            icon: '✨',
            followUp: ['story_type', 'target_audience']
          }
        ]
      }
    },
    
    {
      id: 'genre_selection',
      title: 'Choose Your Genre',
      type: 'selection',
      required: true,
      conditional: ['first_book', 'passive_income'],
      content: {
        question: 'What type of book do you want to write?',
        options: [
          {
            id: 'mystery',
            title: 'Mystery/Crime Fiction',
            description: 'Suspenseful stories with puzzles to solve',
            icon: '🔍',
            marketData: {
              averageLength: '70,000-90,000 words',
              averagePrice: '$4.99',
              marketSize: '45 million readers',
              growthRate: '+12% annually'
            },
            templates: ['cozy_mystery', 'police_procedural', 'amateur_sleuth']
          },
          {
            id: 'self_help',
            title: 'Self-Help/Personal Development',
            description: 'Practical guidance for personal improvement',
            icon: '🌱',
            marketData: {
              averageLength: '50,000-70,000 words',
              averagePrice: '$7.99',
              marketSize: '78 million readers',
              growthRate: '+18% annually'
            },
            templates: ['productivity', 'wellness', 'relationships', 'career']
          }
        ]
      }
    },
    
    {
      id: 'experience_level',
      title: 'Writing Experience',
      type: 'selection',
      required: true,
      content: {
        question: 'How would you describe your writing experience?',
        options: [
          {
            id: 'beginner',
            title: 'Complete Beginner',
            description: 'I\'ve never written anything substantial',
            icon: '🌱',
            recommendations: {
              aiAssistance: 'high',
              templates: 'detailed',
              guidance: 'step_by_step',
              wordTarget: 'conservative'
            }
          },
          {
            id: 'some_experience',
            title: 'Some Experience',
            description: 'I\'ve written blogs, articles, or short pieces',
            icon: '📝',
            recommendations: {
              aiAssistance: 'medium',
              templates: 'flexible',
              guidance: 'as_needed',
              wordTarget: 'standard'
            }
          },
          {
            id: 'experienced',
            title: 'Experienced Writer',
            description: 'I\'ve published short works or have writing training',
            icon: '✍️',
            recommendations: {
              aiAssistance: 'low',
              templates: 'minimal',
              guidance: 'advanced',
              wordTarget: 'ambitious'
            }
          },
          {
            id: 'professional',
            title: 'Professional Writer',
            description: 'I\'ve published books or write professionally',
            icon: '🏆',
            recommendations: {
              aiAssistance: 'custom',
              templates: 'none',
              guidance: 'expert',
              wordTarget: 'unlimited'
            }
          }
        ]
      }
    },
    
    {
      id: 'time_commitment',
      title: 'Time Availability',
      type: 'selection',
      required: true,
      content: {
        question: 'How much time can you dedicate to writing?',
        options: [
          {
            id: 'casual',
            title: '1-3 hours per week',
            description: 'Writing as a hobby in spare time',
            icon: '🕐',
            timeline: '6-12 months',
            recommendations: {
              sessionLength: 'short',
              aiAssistance: 'high',
              reminders: 'weekly'
            }
          },
          {
            id: 'regular',
            title: '4-10 hours per week',
            description: 'Consistent writing schedule',
            icon: '📅',
            timeline: '3-6 months',
            recommendations: {
              sessionLength: 'medium',
              aiAssistance: 'medium',
              reminders: 'bi_weekly'
            }
          },
          {
            id: 'intensive',
            title: '10+ hours per week',
            description: 'Serious commitment to writing',
            icon: '⚡',
            timeline: '1-3 months',
            recommendations: {
              sessionLength: 'long',
              aiAssistance: 'low',
              reminders: 'daily'
            }
          }
        ]
      }
    },
    
    {
      id: 'target_audience',
      title: 'Target Audience',
      type: 'selection',
      required: true,
      conditional: ['scale_business', 'share_story'],
      content: {
        question: 'Who do you want to reach with your book?',
        options: [
          {
            id: 'general_public',
            title: 'General Public',
            description: 'Broad audience interested in the topic',
            icon: '🌍'
          },
          {
            id: 'professionals',
            title: 'Industry Professionals',
            description: 'People in your field or industry',
            icon: '💼'
          },
          {
            id: 'specific_demographic',
            title: 'Specific Group',
            description: 'Particular age, gender, or interest group',
            icon: '🎯'
          },
          {
            id: 'existing_audience',
            title: 'My Existing Audience',
            description: 'Current clients, followers, or community',
            icon: '👥'
          }
        ]
      }
    },
    
    {
      id: 'book_length',
      title: 'Book Length Preference',
      type: 'selection',
      required: true,
      content: {
        question: 'What length book are you aiming for?',
        options: [
          {
            id: 'novella',
            title: 'Novella (20k-40k words)',
            description: 'Quick read, focused topic',
            icon: '📖',
            timeEstimate: '2-4 weeks',
            tier: 'basic'
          },
          {
            id: 'standard',
            title: 'Standard Book (50k-75k words)',
            description: 'Traditional book length',
            icon: '📚',
            timeEstimate: '6-10 weeks',
            tier: 'pro'
          },
          {
            id: 'comprehensive',
            title: 'Comprehensive (75k-100k words)',
            description: 'In-depth, authoritative work',
            icon: '📕',
            timeEstimate: '10-16 weeks',
            tier: 'pro'
          },
          {
            id: 'epic',
            title: 'Epic (100k+ words)',
            description: 'Extensive, detailed exploration',
            icon: '📗',
            timeEstimate: '16+ weeks',
            tier: 'author'
          }
        ]
      }
    },
    
    {
      id: 'ai_comfort',
      title: 'AI Assistance Preference',
      type: 'scale',
      required: true,
      content: {
        question: 'How much AI assistance would you like?',
        scale: {
          min: 1,
          max: 5,
          labels: {
            1: 'Minimal - I want to write mostly myself',
            2: 'Light - Occasional suggestions and help',
            3: 'Balanced - Equal collaboration with AI',
            4: 'Heavy - AI does most writing, I guide and edit',
            5: 'Maximum - AI generates, I review and approve'
          }
        },
        explanation: 'You can always adjust this later in your settings'
      }
    },
    
    {
      id: 'revenue_interest',
      title: 'Revenue Sharing Interest',
      type: 'selection',
      required: false,
      content: {
        question: 'Are you interested in our revenue sharing program?',
        description: 'Earn 70% of net sales from your published books',
        options: [
          {
            id: 'very_interested',
            title: 'Very Interested',
            description: 'I want to maximize earning potential',
            icon: '💰'
          },
          {
            id: 'somewhat_interested',
            title: 'Somewhat Interested',
            description: 'I\'d like to learn more about it',
            icon: '🤔'
          },
          {
            id: 'not_interested',
            title: 'Not Interested',
            description: 'I just want to write and publish',
            icon: '📝'
          },
          {
            id: 'decide_later',
            title: 'Decide Later',
            description: 'I\'ll think about it after writing',
            icon: '⏰'
          }
        ]
      }
    },
    
    {
      id: 'plan_selection',
      title: 'Choose Your Plan',
      type: 'plan_selection',
      required: true,
      content: {
        question: 'Select the plan that fits your needs',
        plans: [
          {
            id: 'basic',
            name: 'Basic',
            price: 29.99,
            wordLimit: 75000,
            features: [
              'AI-powered content generation',
              'Basic templates and prompts',
              'EPUB and PDF export',
              'Email support',
              'Basic market research'
            ],
            recommended: ['beginner', 'casual', 'novella']
          },
          {
            id: 'pro',
            name: 'Pro',
            price: 49.99,
            wordLimit: 100000,
            features: [
              'Everything in Basic',
              'Advanced AI models',
              'Premium templates',
              'Advanced market research',
              'Priority support',
              'Collaboration tools'
            ],
            recommended: ['some_experience', 'regular', 'standard'],
            popular: true
          },
          {
            id: 'author',
            name: 'Author',
            price: 99.99,
            wordLimit: 150000,
            features: [
              'Everything in Pro',
              'Unlimited AI generations',
              'Custom AI training',
              'Revenue sharing program',
              'Publishing assistance',
              'Dedicated account manager'
            ],
            recommended: ['experienced', 'professional', 'intensive', 'comprehensive']
          }
        ]
      }
    },
    
    {
      id: 'personalization',
      title: 'Personalize Your Experience',
      type: 'preferences',
      required: false,
      content: {
        question: 'Help us customize your experience',
        preferences: [
          {
            id: 'notifications',
            title: 'Email Notifications',
            type: 'checkbox',
            options: [
              'Writing reminders',
              'Progress milestones',
              'Market insights',
              'Platform updates'
            ]
          },
          {
            id: 'interface',
            title: 'Interface Preferences',
            type: 'radio',
            options: [
              { id: 'simple', title: 'Simple - Hide advanced features' },
              { id: 'standard', title: 'Standard - Show all features' },
              { id: 'advanced', title: 'Advanced - Power user mode' }
            ]
          },
          {
            id: 'ai_model',
            title: 'Preferred AI Model',
            type: 'radio',
            options: [
              { id: 'claude', title: 'Claude - Creative and nuanced' },
              { id: 'gpt4', title: 'GPT-4 - Structured and precise' },
              { id: 'auto', title: 'Auto - Best model for each task' }
            ]
          }
        ]
      }
    },
    
    {
      id: 'completion',
      title: 'You\'re All Set!',
      type: 'completion',
      content: {
        heading: 'Welcome to Your Writing Journey',
        summary: 'Based on your responses, we\'ve personalized your experience',
        nextSteps: [
          'Create your first book project',
          'Explore genre-specific templates',
          'Generate your first chapter',
          'Review market insights for your topic'
        ],
        cta: 'Start Writing'
      }
    }
  ]
};

export const assessmentLogic = {
  /**
   * Calculate user profile based on onboarding responses
   */
  calculateUserProfile(responses) {
    const profile = {
      userType: this.determineUserType(responses),
      experienceLevel: responses.experience_level,
      timeCommitment: responses.time_commitment,
      aiAssistanceLevel: responses.ai_comfort,
      recommendedPlan: this.recommendPlan(responses),
      customizations: this.generateCustomizations(responses)
    };
    
    return profile;
  },
  
  /**
   * Determine primary user type for personalization
   */
  determineUserType(responses) {
    const goal = responses.goals;
    const experience = responses.experience_level;
    
    if (goal === 'first_book' && ['beginner', 'some_experience'].includes(experience)) {
      return 'aspiring_author';
    }
    
    if (goal === 'scale_business' || responses.target_audience === 'professionals') {
      return 'business_expert';
    }
    
    if (goal === 'share_story' && ['experienced', 'professional'].includes(experience)) {
      return 'experienced_writer';
    }
    
    if (goal === 'passive_income') {
      return 'income_focused';
    }
    
    return 'general_writer';
  },
  
  /**
   * Recommend subscription plan based on responses
   */
  recommendPlan(responses) {
    const factors = {
      bookLength: responses.book_length,
      timeCommitment: responses.time_commitment,
      experienceLevel: responses.experience_level,
      revenueInterest: responses.revenue_interest
    };
    
    // Author plan recommendations
    if (factors.revenueInterest === 'very_interested' ||
        factors.bookLength === 'epic' ||
        factors.experienceLevel === 'professional') {
      return 'author';
    }
    
    // Pro plan recommendations
    if (factors.bookLength === 'comprehensive' ||
        factors.timeCommitment === 'intensive' ||
        factors.experienceLevel === 'experienced') {
      return 'pro';
    }
    
    // Basic plan default
    return 'basic';
  },
  
  /**
   * Generate interface and feature customizations
   */
  generateCustomizations(responses) {
    const customizations = {
      interface: {
        complexity: 'standard',
        aiAssistanceVisibility: 'prominent',
        progressTracking: 'detailed',
        marketResearch: 'basic'
      },
      features: {
        templates: [],
        aiSettings: {},
        notifications: {},
        dashboard: {}
      }
    };
    
    // Adjust interface complexity
    if (responses.experience_level === 'beginner') {
      customizations.interface.complexity = 'simple';
      customizations.interface.aiAssistanceVisibility = 'prominent';
    } else if (responses.experience_level === 'professional') {
      customizations.interface.complexity = 'advanced';
      customizations.interface.aiAssistanceVisibility = 'subtle';
    }
    
    // Configure AI settings
    customizations.features.aiSettings = {
      defaultModel: responses.ai_model || 'claude',
      assistanceLevel: responses.ai_comfort,
      temperature: this.calculateTemperature(responses),
      promptStyle: this.determinePromptStyle(responses)
    };
    
    // Set up templates based on genre and experience
    if (responses.genre_selection === 'mystery') {
      customizations.features.templates = [
        'cozy_mystery_outline',
        'character_development_mystery',
        'plot_structure_mystery'
      ];
    } else if (responses.genre_selection === 'self_help') {
      customizations.features.templates = [
        'self_help_framework',
        'chapter_structure_guide',
        'actionable_content_template'
      ];
    }
    
    return customizations;
  },
  
  /**
   * Calculate AI temperature based on user preferences
   */
  calculateTemperature(responses) {
    const baseTemp = 0.7;
    
    if (responses.genre_selection === 'mystery') {
      return baseTemp + 0.1; // More creative for fiction
    }
    
    if (responses.genre_selection === 'self_help') {
      return baseTemp - 0.1; // More structured for non-fiction
    }
    
    return baseTemp;
  },
  
  /**
   * Determine AI prompt style based on user type
   */
  determinePromptStyle(responses) {
    if (responses.experience_level === 'beginner') {
      return 'detailed_guidance';
    }
    
    if (responses.experience_level === 'professional') {
      return 'minimal_direction';
    }
    
    return 'balanced_assistance';
  }
};

export const onboardingUI = {
  /**
   * Generate step component props
   */
  getStepProps(stepId, responses = {}) {
    const step = onboardingFlow.steps.find(s => s.id === stepId);
    
    return {
      ...step,
      isVisible: this.shouldShowStep(stepId, responses),
      progress: this.calculateProgress(stepId),
      validation: this.getValidationRules(stepId)
    };
  },
  
  /**
   * Determine if step should be shown based on previous responses
   */
  shouldShowStep(stepId, responses) {
    const step = onboardingFlow.steps.find(s => s.id === stepId);
    
    if (!step.conditional) return true;
    
    return step.conditional.some(condition => 
      responses.goals === condition || 
      responses.genre_selection === condition
    );
  },
  
  /**
   * Calculate onboarding progress percentage
   */
  calculateProgress(currentStepId) {
    const totalSteps = onboardingFlow.steps.length;
    const currentIndex = onboardingFlow.steps.findIndex(s => s.id === currentStepId);
    
    return Math.round(((currentIndex + 1) / totalSteps) * 100);
  },
  
  /**
   * Get validation rules for step
   */
  getValidationRules(stepId) {
    const validationRules = {
      goals: { required: true, type: 'selection' },
      genre_selection: { required: true, type: 'selection' },
      experience_level: { required: true, type: 'selection' },
      time_commitment: { required: true, type: 'selection' },
      book_length: { required: true, type: 'selection' },
      ai_comfort: { required: true, type: 'scale', min: 1, max: 5 },
      plan_selection: { required: true, type: 'plan' }
    };
    
    return validationRules[stepId] || { required: false };
  }
};

export default {
  onboardingFlow,
  assessmentLogic,
  onboardingUI
};