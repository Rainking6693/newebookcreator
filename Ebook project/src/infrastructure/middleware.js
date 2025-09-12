/**
 * Express Middleware Collection
 * Authentication, validation, logging, and error handling middleware
 */

import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';

// Authentication middleware
export const authenticateToken = async (req, res, next) => {
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
    const user = await User.findById(decoded.userId).select('status subscription role');
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: user.role || 'user',
      subscriptionTier: user.subscription?.tier || 'basic'
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired'
        }
      });
    }
    
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or malformed token'
      }
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }
    
    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions for this action',
          requiredRoles: allowedRoles,
          userRole
        }
      });
    }
    
    next();
  };
};

// Subscription tier authorization middleware
export const requireSubscriptionTier = (minTier) => {
  const tierHierarchy = {
    basic: 1,
    pro: 2,
    author: 3
  };
  
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }
      
      const subscription = await Subscription.findOne({ 
        userId: req.user.userId,
        status: 'active'
      });
      
      if (!subscription) {
        return res.status(403).json({
          error: {
            code: 'NO_ACTIVE_SUBSCRIPTION',
            message: 'Active subscription required'
          }
        });
      }
      
      const userTierLevel = tierHierarchy[subscription.tier] || 0;
      const requiredTierLevel = tierHierarchy[minTier] || 0;
      
      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          error: {
            code: 'SUBSCRIPTION_TIER_INSUFFICIENT',
            message: `${minTier} subscription tier or higher required`,
            currentTier: subscription.tier,
            requiredTier: minTier
          }
        });
      }
      
      // Attach subscription info to request
      req.subscription = subscription;
      next();
      
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({
        error: {
          code: 'SUBSCRIPTION_CHECK_FAILED',
          message: 'Failed to verify subscription status'
        }
      });
    }
  };
};

// Usage quota middleware
export const checkUsageQuota = (quotaType) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({ 
        userId: req.user.userId,
        status: 'active'
      });
      
      if (!subscription) {
        return res.status(403).json({
          error: {
            code: 'NO_ACTIVE_SUBSCRIPTION',
            message: 'Active subscription required'
          }
        });
      }
      
      const quotaField = `${quotaType}Used`;
      const limitField = `${quotaType}Limit`;
      
      const currentUsage = subscription.usage[quotaField] || 0;
      const limit = subscription.usage[limitField] || 0;
      
      if (currentUsage >= limit) {
        return res.status(429).json({
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `${quotaType} quota exceeded`,
            currentUsage,
            limit,
            resetDate: subscription.usage.resetDate
          }
        });
      }
      
      // Attach quota info to request
      req.quota = {
        type: quotaType,
        currentUsage,
        limit,
        remaining: limit - currentUsage
      };
      
      next();
      
    } catch (error) {
      console.error('Quota check error:', error);
      res.status(500).json({
        error: {
          code: 'QUOTA_CHECK_FAILED',
          message: 'Failed to verify usage quota'
        }
      });
    }
  };
};

// Request validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: validationErrors
        }
      });
    }
    
    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Request logging middleware
export const requestLogger = (logger) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    logger.info('Incoming request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.userId
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const responseTime = Date.now() - startTime;
      
      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime,
        userId: req.user?.userId
      });
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

// Error handling middleware
export const errorHandler = (logger) => {
  return (error, req, res, next) => {
    // Log error
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      userId: req.user?.userId
    });
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: Object.values(error.errors).map(err => err.message)
        }
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Invalid ID format'
        }
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Resource already exists'
        }
      });
    }
    
    // Default error response
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'INTERNAL_ERROR';
    
    res.status(statusCode).json({
      error: {
        code: errorCode,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  };
};

// Rate limiting by subscription tier
export const tierBasedRateLimit = () => {
  const createLimiter = (windowMs, max, message) => {
    return rateLimit({
      windowMs,
      max,
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message
        }
      },
      keyGenerator: (req) => {
        return req.user?.userId || req.ip;
      },
      skip: (req) => {
        // Skip rate limiting for admin users
        return req.user?.role === 'admin';
      }
    });
  };
  
  return (req, res, next) => {
    const tier = req.user?.subscriptionTier || 'basic';
    
    const limits = {
      basic: createLimiter(
        60 * 60 * 1000, // 1 hour
        100, // 100 requests
        'Basic tier: 100 requests per hour limit exceeded'
      ),
      pro: createLimiter(
        60 * 60 * 1000, // 1 hour
        500, // 500 requests
        'Pro tier: 500 requests per hour limit exceeded'
      ),
      author: createLimiter(
        60 * 60 * 1000, // 1 hour
        1000, // 1000 requests
        'Author tier: 1000 requests per hour limit exceeded'
      )
    };
    
    const limiter = limits[tier] || limits.basic;
    limiter(req, res, next);
  };
};

// File upload middleware
export const fileUploadLimits = () => {
  return (req, res, next) => {
    const tier = req.user?.subscriptionTier || 'basic';
    
    const limits = {
      basic: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5
      },
      pro: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10
      },
      author: {
        maxFileSize: 25 * 1024 * 1024, // 25MB
        maxFiles: 25
      }
    };
    
    req.uploadLimits = limits[tier] || limits.basic;
    next();
  };
};

// CORS middleware with dynamic origins
export const dynamicCors = () => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3001',
    'http://localhost:3000'
  ].filter(Boolean);
  
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  };
};

// Security headers middleware
export const securityHeaders = () => {
  return (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    next();
  };
};

// Request ID middleware
export const requestId = () => {
  return (req, res, next) => {
    const requestId = req.headers['x-request-id'] || 
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    next();
  };
};

export default {
  authenticateToken,
  requireRole,
  requireSubscriptionTier,
  checkUsageQuota,
  validateRequest,
  requestLogger,
  errorHandler,
  tierBasedRateLimit,
  fileUploadLimits,
  dynamicCors,
  securityHeaders,
  requestId
};