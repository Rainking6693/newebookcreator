/**
 * Express Server Setup and Configuration
 * Main server file for the AI Ebook Platform backend
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import redis from 'redis';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import winston from 'winston';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import bookRoutes from './routes/books.js';
import aiRoutes from './routes/ai.js';
import marketRoutes from './routes/market.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { validateRequest } from './middleware/validation.js';

// Import services
import { CollaborationService } from './services/collaboration.js';
import { BackupService } from './services/backup.js';
import { AnalyticsService } from './services/analytics.js';

dotenv.config();

class Server {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
      }
    });
    
    this.port = process.env.PORT || 3000;
    this.redisClient = null;
    this.logger = this.setupLogger();
    
    this.setupDatabase();
    this.setupRedis();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupServices();
    this.setupErrorHandling();
  }
  
  setupLogger() {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'ai-ebook-platform' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }
  
  async setupDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      this.logger.info('Connected to MongoDB');
      
      // Setup database event listeners
      mongoose.connection.on('error', (error) => {
        this.logger.error('MongoDB connection error:', error);
      });
      
      mongoose.connection.on('disconnected', () => {
        this.logger.warn('MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        this.logger.info('MongoDB reconnected');
      });
      
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }
  
  async setupRedis() {
    try {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL
      });
      
      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });
      
      this.redisClient.on('connect', () => {
        this.logger.info('Connected to Redis');
      });
      
      await this.redisClient.connect();
      
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      // Continue without Redis for development
      this.redisClient = null;
    }
  }
  
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"]
        }
      }
    }));
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later'
        }
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    
    this.app.use('/api/', limiter);
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use(requestLogger(this.logger));
    
    // Health check endpoint (before authentication)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });
  }
  
  setupRoutes() {
    const apiRouter = express.Router();
    
    // Public routes (no authentication required)
    apiRouter.use('/auth', authRoutes);
    
    // Protected routes (authentication required)
    apiRouter.use('/users', authenticateToken, userRoutes);
    apiRouter.use('/books', authenticateToken, bookRoutes);
    apiRouter.use('/ai', authenticateToken, aiRoutes);
    apiRouter.use('/market', authenticateToken, marketRoutes);
    apiRouter.use('/payments', paymentRoutes); // Some endpoints public for webhooks
    apiRouter.use('/admin', authenticateToken, adminRoutes);
    
    // Mount API routes
    this.app.use('/api/v1', apiRouter);
    
    // Catch-all route for undefined endpoints
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: 'The requested endpoint does not exist'
        }
      });
    });
  }
  
  setupSocketIO() {
    // Socket.IO authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }
        
        // Verify JWT token
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        socket.userId = decoded.userId;
        next();
        
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
    
    // Initialize collaboration service
    this.collaborationService = new CollaborationService(this.io);
    this.collaborationService.initialize();
    
    this.logger.info('Socket.IO server initialized');
  }
  
  setupServices() {
    // Initialize background services
    this.analyticsService = new AnalyticsService();
    this.backupService = new BackupService();
    
    // Schedule backup jobs
    this.backupService.scheduleBackups();
    
    // Start analytics processing
    this.analyticsService.startProcessing();
    
    this.logger.info('Background services initialized');
  }
  
  setupErrorHandling() {
    // Global error handler
    this.app.use(errorHandler(this.logger));
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });
    
    process.on('SIGINT', () => {
      this.logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }
  
  async shutdown() {
    try {
      // Close server
      this.server.close(() => {
        this.logger.info('HTTP server closed');
      });
      
      // Close database connection
      await mongoose.connection.close();
      this.logger.info('MongoDB connection closed');
      
      // Close Redis connection
      if (this.redisClient) {
        await this.redisClient.quit();
        this.logger.info('Redis connection closed');
      }
      
      // Stop background services
      if (this.analyticsService) {
        this.analyticsService.stop();
      }
      
      process.exit(0);
      
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
  
  start() {
    this.server.listen(this.port, () => {
      this.logger.info(`Server running on port ${this.port}`);
      this.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      this.logger.info(`API Base URL: http://localhost:${this.port}/api/v1`);
    });
  }
}

// Create and start server
const server = new Server();
server.start();

export default server;