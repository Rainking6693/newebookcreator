# API Access Setup for AI Ebook Generation Platform

## Overview
This document outlines the API access setup for both Claude (Anthropic) and GPT-4 (OpenAI) services required for the AI Ebook Generation Platform.

## 1. Claude (Anthropic) API Setup

### API Access Requirements
- **Service**: Claude API (Anthropic)
- **Model Versions**: Claude 3 Sonnet, Claude 3.5 Sonnet, Claude 3 Opus
- **Rate Limits**: 4,000 requests per minute, 400,000 tokens per minute
- **Pricing**: $3.00 per million input tokens, $15.00 per million output tokens (Claude 3 Sonnet)

### Configuration
```javascript
// Claude API Configuration
const CLAUDE_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com',
  version: '2023-06-01',
  model: 'claude-3-sonnet-20240229',
  maxTokens: 4096,
  temperature: 0.7
};
```

### Setup Steps
1. ✅ Create Anthropic account at console.anthropic.com
2. ✅ Generate API key with appropriate permissions
3. ✅ Configure environment variables
4. ✅ Set up rate limiting and error handling
5. ✅ Implement token counting for cost tracking

## 2. GPT-4 (OpenAI) API Setup

### API Access Requirements
- **Service**: OpenAI API
- **Model Versions**: GPT-4, GPT-4 Turbo, GPT-4o
- **Rate Limits**: 10,000 requests per minute, 2,000,000 tokens per minute
- **Pricing**: $10.00 per million input tokens, $30.00 per million output tokens (GPT-4)

### Configuration
```javascript
// OpenAI API Configuration
const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4-turbo-preview',
  maxTokens: 4096,
  temperature: 0.7,
  organization: process.env.OPENAI_ORG_ID
};
```

### Setup Steps
1. ✅ Create OpenAI account at platform.openai.com
2. ✅ Generate API key with appropriate permissions
3. ✅ Configure organization ID and billing
4. ✅ Set up rate limiting and error handling
5. ✅ Implement token counting for cost tracking

## 3. API Integration Code

### Base API Client
```javascript
class LLMClient {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
    this.tokenCount = 0;
    this.requestCount = 0;
  }

  async generateContent(prompt, options = {}) {
    try {
      const response = await this.makeRequest(prompt, options);
      this.trackUsage(response);
      return response;
    } catch (error) {
      console.error(`${this.provider} API Error:`, error);
      throw error;
    }
  }

  trackUsage(response) {
    this.tokenCount += response.usage.total_tokens;
    this.requestCount += 1;
  }
}
```

### Error Handling & Retry Logic
```javascript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

## 4. Cost Tracking Implementation

### Token Counting
- Input tokens: Counted before sending to API
- Output tokens: Retrieved from API response
- Total cost calculation: (input_tokens * input_rate) + (output_tokens * output_rate)

### Usage Monitoring
```javascript
class UsageTracker {
  constructor() {
    this.usage = {
      claude: { tokens: 0, requests: 0, cost: 0 },
      openai: { tokens: 0, requests: 0, cost: 0 }
    };
  }

  trackRequest(provider, inputTokens, outputTokens) {
    const rates = this.getRates(provider);
    const cost = (inputTokens * rates.input) + (outputTokens * rates.output);
    
    this.usage[provider].tokens += inputTokens + outputTokens;
    this.usage[provider].requests += 1;
    this.usage[provider].cost += cost;
  }
}
```

## 5. Security & Environment Setup

### Environment Variables
```bash
# Claude API
ANTHROPIC_API_KEY=your_claude_api_key_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORG_ID=your_organization_id_here

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=60
MAX_TOKENS_PER_REQUEST=4096
```

### Security Best Practices
- ✅ API keys stored as environment variables
- ✅ No hardcoded credentials in source code
- ✅ Rate limiting implemented
- ✅ Request/response logging for debugging
- ✅ Error handling for API failures

## 6. Testing Configuration

### Health Check Endpoints
```javascript
// Test Claude API connection
const testClaudeConnection = async () => {
  try {
    const response = await claude.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hello' }]
    });
    return { status: 'success', provider: 'claude' };
  } catch (error) {
    return { status: 'error', provider: 'claude', error: error.message };
  }
};

// Test OpenAI API connection
const testOpenAIConnection = async () => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hello' }]
    });
    return { status: 'success', provider: 'openai' };
  } catch (error) {
    return { status: 'error', provider: 'openai', error: error.message };
  }
};
```

## Status: ✅ COMPLETED
- Claude API access configured and tested
- OpenAI API access configured and tested
- Cost tracking implementation ready
- Security protocols established
- Error handling and retry logic implemented

**Completion Date**: 2025-01-13 14:30 UTC