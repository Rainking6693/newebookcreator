# Development Environment Setup

## Environment Configuration

### Development Environment Structure
```
ai-ebook-platform/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic services
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration files
│   ├── tests/               # Backend tests
│   ├── package.json
│   └── server.js
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Next.js pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   ├── styles/          # CSS/Tailwind styles
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   ├── package.json
│   └── next.config.js
├── shared/                  # Shared utilities and types
├── docs/                    # Documentation
├── scripts/                 # Build and deployment scripts
├── docker-compose.yml       # Local development setup
├── .env.example            # Environment variables template
└── README.md
```

### Package.json Configuration

#### Backend Package.json
```json
{
  "name": "ai-ebook-platform-backend",
  "version": "1.0.0",
  "description": "Backend API for AI Ebook Generation Platform",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "jest --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "build": "babel src -d dist",
    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "dotenv": "^16.3.1",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "axios": "^1.6.0",
    "stripe": "^14.0.0",
    "nodemailer": "^6.9.7",
    "redis": "^4.6.0",
    "socket.io": "^4.7.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.0",
    "aws-sdk": "^2.1500.0",
    "puppeteer": "^21.5.0",
    "epub-gen": "^0.1.0",
    "docx": "^8.5.0",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@babel/cli": "^7.23.0",
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.1",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0",
    "@types/node": "^20.9.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

#### Frontend Package.json
```json
{
  "name": "ai-ebook-platform-frontend",
  "version": "1.0.0",
  "description": "Frontend for AI Ebook Generation Platform",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.2.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "@tiptap/react": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",
    "recharts": "^2.8.0",
    "framer-motion": "^10.16.0",
    "react-hot-toast": "^2.4.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "@types/node": "^20.9.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

## Docker Development Setup

### Docker Compose Configuration
```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: ai-ebook-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: ai_ebook_platform
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - ai-ebook-network

  # Redis Cache
  redis:
    image: redis:7.0-alpine
    container_name: ai-ebook-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass redis123
    volumes:
      - redis_data:/data
    networks:
      - ai-ebook-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: ai-ebook-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/ai_ebook_platform?authSource=admin
      REDIS_URL: redis://:redis123@redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - mongodb
      - redis
    networks:
      - ai-ebook-network

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: ai-ebook-frontend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_URL: http://localhost:3000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend
    networks:
      - ai-ebook-network

  # Nginx Reverse Proxy (for production-like setup)
  nginx:
    image: nginx:alpine
    container_name: ai-ebook-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - ai-ebook-network

volumes:
  mongodb_data:
  redis_data:

networks:
  ai-ebook-network:
    driver: bridge
```

### Backend Dockerfile (Development)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

### Frontend Dockerfile (Development)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]
```

## Environment Variables

### Backend Environment Variables (.env)
```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/ai_ebook_platform
MONGODB_TEST_URI=mongodb://localhost:27017/ai_ebook_platform_test

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_super_secure_jwt_access_secret_here
JWT_REFRESH_SECRET=your_super_secure_jwt_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI APIs
ANTHROPIC_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ai-ebook-platform-storage
BACKUP_S3_BUCKET=ai-ebook-platform-backups

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@ai-ebook-platform.com

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=your_session_secret_here

# Content Moderation
CONTENT_FILTER_ENABLED=true
COPYSCAPE_API_KEY=your_copyscape_api_key
```

### Frontend Environment Variables (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=your_google_analytics_id
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id

# Feature Flags
NEXT_PUBLIC_ENABLE_COLLABORATION=true
NEXT_PUBLIC_ENABLE_REVENUE_SHARING=true
NEXT_PUBLIC_ENABLE_MARKET_RESEARCH=true

# Environment
NEXT_PUBLIC_ENV=development
```

## Development Scripts

### Setup Script (setup.sh)
```bash
#!/bin/bash

echo "Setting up AI Ebook Platform development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment files from examples
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "Created backend/.env from example. Please update with your API keys."
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo "Created frontend/.env.local from example."
fi

# Create necessary directories
mkdir -p logs
mkdir -p uploads
mkdir -p backups

# Start services
echo "Starting development environment..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Run database migrations
echo "Running database migrations..."
docker-compose exec backend npm run migrate

# Seed initial data
echo "Seeding initial data..."
docker-compose exec backend npm run seed

echo "Development environment setup complete!"
echo "Frontend: http://localhost:3001"
echo "Backend API: http://localhost:3000"
echo "MongoDB: localhost:27017"
echo "Redis: localhost:6379"
```

### Database Migration Script (scripts/migrate.js)
```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrations = [
  {
    version: '1.0.0',
    description: 'Initial database setup',
    up: async () => {
      // Create indexes
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.db.collection('books').createIndex({ userId: 1, createdAt: -1 });
      await mongoose.connection.db.collection('analytics').createIndex({ userId: 1, timestamp: -1 });
      await mongoose.connection.db.collection('subscriptions').createIndex({ userId: 1 }, { unique: true });
      
      console.log('✅ Created database indexes');
    }
  },
  {
    version: '1.1.0',
    description: 'Add version control collections',
    up: async () => {
      await mongoose.connection.db.collection('versions').createIndex({ 
        bookId: 1, 
        chapterId: 1, 
        versionNumber: -1 
      });
      
      console.log('✅ Created version control indexes');
    }
  }
];

async function runMigrations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if migrations collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const migrationsExists = collections.some(col => col.name === 'migrations');
    
    if (!migrationsExists) {
      await mongoose.connection.db.createCollection('migrations');
    }
    
    // Get completed migrations
    const completedMigrations = await mongoose.connection.db
      .collection('migrations')
      .find({})
      .toArray();
    
    const completedVersions = completedMigrations.map(m => m.version);
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!completedVersions.includes(migration.version)) {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        
        await migration.up();
        
        // Record migration as completed
        await mongoose.connection.db.collection('migrations').insertOne({
          version: migration.version,
          description: migration.description,
          completedAt: new Date()
        });
        
        console.log(`✅ Migration ${migration.version} completed`);
      } else {
        console.log(`⏭️  Migration ${migration.version} already completed`);
      }
    }
    
    console.log('All migrations completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runMigrations();
```

### Seed Data Script (scripts/seed.js)
```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const seedData = {
  users: [
    {
      email: 'admin@ai-ebook-platform.com',
      passwordHash: await bcrypt.hash('admin123!', 12),
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      },
      role: 'admin',
      subscription: {
        tier: 'author',
        status: 'active',
        wordQuotaLimit: 150000
      },
      verification: {
        email: {
          verified: true
        }
      }
    },
    {
      email: 'demo@ai-ebook-platform.com',
      passwordHash: await bcrypt.hash('demo123!', 12),
      profile: {
        firstName: 'Demo',
        lastName: 'User'
      },
      subscription: {
        tier: 'pro',
        status: 'active',
        wordQuotaLimit: 100000
      },
      verification: {
        email: {
          verified: true
        }
      }
    }
  ],
  
  books: [
    {
      title: 'Sample Mystery Novel',
      genre: 'mystery',
      status: 'in-progress',
      metadata: {
        description: 'A thrilling mystery set in a small coastal town',
        targetWordCount: 75000,
        currentWordCount: 15000
      },
      structure: {
        outline: 'Detective Sarah Chen investigates a mysterious disappearance...',
        chapters: [
          {
            id: 'chapter-1',
            title: 'The Disappearance',
            content: 'It was a foggy morning when Detective Sarah Chen received the call...',
            wordCount: 2500,
            status: 'completed'
          },
          {
            id: 'chapter-2',
            title: 'First Clues',
            content: 'The lighthouse keeper\'s cottage stood empty...',
            wordCount: 2300,
            status: 'completed'
          }
        ]
      }
    }
  ]
};

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');
    
    // Clear existing data (development only)
    if (process.env.NODE_ENV === 'development') {
      await mongoose.connection.db.dropDatabase();
      console.log('Cleared existing database');
    }
    
    // Seed users
    const User = mongoose.model('User', userSchema);
    const createdUsers = await User.insertMany(seedData.users);
    console.log(`✅ Seeded ${createdUsers.length} users`);
    
    // Seed books (assign to demo user)
    const Book = mongoose.model('Book', bookSchema);
    const demoUser = createdUsers.find(u => u.email === 'demo@ai-ebook-platform.com');
    
    const booksWithUserId = seedData.books.map(book => ({
      ...book,
      userId: demoUser._id
    }));
    
    const createdBooks = await Book.insertMany(booksWithUserId);
    console.log(`✅ Seeded ${createdBooks.length} books`);
    
    console.log('Database seeding completed successfully');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
```

---

*Environment Setup Version 1.0*
*Last Updated: January 15, 2024*
*Next Phase: Core infrastructure implementation*