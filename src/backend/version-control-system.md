# Version Control & Backup System

## Content Version Control

### Version Control Architecture
```javascript
// Version control schema for manuscripts
const versionSchema = {
  bookId: ObjectId,
  chapterId: String,
  versionNumber: Number,
  content: String,
  changes: [{
    type: String, // 'insert', 'delete', 'modify'
    position: Number,
    oldText: String,
    newText: String,
    timestamp: Date
  }],
  metadata: {
    wordCount: Number,
    characterCount: Number,
    readabilityScore: Number,
    qualityScore: Number
  },
  author: {
    userId: ObjectId,
    type: String, // 'user', 'ai', 'collaborative'
    aiModel: String, // if AI-generated
    prompt: String // if AI-generated
  },
  createdAt: Date,
  tags: [String], // 'draft', 'reviewed', 'final', etc.
  parentVersion: ObjectId, // Reference to previous version
  branches: [ObjectId] // Alternative versions
};
```

### Version Control Service
```javascript
class VersionControlService {
  constructor() {
    this.maxVersionsPerChapter = 50;
    this.autoSaveInterval = 30000; // 30 seconds
  }
  
  async createVersion(bookId, chapterId, content, metadata = {}) {
    try {
      // Get current version number
      const latestVersion = await Version.findOne({
        bookId,
        chapterId
      }).sort({ versionNumber: -1 });
      
      const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
      
      // Calculate changes if previous version exists
      const changes = latestVersion ? 
        this.calculateChanges(latestVersion.content, content) : [];
      
      // Create new version
      const version = await Version.create({
        bookId,
        chapterId,
        versionNumber,
        content,
        changes,
        metadata: {
          wordCount: this.countWords(content),
          characterCount: content.length,
          ...metadata
        },
        author: {
          userId: metadata.userId,
          type: metadata.authorType || 'user',
          aiModel: metadata.aiModel,
          prompt: metadata.prompt
        },
        parentVersion: latestVersion?._id,
        tags: metadata.tags || ['draft']
      });
      
      // Update chapter with latest version
      await this.updateChapterVersion(bookId, chapterId, version._id);
      
      // Clean up old versions if needed
      await this.cleanupOldVersions(bookId, chapterId);
      
      return version;
      
    } catch (error) {
      console.error('Version creation failed:', error);
      throw error;
    }
  }
  
  async getVersionHistory(bookId, chapterId, limit = 20) {
    const versions = await Version.find({
      bookId,
      chapterId
    })
    .sort({ versionNumber: -1 })
    .limit(limit)
    .populate('author.userId', 'profile.firstName profile.lastName');
    
    return versions.map(version => ({
      id: version._id,
      versionNumber: version.versionNumber,
      createdAt: version.createdAt,
      author: version.author,
      metadata: version.metadata,
      tags: version.tags,
      changesSummary: this.summarizeChanges(version.changes)
    }));
  }
  
  async restoreVersion(bookId, chapterId, versionId, userId) {
    try {
      // Get the version to restore
      const versionToRestore = await Version.findById(versionId);
      
      if (!versionToRestore || versionToRestore.bookId.toString() !== bookId) {
        throw new Error('Version not found');
      }
      
      // Create new version with restored content
      const restoredVersion = await this.createVersion(
        bookId,
        chapterId,
        versionToRestore.content,
        {
          userId,
          authorType: 'user',
          tags: ['restored', `from-v${versionToRestore.versionNumber}`]
        }
      );
      
      // Update the chapter content
      await Book.updateOne(
        { 
          _id: bookId,
          'structure.chapters.id': chapterId
        },
        {
          $set: {
            'structure.chapters.$.content': versionToRestore.content,
            'structure.chapters.$.lastModified': new Date(),
            'structure.chapters.$.wordCount': versionToRestore.metadata.wordCount
          }
        }
      );
      
      return restoredVersion;
      
    } catch (error) {
      console.error('Version restoration failed:', error);
      throw error;
    }
  }
  
  async compareVersions(versionId1, versionId2) {
    const [version1, version2] = await Promise.all([
      Version.findById(versionId1),
      Version.findById(versionId2)
    ]);
    
    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }
    
    const diff = this.calculateDetailedDiff(version1.content, version2.content);
    
    return {
      version1: {
        id: version1._id,
        versionNumber: version1.versionNumber,
        createdAt: version1.createdAt,
        metadata: version1.metadata
      },
      version2: {
        id: version2._id,
        versionNumber: version2.versionNumber,
        createdAt: version2.createdAt,
        metadata: version2.metadata
      },
      diff,
      statistics: {
        addedWords: diff.filter(d => d.type === 'insert').reduce((sum, d) => sum + this.countWords(d.text), 0),
        deletedWords: diff.filter(d => d.type === 'delete').reduce((sum, d) => sum + this.countWords(d.text), 0),
        modifiedSections: diff.filter(d => d.type === 'modify').length
      }
    };
  }
  
  calculateChanges(oldContent, newContent) {
    // Simple diff algorithm - in production would use more sophisticated diff
    const changes = [];
    
    if (oldContent === newContent) {
      return changes;
    }
    
    // Split into words for comparison
    const oldWords = oldContent.split(/\s+/);
    const newWords = newContent.split(/\s+/);
    
    // Basic word-level diff
    let oldIndex = 0;
    let newIndex = 0;
    
    while (oldIndex < oldWords.length || newIndex < newWords.length) {
      if (oldIndex >= oldWords.length) {
        // Insertion at end
        changes.push({
          type: 'insert',
          position: newIndex,
          newText: newWords.slice(newIndex).join(' '),
          timestamp: new Date()
        });
        break;
      } else if (newIndex >= newWords.length) {
        // Deletion at end
        changes.push({
          type: 'delete',
          position: oldIndex,
          oldText: oldWords.slice(oldIndex).join(' '),
          timestamp: new Date()
        });
        break;
      } else if (oldWords[oldIndex] === newWords[newIndex]) {
        // No change
        oldIndex++;
        newIndex++;
      } else {
        // Find next matching word
        const nextMatch = this.findNextMatch(oldWords, newWords, oldIndex, newIndex);
        
        if (nextMatch.oldIndex > oldIndex && nextMatch.newIndex > newIndex) {
          // Modification
          changes.push({
            type: 'modify',
            position: oldIndex,
            oldText: oldWords.slice(oldIndex, nextMatch.oldIndex).join(' '),
            newText: newWords.slice(newIndex, nextMatch.newIndex).join(' '),
            timestamp: new Date()
          });
        } else if (nextMatch.oldIndex > oldIndex) {
          // Deletion
          changes.push({
            type: 'delete',
            position: oldIndex,
            oldText: oldWords.slice(oldIndex, nextMatch.oldIndex).join(' '),
            timestamp: new Date()
          });
        } else if (nextMatch.newIndex > newIndex) {
          // Insertion
          changes.push({
            type: 'insert',
            position: newIndex,
            newText: newWords.slice(newIndex, nextMatch.newIndex).join(' '),
            timestamp: new Date()
          });
        }
        
        oldIndex = nextMatch.oldIndex;
        newIndex = nextMatch.newIndex;
      }
    }
    
    return changes;
  }
  
  async cleanupOldVersions(bookId, chapterId) {
    const versionCount = await Version.countDocuments({ bookId, chapterId });
    
    if (versionCount > this.maxVersionsPerChapter) {
      const versionsToDelete = versionCount - this.maxVersionsPerChapter;
      
      const oldVersions = await Version.find({ bookId, chapterId })
        .sort({ versionNumber: 1 })
        .limit(versionsToDelete);
      
      const versionIds = oldVersions.map(v => v._id);
      await Version.deleteMany({ _id: { $in: versionIds } });
    }
  }
  
  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}
```

## Backup System

### Automated Backup Service
```javascript
class BackupService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    this.backupBucket = process.env.BACKUP_S3_BUCKET;
    this.retentionDays = 30;
  }
  
  async createFullBackup() {
    try {
      const timestamp = new Date().toISOString();
      const backupId = `full-backup-${timestamp}`;
      
      console.log(`Starting full backup: ${backupId}`);
      
      // Backup all collections
      const collections = ['users', 'books', 'subscriptions', 'payments', 'analytics'];
      const backupData = {};
      
      for (const collection of collections) {
        console.log(`Backing up collection: ${collection}`);
        backupData[collection] = await this.backupCollection(collection);
      }
      
      // Compress and upload to S3
      const compressedData = await this.compressData(backupData);
      const s3Key = `backups/full/${backupId}.gz`;
      
      await this.uploadToS3(s3Key, compressedData);
      
      // Record backup metadata
      await this.recordBackup({
        backupId,
        type: 'full',
        timestamp: new Date(),
        s3Key,
        size: compressedData.length,
        collections: collections,
        status: 'completed'
      });
      
      console.log(`Full backup completed: ${backupId}`);
      
      return { backupId, s3Key, size: compressedData.length };
      
    } catch (error) {
      console.error('Full backup failed:', error);
      throw error;
    }
  }
  
  async createIncrementalBackup(lastBackupTime) {
    try {
      const timestamp = new Date().toISOString();
      const backupId = `incremental-backup-${timestamp}`;
      
      console.log(`Starting incremental backup: ${backupId}`);
      
      // Get changes since last backup
      const changes = await this.getChangesSince(lastBackupTime);
      
      if (Object.keys(changes).length === 0) {
        console.log('No changes since last backup');
        return null;
      }
      
      // Compress and upload changes
      const compressedData = await this.compressData(changes);
      const s3Key = `backups/incremental/${backupId}.gz`;
      
      await this.uploadToS3(s3Key, compressedData);
      
      // Record backup metadata
      await this.recordBackup({
        backupId,
        type: 'incremental',
        timestamp: new Date(),
        s3Key,
        size: compressedData.length,
        baseBackupTime: lastBackupTime,
        status: 'completed'
      });
      
      console.log(`Incremental backup completed: ${backupId}`);
      
      return { backupId, s3Key, size: compressedData.length };
      
    } catch (error) {
      console.error('Incremental backup failed:', error);
      throw error;
    }
  }
  
  async backupUserData(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      const userData = {
        user: user.toObject(),
        books: await Book.find({ userId }).lean(),
        subscription: await Subscription.findOne({ userId }).lean(),
        analytics: await Analytics.find({ userId }).lean()
      };
      
      const timestamp = new Date().toISOString();
      const backupId = `user-backup-${userId}-${timestamp}`;
      
      const compressedData = await this.compressData(userData);
      const s3Key = `backups/users/${userId}/${backupId}.gz`;
      
      await this.uploadToS3(s3Key, compressedData);
      
      return {
        backupId,
        s3Key,
        size: compressedData.length,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('User backup failed:', error);
      throw error;
    }
  }
  
  async restoreFromBackup(backupId, options = {}) {
    try {
      const backup = await BackupRecord.findOne({ backupId });
      if (!backup) throw new Error('Backup not found');
      
      console.log(`Starting restore from backup: ${backupId}`);
      
      // Download backup from S3
      const backupData = await this.downloadFromS3(backup.s3Key);
      const decompressedData = await this.decompressData(backupData);
      
      if (backup.type === 'full') {
        await this.restoreFullBackup(decompressedData, options);
      } else if (backup.type === 'incremental') {
        await this.restoreIncrementalBackup(decompressedData, options);
      }
      
      console.log(`Restore completed from backup: ${backupId}`);
      
      return { success: true, backupId };
      
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }
  
  async getChangesSince(timestamp) {
    const changes = {};
    
    // Get modified users
    const modifiedUsers = await User.find({
      updatedAt: { $gt: timestamp }
    }).lean();
    
    if (modifiedUsers.length > 0) {
      changes.users = modifiedUsers;
    }
    
    // Get modified books
    const modifiedBooks = await Book.find({
      updatedAt: { $gt: timestamp }
    }).lean();
    
    if (modifiedBooks.length > 0) {
      changes.books = modifiedBooks;
    }
    
    // Get new analytics events
    const newAnalytics = await Analytics.find({
      timestamp: { $gt: timestamp }
    }).lean();
    
    if (newAnalytics.length > 0) {
      changes.analytics = newAnalytics;
    }
    
    return changes;
  }
  
  async uploadToS3(key, data) {
    const params = {
      Bucket: this.backupBucket,
      Key: key,
      Body: data,
      ServerSideEncryption: 'AES256'
    };
    
    return await this.s3.upload(params).promise();
  }
  
  async downloadFromS3(key) {
    const params = {
      Bucket: this.backupBucket,
      Key: key
    };
    
    const result = await this.s3.getObject(params).promise();
    return result.Body;
  }
  
  async compressData(data) {
    const zlib = require('zlib');
    const jsonString = JSON.stringify(data);
    return zlib.gzipSync(jsonString);
  }
  
  async decompressData(compressedData) {
    const zlib = require('zlib');
    const jsonString = zlib.gunzipSync(compressedData).toString();
    return JSON.parse(jsonString);
  }
  
  async scheduleBackups() {
    const cron = require('node-cron');
    
    // Full backup daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.createFullBackup();
      } catch (error) {
        console.error('Scheduled full backup failed:', error);
      }
    });
    
    // Incremental backup every 4 hours
    cron.schedule('0 */4 * * *', async () => {
      try {
        const lastBackup = await BackupRecord.findOne()
          .sort({ timestamp: -1 });
        
        if (lastBackup) {
          await this.createIncrementalBackup(lastBackup.timestamp);
        }
      } catch (error) {
        console.error('Scheduled incremental backup failed:', error);
      }
    });
    
    // Cleanup old backups weekly
    cron.schedule('0 3 * * 0', async () => {
      try {
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('Backup cleanup failed:', error);
      }
    });
  }
  
  async cleanupOldBackups() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    
    const oldBackups = await BackupRecord.find({
      timestamp: { $lt: cutoffDate }
    });
    
    for (const backup of oldBackups) {
      try {
        // Delete from S3
        await this.s3.deleteObject({
          Bucket: this.backupBucket,
          Key: backup.s3Key
        }).promise();
        
        // Delete record
        await BackupRecord.deleteOne({ _id: backup._id });
        
        console.log(`Deleted old backup: ${backup.backupId}`);
      } catch (error) {
        console.error(`Failed to delete backup ${backup.backupId}:`, error);
      }
    }
  }
}
```

## Real-time Collaboration System

### Collaborative Editing Service
```javascript
class CollaborationService {
  constructor() {
    this.io = require('socket.io')(server);
    this.activeEditors = new Map(); // bookId -> Set of userIds
    this.documentStates = new Map(); // bookId -> document state
  }
  
  initialize() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      
      socket.on('join-document', async (data) => {
        await this.handleJoinDocument(socket, data);
      });
      
      socket.on('leave-document', async (data) => {
        await this.handleLeaveDocument(socket, data);
      });
      
      socket.on('content-change', async (data) => {
        await this.handleContentChange(socket, data);
      });
      
      socket.on('cursor-position', async (data) => {
        await this.handleCursorPosition(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }
  
  async handleJoinDocument(socket, { bookId, chapterId, userId }) {
    try {
      // Verify user has access to the document
      const hasAccess = await this.verifyDocumentAccess(userId, bookId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }
      
      // Join the document room
      socket.join(`doc:${bookId}:${chapterId}`);
      socket.userId = userId;
      socket.bookId = bookId;
      socket.chapterId = chapterId;
      
      // Track active editors
      const editorKey = `${bookId}:${chapterId}`;
      if (!this.activeEditors.has(editorKey)) {
        this.activeEditors.set(editorKey, new Set());
      }
      this.activeEditors.get(editorKey).add(userId);
      
      // Get current document state
      const documentState = await this.getDocumentState(bookId, chapterId);
      
      // Send current state to the joining user
      socket.emit('document-state', documentState);
      
      // Notify other users about the new editor
      socket.to(`doc:${bookId}:${chapterId}`).emit('user-joined', {
        userId,
        timestamp: new Date()
      });
      
      // Send list of active editors
      const activeUsers = Array.from(this.activeEditors.get(editorKey));
      socket.emit('active-editors', activeUsers);
      
    } catch (error) {
      console.error('Join document failed:', error);
      socket.emit('error', { message: 'Failed to join document' });
    }
  }
  
  async handleContentChange(socket, { bookId, chapterId, operation, content }) {
    try {
      // Validate the operation
      if (!this.validateOperation(operation)) {
        socket.emit('error', { message: 'Invalid operation' });
        return;
      }
      
      // Apply operational transformation
      const transformedOperation = await this.transformOperation(
        bookId,
        chapterId,
        operation
      );
      
      // Update document state
      await this.applyOperation(bookId, chapterId, transformedOperation);
      
      // Broadcast to other editors
      socket.to(`doc:${bookId}:${chapterId}`).emit('content-changed', {
        operation: transformedOperation,
        userId: socket.userId,
        timestamp: new Date()
      });
      
      // Create version if significant change
      if (this.isSignificantChange(transformedOperation)) {
        await this.createCollaborativeVersion(bookId, chapterId, content, socket.userId);
      }
      
    } catch (error) {
      console.error('Content change failed:', error);
      socket.emit('error', { message: 'Failed to apply changes' });
    }
  }
  
  async transformOperation(bookId, chapterId, operation) {
    // Operational Transformation (OT) algorithm
    // This is a simplified version - production would use a more robust OT library
    
    const documentState = this.documentStates.get(`${bookId}:${chapterId}`);
    if (!documentState) {
      return operation; // No transformation needed
    }
    
    // Transform against concurrent operations
    let transformedOp = operation;
    
    for (const concurrentOp of documentState.pendingOperations) {
      transformedOp = this.transformAgainstOperation(transformedOp, concurrentOp);
    }
    
    return transformedOp;
  }
  
  transformAgainstOperation(op1, op2) {
    // Simplified OT transformation
    // In production, would use a library like ShareJS or Yjs
    
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + op2.text.length
        };
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + op2.text.length
        };
      }
    }
    
    // Add more transformation rules as needed
    return op1;
  }
  
  async getDocumentState(bookId, chapterId) {
    const book = await Book.findById(bookId);
    const chapter = book.structure.chapters.find(ch => ch.id === chapterId);
    
    return {
      content: chapter?.content || '',
      version: chapter?.version || 1,
      lastModified: chapter?.lastModified || new Date()
    };
  }
  
  async createCollaborativeVersion(bookId, chapterId, content, userId) {
    const versionService = new VersionControlService();
    
    await versionService.createVersion(bookId, chapterId, content, {
      userId,
      authorType: 'collaborative',
      tags: ['collaborative', 'auto-save']
    });
  }
  
  isSignificantChange(operation) {
    // Define what constitutes a significant change
    if (operation.type === 'insert' && operation.text.length > 50) {
      return true;
    }
    
    if (operation.type === 'delete' && operation.length > 50) {
      return true;
    }
    
    return false;
  }
}
```

## Data Recovery System

### Recovery Service
```javascript
class DataRecoveryService {
  constructor() {
    this.backupService = new BackupService();
    this.versionService = new VersionControlService();
  }
  
  async recoverDeletedBook(bookId, userId) {
    try {
      // Check if book exists in recent backups
      const recentBackups = await BackupRecord.find({
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }).sort({ timestamp: -1 });
      
      for (const backup of recentBackups) {
        const bookData = await this.findBookInBackup(backup, bookId);
        if (bookData) {
          // Restore the book
          const restoredBook = await this.restoreBookFromBackup(bookData, userId);
          return restoredBook;
        }
      }
      
      throw new Error('Book not found in recent backups');
      
    } catch (error) {
      console.error('Book recovery failed:', error);
      throw error;
    }
  }
  
  async recoverDeletedChapter(bookId, chapterId, userId) {
    try {
      // First check version history
      const versions = await this.versionService.getVersionHistory(bookId, chapterId);
      
      if (versions.length > 0) {
        // Restore from latest version
        const latestVersion = versions[0];
        await this.versionService.restoreVersion(bookId, chapterId, latestVersion.id, userId);
        return { source: 'version_history', version: latestVersion };
      }
      
      // If no version history, check backups
      const chapterData = await this.findChapterInBackups(bookId, chapterId);
      if (chapterData) {
        await this.restoreChapterFromBackup(bookId, chapterId, chapterData, userId);
        return { source: 'backup', data: chapterData };
      }
      
      throw new Error('Chapter not found in version history or backups');
      
    } catch (error) {
      console.error('Chapter recovery failed:', error);
      throw error;
    }
  }
  
  async generateRecoveryReport(userId) {
    const report = {
      userId,
      generatedAt: new Date(),
      recoveryOptions: {
        books: [],
        chapters: [],
        versions: []
      }
    };
    
    // Check for recoverable books in backups
    const userBackups = await this.findUserDataInBackups(userId);
    report.recoveryOptions.books = userBackups.books || [];
    
    // Check for recoverable chapters
    const userBooks = await Book.find({ userId });
    for (const book of userBooks) {
      const recoverableChapters = await this.findRecoverableChapters(book._id);
      report.recoveryOptions.chapters.push(...recoverableChapters);
    }
    
    // Check version history
    const versionHistory = await this.getRecoverableVersions(userId);
    report.recoveryOptions.versions = versionHistory;
    
    return report;
  }
  
  async findBookInBackup(backup, bookId) {
    try {
      const backupData = await this.backupService.downloadFromS3(backup.s3Key);
      const decompressedData = await this.backupService.decompressData(backupData);
      
      if (decompressedData.books) {
        return decompressedData.books.find(book => book._id.toString() === bookId);
      }
      
      return null;
    } catch (error) {
      console.error('Error searching backup:', error);
      return null;
    }
  }
  
  async restoreBookFromBackup(bookData, userId) {
    // Verify ownership
    if (bookData.userId.toString() !== userId) {
      throw new Error('Unauthorized: Book belongs to different user');
    }
    
    // Create new book with recovered data
    const restoredBook = await Book.create({
      ...bookData,
      _id: undefined, // Let MongoDB generate new ID
      title: `${bookData.title} (Recovered)`,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return restoredBook;
  }
}
```

---

*Version Control & Backup System Version 1.0*
*Last Updated: January 15, 2024*
*Next Phase: Integration testing and performance optimization*