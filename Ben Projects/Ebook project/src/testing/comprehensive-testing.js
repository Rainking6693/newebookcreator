/**
 * Comprehensive Testing Suite
 * End-to-end testing, security testing, performance testing, and quality assurance
 */

import { jest } from '@jest/globals';
import supertest from 'supertest';
import puppeteer from 'puppeteer';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

class ComprehensiveTestingSuite {
  constructor() {
    this.testResults = {
      endToEnd: [],
      security: [],
      performance: [],
      api: [],
      integration: []
    };
    
    this.testConfig = {
      timeout: 30000,
      retries: 3,
      parallel: true,
      coverage: {
        threshold: 80,
        includeUntested: true
      }
    };
    
    this.securityTests = {
      sqlInjection: true,
      xss: true,
      csrf: true,
      authentication: true,
      authorization: true,
      dataValidation: true
    };
    
    this.performanceThresholds = {
      apiResponse: 2000, // 2 seconds
      pageLoad: 3000, // 3 seconds
      databaseQuery: 1000, // 1 second
      fileUpload: 5000, // 5 seconds
      aiGeneration: 30000 // 30 seconds
    };
  }
  
  // End-to-End Testing
  async runEndToEndTests() {
    console.log('🧪 Starting End-to-End Tests...');
    
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const testSuites = [
        this.testUserRegistrationFlow,
        this.testBookCreationWorkflow,
        this.testAIGenerationWorkflow,
        this.testSubscriptionWorkflow,
        this.testExportWorkflow,
        this.testCollaborationWorkflow
      ];
      
      for (const testSuite of testSuites) {
        await this.runTestSuite(browser, testSuite);
      }
      
    } finally {
      await browser.close();
    }
    
    return this.testResults.endToEnd;
  }
  
  async testUserRegistrationFlow(browser) {
    const page = await browser.newPage();
    const testName = 'User Registration Flow';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      // Navigate to registration page
      await page.goto(`${process.env.FRONTEND_URL}/register`);
      await page.waitForSelector('[data-testid="register-form"]');
      
      // Fill registration form
      const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      };
      
      await page.fill('[data-testid="first-name"]', testUser.firstName);
      await page.fill('[data-testid="last-name"]', testUser.lastName);
      await page.fill('[data-testid="email"]', testUser.email);
      await page.fill('[data-testid="password"]', testUser.password);
      await page.fill('[data-testid="confirm-password"]', testUser.password);
      
      // Submit form
      await page.click('[data-testid="register-button"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/app/dashboard', { timeout: 10000 });
      
      // Verify dashboard elements
      await page.waitForSelector('[data-testid="dashboard-welcome"]');
      await page.waitForSelector('[data-testid="create-book-button"]');
      
      this.testResults.endToEnd.push({
        name: testName,
        status: 'passed',
        duration: performance.now(),
        details: 'User registration and dashboard access successful'
      });
      
    } catch (error) {
      this.testResults.endToEnd.push({
        name: testName,
        status: 'failed',
        error: error.message,
        duration: performance.now()
      });
    } finally {
      await page.close();
    }
  }
  
  async testBookCreationWorkflow(browser) {
    const page = await browser.newPage();
    const testName = 'Book Creation Workflow';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      // Login first
      await this.loginTestUser(page);
      
      // Navigate to book creation
      await page.goto(`${process.env.FRONTEND_URL}/app/books/new`);
      await page.waitForSelector('[data-testid="book-creation-form"]');
      
      // Fill book details
      const testBook = {
        title: `Test Book ${Date.now()}`,
        genre: 'mystery',
        description: 'A test mystery novel for automated testing',
        targetWordCount: 50000
      };
      
      await page.fill('[data-testid="book-title"]', testBook.title);
      await page.selectOption('[data-testid="book-genre"]', testBook.genre);
      await page.fill('[data-testid="book-description"]', testBook.description);
      await page.fill('[data-testid="target-word-count"]', testBook.targetWordCount.toString());
      
      // Create book
      await page.click('[data-testid="create-book-button"]');
      
      // Wait for redirect to book editor
      await page.waitForURL('**/app/books/*/edit', { timeout: 10000 });
      
      // Verify editor elements
      await page.waitForSelector('[data-testid="book-editor"]');
      await page.waitForSelector('[data-testid="ai-assistant-button"]');
      
      this.testResults.endToEnd.push({
        name: testName,
        status: 'passed',
        duration: performance.now(),
        details: 'Book creation and editor access successful'
      });
      
    } catch (error) {
      this.testResults.endToEnd.push({
        name: testName,
        status: 'failed',
        error: error.message,
        duration: performance.now()
      });
    } finally {
      await page.close();
    }
  }
  
  async testAIGenerationWorkflow(browser) {
    const page = await browser.newPage();
    const testName = 'AI Generation Workflow';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      // Login and navigate to existing book
      await this.loginTestUser(page);
      await this.navigateToTestBook(page);
      
      // Open AI assistant
      await page.click('[data-testid="ai-assistant-button"]');
      await page.waitForSelector('[data-testid="ai-assistant-panel"]');
      
      // Generate content
      const prompt = 'Write the opening paragraph of a mystery novel set in a small coastal town.';
      await page.fill('[data-testid="ai-prompt-input"]', prompt);
      await page.click('[data-testid="generate-button"]');
      
      // Wait for generation to complete
      await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 30000 });
      
      // Verify content was inserted
      const editorContent = await page.textContent('[data-testid="editor-content"]');
      if (!editorContent || editorContent.length < 50) {
        throw new Error('Generated content not found or too short');
      }
      
      this.testResults.endToEnd.push({
        name: testName,
        status: 'passed',
        duration: performance.now(),
        details: 'AI content generation successful'
      });
      
    } catch (error) {
      this.testResults.endToEnd.push({
        name: testName,
        status: 'failed',
        error: error.message,
        duration: performance.now()
      });
    } finally {
      await page.close();
    }
  }
  
  async testSubscriptionWorkflow(browser) {
    const page = await browser.newPage();
    const testName = 'Subscription Workflow';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      // Login and navigate to billing
      await this.loginTestUser(page);
      await page.goto(`${process.env.FRONTEND_URL}/app/settings/billing`);
      
      // Test plan selection
      await page.waitForSelector('[data-testid="billing-settings"]');
      await page.click('[data-testid="change-plan-button"]');
      await page.waitForSelector('[data-testid="plan-selection-modal"]');
      
      // Select Pro plan
      await page.click('[data-testid="select-pro-plan"]');
      
      // Verify Stripe checkout (in test mode)
      if (process.env.NODE_ENV === 'test') {
        await page.waitForSelector('[data-testid="stripe-checkout"]');
        
        // Fill test card details
        await page.fill('[data-testid="card-number"]', '4242424242424242');
        await page.fill('[data-testid="card-expiry"]', '12/25');
        await page.fill('[data-testid="card-cvc"]', '123');
        
        await page.click('[data-testid="complete-payment"]');
        
        // Wait for success
        await page.waitForSelector('[data-testid="payment-success"]', { timeout: 15000 });
      }
      
      this.testResults.endToEnd.push({
        name: testName,
        status: 'passed',
        duration: performance.now(),
        details: 'Subscription workflow completed successfully'
      });
      
    } catch (error) {
      this.testResults.endToEnd.push({
        name: testName,
        status: 'failed',
        error: error.message,
        duration: performance.now()
      });
    } finally {
      await page.close();
    }
  }
  
  // Security Testing
  async runSecurityTests() {
    console.log('🔒 Starting Security Tests...');
    
    const securityTestSuites = [
      this.testSQLInjection,
      this.testXSSVulnerabilities,
      this.testCSRFProtection,
      this.testAuthenticationSecurity,
      this.testAuthorizationControls,
      this.testDataValidation,
      this.testRateLimiting,
      this.testFileUploadSecurity
    ];
    
    for (const testSuite of securityTestSuites) {
      await testSuite.call(this);
    }
    
    return this.testResults.security;
  }
  
  async testSQLInjection() {
    const testName = 'SQL Injection Protection';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --",
        "' UNION SELECT * FROM users --"
      ];
      
      const app = await this.getTestApp();
      
      for (const input of maliciousInputs) {
        // Test login endpoint
        const response = await supertest(app)
          .post('/api/v1/auth/login')
          .send({
            email: input,
            password: 'password'
          });
        
        // Should not return 500 or expose database errors
        if (response.status === 500 || 
            (response.body.error && response.body.error.includes('SQL'))) {
          throw new Error(`SQL injection vulnerability detected with input: ${input}`);
        }
      }
      
      this.testResults.security.push({
        name: testName,
        status: 'passed',
        details: 'No SQL injection vulnerabilities detected'
      });
      
    } catch (error) {
      this.testResults.security.push({
        name: testName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  async testXSSVulnerabilities() {
    const testName = 'XSS Protection';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        '<svg onload="alert(1)">'
      ];
      
      const app = await this.getTestApp();
      const token = await this.getTestAuthToken();
      
      for (const payload of xssPayloads) {
        // Test book creation with XSS payload
        const response = await supertest(app)
          .post('/api/v1/books')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: payload,
            genre: 'mystery',
            description: payload
          });
        
        // Check if payload is properly escaped in response
        if (response.body.title && response.body.title.includes('<script>')) {
          throw new Error(`XSS vulnerability detected with payload: ${payload}`);
        }
      }
      
      this.testResults.security.push({
        name: testName,
        status: 'passed',
        details: 'No XSS vulnerabilities detected'
      });
      
    } catch (error) {
      this.testResults.security.push({
        name: testName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  async testAuthenticationSecurity() {
    const testName = 'Authentication Security';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      const app = await this.getTestApp();
      
      // Test weak password rejection
      const weakPasswords = ['123456', 'password', 'qwerty', 'abc123'];
      
      for (const password of weakPasswords) {
        const response = await supertest(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test@example.com',
            password: password,
            firstName: 'Test',
            lastName: 'User'
          });
        
        if (response.status === 201) {
          throw new Error(`Weak password accepted: ${password}`);
        }
      }
      
      // Test rate limiting on login attempts
      const loginAttempts = Array(20).fill().map(() => 
        supertest(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          })
      );
      
      const responses = await Promise.all(loginAttempts);
      const rateLimited = responses.some(r => r.status === 429);
      
      if (!rateLimited) {
        throw new Error('Rate limiting not working on login attempts');
      }
      
      this.testResults.security.push({
        name: testName,
        status: 'passed',
        details: 'Authentication security measures working correctly'
      });
      
    } catch (error) {
      this.testResults.security.push({
        name: testName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Performance Testing
  async runPerformanceTests() {
    console.log('⚡ Starting Performance Tests...');
    
    const performanceTestSuites = [
      this.testAPIResponseTimes,
      this.testDatabasePerformance,
      this.testFileUploadPerformance,
      this.testAIGenerationPerformance,
      this.testConcurrentUsers,
      this.testMemoryUsage
    ];
    
    for (const testSuite of performanceTestSuites) {
      await testSuite.call(this);
    }
    
    return this.testResults.performance;
  }
  
  async testAPIResponseTimes() {
    const testName = 'API Response Times';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      const app = await this.getTestApp();
      const token = await this.getTestAuthToken();
      
      const endpoints = [
        { method: 'GET', path: '/api/v1/books', threshold: this.performanceThresholds.apiResponse },
        { method: 'GET', path: '/api/v1/users/profile', threshold: this.performanceThresholds.apiResponse },
        { method: 'GET', path: '/api/v1/analytics/dashboard', threshold: this.performanceThresholds.apiResponse }
      ];
      
      const results = [];
      
      for (const endpoint of endpoints) {
        const startTime = performance.now();
        
        const response = await supertest(app)
          [endpoint.method.toLowerCase()](endpoint.path)
          .set('Authorization', `Bearer ${token}`);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        results.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          duration: Math.round(duration),
          threshold: endpoint.threshold,
          passed: duration < endpoint.threshold
        });
        
        if (duration > endpoint.threshold) {
          throw new Error(`${endpoint.path} exceeded threshold: ${duration}ms > ${endpoint.threshold}ms`);
        }
      }
      
      this.testResults.performance.push({
        name: testName,
        status: 'passed',
        details: 'All API endpoints within performance thresholds',
        results
      });
      
    } catch (error) {
      this.testResults.performance.push({
        name: testName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  async testConcurrentUsers() {
    const testName = 'Concurrent User Load';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      const app = await this.getTestApp();
      const concurrentUsers = 50;
      const requestsPerUser = 10;
      
      const userPromises = Array(concurrentUsers).fill().map(async (_, userIndex) => {
        const token = await this.getTestAuthToken(`testuser${userIndex}@example.com`);
        
        const requests = Array(requestsPerUser).fill().map(() =>
          supertest(app)
            .get('/api/v1/books')
            .set('Authorization', `Bearer ${token}`)
        );
        
        return Promise.all(requests);
      });
      
      const startTime = performance.now();
      const results = await Promise.all(userPromises);
      const endTime = performance.now();
      
      const totalRequests = concurrentUsers * requestsPerUser;
      const duration = endTime - startTime;
      const requestsPerSecond = (totalRequests / duration) * 1000;
      
      // Flatten results and check for errors
      const allResponses = results.flat();
      const errorCount = allResponses.filter(r => r.status >= 400).length;
      const errorRate = (errorCount / totalRequests) * 100;
      
      if (errorRate > 5) { // Allow up to 5% error rate
        throw new Error(`High error rate under load: ${errorRate.toFixed(2)}%`);
      }
      
      this.testResults.performance.push({
        name: testName,
        status: 'passed',
        details: `Handled ${concurrentUsers} concurrent users successfully`,
        metrics: {
          totalRequests,
          duration: Math.round(duration),
          requestsPerSecond: Math.round(requestsPerSecond),
          errorRate: Math.round(errorRate * 100) / 100
        }
      });
      
    } catch (error) {
      this.testResults.performance.push({
        name: testName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Content Quality Testing
  async runContentQualityTests() {
    console.log('📝 Starting Content Quality Tests...');
    
    const qualityTestSuites = [
      this.testAIContentQuality,
      this.testContentModeration,
      this.testPlagiarismDetection,
      this.testExportQuality
    ];
    
    for (const testSuite of qualityTestSuites) {
      await testSuite.call(this);
    }
    
    return this.testResults.quality;
  }
  
  async testAIContentQuality() {
    const testName = 'AI Content Quality';
    
    try {
      console.log(`  Testing: ${testName}`);
      
      const testPrompts = [
        {
          prompt: 'Write the opening paragraph of a mystery novel.',
          genre: 'mystery',
          expectedLength: 100
        },
        {
          prompt: 'Create a self-help exercise for goal setting.',
          genre: 'self-help',
          expectedLength: 150
        }
      ];
      
      const aiService = await this.getAIService();
      
      for (const test of testPrompts) {
        const result = await aiService.generateContent({
          prompt: test.prompt,
          genre: test.genre,
          maxTokens: 500
        });
        
        // Check content length
        if (result.content.length < test.expectedLength) {
          throw new Error(`Generated content too short: ${result.content.length} < ${test.expectedLength}`);
        }
        
        // Check quality score
        if (result.qualityScore < 70) {
          throw new Error(`Quality score too low: ${result.qualityScore} < 70`);
        }
        
        // Check for genre appropriateness
        const genreKeywords = {
          mystery: ['mystery', 'detective', 'clue', 'investigate'],
          'self-help': ['goal', 'improve', 'success', 'achieve']
        };
        
        const keywords = genreKeywords[test.genre] || [];
        const hasGenreKeywords = keywords.some(keyword => 
          result.content.toLowerCase().includes(keyword)
        );
        
        if (!hasGenreKeywords && test.genre !== 'general') {
          console.warn(`Generated content may not be genre-appropriate for ${test.genre}`);
        }
      }
      
      this.testResults.quality.push({
        name: testName,
        status: 'passed',
        details: 'AI content quality meets standards'
      });
      
    } catch (error) {
      this.testResults.quality.push({
        name: testName,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Utility Methods
  async loginTestUser(page) {
    await page.goto(`${process.env.FRONTEND_URL}/login`);
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/app/dashboard');
  }
  
  async navigateToTestBook(page) {
    await page.goto(`${process.env.FRONTEND_URL}/app/books`);
    await page.click('[data-testid="first-book-link"]');
    await page.waitForSelector('[data-testid="book-editor"]');
  }
  
  async getTestApp() {
    // Return your Express app instance for testing
    const { default: app } = await import('../infrastructure/server-setup.js');
    return app;
  }
  
  async getTestAuthToken(email = 'test@example.com') {
    // Generate a test JWT token
    const jwt = await import('jsonwebtoken');
    return jwt.sign(
      { userId: 'test-user-id', email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  }
  
  async getAIService() {
    const { default: AIService } = await import('../services/ai-service.js');
    return new AIService();
  }
  
  async runTestSuite(browser, testSuite) {
    try {
      await testSuite.call(this, browser);
    } catch (error) {
      console.error(`Test suite failed: ${error.message}`);
    }
  }
  
  // Test Report Generation
  generateTestReport() {
    const allTests = [
      ...this.testResults.endToEnd,
      ...this.testResults.security,
      ...this.testResults.performance,
      ...this.testResults.quality || []
    ];
    
    const passed = allTests.filter(t => t.status === 'passed').length;
    const failed = allTests.filter(t => t.status === 'failed').length;
    const total = allTests.length;
    
    const report = {
      summary: {
        total,
        passed,
        failed,
        passRate: Math.round((passed / total) * 100),
        timestamp: new Date().toISOString()
      },
      categories: {
        endToEnd: this.testResults.endToEnd,
        security: this.testResults.security,
        performance: this.testResults.performance,
        quality: this.testResults.quality || []
      },
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    // Check for failed tests
    const failedTests = [
      ...this.testResults.endToEnd,
      ...this.testResults.security,
      ...this.testResults.performance
    ].filter(t => t.status === 'failed');
    
    if (failedTests.length > 0) {
      recommendations.push({
        type: 'critical',
        message: `${failedTests.length} tests failed and need immediate attention`,
        tests: failedTests.map(t => t.name)
      });
    }
    
    // Check performance issues
    const slowTests = this.testResults.performance.filter(t => 
      t.results && t.results.some(r => !r.passed)
    );
    
    if (slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        message: 'Some API endpoints are slower than expected',
        suggestion: 'Consider optimizing database queries and adding caching'
      });
    }
    
    // Check security
    const securityIssues = this.testResults.security.filter(t => t.status === 'failed');
    
    if (securityIssues.length > 0) {
      recommendations.push({
        type: 'security',
        message: 'Security vulnerabilities detected',
        suggestion: 'Address security issues before production deployment'
      });
    }
    
    return recommendations;
  }
  
  // Main test runner
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite...\n');
    
    const startTime = performance.now();
    
    try {
      // Initialize test results
      this.testResults = {
        endToEnd: [],
        security: [],
        performance: [],
        quality: []
      };
      
      // Run all test suites
      await this.runEndToEndTests();
      await this.runSecurityTests();
      await this.runPerformanceTests();
      await this.runContentQualityTests();
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.log(`\n✅ Test Suite Completed in ${duration}ms`);
      
      // Generate and return report
      const report = this.generateTestReport();
      
      console.log(`\n📊 Test Results:`);
      console.log(`   Total Tests: ${report.summary.total}`);
      console.log(`   Passed: ${report.summary.passed}`);
      console.log(`   Failed: ${report.summary.failed}`);
      console.log(`   Pass Rate: ${report.summary.passRate}%`);
      
      if (report.recommendations.length > 0) {
        console.log(`\n⚠️  Recommendations:`);
        report.recommendations.forEach(rec => {
          console.log(`   ${rec.type.toUpperCase()}: ${rec.message}`);
        });
      }
      
      return report;
      
    } catch (error) {
      console.error('Test suite execution failed:', error);
      throw error;
    }
  }
}

export default ComprehensiveTestingSuite;