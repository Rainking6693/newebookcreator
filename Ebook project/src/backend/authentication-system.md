# Authentication & User Account System

## Authentication Architecture

### JWT-Based Authentication Strategy
```javascript
// JWT Configuration
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m', // Short-lived for security
    algorithm: 'HS256'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d', // Longer-lived for convenience
    algorithm: 'HS256'
  }
};

// Token payload structure
const tokenPayload = {
  userId: 'ObjectId',
  email: 'user@example.com',
  role: 'user', // 'user', 'admin', 'moderator'
  subscriptionTier: 'pro',
  iat: 'issued_at_timestamp',
  exp: 'expiration_timestamp'
};
```

### Authentication Service
```javascript
class AuthenticationService {
  constructor() {
    this.bcrypt = require('bcryptjs');
    this.jwt = require('jsonwebtoken');
    this.saltRounds = 12;
  }
  
  async register(userData) {
    try {
      // Validate input data
      const validation = await this.validateRegistrationData(userData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      
      // Hash password
      const passwordHash = await this.bcrypt.hash(userData.password, this.saltRounds);
      
      // Create user
      const user = await User.create({
        email: userData.email.toLowerCase(),
        passwordHash,
        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName
        },
        verification: {
          email: {
            verified: false,
            token: this.generateVerificationToken(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        },
        subscription: {
          tier: 'basic',
          status: 'trialing',
          wordQuotaLimit: 75000
        }
      });
      
      // Send verification email
      await this.sendVerificationEmail(user);
      
      // Generate tokens
      const tokens = await this.generateTokens(user);
      
      return {
        user: this.sanitizeUser(user),
        tokens,
        message: 'Registration successful. Please verify your email.'
      };
      
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }
  
  async login(email, password, options = {}) {
    try {
      // Find user
      const user = await User.findOne({ 
        email: email.toLowerCase() 
      }).select('+passwordHash +security');
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Check account lockout
      if (await this.isAccountLocked(user)) {
        throw new Error('Account temporarily locked due to failed login attempts');
      }
      
      // Verify password
      const isValidPassword = await this.bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        await this.handleFailedLogin(user);
        throw new Error('Invalid credentials');
      }
      
      // Check email verification
      if (!user.verification.email.verified) {
        throw new Error('Please verify your email before logging in');
      }
      
      // Reset failed login attempts
      await this.resetFailedLoginAttempts(user);
      
      // Update last login
      await User.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
        'security.lastLoginIP': options.ipAddress,
        'security.lastLoginUserAgent': options.userAgent
      });
      
      // Generate tokens
      const tokens = await this.generateTokens(user);
      
      // Log successful login
      await this.logAuthEvent(user._id, 'login_success', options);
      
      return {
        user: this.sanitizeUser(user),
        tokens,
        message: 'Login successful'
      };
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }
  
  async refreshTokens(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.jwt.verify(refreshToken, jwtConfig.refreshToken.secret);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if user is still active
      if (user.status !== 'active') {
        throw new Error('User account is not active');
      }
      
      // Generate new tokens
      const tokens = await this.generateTokens(user);
      
      return {
        tokens,
        user: this.sanitizeUser(user)
      };
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Invalid refresh token');
    }
  }
  
  async generateTokens(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role || 'user',
      subscriptionTier: user.subscription?.tier || 'basic'
    };
    
    const accessToken = this.jwt.sign(
      payload,
      jwtConfig.accessToken.secret,
      { expiresIn: jwtConfig.accessToken.expiresIn }
    );
    
    const refreshToken = this.jwt.sign(
      { userId: user._id },
      jwtConfig.refreshToken.secret,
      { expiresIn: jwtConfig.refreshToken.expiresIn }
    );
    
    return {
      accessToken,
      refreshToken,
      expiresIn: jwtConfig.accessToken.expiresIn
    };
  }
  
  async validateRegistrationData(userData) {
    const errors = [];
    
    // Email validation
    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    }
    
    // Password validation
    if (!userData.password || userData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!this.isStrongPassword(userData.password)) {
      errors.push('Password must contain uppercase, lowercase, number, and special character');
    }
    
    // Name validation
    if (!userData.firstName || userData.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters');
    }
    
    if (!userData.lastName || userData.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  isStrongPassword(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return strongPasswordRegex.test(password);
  }
  
  async isAccountLocked(user) {
    if (!user.security?.lockUntil) return false;
    
    const now = new Date();
    const lockUntil = new Date(user.security.lockUntil);
    
    if (now < lockUntil) {
      return true;
    }
    
    // Lock has expired, reset
    await User.findByIdAndUpdate(user._id, {
      $unset: { 'security.lockUntil': 1 },
      'security.loginAttempts': 0
    });
    
    return false;
  }
  
  async handleFailedLogin(user) {
    const maxAttempts = 5;
    const lockDuration = 15 * 60 * 1000; // 15 minutes
    
    const attempts = (user.security?.loginAttempts || 0) + 1;
    
    const updateData = {
      'security.loginAttempts': attempts
    };
    
    if (attempts >= maxAttempts) {
      updateData['security.lockUntil'] = new Date(Date.now() + lockDuration);
    }
    
    await User.findByIdAndUpdate(user._id, updateData);
  }
  
  async resetFailedLoginAttempts(user) {
    await User.findByIdAndUpdate(user._id, {
      $unset: { 
        'security.loginAttempts': 1,
        'security.lockUntil': 1
      }
    });
  }
  
  sanitizeUser(user) {
    const sanitized = user.toObject();
    delete sanitized.passwordHash;
    delete sanitized.security;
    delete sanitized.verification;
    return sanitized;
  }
}
```

## Email Verification System

### Verification Service
```javascript
class EmailVerificationService {
  constructor() {
    this.crypto = require('crypto');
    this.emailService = new EmailService();
  }
  
  generateVerificationToken() {
    return this.crypto.randomBytes(32).toString('hex');
  }
  
  async sendVerificationEmail(user) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.verification.email.token}&email=${encodeURIComponent(user.email)}`;
    
    const emailData = {
      to: user.email,
      subject: 'Verify Your Email - AI Ebook Platform',
      template: 'email-verification',
      data: {
        firstName: user.profile.firstName,
        verificationUrl,
        expiresAt: user.verification.email.expiresAt
      }
    };
    
    await this.emailService.send(emailData);
  }
  
  async verifyEmail(email, token) {
    try {
      const user = await User.findOne({
        email: email.toLowerCase(),
        'verification.email.token': token,
        'verification.email.expiresAt': { $gt: new Date() }
      });
      
      if (!user) {
        throw new Error('Invalid or expired verification token');
      }
      
      // Mark email as verified
      await User.findByIdAndUpdate(user._id, {
        'verification.email.verified': true,
        $unset: {
          'verification.email.token': 1,
          'verification.email.expiresAt': 1
        }
      });
      
      // Send welcome email
      await this.sendWelcomeEmail(user);
      
      return {
        success: true,
        message: 'Email verified successfully'
      };
      
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }
  
  async resendVerificationEmail(email) {
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      'verification.email.verified': false
    });
    
    if (!user) {
      throw new Error('User not found or email already verified');
    }
    
    // Generate new token
    const newToken = this.generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await User.findByIdAndUpdate(user._id, {
      'verification.email.token': newToken,
      'verification.email.expiresAt': expiresAt
    });
    
    // Update user object for email sending
    user.verification.email.token = newToken;
    user.verification.email.expiresAt = expiresAt;
    
    await this.sendVerificationEmail(user);
    
    return {
      success: true,
      message: 'Verification email sent'
    };
  }
}
```

## Password Reset System

### Password Reset Service
```javascript
class PasswordResetService {
  constructor() {
    this.crypto = require('crypto');
    this.bcrypt = require('bcryptjs');
    this.emailService = new EmailService();
  }
  
  async initiatePasswordReset(email) {
    try {
      const user = await User.findOne({ 
        email: email.toLowerCase() 
      });
      
      if (!user) {
        // Don't reveal if email exists for security
        return {
          success: true,
          message: 'If an account with that email exists, a reset link has been sent'
        };
      }
      
      // Generate reset token
      const resetToken = this.crypto.randomBytes(32).toString('hex');
      const hashedToken = this.crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Save hashed token to database
      await User.findByIdAndUpdate(user._id, {
        'security.passwordResetToken': hashedToken,
        'security.passwordResetExpires': new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      });
      
      // Send reset email
      await this.sendPasswordResetEmail(user, resetToken);
      
      return {
        success: true,
        message: 'Password reset email sent'
      };
      
    } catch (error) {
      console.error('Password reset initiation failed:', error);
      throw error;
    }
  }
  
  async resetPassword(token, newPassword) {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = this.crypto.createHash('sha256').update(token).digest('hex');
      
      // Find user with valid reset token
      const user = await User.findOne({
        'security.passwordResetToken': hashedToken,
        'security.passwordResetExpires': { $gt: new Date() }
      });
      
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }
      
      // Validate new password
      if (!this.isStrongPassword(newPassword)) {
        throw new Error('Password must contain uppercase, lowercase, number, and special character');
      }
      
      // Hash new password
      const passwordHash = await this.bcrypt.hash(newPassword, 12);
      
      // Update password and clear reset token
      await User.findByIdAndUpdate(user._id, {
        passwordHash,
        'security.lastPasswordChange': new Date(),
        $unset: {
          'security.passwordResetToken': 1,
          'security.passwordResetExpires': 1,
          'security.loginAttempts': 1,
          'security.lockUntil': 1
        }
      });
      
      // Send confirmation email
      await this.sendPasswordChangeConfirmation(user);
      
      // Log security event
      await this.logSecurityEvent(user._id, 'password_reset', {
        timestamp: new Date(),
        method: 'email_reset'
      });
      
      return {
        success: true,
        message: 'Password reset successfully'
      };
      
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }
  
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const emailData = {
      to: user.email,
      subject: 'Reset Your Password - AI Ebook Platform',
      template: 'password-reset',
      data: {
        firstName: user.profile.firstName,
        resetUrl,
        expiresIn: '1 hour'
      }
    };
    
    await this.emailService.send(emailData);
  }
  
  isStrongPassword(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }
}
```

## Session Management

### Session Service
```javascript
class SessionService {
  constructor() {
    this.redis = require('redis').createClient(process.env.REDIS_URL);
    this.sessionDuration = 24 * 60 * 60; // 24 hours in seconds
  }
  
  async createSession(userId, sessionData) {
    const sessionId = this.generateSessionId();
    const sessionKey = `session:${sessionId}`;
    
    const session = {
      userId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      isActive: true
    };
    
    await this.redis.setex(sessionKey, this.sessionDuration, JSON.stringify(session));
    
    return sessionId;
  }
  
  async getSession(sessionId) {
    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);
    
    if (!sessionData) {
      return null;
    }
    
    return JSON.parse(sessionData);
  }
  
  async updateSessionActivity(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (session) {
      session.lastActivity = new Date().toISOString();
      const sessionKey = `session:${sessionId}`;
      await this.redis.setex(sessionKey, this.sessionDuration, JSON.stringify(session));
    }
  }
  
  async destroySession(sessionId) {
    const sessionKey = `session:${sessionId}`;
    await this.redis.del(sessionKey);
  }
  
  async destroyAllUserSessions(userId) {
    // Get all session keys
    const keys = await this.redis.keys('session:*');
    
    for (const key of keys) {
      const sessionData = await this.redis.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.userId === userId.toString()) {
          await this.redis.del(key);
        }
      }
    }
  }
  
  generateSessionId() {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
```

## Multi-Factor Authentication (Future Enhancement)

### MFA Service Structure
```javascript
class MFAService {
  constructor() {
    this.speakeasy = require('speakeasy');
    this.qrcode = require('qrcode');
  }
  
  async setupTOTP(userId) {
    const user = await User.findById(userId);
    
    const secret = this.speakeasy.generateSecret({
      name: `AI Ebook Platform (${user.email})`,
      issuer: 'AI Ebook Platform'
    });
    
    // Save secret to user (encrypted)
    await User.findByIdAndUpdate(userId, {
      'security.mfaSecret': this.encryptSecret(secret.base32),
      'security.mfaEnabled': false // Not enabled until verified
    });
    
    // Generate QR code
    const qrCodeUrl = await this.qrcode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: this.generateBackupCodes()
    };
  }
  
  async verifyTOTP(userId, token) {
    const user = await User.findById(userId).select('+security');
    
    if (!user.security?.mfaSecret) {
      throw new Error('MFA not set up for this user');
    }
    
    const secret = this.decryptSecret(user.security.mfaSecret);
    
    const verified = this.speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps of variance
    });
    
    if (verified) {
      await User.findByIdAndUpdate(userId, {
        'security.mfaEnabled': true
      });
    }
    
    return verified;
  }
  
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(require('crypto').randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}
```

---

*Authentication System Version 1.0*
*Last Updated: January 15, 2024*
*Next Phase: API endpoint implementation and middleware setup*