/**
 * Content Management Service
 * Handles book creation, editing, organization, and version control
 */

import { Book } from '../models/Book.js';
import { Version } from '../models/Version.js';
import { Analytics } from '../models/Analytics.js';
import VersionControlService from './version-control.js';
import ContentModerationService from './content-moderation.js';

class ContentManagementService {
  constructor() {
    this.versionControl = new VersionControlService();
    this.moderation = new ContentModerationService();
    this.maxBooksPerTier = {
      basic: 5,
      pro: 15,
      author: 50
    };
  }
  
  // Book Management
  async createBook(userId, bookData, subscriptionTier) {
    try {
      // Check book creation limits
      await this.checkBookCreationLimits(userId, subscriptionTier);
      
      // Validate book data
      const validatedData = await this.validateBookData(bookData);
      
      // Create book
      const book = await Book.create({
        userId,
        title: validatedData.title,
        genre: validatedData.genre,
        status: 'draft',
        metadata: {
          description: validatedData.description || '',
          targetWordCount: validatedData.targetWordCount || 75000,
          currentWordCount: 0,
          createdAt: new Date(),
          lastModified: new Date()
        },
        structure: {
          outline: validatedData.outline || '',
          chapters: [],
          characters: validatedData.characters || [],
          settings: validatedData.settings || []
        },
        settings: {
          aiModel: validatedData.aiModel || 'claude',
          temperature: validatedData.temperature || 0.7,
          maxTokensPerGeneration: validatedData.maxTokensPerGeneration || 4000,
          autoSave: true,
          collaborationEnabled: false
        }
      });
      
      // Track analytics
      await this.trackEvent(userId, 'book_created', {
        bookId: book._id,
        genre: book.genre,
        targetWordCount: book.metadata.targetWordCount
      });
      
      return book;
      
    } catch (error) {
      console.error('Book creation failed:', error);
      throw error;
    }
  }
  
  async updateBook(userId, bookId, updates) {
    try {
      // Validate ownership
      const book = await this.validateBookOwnership(userId, bookId);
      
      // Sanitize updates
      const sanitizedUpdates = this.sanitizeBookUpdates(updates);
      
      // Update book
      const updatedBook = await Book.findByIdAndUpdate(
        bookId,
        {
          $set: {
            ...sanitizedUpdates,
            'metadata.lastModified': new Date()
          }
        },
        { new: true, runValidators: true }
      );
      
      // Track analytics
      await this.trackEvent(userId, 'book_updated', {
        bookId,
        updatedFields: Object.keys(sanitizedUpdates)
      });
      
      return updatedBook;
      
    } catch (error) {
      console.error('Book update failed:', error);
      throw error;
    }
  }
  
  async deleteBook(userId, bookId) {
    try {
      // Validate ownership
      await this.validateBookOwnership(userId, bookId);
      
      // Soft delete (mark as deleted)
      const deletedBook = await Book.findByIdAndUpdate(
        bookId,
        {
          $set: {
            status: 'deleted',
            'metadata.deletedAt': new Date()
          }
        },
        { new: true }
      );
      
      // Track analytics
      await this.trackEvent(userId, 'book_deleted', {
        bookId,
        wordCount: deletedBook.metadata.currentWordCount
      });
      
      return { success: true, message: 'Book deleted successfully' };
      
    } catch (error) {
      console.error('Book deletion failed:', error);
      throw error;
    }
  }
  
  async getUserBooks(userId, filters = {}) {
    try {
      const query = { 
        userId,
        status: { $ne: 'deleted' }
      };
      
      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.genre) query.genre = filters.genre;
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { 'metadata.description': { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      const books = await Book.find(query)
        .sort({ 'metadata.lastModified': -1 })
        .limit(filters.limit || 50)
        .skip(filters.offset || 0)
        .select('-structure.chapters.content'); // Exclude content for list view
      
      const total = await Book.countDocuments(query);
      
      return {
        books,
        pagination: {
          total,
          page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
          limit: filters.limit || 50,
          pages: Math.ceil(total / (filters.limit || 50))
        }
      };
      
    } catch (error) {
      console.error('Failed to get user books:', error);
      throw error;
    }
  }
  
  // Chapter Management
  async createChapter(userId, bookId, chapterData) {
    try {
      // Validate ownership
      const book = await this.validateBookOwnership(userId, bookId);
      
      // Generate chapter ID
      const chapterId = `chapter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create chapter object
      const chapter = {
        id: chapterId,
        title: chapterData.title || `Chapter ${book.structure.chapters.length + 1}`,
        content: chapterData.content || '',
        wordCount: this.countWords(chapterData.content || ''),
        status: 'draft',
        order: chapterData.order || book.structure.chapters.length + 1,
        createdAt: new Date(),
        lastModified: new Date(),
        notes: chapterData.notes || '',
        tags: chapterData.tags || []
      };
      
      // Add chapter to book
      await Book.findByIdAndUpdate(
        bookId,
        {
          $push: { 'structure.chapters': chapter },
          $set: { 'metadata.lastModified': new Date() }
        }
      );
      
      // Create initial version
      if (chapter.content) {
        await this.versionControl.createVersion(bookId, chapterId, chapter.content, {
          userId,
          authorType: 'user',
          tags: ['initial']
        });
      }
      
      // Track analytics
      await this.trackEvent(userId, 'chapter_created', {
        bookId,
        chapterId,
        wordCount: chapter.wordCount
      });
      
      return chapter;
      
    } catch (error) {
      console.error('Chapter creation failed:', error);
      throw error;
    }
  }
  
  async updateChapter(userId, bookId, chapterId, updates) {
    try {
      // Validate ownership
      await this.validateBookOwnership(userId, bookId);
      
      // Get current chapter
      const book = await Book.findById(bookId);
      const chapterIndex = book.structure.chapters.findIndex(ch => ch.id === chapterId);
      
      if (chapterIndex === -1) {
        throw new Error('Chapter not found');
      }
      
      const currentChapter = book.structure.chapters[chapterIndex];
      
      // Moderate content if provided
      if (updates.content && updates.content !== currentChapter.content) {
        const moderationResult = await this.moderation.moderateContent(updates.content, {
          genre: book.genre,
          contentType: 'chapter'
        });
        
        if (!moderationResult.approved) {
          throw new Error(`Content moderation failed: ${moderationResult.reason}`);
        }
      }
      
      // Prepare updates
      const chapterUpdates = {
        ...updates,
        wordCount: updates.content ? this.countWords(updates.content) : currentChapter.wordCount,
        lastModified: new Date()
      };
      
      // Update chapter
      const updateQuery = {};
      Object.keys(chapterUpdates).forEach(key => {
        updateQuery[`structure.chapters.${chapterIndex}.${key}`] = chapterUpdates[key];
      });
      updateQuery['metadata.lastModified'] = new Date();
      
      await Book.findByIdAndUpdate(bookId, { $set: updateQuery });
      
      // Create version if content changed
      if (updates.content && updates.content !== currentChapter.content) {
        await this.versionControl.createVersion(bookId, chapterId, updates.content, {
          userId,
          authorType: 'user',
          tags: ['edit']
        });
      }
      
      // Update book word count
      await this.updateBookWordCount(bookId);
      
      // Track analytics
      await this.trackEvent(userId, 'chapter_updated', {
        bookId,
        chapterId,
        updatedFields: Object.keys(chapterUpdates),
        wordCount: chapterUpdates.wordCount
      });
      
      return chapterUpdates;
      
    } catch (error) {
      console.error('Chapter update failed:', error);
      throw error;
    }
  }
  
  async deleteChapter(userId, bookId, chapterId) {
    try {
      // Validate ownership
      await this.validateBookOwnership(userId, bookId);
      
      // Remove chapter
      const result = await Book.findByIdAndUpdate(
        bookId,
        {
          $pull: { 'structure.chapters': { id: chapterId } },
          $set: { 'metadata.lastModified': new Date() }
        },
        { new: true }
      );
      
      if (!result) {
        throw new Error('Chapter not found');
      }
      
      // Update book word count
      await this.updateBookWordCount(bookId);
      
      // Track analytics
      await this.trackEvent(userId, 'chapter_deleted', {
        bookId,
        chapterId
      });
      
      return { success: true, message: 'Chapter deleted successfully' };
      
    } catch (error) {
      console.error('Chapter deletion failed:', error);
      throw error;
    }
  }
  
  async reorderChapters(userId, bookId, chapterOrder) {
    try {
      // Validate ownership
      const book = await this.validateBookOwnership(userId, bookId);
      
      // Validate chapter order
      if (chapterOrder.length !== book.structure.chapters.length) {
        throw new Error('Chapter order must include all chapters');
      }
      
      // Reorder chapters
      const reorderedChapters = chapterOrder.map((chapterId, index) => {
        const chapter = book.structure.chapters.find(ch => ch.id === chapterId);
        if (!chapter) {
          throw new Error(`Chapter ${chapterId} not found`);
        }
        return {
          ...chapter.toObject(),
          order: index + 1
        };
      });
      
      // Update book
      await Book.findByIdAndUpdate(
        bookId,
        {
          $set: {
            'structure.chapters': reorderedChapters,
            'metadata.lastModified': new Date()
          }
        }
      );
      
      // Track analytics
      await this.trackEvent(userId, 'chapters_reordered', {
        bookId,
        newOrder: chapterOrder
      });
      
      return { success: true, chapters: reorderedChapters };
      
    } catch (error) {
      console.error('Chapter reordering failed:', error);
      throw error;
    }
  }
  
  // Content Organization
  async createOutline(userId, bookId, outlineData) {
    try {
      // Validate ownership
      await this.validateBookOwnership(userId, bookId);
      
      // Update book outline
      const updatedBook = await Book.findByIdAndUpdate(
        bookId,
        {
          $set: {
            'structure.outline': outlineData.content,
            'metadata.lastModified': new Date()
          }
        },
        { new: true }
      );
      
      // Track analytics
      await this.trackEvent(userId, 'outline_created', {
        bookId,
        outlineLength: outlineData.content.length
      });
      
      return updatedBook.structure.outline;
      
    } catch (error) {
      console.error('Outline creation failed:', error);
      throw error;
    }
  }
  
  async addCharacter(userId, bookId, characterData) {
    try {
      // Validate ownership
      await this.validateBookOwnership(userId, bookId);
      
      // Create character object
      const character = {
        id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: characterData.name,
        role: characterData.role || 'supporting',
        description: characterData.description || '',
        background: characterData.background || '',
        personality: characterData.personality || '',
        appearance: characterData.appearance || '',
        motivations: characterData.motivations || '',
        relationships: characterData.relationships || [],
        voice: characterData.voice || '',
        arc: characterData.arc || '',
        notes: characterData.notes || '',
        createdAt: new Date()
      };
      
      // Add character to book
      await Book.findByIdAndUpdate(
        bookId,
        {
          $push: { 'structure.characters': character },
          $set: { 'metadata.lastModified': new Date() }
        }
      );
      
      // Track analytics
      await this.trackEvent(userId, 'character_added', {
        bookId,
        characterId: character.id,
        characterRole: character.role
      });
      
      return character;
      
    } catch (error) {
      console.error('Character addition failed:', error);
      throw error;
    }
  }
  
  async updateCharacter(userId, bookId, characterId, updates) {
    try {
      // Validate ownership
      await this.validateBookOwnership(userId, bookId);
      
      // Find and update character
      const book = await Book.findById(bookId);
      const characterIndex = book.structure.characters.findIndex(ch => ch.id === characterId);
      
      if (characterIndex === -1) {
        throw new Error('Character not found');
      }
      
      // Prepare updates
      const updateQuery = {};
      Object.keys(updates).forEach(key => {
        updateQuery[`structure.characters.${characterIndex}.${key}`] = updates[key];
      });
      updateQuery['metadata.lastModified'] = new Date();
      
      await Book.findByIdAndUpdate(bookId, { $set: updateQuery });
      
      // Track analytics
      await this.trackEvent(userId, 'character_updated', {
        bookId,
        characterId,
        updatedFields: Object.keys(updates)
      });
      
      return updates;
      
    } catch (error) {
      console.error('Character update failed:', error);
      throw error;
    }
  }
  
  // Utility Methods
  async checkBookCreationLimits(userId, subscriptionTier) {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const booksThisMonth = await Book.countDocuments({
      userId,
      'metadata.createdAt': { $gte: currentMonth },
      status: { $ne: 'deleted' }
    });
    
    const limit = this.maxBooksPerTier[subscriptionTier] || this.maxBooksPerTier.basic;
    
    if (booksThisMonth >= limit) {
      throw new Error(`Monthly book creation limit reached (${limit} books per month for ${subscriptionTier} tier)`);
    }
  }
  
  async validateBookOwnership(userId, bookId) {
    const book = await Book.findOne({ _id: bookId, userId });
    
    if (!book) {
      throw new Error('Book not found or access denied');
    }
    
    if (book.status === 'deleted') {
      throw new Error('Book has been deleted');
    }
    
    return book;
  }
  
  validateBookData(bookData) {
    const errors = [];
    
    if (!bookData.title || bookData.title.trim().length < 1) {
      errors.push('Book title is required');
    }
    
    if (bookData.title && bookData.title.length > 200) {
      errors.push('Book title must be less than 200 characters');
    }
    
    if (!bookData.genre) {
      errors.push('Book genre is required');
    }
    
    const allowedGenres = ['mystery', 'self-help'];
    if (bookData.genre && !allowedGenres.includes(bookData.genre)) {
      errors.push(`Genre must be one of: ${allowedGenres.join(', ')}`);
    }
    
    if (bookData.targetWordCount && (bookData.targetWordCount < 1000 || bookData.targetWordCount > 200000)) {
      errors.push('Target word count must be between 1,000 and 200,000');
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return bookData;
  }
  
  sanitizeBookUpdates(updates) {
    const allowedFields = [
      'title',
      'genre',
      'metadata.description',
      'metadata.targetWordCount',
      'structure.outline',
      'settings.aiModel',
      'settings.temperature',
      'settings.maxTokensPerGeneration',
      'settings.autoSave',
      'settings.collaborationEnabled'
    ];
    
    const sanitized = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitized[key] = updates[key];
      }
    });
    
    return sanitized;
  }
  
  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  async updateBookWordCount(bookId) {
    const book = await Book.findById(bookId);
    
    const totalWordCount = book.structure.chapters.reduce((total, chapter) => {
      return total + (chapter.wordCount || 0);
    }, 0);
    
    await Book.findByIdAndUpdate(
      bookId,
      {
        $set: {
          'metadata.currentWordCount': totalWordCount,
          'metadata.lastModified': new Date()
        }
      }
    );
    
    return totalWordCount;
  }
  
  async trackEvent(userId, eventType, eventData) {
    try {
      await Analytics.create({
        userId,
        eventType,
        eventData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
  
  // Search and Discovery
  async searchContent(userId, query, filters = {}) {
    try {
      const searchQuery = {
        userId,
        status: { $ne: 'deleted' },
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { 'metadata.description': { $regex: query, $options: 'i' } },
          { 'structure.outline': { $regex: query, $options: 'i' } },
          { 'structure.chapters.title': { $regex: query, $options: 'i' } },
          { 'structure.chapters.content': { $regex: query, $options: 'i' } }
        ]
      };
      
      if (filters.genre) {
        searchQuery.genre = filters.genre;
      }
      
      if (filters.status) {
        searchQuery.status = filters.status;
      }
      
      const results = await Book.find(searchQuery)
        .sort({ 'metadata.lastModified': -1 })
        .limit(filters.limit || 20)
        .select('title genre metadata.description metadata.currentWordCount status');
      
      return results;
      
    } catch (error) {
      console.error('Content search failed:', error);
      throw error;
    }
  }
}

export default ContentManagementService;