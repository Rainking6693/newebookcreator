/**
 * Content & Publishing Services Integration
 * Plagiarism detection, market research, and publishing platform integrations
 */

import axios from 'axios';
import { Analytics } from '../models/Analytics.js';

class ContentServicesIntegration {
  constructor() {
    this.services = {
      copyscape: {
        apiUrl: 'https://www.copyscape.com/api/',
        username: process.env.COPYSCAPE_USERNAME,
        apiKey: process.env.COPYSCAPE_API_KEY
      },
      grammarly: {
        apiUrl: 'https://api.grammarly.com/v1',
        apiKey: process.env.GRAMMARLY_API_KEY
      },
      amazonKDP: {
        apiUrl: 'https://advertising-api.amazon.com',
        clientId: process.env.AMAZON_CLIENT_ID,
        clientSecret: process.env.AMAZON_CLIENT_SECRET,
        refreshToken: process.env.AMAZON_REFRESH_TOKEN
      },
      googleBooks: {
        apiUrl: 'https://www.googleapis.com/books/v1',
        apiKey: process.env.GOOGLE_BOOKS_API_KEY
      },
      sendgrid: {
        apiUrl: 'https://api.sendgrid.com/v3',
        apiKey: process.env.SENDGRID_API_KEY
      }
    };
  }
  
  // Plagiarism Detection
  async checkPlagiarism(content, userId) {
    try {
      // Use Copyscape API for plagiarism detection
      const response = await this.copyscapeCheck(content);
      
      // Track usage
      await this.trackUsage(userId, 'plagiarism_check', {
        contentLength: content.length,
        matches: response.matches?.length || 0,
        cost: response.cost || 0
      });
      
      return {
        isPlagiarized: response.matches && response.matches.length > 0,
        matches: response.matches || [],
        confidence: response.confidence || 0,
        summary: this.generatePlagiarismSummary(response)
      };
      
    } catch (error) {
      console.error('Plagiarism check failed:', error);
      throw error;
    }
  }
  
  async copyscapeCheck(content) {
    try {
      const params = new URLSearchParams({
        u: this.services.copyscape.username,
        k: this.services.copyscape.apiKey,
        o: 'csearch',
        t: content.substring(0, 10000), // Copyscape limit
        c: '1', // Include comparison text
        e: 'UTF-8'
      });
      
      const response = await axios.post(
        this.services.copyscape.apiUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return this.parseCopyscapeResponse(response.data);
      
    } catch (error) {
      console.error('Copyscape API error:', error);
      return { matches: [], confidence: 0 };
    }
  }
  
  parseCopyscapeResponse(responseText) {
    const lines = responseText.split('\n');
    const matches = [];
    let confidence = 0;
    
    for (const line of lines) {
      if (line.startsWith('http')) {
        const parts = line.split('\t');
        if (parts.length >= 4) {
          matches.push({
            url: parts[0],
            title: parts[1] || 'Unknown',
            percentage: parseInt(parts[2]) || 0,
            words: parseInt(parts[3]) || 0
          });
        }
      }
    }
    
    if (matches.length > 0) {
      confidence = Math.max(...matches.map(m => m.percentage));
    }
    
    return { matches, confidence };
  }
  
  generatePlagiarismSummary(response) {
    if (!response.matches || response.matches.length === 0) {
      return 'No plagiarism detected. Content appears to be original.';
    }
    
    const highMatches = response.matches.filter(m => m.percentage > 50);
    const mediumMatches = response.matches.filter(m => m.percentage > 20 && m.percentage <= 50);
    
    if (highMatches.length > 0) {
      return `High similarity detected with ${highMatches.length} source(s). Review required.`;
    } else if (mediumMatches.length > 0) {
      return `Moderate similarity detected with ${mediumMatches.length} source(s). Consider revision.`;
    } else {
      return `Low similarity detected with ${response.matches.length} source(s). Likely acceptable.`;
    }
  }
  
  // Grammar and Style Checking
  async checkGrammar(content, userId) {
    try {
      // Simplified grammar check - in production would use Grammarly API
      const issues = await this.grammarlyCheck(content);
      
      // Track usage
      await this.trackUsage(userId, 'grammar_check', {
        contentLength: content.length,
        issues: issues.length
      });
      
      return {
        issues,
        score: this.calculateGrammarScore(issues, content.length),
        suggestions: this.generateGrammarSuggestions(issues)
      };
      
    } catch (error) {
      console.error('Grammar check failed:', error);
      throw error;
    }
  }
  
  async grammarlyCheck(content) {
    // Mock implementation - replace with actual Grammarly API
    const issues = [];
    
    // Simple checks for demonstration
    const sentences = content.split(/[.!?]+/);
    
    sentences.forEach((sentence, index) => {
      // Check for passive voice
      if (sentence.match(/\b(was|were|been|being)\s+\w+ed\b/)) {
        issues.push({
          type: 'style',
          category: 'passive_voice',
          message: 'Consider using active voice',
          position: content.indexOf(sentence),
          length: sentence.length,
          severity: 'medium'
        });
      }
      
      // Check for long sentences
      if (sentence.split(' ').length > 25) {
        issues.push({
          type: 'readability',
          category: 'long_sentence',
          message: 'Consider breaking this long sentence into shorter ones',
          position: content.indexOf(sentence),
          length: sentence.length,
          severity: 'low'
        });
      }
      
      // Check for repeated words
      const words = sentence.toLowerCase().split(/\s+/);
      const wordCounts = {};
      words.forEach(word => {
        if (word.length > 3) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
      
      Object.entries(wordCounts).forEach(([word, count]) => {
        if (count > 2) {
          issues.push({
            type: 'style',
            category: 'repetition',
            message: `The word "${word}" is repeated ${count} times in this sentence`,
            position: content.indexOf(sentence),
            length: sentence.length,
            severity: 'medium'
          });
        }
      });
    });
    
    return issues;
  }
  
  calculateGrammarScore(issues, contentLength) {
    const baseScore = 100;
    const deductions = {
      high: 10,
      medium: 5,
      low: 2
    };
    
    let totalDeduction = 0;
    issues.forEach(issue => {
      totalDeduction += deductions[issue.severity] || 2;
    });
    
    // Normalize by content length (per 1000 characters)
    const normalizedDeduction = (totalDeduction / contentLength) * 1000;
    
    return Math.max(0, Math.min(100, baseScore - normalizedDeduction));
  }
  
  generateGrammarSuggestions(issues) {
    const suggestions = [];
    const categories = {};
    
    // Group issues by category
    issues.forEach(issue => {
      if (!categories[issue.category]) {
        categories[issue.category] = [];
      }
      categories[issue.category].push(issue);
    });
    
    // Generate category-specific suggestions
    Object.entries(categories).forEach(([category, categoryIssues]) => {
      switch (category) {
        case 'passive_voice':
          suggestions.push({
            category: 'Style',
            suggestion: `Found ${categoryIssues.length} instances of passive voice. Consider rewriting in active voice for more engaging prose.`,
            priority: 'medium'
          });
          break;
        case 'long_sentence':
          suggestions.push({
            category: 'Readability',
            suggestion: `${categoryIssues.length} sentences are quite long. Breaking them into shorter sentences can improve readability.`,
            priority: 'low'
          });
          break;
        case 'repetition':
          suggestions.push({
            category: 'Style',
            suggestion: `Some words are repeated frequently. Consider using synonyms to add variety to your writing.`,
            priority: 'medium'
          });
          break;
      }
    });
    
    return suggestions;
  }
  
  // Market Research Integration
  async researchMarketTrends(genre, keywords = []) {
    try {
      const [googleTrends, amazonData] = await Promise.all([
        this.getGoogleBooksTrends(genre, keywords),
        this.getAmazonMarketData(genre, keywords)
      ]);
      
      return {
        trends: this.combineTrendData(googleTrends, amazonData),
        keywords: this.extractTrendingKeywords(googleTrends, amazonData),
        opportunities: this.identifyMarketOpportunities(googleTrends, amazonData)
      };
      
    } catch (error) {
      console.error('Market research failed:', error);
      throw error;
    }
  }
  
  async getGoogleBooksTrends(genre, keywords) {
    try {
      const searchQueries = [genre, ...keywords];
      const trends = [];
      
      for (const query of searchQueries) {
        const response = await axios.get(`${this.services.googleBooks.apiUrl}/volumes`, {
          params: {
            q: `subject:${query}`,
            orderBy: 'newest',
            maxResults: 40,
            key: this.services.googleBooks.apiKey
          }
        });
        
        if (response.data.items) {
          trends.push({
            query,
            totalItems: response.data.totalItems,
            books: response.data.items.map(item => ({
              title: item.volumeInfo.title,
              authors: item.volumeInfo.authors || [],
              publishedDate: item.volumeInfo.publishedDate,
              categories: item.volumeInfo.categories || [],
              averageRating: item.volumeInfo.averageRating || 0,
              ratingsCount: item.volumeInfo.ratingsCount || 0
            }))
          });
        }
      }
      
      return trends;
      
    } catch (error) {
      console.error('Google Books API error:', error);
      return [];
    }
  }
  
  async getAmazonMarketData(genre, keywords) {
    // Mock implementation - would require Amazon Product Advertising API
    return {
      bestsellers: [
        {
          title: 'Sample Mystery Novel',
          author: 'John Doe',
          rank: 1,
          category: 'Mystery & Thrillers',
          price: 9.99,
          rating: 4.5,
          reviews: 1234
        }
      ],
      categories: [
        {
          name: 'Cozy Mystery',
          growth: 15.2,
          competition: 'medium'
        }
      ]
    };
  }
  
  combineTrendData(googleTrends, amazonData) {
    // Combine and analyze trend data from multiple sources
    const combined = [];
    
    googleTrends.forEach(trend => {
      const recentBooks = trend.books.filter(book => {
        const publishYear = new Date(book.publishedDate).getFullYear();
        return publishYear >= new Date().getFullYear() - 2;
      });
      
      combined.push({
        keyword: trend.query,
        totalBooks: trend.totalItems,
        recentBooks: recentBooks.length,
        averageRating: recentBooks.reduce((sum, book) => sum + book.averageRating, 0) / recentBooks.length || 0,
        growth: this.calculateGrowthTrend(trend.books)
      });
    });
    
    return combined;
  }
  
  calculateGrowthTrend(books) {
    const currentYear = new Date().getFullYear();
    const thisYear = books.filter(book => new Date(book.publishedDate).getFullYear() === currentYear).length;
    const lastYear = books.filter(book => new Date(book.publishedDate).getFullYear() === currentYear - 1).length;
    
    if (lastYear === 0) return 0;
    return ((thisYear - lastYear) / lastYear) * 100;
  }
  
  extractTrendingKeywords(googleTrends, amazonData) {
    const keywords = new Map();
    
    // Extract from Google Books categories
    googleTrends.forEach(trend => {
      trend.books.forEach(book => {
        book.categories.forEach(category => {
          const key = category.toLowerCase();
          keywords.set(key, (keywords.get(key) || 0) + 1);
        });
      });
    });
    
    // Convert to sorted array
    return Array.from(keywords.entries())
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  }
  
  identifyMarketOpportunities(googleTrends, amazonData) {
    const opportunities = [];
    
    // Look for high-growth, low-competition areas
    googleTrends.forEach(trend => {
      const growth = this.calculateGrowthTrend(trend.books);
      const competition = trend.totalItems;
      
      if (growth > 20 && competition < 1000) {
        opportunities.push({
          type: 'high_growth_low_competition',
          keyword: trend.query,
          growth: `${growth.toFixed(1)}%`,
          competition: 'Low',
          description: `${trend.query} shows strong growth with relatively low competition`
        });
      }
    });
    
    return opportunities;
  }
  
  // Email Marketing Integration
  async sendEmail(to, templateId, templateData) {
    try {
      const response = await axios.post(
        `${this.services.sendgrid.apiUrl}/mail/send`,
        {
          from: {
            email: process.env.FROM_EMAIL || 'noreply@ai-ebook-platform.com',
            name: 'AI Ebook Platform'
          },
          personalizations: [{
            to: [{ email: to }],
            dynamic_template_data: templateData
          }],
          template_id: templateId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.services.sendgrid.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true, messageId: response.headers['x-message-id'] };
      
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }
  
  async sendWelcomeEmail(userEmail, userName) {
    return await this.sendEmail(userEmail, 'd-welcome-template-id', {
      user_name: userName,
      login_url: `${process.env.FRONTEND_URL}/login`
    });
  }
  
  async sendTrialEndingEmail(userEmail, userName, daysLeft) {
    return await this.sendEmail(userEmail, 'd-trial-ending-template-id', {
      user_name: userName,
      days_left: daysLeft,
      upgrade_url: `${process.env.FRONTEND_URL}/app/settings/billing`
    });
  }
  
  async sendPaymentFailedEmail(userEmail, userName, amount) {
    return await this.sendEmail(userEmail, 'd-payment-failed-template-id', {
      user_name: userName,
      amount: amount,
      update_payment_url: `${process.env.FRONTEND_URL}/app/settings/billing`
    });
  }
  
  // Analytics and Tracking
  async trackUsage(userId, serviceType, data) {
    try {
      await Analytics.create({
        userId,
        eventType: 'service_usage',
        eventData: {
          service: serviceType,
          ...data
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track service usage:', error);
    }
  }
  
  // Content Quality Assessment
  async assessContentQuality(content, genre) {
    try {
      const [grammarCheck, readabilityScore] = await Promise.all([
        this.checkGrammar(content, null),
        this.calculateReadabilityScore(content)
      ]);
      
      const qualityScore = this.calculateOverallQualityScore(
        grammarCheck.score,
        readabilityScore,
        content,
        genre
      );
      
      return {
        overallScore: qualityScore,
        grammarScore: grammarCheck.score,
        readabilityScore,
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
        issues: grammarCheck.issues,
        suggestions: grammarCheck.suggestions,
        genreAlignment: this.assessGenreAlignment(content, genre)
      };
      
    } catch (error) {
      console.error('Content quality assessment failed:', error);
      throw error;
    }
  }
  
  calculateReadabilityScore(content) {
    // Flesch Reading Ease score
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);
    
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, score));
  }
  
  countSyllables(text) {
    // Simple syllable counting
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .replace(/[^a]/g, '')
      .length || 1;
  }
  
  calculateOverallQualityScore(grammarScore, readabilityScore, content, genre) {
    let score = (grammarScore * 0.4) + (readabilityScore * 0.3);
    
    // Genre-specific adjustments
    if (genre === 'mystery') {
      // Check for dialogue
      const dialogueRatio = (content.match(/"/g) || []).length / content.length;
      score += dialogueRatio * 100 * 0.1; // Up to 10 points for dialogue
      
      // Check for suspense words
      const suspenseWords = ['mysterious', 'suspicious', 'clue', 'evidence', 'investigate'];
      const suspenseCount = suspenseWords.reduce((count, word) => {
        return count + (content.toLowerCase().match(new RegExp(word, 'g')) || []).length;
      }, 0);
      score += Math.min(suspenseCount * 2, 10); // Up to 10 points for suspense
    }
    
    // Length bonus
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 500) {
      score += Math.min((wordCount - 500) / 100, 10); // Up to 10 points for length
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  assessGenreAlignment(content, genre) {
    const genreKeywords = {
      mystery: ['detective', 'clue', 'suspect', 'investigate', 'murder', 'crime', 'evidence'],
      'self-help': ['improve', 'success', 'goal', 'achieve', 'develop', 'growth', 'strategy']
    };
    
    const keywords = genreKeywords[genre] || [];
    const contentLower = content.toLowerCase();
    
    const foundKeywords = keywords.filter(keyword => 
      contentLower.includes(keyword)
    );
    
    const alignment = (foundKeywords.length / keywords.length) * 100;
    
    return {
      score: alignment,
      foundKeywords,
      suggestions: alignment < 50 ? 
        `Consider including more ${genre}-specific elements and terminology` : 
        `Good alignment with ${genre} genre conventions`
    };
  }
}

export default ContentServicesIntegration;