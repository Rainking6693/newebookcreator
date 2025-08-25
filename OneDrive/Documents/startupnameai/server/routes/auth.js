const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/database');
const { AppError, logger } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

const router = express.Router();

// Aggressive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts. Please wait 15 minutes.',
    resetTime: new Date(Date.now() + 15 * 60 * 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Input validation schemas
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special character'),
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('First name required (1-50 characters)'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('Last name required (1-50 characters)')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// POST /api/auth/register - Master-level user registration
router.post('/register', authLimiter, registerValidation, async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration data',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Account with this email already exists'
      });
    }

    // Hash password with advanced security
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user account
    const userId = await createUser({
      email,
      passwordHash,
      firstName,
      lastName
    });

    // Generate verification token
    const verificationToken = generateToken(userId, '24h');

    // Send welcome email with verification
    await emailService.sendWelcomeEmail(email, firstName, verificationToken);

    // Log successful registration
    logger.info('User registered successfully', {
      userId,
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        userId,
        email,
        firstName,
        lastName,
        isVerified: false,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Registration failed:', error);
    next(new AppError('Registration failed. Please try again.', 500));
  }
});

// POST /api/auth/login - Master-level secure login
router.post('/login', authLimiter, loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      // Use same response time to prevent email enumeration
      await bcrypt.hash('dummy_password', 12);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // Log failed login attempt
      logger.warn('Failed login attempt', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login timestamp
    await updateLastLogin(user.id);

    // Generate JWT tokens
    const accessToken = generateToken(user.id, '1h');
    const refreshToken = generateToken(user.id, '7d');

    // Store refresh token (in production, use Redis)
    await storeRefreshToken(user.id, refreshToken);

    // Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log successful login
    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified,
          lastLogin: new Date().toISOString()
        },
        accessToken,
        expiresIn: 3600 // 1 hour in seconds
      }
    });

  } catch (error) {
    logger.error('Login failed:', error);
    next(new AppError('Login failed. Please try again.', 500));
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if refresh token is still valid in database
    const isValidRefreshToken = await validateRefreshToken(userId, refreshToken);
    if (!isValidRefreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Get user data
    const user = await findUserById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(userId, '1h');

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 3600,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    logger.error('Token refresh failed:', error);
    next(new AppError('Token refresh failed', 500));
  }
});

// POST /api/auth/logout - Secure logout
router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Invalidate refresh token
      await invalidateRefreshToken(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout failed:', error);
    next(new AppError('Logout failed', 500));
  }
});

// POST /api/auth/verify-email - Email verification
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Update user verification status
    await verifyUserEmail(userId);

    logger.info('Email verified successfully', { userId });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    logger.error('Email verification failed:', error);
    next(new AppError('Email verification failed', 500));
  }
});

// Helper functions
async function findUserByEmail(email) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

async function findUserById(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

async function createUser({ email, passwordHash, firstName, lastName }) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [email, passwordHash, firstName, lastName]
    );
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

async function updateLastLogin(userId) {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [userId]
    );
  } finally {
    client.release();
  }
}

async function verifyUserEmail(userId) {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  } finally {
    client.release();
  }
}

function generateToken(userId, expiresIn) {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

async function storeRefreshToken(userId, refreshToken) {
  // In production, use Redis for better performance
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO user_tokens (user_id, token, type, expires_at)
       VALUES ($1, $2, 'refresh', NOW() + INTERVAL '7 days')
       ON CONFLICT (user_id, type) DO UPDATE SET
       token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
      [userId, refreshToken]
    );
  } finally {
    client.release();
  }
}

async function validateRefreshToken(userId, refreshToken) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id FROM user_tokens 
       WHERE user_id = $1 AND token = $2 AND type = 'refresh' 
       AND expires_at > NOW()`,
      [userId, refreshToken]
    );
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

async function invalidateRefreshToken(refreshToken) {
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM user_tokens WHERE token = $1',
      [refreshToken]
    );
  } finally {
    client.release();
  }
}

module.exports = router;