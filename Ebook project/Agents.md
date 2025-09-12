Repository Guidelines
Project Structure & Module Organization
EbookAI follows a standard Next.js 14 structure with TypeScript. Source code is organized in /pages for Next.js pages and API routes, /components for React components grouped by feature (book-editor, analytics, dashboard, etc.), /lib for utilities, database connections, AI services, and type definitions, and /public for static assets. The /humanization-engine directory contains the advanced content processing modules for authentic voice generation.
Build, Test, and Development Commands
bash# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Code quality checks
npm run lint

# Comprehensive testing
npm run test:comprehensive

# E2E testing
npm run test:e2e

# AI integration tests
npm run test:ai-integration

# Book generation tests
npm run test:book-generation
Coding Style & Naming Conventions

Indentation: 2 spaces (TypeScript/JavaScript)
File naming: kebab-case for components, camelCase for utilities
Function/variable naming: camelCase with descriptive names
Linting: ESLint with Next.js configuration, TypeScript strict mode enabled

Testing Guidelines

Framework: Jest for unit tests, Playwright for E2E testing
Test files: Located in /tests directory with feature-specific subdirectories
Running tests: Use npm run test:comprehensive for full test suite
Coverage: Comprehensive test coverage for AI services, book generation, payment flows, and user journeys

Commit & Pull Request Guidelines

Commit format: Descriptive messages focusing on feature/fix areas (e.g., "book-generation", "humanization", "fixes", "updates")
PR process: Team-based development with code review requirements
Branch naming: Feature branches with descriptive names


Repository Tour
🎯 What This Repository Does
EbookAI is an AI-powered ebook generation platform that creates complete, publishable books from start to finish. The platform specializes in mystery and self-help genres, providing comprehensive writing assistance, humanization layers, market analytics, and publishing tools to help authors create authentic, engaging books efficiently.
Key responsibilities:

AI-powered complete book generation with humanization layers
Market research and competitive analysis for optimal positioning
Multi-tier subscription management with hybrid revenue sharing
Professional formatting and export to multiple ebook formats
Plagiarism detection and content quality assurance


🏗️ Architecture Overview
System Context
[User Input/Stories] → [EbookAI Platform] → [Complete Published Books]
                            ↓
                    [Claude AI Engine]
                            ↓
                    [Humanization Layers] → [Market Analytics]
Key Components

Book Generation Engine - Claude API integration for long-form content creation
Humanization System - Multi-layer content processing for authentic voice and style
Market Intelligence - Real-time bestseller analysis and keyword research
Payment Processing - Stripe integration with subscription tiers and revenue sharing
Content Management - Version control, chapter organization, and export systems
Quality Assurance - Plagiarism detection and content consistency validation

Data Flow

User completes onboarding assessment for personalized experience
AI generates book outline and chapter structure based on genre and preferences
Content generation with real-time humanization processing
Market analytics provide positioning and optimization recommendations
Quality assurance validates content originality and consistency
Professional formatting and export to EPUB, PDF, DOCX formats


📁 Project Structure [Partial Directory Tree]
EbookAI/
├── pages/                          # Next.js pages and API routes
│   ├── api/                        # Backend API endpoints
│   │   ├── ai/                     # AI generation endpoints
│   │   ├── generate-book.ts        # Main book generation API
│   │   ├── humanize-content.ts     # Content humanization API
│   │   ├── market-analysis.ts      # Market research API
│   │   └── stripe/                 # Payment processing
│   ├── dashboard/                  # User dashboard pages
│   ├── book-editor/                # Book editing interface
│   ├── index.tsx                   # Homepage with onboarding
│   └── _app.tsx                    # App configuration
├── components/                     # React components by feature
│   ├── book-editor/                # Book creation and editing
│   ├── humanization/               # Humanization controls
│   ├── analytics/                  # Market analytics dashboard
│   ├── dashboard/                  # User dashboard components
│   ├── onboarding/                 # User assessment flow
│   └── ui/                         # Reusable UI components
├── lib/                           # Core utilities and services
│   ├── ai-services/               # Claude API integrations
│   ├── humanization/              # Content processing engines
│   ├── market-research/           # Analytics and trend analysis
│   ├── database/                  # Supabase database layer
│   ├── types/                     # TypeScript type definitions
│   ├── export-handlers/           # EPUB, PDF, DOCX generation
│   └── plagiarism/                # Content originality checking
├── humanization-engine/           # Advanced content processing
├── public/                        # Static assets and images
├── styles/                        # Global CSS and Tailwind config
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── netlify.toml                   # Deployment configuration
Key Files to Know
FilePurposeWhen You'd Touch Itpages/api/generate-book.tsMain book generation APIAdding new generation featureslib/humanization/voice-engine.tsContent humanization coreEnhancing authenticity layerslib/market-research/analytics.tsMarket analysis operationsAdding research capabilitieslib/types/book.types.tsBook generation type definitionsExtending book functionalitypages/_app.tsxApp configuration and providersGlobal app changesnext.config.jsNext.js build configurationBuild optimizationtailwind.config.jsDesign system configurationUI/styling changesnetlify.tomlDeployment and serverless configInfrastructure changespackage.jsonDependencies and scriptsAdding new packages

🔧 Technology Stack
Core Technologies

Language: TypeScript (5.2+) - Full type safety across frontend and backend
Framework: Next.js 14 with App Router - Server-side rendering and API routes
Database: Supabase - PostgreSQL with real-time capabilities for user data and projects
Styling: Tailwind CSS 3.4 - Utility-first CSS with custom design system

Key Libraries

@anthropic-ai/sdk - Claude AI integration for book generation
epub-gen - EPUB format generation for ebook exports
jspdf - PDF generation with professional formatting
mammoth - DOCX format handling and generation
stripe - Payment processing and subscription management
@supabase/supabase-js - Database operations and real-time updates
copyscape-api - Plagiarism detection and content verification
framer-motion - UI animations and writing progress visualization

Development Tools

Jest - Unit testing framework with AI service mocks
Playwright - End-to-end testing for complete book generation flows
ESLint - Code quality and Next.js best practices
TypeScript - Static type checking and IntelliSense


🌐 External Dependencies
Required Services

Supabase - Primary database for users, projects, and book data
Stripe - Payment processing for subscriptions and revenue sharing
Anthropic API - Claude integration for book generation and humanization
Copyscape API - Plagiarism detection and content originality verification
Netlify - Hosting platform with serverless functions and CDN

Optional Integrations

Amazon KDP API - Direct publishing pipeline (future integration)
Google Analytics - User behavior tracking and conversion metrics
Grammarly API - Additional grammar and style checking
Bestseller API - Real-time market data and trend analysis

Environment Variables
bash# Required
STRIPE_SECRET_KEY=          # Payment processing
ANTHROPIC_API_KEY=          # Claude AI book generation
SUPABASE_URL=              # Database connection
SUPABASE_SERVICE_KEY=      # Database admin access
COPYSCAPE_API_KEY=         # Plagiarism detection

# Optional
KDP_API_KEY=               # Amazon publishing integration
GA_MEASUREMENT_ID=         # Analytics tracking
GRAMMARLY_API_KEY=         # Grammar checking
BESTSELLER_API_KEY=        # Market research data

📄 Common Workflows
Book Generation Workflow

User completes onboarding assessment via /onboarding flow
AI generates book outline and chapter structure via /api/generate-book
Content generation with real-time humanization processing
User reviews and refines chapters using collaborative editing tools
Final export to EPUB, PDF, and DOCX formats with professional formatting

Code path: pages/onboarding/ → pages/api/generate-book.ts → lib/ai-services/ → lib/humanization/ → lib/export-handlers/
Market Analysis Workflow

User requests market research for their book topic or completed manuscript
Analytics engine processes current bestseller trends and keyword analysis
Competitive analysis identifies positioning opportunities and pricing recommendations
Results integrated into book optimization suggestions and marketing copy

Code path: components/analytics/MarketResearch.tsx → pages/api/market-analysis.ts → lib/market-research/ → lib/database/
Payment & Subscription Workflow

User selects subscription tier or hybrid model on pricing page
Stripe checkout session created with tier-specific word limits and features
Webhook processes payments and updates user access levels
Revenue sharing calculations for hybrid model users upon book sales

Code path: pages/pricing.tsx → pages/api/create-checkout-session.ts → pages/api/webhook.js → lib/database/

📈 Performance & Scale
Performance Considerations

AI Token Optimization - Efficient prompt engineering and response caching for book generation
Content Processing - Streaming responses for real-time chapter generation
Export Generation - Optimized EPUB/PDF creation with progress tracking
Database Queries - Optimized Supabase queries for manuscript storage and version control

Word Limits & Scaling

Basic Tier - 75,000 words per book (~150 pages)
Pro Tier - 100,000 words per book (~200 pages)
Author Tier - 150,000 words per book (~300 pages)
Cost Management - $25-40 per 200-page book in AI generation costs

Monitoring

Generation Health - /api/health endpoint monitors AI services and database
Token Usage - Real-time tracking of Claude API costs and optimization
Export Performance - Monitoring EPUB/PDF generation times and success rates
User Analytics - Book completion rates and subscription conversion tracking


🚨 Things to Be Careful About
🔒 Security Considerations

Content Protection - User manuscripts encrypted and backed up with version control
API Key Management - All AI and payment keys stored securely in environment variables
Input Validation - Sanitization of user inputs for book generation prompts
Rate Limiting - AI generation endpoints protected against abuse and excessive usage

🤖 AI Content Management

Plagiarism Prevention - Mandatory originality checking before export/publishing
Content Filtering - Automated detection of explicit content (no other censorship)
Quality Control - Consistency validation across chapters and character/plot tracking
Cost Optimization - Token usage monitoring and efficient prompt strategies

💳 Payment & Revenue Processing

Subscription Lifecycle - Proper handling of tier changes and usage limits
Revenue Share Tracking - Accurate calculation of 8% share for hybrid model users
Word Limit Enforcement - Hard limits with upgrade prompts at 90% usage
Refund Handling - Clear policies for incomplete or unsatisfactory generations

📚 Content Quality Assurance

Humanization Effectiveness - Validation that AI-generated content feels authentic
Export Quality - Professional formatting across EPUB, PDF, and DOCX formats
Version Control - Comprehensive backup and recovery for user manuscripts
Market Data Accuracy - Reliable bestseller and keyword analysis for positioning