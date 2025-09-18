/**
 * Database Schema Definitions
 * MongoDB schemas using Mongoose for the AI Ebook Platform
 */

import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: 500
    },
    writingExperience: {
      type: String,
      enum: ['beginner', 'intermediate', 'experienced', 'professional'],
      default: 'beginner'
    },
    genres: [{
      type: String,
      enum: ['mystery', 'self-help', 'romance', 'sci-fi', 'fantasy', 'non-fiction', 'other']
    }]
  },
  subscription: {
    tier: {
      type: String,
      enum: ['basic', 'pro', 'author'],
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'trialing'],
      default: 'trialing'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    wordQuotaUsed: {
      type: Number,
      default: 0
    },
    wordQuotaLimit: {
      type: Number,
      default: 75000 // Basic tier limit
    },
    revenueShare: {
      enabled: {
        type: Boolean,
        default: false
      },
      percentage: {
        type: Number,
        default: 30
      },
      totalEarnings: {
        type: Number,
        default: 0
      }
    }
  },
  preferences: {
    aiModel: {
      type: String,
      enum: ['claude', 'gpt4'],
      default: 'claude'
    },
    contentFiltering: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  verification: {
    email: {
      verified: {
        type: Boolean,
        default: false
      },
      token: String,
      expiresAt: Date
    }
  },
  security: {
    mfaEnabled: {
      type: Boolean,
      default: false
    },
    mfaSecret: String,
    lastPasswordChange: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Book Schema
const bookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  genre: {
    type: String,
    required: true,
    enum: ['mystery', 'self-help'],
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'published'],
    default: 'draft',
    index: true
  },
  metadata: {
    description: {
      type: String,
      maxlength: 1000
    },
    targetWordCount: {
      type: Number,
      min: 10000,
      max: 200000
    },
    currentWordCount: {
      type: Number,
      default: 0
    },
    targetAudience: {
      type: String,
      enum: ['general', 'young-adult', 'adult', 'professional']
    },
    keywords: [{
      type: String,
      trim: true
    }],
    coverImage: String,
    isbn: String,
    publishedDate: Date,
    marketingCopy: {
      tagline: String,
      backCover: String,
      authorBio: String
    }
  },
  structure: {
    outline: {
      type: String,
      maxlength: 5000
    },
    chapters: [{
      id: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true,
        trim: true
      },
      content: {
        type: String,
        default: ''
      },
      wordCount: {
        type: Number,
        default: 0
      },
      status: {
        type: String,
        enum: ['planned', 'in-progress', 'completed', 'reviewed'],
        default: 'planned'
      },
      aiGenerated: {
        type: Boolean,
        default: false
      },
      generationPrompt: String,
      lastModified: {
        type: Date,
        default: Date.now
      },
      notes: String
    }]
  },
  aiSettings: {
    model: {
      type: String,
      enum: ['claude', 'gpt4'],
      default: 'claude'
    },
    temperature: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 4000
    },
    customPrompts: {
      characterDevelopment: String,
      plotStructure: String,
      styleGuide: String,
      toneInstructions: String
    },
    humanizationLevel: {
      type: String,
      enum: ['minimal', 'moderate', 'high'],
      default: 'moderate'
    }
  },
  analytics: {
    generationCost: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    revisionsCount: {
      type: Number,
      default: 0
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    readabilityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    marketPotential: {
      score: Number,
      factors: [String],
      lastUpdated: Date
    }
  },
  exports: [{
    format: {
      type: String,
      enum: ['epub', 'pdf', 'docx', 'html'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    fileSize: Number,
    generatedAt: {
      type: Date,
      default: Date.now
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    settings: {
      fontSize: Number,
      fontFamily: String,
      margins: Object,
      includeTableOfContents: Boolean
    }
  }],
  collaboration: {
    betaReaders: [{
      email: String,
      accessLevel: {
        type: String,
        enum: ['read', 'comment'],
        default: 'read'
      },
      invitedAt: Date,
      lastAccess: Date
    }],
    feedback: [{
      readerId: String,
      chapterId: String,
      comment: String,
      rating: Number,
      timestamp: Date
    }]
  },
  publishing: {
    platforms: [{
      name: {
        type: String,
        enum: ['amazon-kdp', 'draft2digital', 'smashwords', 'direct']
      },
      status: {
        type: String,
        enum: ['pending', 'published', 'rejected']
      },
      publishedAt: Date,
      url: String,
      sales: {
        totalUnits: Number,
        totalRevenue: Number,
        lastUpdated: Date
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'user_registration',
      'user_login',
      'subscription_created',
      'subscription_updated',
      'book_created',
      'chapter_generated',
      'content_edited',
      'book_exported',
      'book_published',
      'payment_processed',
      'error_occurred'
    ],
    index: true
  },
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    referrer: String,
    platform: String,
    version: String
  },
  performance: {
    responseTime: Number,
    memoryUsage: Number,
    cpuUsage: Number
  }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false },
  capped: { size: 100000000, max: 1000000 } // 100MB cap, 1M documents max
});

// Market Data Schema
const marketDataSchema = new mongoose.Schema({
  genre: {
    type: String,
    required: true,
    enum: ['mystery', 'self-help', 'general'],
    index: true
  },
  dataType: {
    type: String,
    required: true,
    enum: ['bestsellers', 'keywords', 'trends', 'competitors'],
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['amazon', 'google-books', 'goodreads', 'manual']
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  stripePaymentIntentId: {
    type: String,
    unique: true,
    sparse: true
  },
  type: {
    type: String,
    enum: ['subscription', 'one-time', 'revenue-share'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled', 'refunded'],
    required: true,
    index: true
  },
  description: String,
  metadata: {
    bookId: mongoose.Schema.Types.ObjectId,
    subscriptionTier: String,
    billingPeriod: String
  },
  revenueShare: {
    bookId: mongoose.Schema.Types.ObjectId,
    salesAmount: Number,
    platformFee: Number,
    authorEarnings: Number
  }
}, {
  timestamps: true
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    required: true
  },
  category: {
    type: String,
    enum: ['system', 'billing', 'book', 'marketing', 'security'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  actionUrl: String,
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date
}, {
  timestamps: true
});

// Indexes for performance optimization
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.tier': 1 });
userSchema.index({ createdAt: -1 });

bookSchema.index({ userId: 1, status: 1 });
bookSchema.index({ genre: 1, status: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ 'metadata.currentWordCount': 1 });

analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ bookId: 1, timestamp: -1 });

marketDataSchema.index({ genre: 1, dataType: 1, lastUpdated: -1 });
marketDataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

bookSchema.virtual('progress').get(function() {
  if (!this.metadata.targetWordCount) return 0;
  return Math.min(100, (this.metadata.currentWordCount / this.metadata.targetWordCount) * 100);
});

bookSchema.virtual('estimatedReadingTime').get(function() {
  // Average reading speed: 250 words per minute
  return Math.ceil(this.metadata.currentWordCount / 250);
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Update word quota limit based on subscription tier
  const quotaLimits = {
    basic: 75000,
    pro: 100000,
    author: 150000
  };
  
  if (this.isModified('subscription.tier')) {
    this.subscription.wordQuotaLimit = quotaLimits[this.subscription.tier];
  }
  
  next();
});

bookSchema.pre('save', function(next) {
  // Update current word count based on chapters
  if (this.isModified('structure.chapters')) {
    this.metadata.currentWordCount = this.structure.chapters.reduce(
      (total, chapter) => total + (chapter.wordCount || 0), 0
    );
  }
  
  next();
});

// Export models
export const User = mongoose.model('User', userSchema);
export const Book = mongoose.model('Book', bookSchema);
export const Analytics = mongoose.model('Analytics', analyticsSchema);
export const MarketData = mongoose.model('MarketData', marketDataSchema);
export const Payment = mongoose.model('Payment', paymentSchema);
export const Notification = mongoose.model('Notification', notificationSchema);

export default {
  User,
  Book,
  Analytics,
  MarketData,
  Payment,
  Notification
};