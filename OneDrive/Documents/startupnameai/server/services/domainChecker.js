const axios = require('axios');
const { logger } = require('../middleware/errorHandler');

class DomainChecker {
  constructor() {
    this.apis = [
      {
        name: 'namecheap',
        key: process.env.NAMECHEAP_API_KEY,
        endpoint: 'https://api.namecheap.com/xml.response'
      },
      {
        name: 'godaddy',
        key: process.env.GODADDY_API_KEY,
        secret: process.env.GODADDY_SECRET,
        endpoint: 'https://api.godaddy.com/v1/domains/available'
      }
    ];
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  // Master-level domain availability checking with multiple APIs and caching
  async checkAvailability(name) {
    const sanitizedName = this.sanitizeDomainName(name);
    const extensions = ['.com', '.ai', '.io', '.org', '.net'];
    
    const results = {
      primary_domain: `${sanitizedName}.com`,
      available: {},
      prices: {},
      recommendations: [],
      checked_at: new Date().toISOString()
    };

    try {
      for (const ext of extensions) {
        const domain = `${sanitizedName}${ext}`;
        const availability = await this.checkSingleDomain(domain);
        
        results.available[ext] = availability.available;
        if (availability.price) {
          results.prices[ext] = availability.price;
        }
      }

      // Generate intelligent recommendations
      results.recommendations = this.generateDomainRecommendations(results, sanitizedName);
      
      logger.info(`Domain check completed for: ${sanitizedName}`);
      return results;

    } catch (error) {
      logger.error(`Domain checking failed for ${sanitizedName}: ${error.message}`);
      return {
        ...results,
        error: true,
        message: 'Domain checking temporarily unavailable'
      };
    }
  }

  async checkSingleDomain(domain) {
    // Check cache first
    const cacheKey = domain.toLowerCase();
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Try primary API (GoDaddy)
      const result = await this.checkWithGoDaddy(domain);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
      
    } catch (error) {
      // Fallback to secondary API or basic check
      logger.warn(`Primary domain API failed for ${domain}: ${error.message}`);
      return await this.fallbackDomainCheck(domain);
    }
  }

  async checkWithGoDaddy(domain) {
    if (!process.env.GODADDY_API_KEY) {
      throw new Error('GoDaddy API key not configured');
    }

    const response = await axios.get(
      `https://api.godaddy.com/v1/domains/available?domain=${domain}`,
      {
        headers: {
          'Authorization': `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_SECRET}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return {
      available: response.data.available,
      price: response.data.price ? response.data.price / 1000000 : null, // Convert from micro-units
      currency: response.data.currency || 'USD',
      api_source: 'godaddy'
    };
  }

  async fallbackDomainCheck(domain) {
    // Basic DNS lookup as fallback
    try {
      const dns = require('dns').promises;
      await dns.resolve(domain);
      
      return {
        available: false,
        api_source: 'dns_fallback',
        note: 'Verified via DNS resolution'
      };
    } catch (error) {
      return {
        available: true,
        api_source: 'dns_fallback',
        confidence: 'medium',
        note: 'No DNS record found - likely available'
      };
    }
  }

  sanitizeDomainName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 63); // Domain label max length
  }

  generateDomainRecommendations(results, baseName) {
    const recommendations = [];
    
    // Check if .com is available
    if (results.available['.com']) {
      recommendations.push({
        priority: 'high',
        message: `.com domain is available - highly recommended for credibility`,
        action: `Secure ${baseName}.com immediately`
      });
    } else {
      // Suggest alternatives
      const availableExts = Object.keys(results.available)
        .filter(ext => results.available[ext]);
      
      if (availableExts.includes('.ai')) {
        recommendations.push({
          priority: 'high',
          message: '.ai domain perfect for AI startup - premium but brandable',
          action: `Consider ${baseName}.ai for tech credibility`
        });
      }
      
      if (availableExts.includes('.io')) {
        recommendations.push({
          priority: 'medium',
          message: '.io popular with tech startups and developers',
          action: `${baseName}.io could work for tech-focused audience`
        });
      }
      
      if (!availableExts.length) {
        recommendations.push({
          priority: 'high',
          message: 'Consider modifying the name - no major extensions available',
          action: 'Try adding prefix/suffix or using variation of the name'
        });
      }
    }

    // Price warnings
    Object.keys(results.prices).forEach(ext => {
      const price = results.prices[ext];
      if (price > 100) {
        recommendations.push({
          priority: 'low',
          message: `${ext} domain is premium priced at $${price}`,
          action: 'Consider if premium pricing aligns with budget'
        });
      }
    });

    return recommendations;
  }

  // Batch domain checking for multiple names
  async batchCheck(names) {
    const results = [];
    const batchSize = 5; // Prevent API rate limiting
    
    for (let i = 0; i < names.length; i += batchSize) {
      const batch = names.slice(i, i + batchSize);
      const batchPromises = batch.map(name => this.checkAvailability(name));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + batchSize < names.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error(`Batch domain check failed: ${error.message}`);
        // Add error results for failed batch
        batch.forEach(name => {
          results.push({
            primary_domain: `${name}.com`,
            error: true,
            message: 'Batch check failed'
          });
        });
      }
    }
    
    return results;
  }

  // Clean up expired cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new DomainChecker();