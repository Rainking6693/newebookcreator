const { openai, NAMING_PROMPTS } = require('../config/openai');
const { logger } = require('../middleware/errorHandler');
const domainChecker = require('./domainChecker');

class NameGenerator {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxRetries = 3;
    this.timeout = 30000; // 30 seconds
  }

  // Master-level prompt engineering for startup names
  buildPrompt(keywords, industry, style, count) {
    const basePrompt = NAMING_PROMPTS.general;
    const industryContext = NAMING_PROMPTS.industries[industry] || '';
    const styleContext = NAMING_PROMPTS.styles[style] || '';

    return `${basePrompt}

CONTEXT:
- Keywords: ${keywords.join(', ')}
- Industry: ${industry}
- Style: ${style}
- Industry focus: ${industryContext}
- Style approach: ${styleContext}

Generate exactly ${count} startup names. For each name, provide:
1. The name itself
2. A brief explanation (1-2 sentences) of why it works
3. A brandability score (1-10)
4. Potential concerns or considerations

Format as JSON array with objects containing: name, explanation, brandability_score, concerns

Remember: Prioritize names likely to have .com domain availability.`;
  }

  // Advanced AI name generation with retry logic and error handling
  async generateNames(params) {
    const { keywords, industry = 'tech', style = 'modern', count = 50 } = params;
    
    try {
      logger.info(`Starting name generation: ${keywords.join(', ')} | ${industry} | ${style} | ${count}`);
      
      const prompt = this.buildPrompt(keywords, industry, style, count);
      
      const response = await this.callOpenAI(prompt);
      const names = this.parseAIResponse(response);
      
      // Enhance each name with domain checking and additional analysis
      const enhancedNames = await this.enhanceNames(names);
      
      logger.info(`Successfully generated ${enhancedNames.length} names`);
      return enhancedNames;
      
    } catch (error) {
      logger.error(`Name generation failed: ${error.message}`);
      throw error;
    }
  }

  // Master-level OpenAI API integration with retry logic
  async callOpenAI(prompt, retryCount = 0) {
    try {
      const response = await Promise.race([
        openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a world-class startup naming consultant with 20+ years of experience.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.8,
          response_format: { type: 'json_object' }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI timeout')), this.timeout))
      ]);

      return response.choices[0].message.content;
      
    } catch (error) {
      if (retryCount < this.maxRetries) {
        logger.warn(`OpenAI retry ${retryCount + 1}/${this.maxRetries}: ${error.message}`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.callOpenAI(prompt, retryCount + 1);
      }
      throw error;
    }
  }

  // Parse and validate AI response
  parseAIResponse(response) {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : parsed.names || [];
    } catch (error) {
      logger.error(`Failed to parse AI response: ${error.message}`);
      // Fallback parsing for non-JSON responses
      return this.fallbackParse(response);
    }
  }

  // Enhanced name analysis with domain checking and brandability scoring
  async enhanceNames(names) {
    const enhanced = [];
    
    for (const name of names) {
      try {
        const domainInfo = await domainChecker.checkAvailability(name.name);
        const brandabilityAnalysis = this.analyzeBrandability(name.name);
        
        enhanced.push({
          ...name,
          domain_info: domainInfo,
          brandability_analysis: brandabilityAnalysis,
          seo_potential: this.calculateSEOPotential(name.name),
          trademark_risk: this.assessTrademarkRisk(name.name),
          generated_at: new Date().toISOString()
        });
      } catch (error) {
        logger.warn(`Failed to enhance name '${name.name}': ${error.message}`);
        enhanced.push({
          ...name,
          domain_info: { available: false, error: true },
          brandability_analysis: this.analyzeBrandability(name.name)
        });
      }
    }
    
    return enhanced.sort((a, b) => b.brandability_score - a.brandability_score);
  }

  // Master-level brandability analysis algorithm
  analyzeBrandability(name) {
    const analysis = {
      length_score: this.scoreLengh(name),
      pronunciation_score: this.scorePronunciation(name),
      memorability_score: this.scoreMemorability(name),
      uniqueness_score: this.scoreUniqueness(name),
      domain_friendliness: this.scoreDomainFriendliness(name)
    };

    const overall_score = Object.values(analysis).reduce((sum, score) => sum + score, 0) / Object.keys(analysis).length;
    
    return {
      ...analysis,
      overall_score: Math.round(overall_score * 10) / 10,
      recommendations: this.generateRecommendations(name, analysis)
    };
  }

  scoreLengh(name) {
    const length = name.length;
    if (length >= 5 && length <= 8) return 10;
    if (length >= 9 && length <= 12) return 8;
    if (length >= 3 && length <= 4) return 7;
    if (length >= 13 && length <= 15) return 6;
    return 3;
  }

  scorePronunciation(name) {
    // Advanced phonetic analysis
    const vowels = (name.match(/[aeiou]/gi) || []).length;
    const consonants = name.length - vowels;
    const vowelRatio = vowels / name.length;
    
    if (vowelRatio >= 0.3 && vowelRatio <= 0.5) return 10;
    if (vowelRatio >= 0.2 && vowelRatio < 0.3) return 8;
    if (vowelRatio >= 0.5 && vowelRatio <= 0.6) return 7;
    return 5;
  }

  scoreMemorability(name) {
    let score = 10;
    
    // Penalize common patterns
    if (/(.)\1{2,}/.test(name)) score -= 2; // Repeated characters
    if (/^(get|my|the|app|web)/.test(name.toLowerCase())) score -= 3; // Common prefixes
    if (/(ly|er|ing)$/.test(name.toLowerCase())) score -= 1; // Common suffixes
    
    // Reward memorable patterns
    if (/^[A-Z][a-z]+[A-Z][a-z]+$/.test(name)) score += 2; // CamelCase
    if (name.toLowerCase().includes('x') || name.toLowerCase().includes('z')) score += 1; // Distinctive letters
    
    return Math.max(1, Math.min(10, score));
  }

  scoreUniqueness(name) {
    // This would integrate with trademark databases in production
    const commonWords = ['app', 'web', 'tech', 'digital', 'online', 'smart', 'pro', 'max', 'plus'];
    let score = 10;
    
    for (const word of commonWords) {
      if (name.toLowerCase().includes(word)) {
        score -= 2;
      }
    }
    
    return Math.max(1, score);
  }

  scoreDomainFriendliness(name) {
    let score = 10;
    
    if (/[^a-zA-Z0-9-]/.test(name)) score -= 5; // Special characters
    if (name.includes('-')) score -= 2; // Hyphens
    if (/\d/.test(name)) score -= 1; // Numbers
    if (name.length > 15) score -= 3; // Too long for domains
    
    return Math.max(1, score);
  }

  calculateSEOPotential(name) {
    // SEO analysis based on searchability and keyword potential
    const factors = {
      brand_search_potential: name.length <= 12 ? 8 : 5,
      type_ability: /^[a-zA-Z]+$/.test(name) ? 9 : 6,
      voice_search_friendly: this.scorePronunciation(name),
      memorable_for_backlinks: this.scoreMemorability(name)
    };

    return Math.round(Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length);
  }

  assessTrademarkRisk(name) {
    // Basic trademark risk assessment (would integrate with USPTO API in production)
    const riskFactors = [];
    
    if (name.toLowerCase().includes('apple') || name.toLowerCase().includes('google')) {
      riskFactors.push('Contains major brand name');
    }
    
    if (/^(i|e)[A-Z]/.test(name)) {
      riskFactors.push('Similar to Apple naming convention');
    }
    
    return {
      risk_level: riskFactors.length > 0 ? 'medium' : 'low',
      risk_factors: riskFactors,
      recommendation: riskFactors.length > 0 ? 'Conduct trademark search' : 'Proceed with confidence'
    };
  }

  generateRecommendations(name, analysis) {
    const recommendations = [];
    
    if (analysis.length_score < 7) {
      recommendations.push('Consider shortening the name for better memorability');
    }
    
    if (analysis.pronunciation_score < 7) {
      recommendations.push('Add more vowels or simplify pronunciation');
    }
    
    if (analysis.uniqueness_score < 7) {
      recommendations.push('Make the name more distinctive to avoid confusion');
    }
    
    return recommendations;
  }

  fallbackParse(response) {
    // Emergency parsing for non-JSON responses
    const names = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+?)(?:\s*-\s*(.+))?$/);
      if (match) {
        names.push({
          name: match[1].trim(),
          explanation: match[2] || 'AI-generated startup name',
          brandability_score: 7
        });
      }
    }
    
    return names;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new NameGenerator();