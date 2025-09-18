# API Endpoints & Backend Services

## API Architecture Overview

### RESTful API Design Principles
```javascript
// Base API structure
const apiStructure = {
  baseUrl: 'https://api.ai-ebook-platform.com/v1',
  authentication: 'Bearer JWT tokens',
  contentType: 'application/json',
  rateLimit: 'Tier-based rate limiting',
  versioning: 'URL path versioning (/v1/)',
  errorHandling: 'Consistent error response format'
};

// Standard response format
const responseFormat = {
  success: {
    status: 200,
    data: {}, // Response data
    message: 'Success message',
    meta: {
      timestamp: 'ISO 8601',
      requestId: 'unique_request_id',
      version: 'v1'
    }
  },
  error: {
    status: 400, // HTTP status code
    error: {
      code: 'ERROR_CODE',
      message: 'Human readable error message',
      details: 'Additional error details',
      field: 'field_name' // For validation errors
    },
    meta: {
      timestamp: 'ISO 8601',
      requestId: 'unique_request_id'
    }
  }
};
```

## Authentication Endpoints

### Auth Controller
```javascript
class AuthController {
  constructor() {
    this.authService = new AuthenticationService();
    this.emailService = new EmailVerificationService();
    this.passwordService = new PasswordResetService();
  }
  
  // POST /api/v1/auth/register
  async register(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Validate input
      const validation = this.validateRegistrationInput(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: validation.errors
          }
        });
      }
      
      // Register user
      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName
      });
      
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.status(201).json({
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        },
        message: result.message
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'Email and password are required'
          }
        });
      }
      
      const result = await this.authService.login(email, password, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Set refresh token cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      res.json({
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        },
        message: result.message
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/auth/refresh
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'Refresh token not provided'
          }
        });
      }
      
      const result = await this.authService.refreshTokens(refreshToken);
      
      // Set new refresh token cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      res.json({
        data: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        }
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/auth/logout
  async logout(req, res) {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');
      
      // Optionally blacklist the access token
      // await this.authService.blacklistToken(req.token);
      
      res.json({
        message: 'Logged out successfully'
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/auth/verify-email
  async verifyEmail(req, res) {
    try {
      const { email, token } = req.body;
      
      const result = await this.emailService.verifyEmail(email, token);
      
      res.json({
        data: result,
        message: 'Email verified successfully'
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/auth/forgot-password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      const result = await this.passwordService.initiatePasswordReset(email);
      
      res.json({
        message: result.message
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/auth/reset-password
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      const result = await this.passwordService.resetPassword(token, newPassword);
      
      res.json({
        message: result.message
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  handleError(res, error) {
    console.error('Auth error:', error);
    
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'INTERNAL_ERROR';
    
    res.status(statusCode).json({
      error: {
        code: errorCode,
        message: error.message || 'Internal server error'
      }
    });
  }
}
```

## User Management Endpoints

### User Controller
```javascript
class UserController {
  constructor() {
    this.userService = new UserService();
    this.subscriptionService = new SubscriptionService();
  }
  
  // GET /api/v1/users/profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .populate('subscription')
        .select('-passwordHash -security');
      
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }
      
      res.json({
        data: { user }
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // PUT /api/v1/users/profile
  async updateProfile(req, res) {
    try {
      const updates = this.sanitizeProfileUpdates(req.body);
      
      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-passwordHash -security');
      
      res.json({
        data: { user },
        message: 'Profile updated successfully'
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // GET /api/v1/users/subscription
  async getSubscription(req, res) {
    try {
      const subscription = await this.subscriptionService.getUserSubscription(req.user.userId);
      const usage = await this.subscriptionService.getUsageStats(req.user.userId);
      
      res.json({
        data: {
          subscription,
          usage
        }
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // PUT /api/v1/users/subscription
  async updateSubscription(req, res) {
    try {
      const { tier, paymentMethodId } = req.body;
      
      const result = await this.subscriptionService.updateSubscription(
        req.user.userId,
        tier,
        paymentMethodId
      );
      
      res.json({
        data: result,
        message: 'Subscription updated successfully'
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // DELETE /api/v1/users/account
  async deleteAccount(req, res) {
    try {
      const { password, confirmation } = req.body;
      
      if (confirmation !== 'DELETE') {
        return res.status(400).json({
          error: {
            code: 'INVALID_CONFIRMATION',
            message: 'Please type DELETE to confirm account deletion'
          }
        });
      }
      
      await this.userService.deleteAccount(req.user.userId, password);
      
      res.json({
        message: 'Account deleted successfully'
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  sanitizeProfileUpdates(updates) {
    const allowedFields = [
      'profile.firstName',
      'profile.lastName',
      'profile.bio',
      'profile.avatar',
      'profile.writingExperience',
      'profile.genres',
      'preferences.aiModel',
      'preferences.contentFiltering',
      'preferences.emailNotifications',
      'preferences.theme'
    ];
    
    const sanitized = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitized[key] = updates[key];
      }
    });
    
    return sanitized;
  }
}
```

## Book Management Endpoints

### Book Controller
```javascript
class BookController {
  constructor() {
    this.bookService = new BookService();
    this.aiService = new AIService();
    this.exportService = new ExportService();
  }
  
  // GET /api/v1/books
  async getBooks(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        genre,
        search
      } = req.query;
      
      const filters = { userId: req.user.userId };
      
      if (status) filters.status = status;
      if (genre) filters.genre = genre;
      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: 'i' } },
          { 'metadata.description': { $regex: search, $options: 'i' } }
        ];
      }
      
      const books = await Book.find(filters)
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-structure.chapters.content'); // Exclude content for list view
      
      const total = await Book.countDocuments(filters);
      
      res.json({
        data: {
          books,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/books
  async createBook(req, res) {
    try {
      const { title, genre, description, targetWordCount } = req.body;
      
      // Check user's book creation limits
      await this.checkBookCreationLimits(req.user.userId);
      
      const book = await Book.create({
        userId: req.user.userId,
        title,
        genre,
        metadata: {
          description,
          targetWordCount: targetWordCount || 75000
        },
        structure: {
          chapters: []
        }
      });
      
      res.status(201).json({
        data: { book },
        message: 'Book created successfully'
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // GET /api/v1/books/:id
  async getBook(req, res) {
    try {
      const book = await Book.findOne({
        _id: req.params.id,
        userId: req.user.userId
      });
      
      if (!book) {
        return res.status(404).json({
          error: {
            code: 'BOOK_NOT_FOUND',
            message: 'Book not found'
          }
        });
      }
      
      res.json({
        data: { book }
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // PUT /api/v1/books/:id
  async updateBook(req, res) {
    try {
      const updates = this.sanitizeBookUpdates(req.body);
      
      const book = await Book.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.userId },
        { $set: updates },
        { new: true, runValidators: true }
      );
      
      if (!book) {
        return res.status(404).json({
          error: {
            code: 'BOOK_NOT_FOUND',
            message: 'Book not found'
          }
        });
      }
      
      res.json({
        data: { book },
        message: 'Book updated successfully'
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/books/:id/generate
  async generateContent(req, res) {
    try {
      const { chapterId, prompt, model, temperature, maxTokens } = req.body;
      
      // Check user's AI generation limits
      await this.checkAIGenerationLimits(req.user.userId);
      
      const book = await Book.findOne({
        _id: req.params.id,
        userId: req.user.userId
      });
      
      if (!book) {
        return res.status(404).json({
          error: {
            code: 'BOOK_NOT_FOUND',
            message: 'Book not found'
          }
        });
      }
      
      const result = await this.aiService.generateContent({
        bookId: book._id,
        chapterId,
        prompt,
        model: model || 'claude',
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 4000,
        genre: book.genre,
        context: this.buildContext(book, chapterId)
      });
      
      // Update usage tracking
      await this.updateAIUsage(req.user.userId, result.tokensUsed, result.cost);
      
      res.json({
        data: result,
        message: 'Content generated successfully'
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/books/:id/export
  async exportBook(req, res) {
    try {
      const { format, settings } = req.body;
      
      const book = await Book.findOne({
        _id: req.params.id,
        userId: req.user.userId
      });
      
      if (!book) {
        return res.status(404).json({
          error: {
            code: 'BOOK_NOT_FOUND',
            message: 'Book not found'
          }
        });
      }
      
      const exportResult = await this.exportService.exportBook(book, format, settings);
      
      res.json({
        data: exportResult,
        message: 'Book exported successfully'
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  async checkBookCreationLimits(userId) {
    const subscription = await this.getSubscription(userId);
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const booksThisMonth = await Book.countDocuments({
      userId,
      createdAt: { $gte: currentMonth }
    });
    
    const limits = {
      basic: 5,
      pro: 15,
      author: 50
    };
    
    if (booksThisMonth >= limits[subscription.tier]) {
      throw new Error('Monthly book creation limit reached');
    }
  }
}
```

## AI Generation Endpoints

### AI Controller
```javascript
class AIController {
  constructor() {
    this.aiService = new AIService();
    this.usageTracker = new UsageTracker();
  }
  
  // POST /api/v1/ai/generate
  async generate(req, res) {
    try {
      const {
        prompt,
        model = 'claude',
        temperature = 0.7,
        maxTokens = 4000,
        genre,
        context
      } = req.body;
      
      // Validate input
      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PROMPT',
            message: 'Prompt is required'
          }
        });
      }
      
      // Check usage limits
      await this.usageTracker.checkAIGenerationLimit(req.user.userId);
      
      // Generate content
      const result = await this.aiService.generateContent({
        prompt,
        model,
        temperature,
        maxTokens,
        genre,
        context,
        userId: req.user.userId
      });
      
      // Track usage
      await this.usageTracker.trackAIUsage(req.user.userId, {
        model,
        tokensUsed: result.tokensUsed,
        cost: result.cost
      });
      
      res.json({
        data: result
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/ai/improve
  async improveContent(req, res) {
    try {
      const { content, improvementType, instructions } = req.body;
      
      const result = await this.aiService.improveContent({
        content,
        improvementType,
        instructions,
        userId: req.user.userId
      });
      
      res.json({
        data: result
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // POST /api/v1/ai/analyze
  async analyzeContent(req, res) {
    try {
      const { content, analysisType } = req.body;
      
      const result = await this.aiService.analyzeContent({
        content,
        analysisType,
        userId: req.user.userId
      });
      
      res.json({
        data: result
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
  
  // GET /api/v1/ai/usage
  async getUsage(req, res) {
    try {
      const { period = '30d', model } = req.query;
      
      const usage = await this.usageTracker.getUsageStats(req.user.userId, {
        period,
        model
      });
      
      res.json({
        data: usage
      });
      
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
```

## Middleware

### Authentication Middleware
```javascript
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: {
          code: 'NO_TOKEN',
          message: 'Access token required'
        }
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('status subscription');
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }
    
    req.user = decoded;
    req.user.subscription = user.subscription;
    next();
    
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

// Rate limiting middleware
const rateLimiter = (tier) => {
  const limits = {
    basic: { windowMs: 60 * 60 * 1000, max: 100 }, // 100 requests per hour
    pro: { windowMs: 60 * 60 * 1000, max: 500 },   // 500 requests per hour
    author: { windowMs: 60 * 60 * 1000, max: 1000 } // 1000 requests per hour
  };
  
  return rateLimit({
    windowMs: limits[tier].windowMs,
    max: limits[tier].max,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    }
  });
};
```

---

*API Endpoints System Version 1.0*
*Last Updated: January 15, 2024*
*Next Phase: Database integration and testing*