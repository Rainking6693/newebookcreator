/**
 * AI Service - LLM Integration and Content Generation
 * Handles Claude and GPT-4 API integration with prompt engineering
 */

import axios from 'axios';
import { Analytics } from '../models/Analytics.js';
import { Book } from '../models/Book.js';
import { Subscription } from '../models/Subscription.js';

class AIService {
  constructor() {
    this.models = {
      claude: {
        apiUrl: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 8000,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      },
      gpt4: {
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4-turbo-preview',
        maxTokens: 8000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    };
    
    this.pricing = {
      claude: {
        inputTokenCost: 0.003 / 1000,   // $3 per 1M input tokens
        outputTokenCost: 0.015 / 1000   // $15 per 1M output tokens
      },
      gpt4: {
        inputTokenCost: 0.01 / 1000,    // $10 per 1M input tokens
        outputTokenCost: 0.03 / 1000    // $30 per 1M output tokens
      }
    };
    
    this.promptTemplates = this.loadPromptTemplates();
  }
  
  async generateContent(options) {
    const {
      prompt,
      model = 'claude',
      temperature = 0.7,
      maxTokens = 4000,
      genre,
      context,
      userId,
      bookId,
      chapterId
    } = options;
    
    try {
      // Select appropriate model
      const selectedModel = this.selectModel(model, genre);
      
      // Build enhanced prompt with context
      const enhancedPrompt = await this.buildEnhancedPrompt(prompt, {
        genre,
        context,
        bookId,
        chapterId
      });
      
      // Generate content
      const startTime = Date.now();
      const result = await this.callAIModel(selectedModel, enhancedPrompt, {
        temperature,
        maxTokens
      });
      
      const responseTime = Date.now() - startTime;
      
      // Calculate cost
      const cost = this.calculateCost(selectedModel, result.usage);
      
      // Track usage
      await this.trackUsage(userId, {
        model: selectedModel,
        tokensUsed: result.usage,
        cost,
        responseTime,
        genre,
        prompt: prompt.substring(0, 100) // First 100 chars for analytics
      });
      
      // Post-process content
      const processedContent = await this.postProcessContent(result.content, genre);
      
      return {
        content: processedContent,
        model: selectedModel,
        tokensUsed: result.usage,
        cost,
        responseTime,
        qualityScore: await this.assessContentQuality(processedContent, genre)
      };
      
    } catch (error) {
      console.error('AI generation failed:', error);
      
      // Try fallback model if primary fails
      if (model !== 'gpt4' && error.code !== 'QUOTA_EXCEEDED') {
        console.log('Trying fallback model...');
        return await this.generateContent({
          ...options,
          model: 'gpt4'
        });
      }
      
      throw error;
    }
  }
  
  selectModel(preferredModel, genre) {
    // Model selection logic based on genre and availability
    if (preferredModel === 'auto') {
      return genre === 'mystery' ? 'claude' : 'gpt4';
    }
    
    return preferredModel;
  }
  
  async buildEnhancedPrompt(basePrompt, context) {
    let enhancedPrompt = '';
    
    // Add genre-specific context
    if (context.genre) {
      const genreContext = this.promptTemplates.genreContexts[context.genre];
      if (genreContext) {
        enhancedPrompt += genreContext + '\n\n';
      }
    }
    
    // Add book context if available
    if (context.bookId) {
      const bookContext = await this.getBookContext(context.bookId, context.chapterId);
      if (bookContext) {
        enhancedPrompt += bookContext + '\n\n';
      }
    }
    
    // Add the main prompt
    enhancedPrompt += basePrompt;
    
    // Add quality guidelines
    enhancedPrompt += '\n\n' + this.promptTemplates.qualityGuidelines;
    
    return enhancedPrompt;
  }
  
  async callAIModel(model, prompt, options) {
    const modelConfig = this.models[model];
    
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }
    
    const requestData = this.buildRequestData(model, prompt, options);
    
    try {
      const response = await axios.post(modelConfig.apiUrl, requestData, {
        headers: modelConfig.headers,
        timeout: 120000 // 2 minute timeout
      });
      
      return this.parseResponse(model, response.data);
      
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Invalid API key for ' + model);
      }
      
      throw new Error(`AI model request failed: ${error.message}`);
    }
  }
  
  buildRequestData(model, prompt, options) {
    if (model === 'claude') {
      return {
        model: this.models.claude.model,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      };
    } else if (model === 'gpt4') {
      return {
        model: this.models.gpt4.model,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      };
    }
  }
  
  parseResponse(model, responseData) {
    if (model === 'claude') {
      return {
        content: responseData.content[0].text,
        usage: {
          inputTokens: responseData.usage.input_tokens,
          outputTokens: responseData.usage.output_tokens,
          totalTokens: responseData.usage.input_tokens + responseData.usage.output_tokens
        }
      };
    } else if (model === 'gpt4') {
      return {
        content: responseData.choices[0].message.content,
        usage: {
          inputTokens: responseData.usage.prompt_tokens,
          outputTokens: responseData.usage.completion_tokens,
          totalTokens: responseData.usage.total_tokens
        }
      };
    }
  }
  
  calculateCost(model, usage) {
    const pricing = this.pricing[model];
    if (!pricing) return 0;
    
    const inputCost = usage.inputTokens * pricing.inputTokenCost;
    const outputCost = usage.outputTokens * pricing.outputTokenCost;
    
    return inputCost + outputCost;
  }
  
  async getBookContext(bookId, chapterId) {
    try {
      const book = await Book.findById(bookId);
      if (!book) return null;
      
      let context = `Book Title: ${book.title}\n`;
      context += `Genre: ${book.genre}\n`;
      
      if (book.metadata.description) {
        context += `Description: ${book.metadata.description}\n`;
      }
      
      if (book.structure.outline) {
        context += `Outline: ${book.structure.outline}\n`;
      }
      
      // Add previous chapters for context
      if (chapterId) {
        const currentChapterIndex = book.structure.chapters.findIndex(ch => ch.id === chapterId);
        if (currentChapterIndex > 0) {
          const previousChapters = book.structure.chapters.slice(0, currentChapterIndex);
          context += '\nPrevious Chapters Summary:\n';
          
          previousChapters.forEach((chapter, index) => {
            context += `Chapter ${index + 1}: ${chapter.title}\n`;
            if (chapter.content) {
              // Add first 200 characters of each previous chapter
              context += chapter.content.substring(0, 200) + '...\n\n';
            }
          });
        }
      }
      
      return context;
      
    } catch (error) {
      console.error('Error getting book context:', error);
      return null;
    }
  }
  
  async postProcessContent(content, genre) {
    // Basic post-processing
    let processed = content.trim();
    
    // Remove any AI model artifacts
    processed = processed.replace(/^(Assistant:|AI:|Claude:|GPT-4:)/gm, '');
    
    // Ensure proper paragraph spacing
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    // Genre-specific post-processing
    if (genre === 'mystery') {
      // Ensure dialogue formatting
      processed = this.formatDialogue(processed);
    } else if (genre === 'self-help') {
      // Ensure proper list formatting
      processed = this.formatLists(processed);
    }
    
    return processed;
  }
  
  formatDialogue(content) {
    // Basic dialogue formatting
    return content.replace(/([.!?])\s*"([^"]+)"/g, '$1\n\n"$2"');
  }
  
  formatLists(content) {
    // Ensure proper list formatting
    return content.replace(/^\s*(\d+\.|\*|\-)\s*/gm, '\n$1 ');
  }
  
  async assessContentQuality(content, genre) {
    // Simple quality assessment
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    let score = 70; // Base score
    
    // Adjust based on length
    if (wordCount < 100) score -= 20;
    else if (wordCount > 500) score += 10;
    
    // Adjust based on sentence structure
    if (avgWordsPerSentence > 25) score -= 10; // Too complex
    else if (avgWordsPerSentence < 8) score -= 5; // Too simple
    else score += 10; // Good balance
    
    // Genre-specific adjustments
    if (genre === 'mystery') {
      // Check for dialogue
      const dialogueMatches = content.match(/"/g);
      if (dialogueMatches && dialogueMatches.length >= 4) score += 5;
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  async trackUsage(userId, usageData) {
    try {
      // Record analytics
      await Analytics.create({
        userId,
        eventType: 'ai_generation',
        eventData: usageData,
        timestamp: new Date()
      });
      
      // Update subscription usage
      await Subscription.findOneAndUpdate(
        { userId, status: 'active' },
        {
          $inc: {
            'usage.aiGenerationsUsed': 1,
            'analytics.generationCost': usageData.cost
          }
        }
      );
      
    } catch (error) {
      console.error('Error tracking AI usage:', error);
    }
  }
  
  async improveContent(options) {
    const { content, improvementType, instructions, userId } = options;
    
    const improvementPrompts = {
      grammar: 'Please improve the grammar and sentence structure of the following text while maintaining its original meaning and style:',
      style: 'Please improve the writing style and flow of the following text to make it more engaging:',
      clarity: 'Please improve the clarity and readability of the following text:',
      tone: 'Please adjust the tone of the following text according to these instructions:'
    };
    
    const basePrompt = improvementPrompts[improvementType] || improvementPrompts.style;
    const fullPrompt = `${basePrompt}\n\n${instructions ? `Additional instructions: ${instructions}\n\n` : ''}Original text:\n${content}`;
    
    return await this.generateContent({
      prompt: fullPrompt,
      model: 'claude', // Claude is better for editing tasks
      temperature: 0.3, // Lower temperature for more consistent improvements
      maxTokens: Math.min(8000, content.length * 2), // Roughly 2x original length
      userId
    });
  }
  
  async analyzeContent(options) {
    const { content, analysisType, userId } = options;
    
    const analysisPrompts = {
      quality: 'Please analyze the quality of this writing and provide specific feedback on strengths and areas for improvement:',
      readability: 'Please analyze the readability of this text and suggest improvements for the target audience:',
      structure: 'Please analyze the structure and organization of this text and suggest improvements:',
      consistency: 'Please analyze this text for consistency in tone, style, and character voice:'
    };
    
    const prompt = `${analysisPrompts[analysisType] || analysisPrompts.quality}\n\n${content}`;
    
    const result = await this.generateContent({
      prompt,
      model: 'claude',
      temperature: 0.2,
      maxTokens: 2000,
      userId
    });
    
    return {
      analysis: result.content,
      qualityScore: await this.assessContentQuality(content),
      wordCount: content.split(/\s+/).length,
      readabilityScore: this.calculateReadabilityScore(content)
    };
  }
  
  calculateReadabilityScore(content) {
    // Simplified Flesch Reading Ease score
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
  
  loadPromptTemplates() {
    return {
      genreContexts: {
        mystery: `You are an expert mystery novelist. Focus on creating atmospheric, suspenseful content with well-developed characters, intriguing clues, and engaging dialogue. Maintain a balance between revealing information and keeping readers guessing.`,
        
        'self-help': `You are an expert self-help author. Focus on creating practical, actionable content that provides real value to readers. Include specific examples, exercises, and frameworks that readers can implement immediately.`
      },
      
      qualityGuidelines: `
Quality Guidelines:
- Use vivid, specific details rather than generic descriptions
- Show character emotions through actions and dialogue, not just telling
- Maintain consistent voice and tone throughout
- Ensure smooth transitions between paragraphs and ideas
- Avoid clichés and overused phrases
- Create engaging, natural-sounding dialogue
- Use proper grammar and sentence structure
- End with a compelling hook or transition to maintain reader interest`
    };
  }
}

export default AIService;