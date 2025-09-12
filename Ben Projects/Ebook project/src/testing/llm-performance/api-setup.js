/**
 * LLM API Setup and Configuration
 * Handles connections to Claude (Anthropic) and GPT-4 (OpenAI)
 */

import axios from 'axios';

// API Configuration
const API_CONFIG = {
  claude: {
    baseURL: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-sonnet-20240229', // Latest Claude model for testing
    maxTokens: 8000, // For long-form content generation
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    }
  },
  
  openai: {
    baseURL: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo-preview', // Latest GPT-4 model for testing
    maxTokens: 8000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  }
};

// Cost tracking (as of 2024 pricing)
const PRICING = {
  claude: {
    inputTokenCost: 0.003 / 1000,   // $3 per 1M input tokens
    outputTokenCost: 0.015 / 1000   // $15 per 1M output tokens
  },
  openai: {
    inputTokenCost: 0.01 / 1000,    // $10 per 1M input tokens
    outputTokenCost: 0.03 / 1000    // $30 per 1M output tokens
  }
};

class LLMTester {
  constructor() {
    this.results = {
      claude: [],
      openai: []
    };
    this.totalCosts = {
      claude: 0,
      openai: 0
    };
  }

  /**
   * Test Claude API with given prompt
   */
  async testClaude(prompt, testName) {
    const startTime = Date.now();
    
    try {
      const response = await axios.post(API_CONFIG.claude.baseURL, {
        model: API_CONFIG.claude.model,
        max_tokens: API_CONFIG.claude.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }, {
        headers: API_CONFIG.claude.headers,
        timeout: 120000 // 2 minute timeout for long generations
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result = {
        testName,
        model: 'claude-3-sonnet',
        prompt,
        response: response.data.content[0].text,
        usage: response.data.usage,
        responseTime,
        timestamp: new Date().toISOString(),
        success: true
      };

      // Calculate costs
      const inputCost = result.usage.input_tokens * PRICING.claude.inputTokenCost;
      const outputCost = result.usage.output_tokens * PRICING.claude.outputTokenCost;
      result.cost = inputCost + outputCost;
      this.totalCosts.claude += result.cost;

      this.results.claude.push(result);
      return result;

    } catch (error) {
      const result = {
        testName,
        model: 'claude-3-sonnet',
        prompt,
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        success: false
      };

      this.results.claude.push(result);
      return result;
    }
  }

  /**
   * Test OpenAI GPT-4 with given prompt
   */
  async testOpenAI(prompt, testName) {
    const startTime = Date.now();
    
    try {
      const response = await axios.post(API_CONFIG.openai.baseURL, {
        model: API_CONFIG.openai.model,
        max_tokens: API_CONFIG.openai.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7 // Balanced creativity for book writing
      }, {
        headers: API_CONFIG.openai.headers,
        timeout: 120000 // 2 minute timeout
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result = {
        testName,
        model: 'gpt-4-turbo',
        prompt,
        response: response.data.choices[0].message.content,
        usage: response.data.usage,
        responseTime,
        timestamp: new Date().toISOString(),
        success: true
      };

      // Calculate costs
      const inputCost = result.usage.prompt_tokens * PRICING.openai.inputTokenCost;
      const outputCost = result.usage.completion_tokens * PRICING.openai.outputTokenCost;
      result.cost = inputCost + outputCost;
      this.totalCosts.openai += result.cost;

      this.results.openai.push(result);
      return result;

    } catch (error) {
      const result = {
        testName,
        model: 'gpt-4-turbo',
        prompt,
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        success: false
      };

      this.results.openai.push(result);
      return result;
    }
  }

  /**
   * Run comparative test on both models
   */
  async runComparativeTest(prompt, testName) {
    console.log(`\n🧪 Running comparative test: ${testName}`);
    console.log('⏳ Testing Claude...');
    
    const claudeResult = await this.testClaude(prompt, testName);
    
    console.log('⏳ Testing GPT-4...');
    const openaiResult = await this.testOpenAI(prompt, testName);

    return {
      claude: claudeResult,
      openai: openaiResult,
      comparison: this.compareResults(claudeResult, openaiResult)
    };
  }

  /**
   * Compare results between models
   */
  compareResults(claudeResult, openaiResult) {
    if (!claudeResult.success || !openaiResult.success) {
      return { error: 'One or both tests failed' };
    }

    const claudeWordCount = claudeResult.response.split(' ').length;
    const openaiWordCount = openaiResult.response.split(' ').length;

    return {
      wordCount: {
        claude: claudeWordCount,
        openai: openaiWordCount,
        difference: Math.abs(claudeWordCount - openaiWordCount)
      },
      cost: {
        claude: claudeResult.cost,
        openai: openaiResult.cost,
        difference: Math.abs(claudeResult.cost - openaiResult.cost),
        cheaper: claudeResult.cost < openaiResult.cost ? 'claude' : 'openai'
      },
      responseTime: {
        claude: claudeResult.responseTime,
        openai: openaiResult.responseTime,
        faster: claudeResult.responseTime < openaiResult.responseTime ? 'claude' : 'openai'
      },
      tokens: {
        claude: claudeResult.usage,
        openai: openaiResult.usage
      }
    };
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.claude.length + this.results.openai.length,
        successfulTests: {
          claude: this.results.claude.filter(r => r.success).length,
          openai: this.results.openai.filter(r => r.success).length
        },
        totalCosts: this.totalCosts,
        averageResponseTime: {
          claude: this.results.claude.reduce((sum, r) => sum + r.responseTime, 0) / this.results.claude.length,
          openai: this.results.openai.reduce((sum, r) => sum + r.responseTime, 0) / this.results.openai.length
        }
      },
      detailedResults: {
        claude: this.results.claude,
        openai: this.results.openai
      },
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];

    // Cost analysis
    if (this.totalCosts.claude < this.totalCosts.openai) {
      recommendations.push({
        category: 'Cost',
        recommendation: 'Claude is more cost-effective for this use case',
        savings: `$${(this.totalCosts.openai - this.totalCosts.claude).toFixed(4)} saved per test cycle`
      });
    } else {
      recommendations.push({
        category: 'Cost',
        recommendation: 'GPT-4 is more cost-effective for this use case',
        savings: `$${(this.totalCosts.claude - this.totalCosts.openai).toFixed(4)} saved per test cycle`
      });
    }

    // Performance analysis
    const claudeAvgTime = this.results.claude.reduce((sum, r) => sum + r.responseTime, 0) / this.results.claude.length;
    const openaiAvgTime = this.results.openai.reduce((sum, r) => sum + r.responseTime, 0) / this.results.openai.length;

    if (claudeAvgTime < openaiAvgTime) {
      recommendations.push({
        category: 'Performance',
        recommendation: 'Claude has faster response times',
        improvement: `${((openaiAvgTime - claudeAvgTime) / 1000).toFixed(2)} seconds faster on average`
      });
    } else {
      recommendations.push({
        category: 'Performance',
        recommendation: 'GPT-4 has faster response times',
        improvement: `${((claudeAvgTime - openaiAvgTime) / 1000).toFixed(2)} seconds faster on average`
      });
    }

    return recommendations;
  }
}

export default LLMTester;