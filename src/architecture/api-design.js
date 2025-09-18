/**
 * API Design and Route Definitions
 * RESTful API structure for the AI Ebook Platform
 */

export const apiRoutes = {
  // Authentication & User Management
  auth: {
    basePath: '/api/auth',
    routes: {
      register: {
        method: 'POST',
        path: '/register',
        description: 'User registration with email verification',
        requestBody: {
          email: 'string',
          password: 'string',
          firstName: 'string',
          lastName: 'string',
          writingExperience: 'enum'
        },
        responses: {
          201: { message: 'User created', userId: 'string', verificationSent: 'boolean' },
          400: { error: 'Validation error', details: 'array' },
          409: { error: 'Email already exists' }
        }
      },
      login: {
        method: 'POST',
        path: '/login',
        description: 'User authentication with JWT tokens',
        requestBody: {
          email: 'string',
          password: 'string'
        },
        responses: {
          200: { 
            accessToken: 'string', 
            refreshToken: 'string', 
            user: 'object',
            subscription: 'object'
          },
          401: { error: 'Invalid credentials' },
          423: { error: 'Account locked' }
        }
      },
      refresh: {
        method: 'POST',
        path: '/refresh',
        description: 'Refresh access token using refresh token',
        requestBody: {
          refreshToken: 'string'
        },
        responses: {
          200: { accessToken: 'string', refreshToken: 'string' },
          401: { error: 'Invalid refresh token' }
        }
      },
      logout: {
        method: 'POST',
        path: '/logout',
        description: 'Invalidate refresh token',
        responses: {
          200: { message: 'Logged out successfully' }
        }
      },
      forgotPassword: {
        method: 'POST',
        path: '/forgot-password',
        description: 'Send password reset email',
        requestBody: {
          email: 'string'
        },
        responses: {
          200: { message: 'Reset email sent' },
          404: { error: 'Email not found' }
        }
      },
      resetPassword: {
        method: 'POST',
        path: '/reset-password',
        description: 'Reset password with token',
        requestBody: {
          token: 'string',
          newPassword: 'string'
        },
        responses: {
          200: { message: 'Password reset successful' },
          400: { error: 'Invalid or expired token' }
        }
      }
    }
  },

  // User Profile & Settings
  users: {
    basePath: '/api/users',
    middleware: ['authenticate'],
    routes: {
      getProfile: {
        method: 'GET',
        path: '/profile',
        description: 'Get current user profile',
        responses: {
          200: { user: 'object', subscription: 'object', usage: 'object' }
        }
      },
      updateProfile: {
        method: 'PUT',
        path: '/profile',
        description: 'Update user profile information',
        requestBody: {
          firstName: 'string?',
          lastName: 'string?',
          bio: 'string?',
          avatar: 'string?',
          genres: 'array?',
          preferences: 'object?'
        },
        responses: {
          200: { user: 'object' },
          400: { error: 'Validation error' }
        }
      },
      getSubscription: {
        method: 'GET',
        path: '/subscription',
        description: 'Get subscription details and usage',
        responses: {
          200: { 
            subscription: 'object',
            usage: 'object',
            billing: 'object'
          }
        }
      },
      updateSubscription: {
        method: 'PUT',
        path: '/subscription',
        description: 'Update subscription tier',
        requestBody: {
          tier: 'enum',
          paymentMethodId: 'string?'
        },
        responses: {
          200: { subscription: 'object' },
          402: { error: 'Payment required' }
        }
      },
      getUsage: {
        method: 'GET',
        path: '/usage',
        description: 'Get detailed usage statistics',
        responses: {
          200: {
            wordQuota: 'object',
            generationHistory: 'array',
            costs: 'object'
          }
        }
      },
      deleteAccount: {
        method: 'DELETE',
        path: '/account',
        description: 'Delete user account and all data',
        requestBody: {
          password: 'string',
          confirmation: 'string'
        },
        responses: {
          200: { message: 'Account deleted' },
          401: { error: 'Invalid password' }
        }
      }
    }
  },

  // Book Management
  books: {
    basePath: '/api/books',
    middleware: ['authenticate'],
    routes: {
      getBooks: {
        method: 'GET',
        path: '/',
        description: 'Get user\'s books with pagination and filtering',
        queryParams: {
          page: 'number?',
          limit: 'number?',
          status: 'enum?',
          genre: 'enum?',
          search: 'string?'
        },
        responses: {
          200: {
            books: 'array',
            pagination: 'object',
            totalCount: 'number'
          }
        }
      },
      createBook: {
        method: 'POST',
        path: '/',
        description: 'Create new book project',
        requestBody: {
          title: 'string',
          genre: 'enum',
          description: 'string?',
          targetWordCount: 'number?',
          targetAudience: 'enum?'
        },
        responses: {
          201: { book: 'object' },
          400: { error: 'Validation error' },
          403: { error: 'Quota exceeded' }
        }
      },
      getBook: {
        method: 'GET',
        path: '/:id',
        description: 'Get specific book details',
        responses: {
          200: { book: 'object' },
          404: { error: 'Book not found' },
          403: { error: 'Access denied' }
        }
      },
      updateBook: {
        method: 'PUT',
        path: '/:id',
        description: 'Update book metadata',
        requestBody: {
          title: 'string?',
          description: 'string?',
          targetWordCount: 'number?',
          keywords: 'array?',
          outline: 'string?'
        },
        responses: {
          200: { book: 'object' },
          404: { error: 'Book not found' }
        }
      },
      deleteBook: {
        method: 'DELETE',
        path: '/:id',
        description: 'Delete book and all content',
        responses: {
          200: { message: 'Book deleted' },
          404: { error: 'Book not found' }
        }
      },
      generateContent: {
        method: 'POST',
        path: '/:id/generate',
        description: 'Generate AI content for book chapter',
        requestBody: {
          chapterId: 'string',
          prompt: 'string',
          model: 'enum?',
          temperature: 'number?',
          maxTokens: 'number?'
        },
        responses: {
          200: { 
            content: 'string',
            wordCount: 'number',
            cost: 'number',
            model: 'string'
          },
          400: { error: 'Invalid request' },
          403: { error: 'Quota exceeded' },
          429: { error: 'Rate limit exceeded' }
        }
      },
      exportBook: {
        method: 'POST',
        path: '/:id/export',
        description: 'Export book in specified format',
        requestBody: {
          format: 'enum',
          settings: 'object?'
        },
        responses: {
          200: { 
            downloadUrl: 'string',
            fileSize: 'number',
            expiresAt: 'string'
          },
          400: { error: 'Invalid format' },
          404: { error: 'Book not found' }
        }
      },
      getAnalytics: {
        method: 'GET',
        path: '/:id/analytics',
        description: 'Get book analytics and insights',
        responses: {
          200: {
            performance: 'object',
            marketInsights: 'object',
            qualityMetrics: 'object'
          }
        }
      }
    }
  },

  // AI Generation Services
  ai: {
    basePath: '/api/ai',
    middleware: ['authenticate', 'checkQuota'],
    routes: {
      generate: {
        method: 'POST',
        path: '/generate',
        description: 'Generate content using AI',
        requestBody: {
          prompt: 'string',
          model: 'enum',
          temperature: 'number?',
          maxTokens: 'number?',
          genre: 'enum?',
          context: 'string?'
        },
        responses: {
          200: {
            content: 'string',
            wordCount: 'number',
            tokensUsed: 'object',
            cost: 'number',
            model: 'string'
          },
          400: { error: 'Invalid parameters' },
          403: { error: 'Quota exceeded' },
          429: { error: 'Rate limit exceeded' },
          503: { error: 'AI service unavailable' }
        }
      },
      improve: {
        method: 'POST',
        path: '/improve',
        description: 'Improve existing content with AI',
        requestBody: {
          content: 'string',
          improvementType: 'enum',
          instructions: 'string?'
        },
        responses: {
          200: {
            improvedContent: 'string',
            changes: 'array',
            cost: 'number'
          }
        }
      },
      analyze: {
        method: 'POST',
        path: '/analyze',
        description: 'Analyze content quality and provide insights',
        requestBody: {
          content: 'string',
          analysisType: 'enum'
        },
        responses: {
          200: {
            qualityScore: 'number',
            readabilityScore: 'number',
            suggestions: 'array',
            insights: 'object'
          }
        }
      },
      getModels: {
        method: 'GET',
        path: '/models',
        description: 'Get available AI models and their capabilities',
        responses: {
          200: {
            models: 'array',
            recommendations: 'object'
          }
        }
      },
      getUsage: {
        method: 'GET',
        path: '/usage',
        description: 'Get AI usage statistics',
        queryParams: {
          period: 'enum?',
          model: 'string?'
        },
        responses: {
          200: {
            usage: 'object',
            costs: 'object',
            quotaRemaining: 'object'
          }
        }
      }
    }
  },

  // Market Research & Analytics
  market: {
    basePath: '/api/market',
    middleware: ['authenticate'],
    routes: {
      getTrends: {
        method: 'GET',
        path: '/trends/:genre',
        description: 'Get market trends for specific genre',
        responses: {
          200: {
            trends: 'object',
            bestsellers: 'array',
            insights: 'object',
            lastUpdated: 'string'
          }
        }
      },
      getKeywords: {
        method: 'GET',
        path: '/keywords',
        description: 'Get keyword research data',
        queryParams: {
          topic: 'string',
          genre: 'enum',
          limit: 'number?'
        },
        responses: {
          200: {
            keywords: 'array',
            searchVolumes: 'object',
            competition: 'object'
          }
        }
      },
      getCompetitors: {
        method: 'GET',
        path: '/competitors',
        description: 'Get competitor analysis',
        queryParams: {
          genre: 'enum',
          keywords: 'string?'
        },
        responses: {
          200: {
            competitors: 'array',
            marketGaps: 'array',
            opportunities: 'object'
          }
        }
      },
      getOpportunities: {
        method: 'GET',
        path: '/opportunities',
        description: 'Get market opportunities analysis',
        queryParams: {
          genre: 'enum',
          userProfile: 'object?'
        },
        responses: {
          200: {
            opportunities: 'array',
            recommendations: 'object',
            marketSize: 'object'
          }
        }
      }
    }
  },

  // Payment & Billing
  payments: {
    basePath: '/api/payments',
    middleware: ['authenticate'],
    routes: {
      createPaymentIntent: {
        method: 'POST',
        path: '/intent',
        description: 'Create Stripe payment intent',
        requestBody: {
          amount: 'number',
          currency: 'string',
          subscriptionTier: 'enum?',
          metadata: 'object?'
        },
        responses: {
          200: {
            clientSecret: 'string',
            paymentIntentId: 'string'
          }
        }
      },
      confirmPayment: {
        method: 'POST',
        path: '/confirm',
        description: 'Confirm payment and update subscription',
        requestBody: {
          paymentIntentId: 'string'
        },
        responses: {
          200: {
            subscription: 'object',
            receipt: 'object'
          }
        }
      },
      getBillingHistory: {
        method: 'GET',
        path: '/history',
        description: 'Get billing history',
        queryParams: {
          page: 'number?',
          limit: 'number?'
        },
        responses: {
          200: {
            payments: 'array',
            pagination: 'object'
          }
        }
      },
      webhook: {
        method: 'POST',
        path: '/webhook',
        description: 'Handle Stripe webhooks',
        middleware: ['verifyStripeSignature'],
        responses: {
          200: { received: 'boolean' }
        }
      },
      getRevenueShare: {
        method: 'GET',
        path: '/revenue-share',
        description: 'Get revenue sharing details',
        responses: {
          200: {
            totalEarnings: 'number',
            pendingPayouts: 'array',
            payoutHistory: 'array'
          }
        }
      }
    }
  },

  // Admin & System
  admin: {
    basePath: '/api/admin',
    middleware: ['authenticate', 'requireAdmin'],
    routes: {
      getStats: {
        method: 'GET',
        path: '/stats',
        description: 'Get platform statistics',
        responses: {
          200: {
            users: 'object',
            books: 'object',
            revenue: 'object',
            aiUsage: 'object'
          }
        }
      },
      getUsers: {
        method: 'GET',
        path: '/users',
        description: 'Get user list with pagination',
        queryParams: {
          page: 'number?',
          limit: 'number?',
          search: 'string?',
          tier: 'enum?'
        },
        responses: {
          200: {
            users: 'array',
            pagination: 'object'
          }
        }
      },
      updateUser: {
        method: 'PUT',
        path: '/users/:id',
        description: 'Update user account (admin)',
        requestBody: {
          subscription: 'object?',
          status: 'enum?'
        },
        responses: {
          200: { user: 'object' }
        }
      }
    }
  },

  // Health & Monitoring
  system: {
    basePath: '/api/system',
    routes: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'System health check',
        responses: {
          200: {
            status: 'string',
            timestamp: 'string',
            services: 'object',
            version: 'string'
          }
        }
      },
      metrics: {
        method: 'GET',
        path: '/metrics',
        middleware: ['authenticate', 'requireAdmin'],
        description: 'System metrics',
        responses: {
          200: {
            performance: 'object',
            usage: 'object',
            errors: 'object'
          }
        }
      }
    }
  }
};

// Middleware definitions
export const middleware = {
  authenticate: {
    description: 'Verify JWT token and set user context',
    implementation: 'verifyJWT'
  },
  checkQuota: {
    description: 'Check user word quota before AI operations',
    implementation: 'checkWordQuota'
  },
  requireAdmin: {
    description: 'Require admin role',
    implementation: 'requireRole("admin")'
  },
  verifyStripeSignature: {
    description: 'Verify Stripe webhook signature',
    implementation: 'verifyStripeWebhook'
  },
  rateLimiter: {
    description: 'Rate limiting based on user tier',
    implementation: 'rateLimitByTier'
  }
};

// Error response schemas
export const errorSchemas = {
  ValidationError: {
    error: 'string',
    details: 'array',
    field: 'string?'
  },
  AuthenticationError: {
    error: 'string',
    code: 'string'
  },
  AuthorizationError: {
    error: 'string',
    requiredRole: 'string?'
  },
  QuotaExceededError: {
    error: 'string',
    quotaUsed: 'number',
    quotaLimit: 'number',
    resetDate: 'string'
  },
  RateLimitError: {
    error: 'string',
    retryAfter: 'number'
  },
  InternalServerError: {
    error: 'string',
    requestId: 'string'
  }
};

export default {
  apiRoutes,
  middleware,
  errorSchemas
};