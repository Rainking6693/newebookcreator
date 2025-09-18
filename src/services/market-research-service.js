/**
 * Market Research Service
 * Provides market insights, trend analysis, and competitive research
 */

import axios from 'axios';
import { Analytics } from '../models/Analytics.js';
import { Book } from '../models/Book.js';

class MarketResearchService {
  constructor() {
    this.amazonAPI = {
      baseUrl: 'https://webservices.amazon.com/paapi5',
      accessKey: process.env.AMAZON_ACCESS_KEY,
      secretKey: process.env.AMAZON_SECRET_KEY,
      partnerTag: process.env.AMAZON_PARTNER_TAG
    };
    
    this.googleBooksAPI = {
      baseUrl: 'https://www.googleapis.com/books/v1',
      apiKey: process.env.GOOGLE_BOOKS_API_KEY
    };
    
    this.trendingKeywords = new Map();
    this.marketData = new Map();
    this.lastUpdate = new Map();
  }
  
  // Trend Analysis
  async analyzeTrends(genre, timeframe = '30d') {
    try {
      const cacheKey = `trends_${genre}_${timeframe}`;
      
      // Check cache
      if (this.isCacheValid(cacheKey)) {
        return this.marketData.get(cacheKey);
      }
      
      // Gather trend data from multiple sources
      const [amazonTrends, googleTrends, internalTrends] = await Promise.all([
        this.getAmazonTrends(genre, timeframe),
        this.getGoogleBooksTrends(genre, timeframe),
        this.getInternalTrends(genre, timeframe)
      ]);
      
      // Combine and analyze trends
      const trendAnalysis = {
        genre,
        timeframe,
        generatedAt: new Date(),
        
        popularTopics: this.extractPopularTopics([
          ...amazonTrends.topics,
          ...googleTrends.topics,
          ...internalTrends.topics
        ]),
        
        keywordTrends: this.analyzeKeywordTrends([
          ...amazonTrends.keywords,
          ...googleTrends.keywords
        ]),
        
        marketGrowth: this.calculateMarketGrowth(amazonTrends, googleTrends),
        
        competitiveAnalysis: {
          topBooks: amazonTrends.topBooks,
          averagePrice: this.calculateAveragePrice(amazonTrends.topBooks),
          priceRange: this.calculatePriceRange(amazonTrends.topBooks),
          averageLength: this.calculateAverageLength(amazonTrends.topBooks)
        },
        
        opportunities: this.identifyOpportunities(amazonTrends, googleTrends, internalTrends),
        
        recommendations: this.generateRecommendations(genre, amazonTrends, googleTrends)
      };
      
      // Cache results
      this.marketData.set(cacheKey, trendAnalysis);
      this.lastUpdate.set(cacheKey, new Date());
      
      return trendAnalysis;
      
    } catch (error) {
      console.error('Trend analysis failed:', error);
      throw error;
    }
  }
  
  async getAmazonTrends(genre, timeframe) {
    try {
      // Simulate Amazon Product Advertising API call
      // In production, this would use the actual Amazon API
      
      const searchTerms = this.getGenreSearchTerms(genre);
      const trends = {
        topics: [],
        keywords: [],
        topBooks: []
      };
      
      for (const term of searchTerms) {
        // Mock API response - replace with actual Amazon API call
        const mockData = this.generateMockAmazonData(term, genre);
        
        trends.topics.push(...mockData.topics);
        trends.keywords.push(...mockData.keywords);
        trends.topBooks.push(...mockData.books);
      }
      
      return trends;
      
    } catch (error) {
      console.error('Amazon trends retrieval failed:', error);
      return { topics: [], keywords: [], topBooks: [] };
    }
  }
  
  async getGoogleBooksTrends(genre, timeframe) {
    try {
      const searchQueries = this.getGenreSearchTerms(genre);
      const trends = {
        topics: [],
        keywords: []
      };
      
      for (const query of searchQueries) {
        const response = await axios.get(`${this.googleBooksAPI.baseUrl}/volumes`, {
          params: {
            q: `subject:${query}`,
            orderBy: 'newest',
            maxResults: 40,
            key: this.googleBooksAPI.apiKey
          }
        });
        
        if (response.data.items) {
          const books = response.data.items;
          
          // Extract topics from book descriptions
          const topics = this.extractTopicsFromBooks(books);
          trends.topics.push(...topics);
          
          // Extract keywords from titles
          const keywords = this.extractKeywordsFromTitles(books);
          trends.keywords.push(...keywords);
        }
      }
      
      return trends;
      
    } catch (error) {
      console.error('Google Books trends retrieval failed:', error);
      return { topics: [], keywords: [] };
    }
  }
  
  async getInternalTrends(genre, timeframe) {
    try {
      const startDate = this.getTimeframeStart(timeframe);
      
      // Analyze internal book data
      const books = await Book.find({
        genre,
        createdAt: { $gte: startDate },
        status: { $ne: 'deleted' }
      });
      
      const topics = [];
      const keywords = [];
      
      books.forEach(book => {
        // Extract topics from descriptions and outlines
        if (book.metadata.description) {
          topics.push(...this.extractTopicsFromText(book.metadata.description));
        }
        
        if (book.structure.outline) {
          topics.push(...this.extractTopicsFromText(book.structure.outline));
        }
        
        // Extract keywords from titles
        keywords.push(...this.extractKeywordsFromText(book.title));
      });
      
      return {
        topics: this.rankTopics(topics),
        keywords: this.rankKeywords(keywords),
        totalBooks: books.length
      };
      
    } catch (error) {
      console.error('Internal trends analysis failed:', error);
      return { topics: [], keywords: [], totalBooks: 0 };
    }
  }
  
  // Keyword Research
  async researchKeywords(topic, genre) {
    try {
      const keywords = await this.getKeywordSuggestions(topic, genre);
      const analysis = [];
      
      for (const keyword of keywords) {
        const metrics = await this.analyzeKeyword(keyword, genre);
        analysis.push({
          keyword,
          ...metrics
        });
      }
      
      // Sort by opportunity score
      analysis.sort((a, b) => b.opportunityScore - a.opportunityScore);
      
      return {
        topic,
        genre,
        keywords: analysis,
        generatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Keyword research failed:', error);
      throw error;
    }
  }
  
  async getKeywordSuggestions(topic, genre) {
    const baseKeywords = [topic];
    const suggestions = new Set(baseKeywords);
    
    // Add genre-specific variations
    const genreModifiers = this.getGenreModifiers(genre);
    genreModifiers.forEach(modifier => {
      suggestions.add(`${topic} ${modifier}`);
      suggestions.add(`${modifier} ${topic}`);
    });
    
    // Add common book-related terms
    const bookTerms = ['book', 'guide', 'handbook', 'manual', 'story'];
    bookTerms.forEach(term => {
      suggestions.add(`${topic} ${term}`);
    });
    
    // Add question-based keywords
    const questionWords = ['how to', 'what is', 'why', 'when', 'where'];
    questionWords.forEach(question => {
      suggestions.add(`${question} ${topic}`);
    });
    
    return Array.from(suggestions);
  }
  
  async analyzeKeyword(keyword, genre) {
    try {
      // Get search volume and competition data
      const searchData = await this.getKeywordSearchData(keyword);
      const competitionData = await this.getKeywordCompetition(keyword, genre);
      
      // Calculate opportunity score
      const opportunityScore = this.calculateOpportunityScore(searchData, competitionData);
      
      return {
        searchVolume: searchData.volume,
        competition: competitionData.level,
        competitorCount: competitionData.count,
        averagePrice: competitionData.averagePrice,
        opportunityScore,
        difficulty: this.calculateDifficulty(searchData, competitionData),
        recommendations: this.generateKeywordRecommendations(keyword, searchData, competitionData)
      };
      
    } catch (error) {
      console.error(`Keyword analysis failed for "${keyword}":`, error);
      return {
        searchVolume: 0,
        competition: 'unknown',
        competitorCount: 0,
        opportunityScore: 0,
        difficulty: 'unknown'
      };
    }
  }
  
  // Competitive Analysis
  async analyzeCompetitors(genre, topic = null) {
    try {
      const competitors = await this.findCompetitors(genre, topic);
      const analysis = [];
      
      for (const competitor of competitors) {
        const competitorAnalysis = await this.analyzeCompetitor(competitor);
        analysis.push(competitorAnalysis);
      }
      
      return {
        genre,
        topic,
        competitors: analysis,
        summary: this.generateCompetitiveSummary(analysis),
        opportunities: this.identifyCompetitiveOpportunities(analysis),
        generatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Competitive analysis failed:', error);
      throw error;
    }
  }
  
  async findCompetitors(genre, topic) {
    try {
      const searchQuery = topic ? `${genre} ${topic}` : genre;
      
      // Search Google Books for competitors
      const response = await axios.get(`${this.googleBooksAPI.baseUrl}/volumes`, {
        params: {
          q: searchQuery,
          orderBy: 'relevance',
          maxResults: 20,
          key: this.googleBooksAPI.apiKey
        }
      });
      
      if (!response.data.items) {
        return [];
      }
      
      return response.data.items.map(item => ({
        id: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || ['Unknown'],
        description: item.volumeInfo.description || '',
        pageCount: item.volumeInfo.pageCount || 0,
        publishedDate: item.volumeInfo.publishedDate,
        categories: item.volumeInfo.categories || [],
        averageRating: item.volumeInfo.averageRating || 0,
        ratingsCount: item.volumeInfo.ratingsCount || 0,
        saleInfo: item.saleInfo || {}
      }));
      
    } catch (error) {
      console.error('Competitor finding failed:', error);
      return [];
    }
  }
  
  async analyzeCompetitor(competitor) {
    return {
      title: competitor.title,
      authors: competitor.authors,
      
      // Content analysis
      wordCount: this.estimateWordCount(competitor.pageCount),
      topics: this.extractTopicsFromText(competitor.description),
      
      // Market performance
      rating: competitor.averageRating,
      reviewCount: competitor.ratingsCount,
      price: this.extractPrice(competitor.saleInfo),
      
      // Competitive metrics
      strengths: this.identifyStrengths(competitor),
      weaknesses: this.identifyWeaknesses(competitor),
      
      // Opportunity assessment
      gapAnalysis: this.analyzeContentGaps(competitor),
      improvementOpportunities: this.identifyImprovementOpportunities(competitor)
    };
  }
  
  // Market Opportunities
  async identifyOpportunities(genre, filters = {}) {
    try {
      const [trends, keywords, competitors] = await Promise.all([
        this.analyzeTrends(genre),
        this.researchKeywords(filters.topic || genre, genre),
        this.analyzeCompetitors(genre, filters.topic)
      ]);
      
      const opportunities = [];
      
      // Trending topic opportunities
      trends.popularTopics.forEach(topic => {
        if (topic.growth > 20) { // 20% growth threshold
          opportunities.push({
            type: 'trending_topic',
            topic: topic.name,
            description: `${topic.name} is trending with ${topic.growth}% growth`,
            potential: 'high',
            difficulty: 'medium',
            timeframe: 'short-term'
          });
        }
      });
      
      // Keyword opportunities
      keywords.keywords.forEach(keyword => {
        if (keyword.opportunityScore > 70) {
          opportunities.push({
            type: 'keyword_opportunity',
            keyword: keyword.keyword,
            description: `High opportunity keyword with ${keyword.searchVolume} monthly searches`,
            potential: 'high',
            difficulty: keyword.difficulty,
            timeframe: 'medium-term'
          });
        }
      });
      
      // Market gap opportunities
      const gaps = this.identifyMarketGaps(competitors.competitors);
      gaps.forEach(gap => {
        opportunities.push({
          type: 'market_gap',
          gap: gap.area,
          description: gap.description,
          potential: gap.potential,
          difficulty: 'low',
          timeframe: 'long-term'
        });
      });
      
      // Sort by potential and difficulty
      opportunities.sort((a, b) => {
        const scoreA = this.calculateOpportunityPriority(a);
        const scoreB = this.calculateOpportunityPriority(b);
        return scoreB - scoreA;
      });
      
      return {
        genre,
        opportunities: opportunities.slice(0, 10), // Top 10 opportunities
        summary: this.generateOpportunitySummary(opportunities),
        generatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Opportunity identification failed:', error);
      throw error;
    }
  }
  
  // Utility Methods
  getGenreSearchTerms(genre) {
    const terms = {
      mystery: [
        'mystery', 'detective', 'crime', 'thriller', 'suspense',
        'cozy mystery', 'police procedural', 'amateur sleuth'
      ],
      'self-help': [
        'self help', 'personal development', 'productivity', 'wellness',
        'motivation', 'success', 'habits', 'mindfulness', 'leadership'
      ]
    };
    
    return terms[genre] || [genre];
  }
  
  getGenreModifiers(genre) {
    const modifiers = {
      mystery: ['cozy', 'hard-boiled', 'psychological', 'historical', 'paranormal'],
      'self-help': ['practical', 'ultimate', 'complete', 'essential', 'proven']
    };
    
    return modifiers[genre] || [];
  }
  
  extractTopicsFromBooks(books) {
    const topics = [];
    
    books.forEach(book => {
      if (book.volumeInfo.description) {
        topics.push(...this.extractTopicsFromText(book.volumeInfo.description));
      }
      
      if (book.volumeInfo.categories) {
        topics.push(...book.volumeInfo.categories);
      }
    });
    
    return this.rankTopics(topics);
  }
  
  extractTopicsFromText(text) {
    if (!text) return [];
    
    // Simple topic extraction - in production would use NLP
    const commonTopics = [
      'love', 'death', 'family', 'friendship', 'betrayal', 'revenge',
      'success', 'failure', 'growth', 'change', 'leadership', 'productivity',
      'health', 'wealth', 'happiness', 'relationships', 'career', 'business'
    ];
    
    const foundTopics = [];
    const lowerText = text.toLowerCase();
    
    commonTopics.forEach(topic => {
      if (lowerText.includes(topic)) {
        foundTopics.push(topic);
      }
    });
    
    return foundTopics;
  }
  
  extractKeywordsFromTitles(books) {
    const keywords = [];
    
    books.forEach(book => {
      if (book.volumeInfo.title) {
        keywords.push(...this.extractKeywordsFromText(book.volumeInfo.title));
      }
    });
    
    return this.rankKeywords(keywords);
  }
  
  extractKeywordsFromText(text) {
    if (!text) return [];
    
    // Simple keyword extraction
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
  }
  
  isStopWord(word) {
    const stopWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
      'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy',
      'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'way', 'will'
    ];
    
    return stopWords.includes(word);
  }
  
  rankTopics(topics) {
    const topicCounts = {};
    
    topics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    return Object.entries(topicCounts)
      .map(([name, count]) => ({ name, count, growth: Math.random() * 50 })) // Mock growth
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
  
  rankKeywords(keywords) {
    const keywordCounts = {};
    
    keywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
    
    return Object.entries(keywordCounts)
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50);
  }
  
  isCacheValid(cacheKey, maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const lastUpdate = this.lastUpdate.get(cacheKey);
    return lastUpdate && (Date.now() - lastUpdate.getTime()) < maxAge;
  }
  
  getTimeframeStart(timeframe) {
    const now = new Date();
    
    switch (timeframe) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
  
  // Mock data generators (replace with real API calls in production)
  generateMockAmazonData(term, genre) {
    return {
      topics: [
        { name: `${term} trends`, count: Math.floor(Math.random() * 100) },
        { name: `${term} analysis`, count: Math.floor(Math.random() * 80) }
      ],
      keywords: [
        { keyword: `${term} book`, frequency: Math.floor(Math.random() * 50) },
        { keyword: `${term} guide`, frequency: Math.floor(Math.random() * 40) }
      ],
      books: [
        {
          title: `The Ultimate ${term} Guide`,
          price: 9.99 + Math.random() * 20,
          rating: 3.5 + Math.random() * 1.5,
          reviews: Math.floor(Math.random() * 1000),
          pages: 200 + Math.floor(Math.random() * 300)
        }
      ]
    };
  }
  
  calculateOpportunityScore(searchData, competitionData) {
    const volumeScore = Math.min(searchData.volume / 1000, 100);
    const competitionScore = 100 - (competitionData.count * 2);
    
    return Math.max(0, (volumeScore + competitionScore) / 2);
  }
  
  async getKeywordSearchData(keyword) {
    // Mock implementation - replace with real search volume API
    return {
      volume: Math.floor(Math.random() * 10000) + 100
    };
  }
  
  async getKeywordCompetition(keyword, genre) {
    // Mock implementation - replace with real competition analysis
    return {
      level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      count: Math.floor(Math.random() * 100),
      averagePrice: 5 + Math.random() * 20
    };
  }
}

export default MarketResearchService;