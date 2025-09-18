d# 🔑 API Keys Setup Guide

## Required API Keys for AI Ebook Platform

This guide will help you obtain all the necessary API keys to run the AI Ebook Platform. I've created both `.env.example` and `.env` files for you.

---

## 🚨 CRITICAL - MUST HAVE THESE FIRST

### 1. **Claude API Key** (Primary AI Service)
- **Website**: https://console.anthropic.com/
- **Cost**: Pay-per-use (approximately $0.01-0.03 per 1K tokens)
- **Setup**:
  1. Create account at Anthropic Console
  2. Add payment method
  3. Generate API key
  4. Add to `.env` as `CLAUDE_API_KEY`

### 2. **OpenAI API Key** (Secondary AI Service)
- **Website**: https://platform.openai.com/
- **Cost**: Pay-per-use (approximately $0.002-0.02 per 1K tokens)
- **Setup**:
  1. Create account at OpenAI Platform
  2. Add payment method
  3. Generate API key
  4. Add to `.env` as `OPENAI_API_KEY`

### 3. **Stripe API Keys** (Payment Processing)
- **Website**: https://dashboard.stripe.com/
- **Cost**: 2.9% + 30¢ per transaction
- **Setup**:
  1. Create Stripe account
  2. Get test keys from Dashboard → Developers → API keys
  3. Add `STRIPE_PUBLISHABLE_KEY-pk_live_51RyJPcPQdMywmVkHwdLQtTRV8YV9fXjdJtrxEwnYCFTn3Wqt4q82g0o1UMhP4Nr3GchadbVvUKXAMkKvxijlRRoF00Zm32Fgms and 
STRIPE_SECRET_KEY-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 to `.env`
  4. Create webhook endpoint for `whsec_wvbQ4l97MQInDV86vrHGtaj1hcBPabNs`
Author Membership- price_1S6GyQPQdMywmVkHTRFqvNMP
Pro Membership- price_1S6GyAPQdMywmVkH7SGVQ6Lc
Basic Membership- price_1S6GxoPQdMywmVkHTdWAX2X8

---

## 🗄️ DATABASE SETUP

### 4. **MongoDB** (Database)
- **Option 1 - Local**: Install MongoDB locally
- **Option 2 - Cloud**: Use MongoDB Atlas (free tier available)
- **Website**: https://www.mongodb.com/atlas
- **Setup**:
  1. Create cluster on MongoDB Atlas
  2. Get connection string
  3. Add to `.env` as `MONGODB_URI`
Airtable:
appjHTPSjN2uYYS6o/pagskX2YD9Gjvc1gn
Ebook Site Records
patituBm01p5iTe83.e56de2da0114b2f0b9ec2dc9dff3600ef1d29b14e727cee4b77d9f4272814436
### 5. **Redis** (Caching)
- **Option 1 - Local**: Install Redis locally
- **Option 2 - Cloud**: Use Redis Cloud (free tier available)
- **Website**: https://redis.com/
- **Setup**:
  1. Create Redis instance
  2. Get connection URL
  3. Add to `.env` as `REDIS_URL`

---

## 📧 EMAIL & COMMUNICATION

### 6. **SendGrid** (Email Service)
- **Website**: https://app.sendgrid.com/
- **Cost**: Free tier (100 emails/day), then $14.95/month
- **Setup**:
  1. Create SendGrid account
  2. Verify sender identity
  3. Generate API key
  4. Add to `.env` as `SENDGRID_API_KEY`

---

## ☁️ CLOUD SERVICES (OPTIONAL FOR DEVELOPMENT)

### 7. **AWS Services** (File Storage & CDN)
- **Website**: https://aws.amazon.com/
- **Cost**: Pay-per-use (S3: ~$0.023/GB, CloudFront: ~$0.085/GB)
- **Setup**:
  1. Create AWS account
  2. Create IAM user with S3 and CloudFront permissions
  3. Generate access keys
  4. Create S3 buckets for content, backups, exports, assets
  5. Add credentials to `.env`

---

## 🔍 CONTENT SERVICES (OPTIONAL)

### 8. **Google Books API** (Market Research)
- **Website**: https://console.developers.google.com/
- **Cost**: Free (with quotas)
- **Setup**:
  1. Create Google Cloud project
  2. Enable Books API
  3. Generate API key
  4. Add to `.env` as `GOOGLE_BOOKS_API_KEY`

### 9. **Copyscape API** (Plagiarism Detection)
- **Website**: https://www.copyscape.com/api/
- **Cost**: $0.05 per search
- **Setup**:
  1. Create Copyscape account
  2. Subscribe to API service
  3. Get username and API key
  4. Add to `.env`

---

## 🔐 SECURITY KEYS GENERATION

### Generate Strong Secrets
You need to generate strong random strings for:
- `JWT_ACCESS_SECRET`-C
- `JWT_REFRESH_SECRET`-732325a2bbdade085f49823a5eb81b2d77d5cd9a699b45ab88c207183c77119b
- `SESSION_SECRET`-L4JSjSEfcokt1JmZI8M17bYMFpZnYlBtW4PENZMISCsvuTHLnbUsD9Nzh5skR9WH
- `ENCRYPTION_KEY`-751bcdad28af6d6b1ea4b7b81a8aa9b6b3627b04081da55236e6de744b1c72c1

**Use this command to generate secure keys:**
```bash
# Generate 64-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator
# https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

---

## 📋 SETUP CHECKLIST

### Essential for Basic Functionality:
- [ ] Claude API Key
- [ ] OpenAI API Key  
- [ ] MongoDB URI
- [ ] Generated JWT secrets
- [ ] Stripe API keys (for payments)

### Important for Full Features:
- [ ] Redis URL (for caching)
- [ ] SendGrid API key (for emails)
- [ ] AWS credentials (for file storage)

### Optional for Enhanced Features:
- [ ] Google Books API key
- [ ] Copyscape API credentials
- [ ] Analytics service keys

---

## 🚀 QUICK START STEPS

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Get the essential API keys:**
   - Claude API key (for AI features)
   - OpenAI API key (backup AI)
   - Stripe keys (for payments)
   - MongoDB URI (for database)

3. **Generate security secrets:**
   ```bash
   # Generate JWT secrets
   node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(16).toString('hex'))"
   ```

4. **Update your `.env` file** with the actual values

5. **Install dependencies:**
   ```bash
   npm install
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## 💰 ESTIMATED MONTHLY COSTS

### Minimal Setup (Development):
- **Claude API**: $10-50/month (depending on usage)
- **OpenAI API**: $5-20/month (backup usage)
- **MongoDB Atlas**: Free tier
- **Redis**: Free tier
- **Total**: ~$15-70/month

### Production Setup:
- **AI APIs**: $100-500/month (based on user volume)
- **Stripe**: 2.9% of revenue
- **MongoDB**: $57/month (M10 cluster)
- **AWS**: $50-200/month (depending on storage/traffic)
- **SendGrid**: $15/month
- **Total**: ~$200-800/month + percentage of revenue

---

## 🔧 TROUBLESHOOTING

### Common Issues:

1. **"API key not found" errors**
   - Check that your `.env` file is in the root directory
   - Verify the API key format is correct
   - Ensure no extra spaces or quotes around keys

2. **Database connection errors**
   - Verify MongoDB is running (if local)
   - Check MongoDB Atlas IP whitelist (if cloud)
   - Confirm connection string format

3. **Stripe webhook errors**
   - Use Stripe CLI for local development
   - Verify webhook endpoint URL
   - Check webhook secret matches

### Getting Help:
- Check the API provider's documentation
- Verify your account has sufficient credits/quota
- Test API keys with simple curl commands first

---

## 🎯 PRIORITY ORDER

**Start with these in order:**

1. **Claude API** - Core AI functionality
2. **MongoDB** - Data storage
3. **JWT Secrets** - Authentication
4. **Stripe** - Payment processing
5. **OpenAI API** - AI backup
6. **SendGrid** - Email notifications
7. **Redis** - Performance optimization
8. **AWS** - File storage and CDN
9. **Optional APIs** - Enhanced features

This setup will get your AI Ebook Platform running with full functionality!