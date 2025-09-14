/**
 * API Connection Testing Framework
 * Tests both Claude (Anthropic) and GPT-4 (OpenAI) API connections
 * Tracks usage and costs for performance evaluation
 */

const https = require('https');

class APITester {
  constructor() {
    this.claudeApiKey = process.env.CLAUDE_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiOrgId = process.env.OPENAI_ORG_ID;
    
    // Usage tracking
    this.usage = {
      claude: { requests: 0, inputTokens: 0, outputTokens: 0, totalCost: 0 },
      openai: { requests: 0, inputTokens: 0, outputTokens: 0, totalCost: 0 }
    };

    // Pricing (per million tokens)
    this.pricing = {
      claude: { input: 3.00, output: 15.00 }, // Claude 3 Sonnet
      openai: { input: 10.00, output: 30.00 } // GPT-4 Turbo
    };
  }

  /**
   * Test Claude API connection
   */
  async testClaudeConnection() {
    console.log('\n🧪 Testing Claude API connection...');
    
    try {
      const response = await this.makeClaudeRequest({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: 'Hello! Please respond with a brief test message.'
        }]
      });

      if (response.content && response.content[0] && response.content[0].text) {
        console.log('✅ Claude API: Connection successful');
        console.log('📝 Test response:', response.content[0].text.slice(0, 100) + '...');
        
        // Track usage
        this.trackUsage('claude', response.usage.input_tokens, response.usage.output_tokens);
        return { success: true, provider: 'claude', response: response.content[0].text };
      } else {
        throw new Error('Invalid response format from Claude API');
      }
    } catch (error) {
      console.error('❌ Claude API: Connection failed');
      console.error('Error:', error.message);
      return { success: false, provider: 'claude', error: error.message };
    }
  }

  /**
   * Test OpenAI API connection
   */
  async testOpenAIConnection() {
    console.log('\n🧪 Testing OpenAI API connection...');
    
    try {
      const response = await this.makeOpenAIRequest({
        model: 'gpt-4-turbo-preview',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: 'Hello! Please respond with a brief test message.'
        }]
      });

      if (response.choices && response.choices[0] && response.choices[0].message) {
        console.log('✅ OpenAI API: Connection successful');
        console.log('📝 Test response:', response.choices[0].message.content.slice(0, 100) + '...');
        
        // Track usage
        this.trackUsage('openai', response.usage.prompt_tokens, response.usage.completion_tokens);
        return { success: true, provider: 'openai', response: response.choices[0].message.content };
      } else {
        throw new Error('Invalid response format from OpenAI API');
      }
    } catch (error) {
      console.error('❌ OpenAI API: Connection failed');
      console.error('Error:', error.message);
      return { success: false, provider: 'openai', error: error.message };
    }
  }

  /**
   * Make HTTP request to Claude API
   */
  async makeClaudeRequest(payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      
      const options = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`Claude API Error ${res.statusCode}: ${parsedData.error?.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse Claude API response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Claude API Request failed: ${error.message}`));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Make HTTP request to OpenAI API
   */
  async makeOpenAIRequest(payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      
      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'OpenAI-Organization': this.openaiOrgId,
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`OpenAI API Error ${res.statusCode}: ${parsedData.error?.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse OpenAI API response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`OpenAI API Request failed: ${error.message}`));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Track API usage and costs
   */
  trackUsage(provider, inputTokens, outputTokens) {
    const usage = this.usage[provider];
    const pricing = this.pricing[provider];
    
    usage.requests += 1;
    usage.inputTokens += inputTokens;
    usage.outputTokens += outputTokens;
    
    // Calculate cost (pricing is per million tokens)
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    usage.totalCost += inputCost + outputCost;
  }

  /**
   * Display usage statistics
   */
  displayUsageStats() {
    console.log('\n📊 API Usage Statistics:');
    console.log('========================');
    
    for (const [provider, stats] of Object.entries(this.usage)) {
      console.log(`\n${provider.toUpperCase()}:`);
      console.log(`  Requests: ${stats.requests}`);
      console.log(`  Input Tokens: ${stats.inputTokens.toLocaleString()}`);
      console.log(`  Output Tokens: ${stats.outputTokens.toLocaleString()}`);
      console.log(`  Total Tokens: ${(stats.inputTokens + stats.outputTokens).toLocaleString()}`);
      console.log(`  Total Cost: $${stats.totalCost.toFixed(4)}`);
    }
    
    const totalCost = this.usage.claude.totalCost + this.usage.openai.totalCost;
    console.log(`\nTOTAL COST: $${totalCost.toFixed(4)}`);
  }

  /**
   * Run comprehensive API tests
   */
  async runTests() {
    console.log('🚀 Starting API Connection Tests');
    console.log('================================');
    
    const results = [];
    
    // Test Claude API
    const claudeResult = await this.testClaudeConnection();
    results.push(claudeResult);
    
    // Test OpenAI API
    const openaiResult = await this.testOpenAIConnection();
    results.push(openaiResult);
    
    // Display usage statistics
    this.displayUsageStats();
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('================');
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`✅ Successful connections: ${successful}/${total}`);
    
    if (successful === total) {
      console.log('🎉 All API connections are working properly!');
      console.log('✨ Ready to proceed with LLM performance testing.');
    } else {
      console.log('⚠️  Some API connections failed. Please check your API keys and network connection.');
    }
    
    return {
      success: successful === total,
      results,
      usage: this.usage
    };
  }
}

// Export for use in other modules
module.exports = APITester;

// Run tests if this file is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  const tester = new APITester();
  tester.runTests().then(results => {
    process.exit(results.success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}