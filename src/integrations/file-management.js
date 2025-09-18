/**
 * File Management & CDN Integration
 * Cloud storage, CDN, backup systems, and file optimization
 */

import AWS from 'aws-sdk';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Analytics } from '../models/Analytics.js';

class FileManagementService {
  constructor() {
    // AWS S3 Configuration
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    // CloudFront CDN Configuration
    this.cloudfront = new AWS.CloudFront({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    // Storage buckets
    this.buckets = {
      content: process.env.AWS_S3_CONTENT_BUCKET || 'ai-ebook-content',
      backups: process.env.AWS_S3_BACKUP_BUCKET || 'ai-ebook-backups',
      exports: process.env.AWS_S3_EXPORTS_BUCKET || 'ai-ebook-exports',
      assets: process.env.AWS_S3_ASSETS_BUCKET || 'ai-ebook-assets'
    };
    
    // CDN distribution
    this.cdnDomain = process.env.CLOUDFRONT_DOMAIN || 'cdn.ai-ebook-platform.com';
    this.distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    
    // File size limits (in bytes)
    this.limits = {
      image: 10 * 1024 * 1024, // 10MB
      document: 50 * 1024 * 1024, // 50MB
      export: 100 * 1024 * 1024, // 100MB
      backup: 1024 * 1024 * 1024 // 1GB
    };
    
    // Supported file types
    this.supportedTypes = {
      images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      documents: ['.pdf', '.docx', '.epub', '.txt', '.md'],
      exports: ['.pdf', '.epub', '.docx', '.html'],
      covers: ['.jpg', '.jpeg', '.png', '.webp']
    };
  }
  
  // File Upload
  async uploadFile(file, userId, type = 'content', options = {}) {
    try {
      // Validate file
      await this.validateFile(file, type);
      
      // Generate unique filename
      const filename = await this.generateFilename(file.originalname, userId, type);
      
      // Determine bucket
      const bucket = this.getBucketForType(type);
      
      // Process file if needed
      const processedFile = await this.processFile(file, type, options);
      
      // Upload to S3
      const uploadResult = await this.uploadToS3(
        bucket,
        filename,
        processedFile.buffer,
        processedFile.contentType,
        options
      );
      
      // Generate CDN URL
      const cdnUrl = this.generateCDNUrl(filename, type);
      
      // Track upload
      await this.trackFileOperation(userId, 'upload', {
        filename,
        type,
        size: processedFile.buffer.length,
        bucket
      });
      
      return {
        filename,
        originalName: file.originalname,
        size: processedFile.buffer.length,
        contentType: processedFile.contentType,
        url: uploadResult.Location,
        cdnUrl,
        bucket,
        key: filename
      };
      
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
  
  async validateFile(file, type) {
    // Check file size
    const limit = this.limits[type] || this.limits.document;
    if (file.size > limit) {
      throw new Error(`File size exceeds limit of ${this.formatFileSize(limit)}`);
    }
    
    // Check file type
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedTypes = this.supportedTypes[type] || this.supportedTypes.documents;
    
    if (!allowedTypes.includes(extension)) {
      throw new Error(`File type ${extension} not supported for ${type}`);
    }
    
    // Check for malicious content (basic)
    if (file.originalname.includes('..') || file.originalname.includes('/')) {
      throw new Error('Invalid filename');
    }
  }
  
  async generateFilename(originalName, userId, type) {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    
    return `${type}/${userId}/${timestamp}-${random}${extension}`;
  }
  
  getBucketForType(type) {
    const bucketMap = {
      content: this.buckets.content,
      backup: this.buckets.backups,
      export: this.buckets.exports,
      asset: this.buckets.assets,
      cover: this.buckets.assets
    };
    
    return bucketMap[type] || this.buckets.content;
  }
  
  async processFile(file, type, options = {}) {
    let buffer = file.buffer;
    let contentType = file.mimetype;
    
    // Image processing
    if (type === 'cover' || this.supportedTypes.images.includes(path.extname(file.originalname))) {
      const processed = await this.processImage(buffer, options);
      buffer = processed.buffer;
      contentType = processed.contentType;
    }
    
    // Document processing
    if (type === 'export') {
      buffer = await this.optimizeDocument(buffer, file.originalname);
    }
    
    return { buffer, contentType };
  }
  
  async processImage(buffer, options = {}) {
    try {
      let image = sharp(buffer);
      
      // Get image metadata
      const metadata = await image.metadata();
      
      // Resize if needed
      if (options.maxWidth || options.maxHeight) {
        image = image.resize({
          width: options.maxWidth,
          height: options.maxHeight,
          fit: options.fit || 'inside',
          withoutEnlargement: true
        });
      }
      
      // Optimize based on format
      if (metadata.format === 'jpeg' || options.format === 'jpeg') {
        image = image.jpeg({ 
          quality: options.quality || 85,
          progressive: true
        });
      } else if (metadata.format === 'png' || options.format === 'png') {
        image = image.png({ 
          compressionLevel: options.compression || 6,
          progressive: true
        });
      } else if (options.format === 'webp') {
        image = image.webp({ 
          quality: options.quality || 85
        });
      }
      
      const processedBuffer = await image.toBuffer();
      
      return {
        buffer: processedBuffer,
        contentType: `image/${options.format || metadata.format}`
      };
      
    } catch (error) {
      console.error('Image processing failed:', error);
      return { buffer, contentType: 'image/jpeg' };
    }
  }
  
  async optimizeDocument(buffer, filename) {
    // Basic document optimization
    // In production, could implement PDF compression, etc.
    return buffer;
  }
  
  async uploadToS3(bucket, key, buffer, contentType, options = {}) {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      Metadata: {
        uploadedAt: new Date().toISOString(),
        ...options.metadata
      }
    };
    
    // Set cache control for CDN
    if (options.cacheControl) {
      params.CacheControl = options.cacheControl;
    } else {
      // Default cache settings
      params.CacheControl = contentType.startsWith('image/') ? 
        'public, max-age=31536000' : // 1 year for images
        'public, max-age=86400'; // 1 day for documents
    }
    
    // Set ACL if public
    if (options.public) {
      params.ACL = 'public-read';
    }
    
    return await this.s3.upload(params).promise();
  }
  
  // File Download
  async downloadFile(key, bucket = null) {
    try {
      const targetBucket = bucket || this.buckets.content;
      
      const params = {
        Bucket: targetBucket,
        Key: key
      };
      
      const result = await this.s3.getObject(params).promise();
      
      return {
        buffer: result.Body,
        contentType: result.ContentType,
        metadata: result.Metadata,
        lastModified: result.LastModified,
        size: result.ContentLength
      };
      
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  }
  
  async getSignedUrl(key, bucket = null, expiresIn = 3600) {
    try {
      const targetBucket = bucket || this.buckets.content;
      
      const params = {
        Bucket: targetBucket,
        Key: key,
        Expires: expiresIn
      };
      
      return await this.s3.getSignedUrlPromise('getObject', params);
      
    } catch (error) {
      console.error('Signed URL generation failed:', error);
      throw error;
    }
  }
  
  // File Management
  async deleteFile(key, bucket = null) {
    try {
      const targetBucket = bucket || this.buckets.content;
      
      const params = {
        Bucket: targetBucket,
        Key: key
      };
      
      await this.s3.deleteObject(params).promise();
      
      // Invalidate CDN cache
      await this.invalidateCDNCache([key]);
      
      return { success: true };
      
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error;
    }
  }
  
  async copyFile(sourceKey, destinationKey, sourceBucket = null, destBucket = null) {
    try {
      const srcBucket = sourceBucket || this.buckets.content;
      const dstBucket = destBucket || this.buckets.content;
      
      const params = {
        Bucket: dstBucket,
        CopySource: `${srcBucket}/${sourceKey}`,
        Key: destinationKey
      };
      
      return await this.s3.copyObject(params).promise();
      
    } catch (error) {
      console.error('File copy failed:', error);
      throw error;
    }
  }
  
  async listFiles(prefix, bucket = null, maxKeys = 1000) {
    try {
      const targetBucket = bucket || this.buckets.content;
      
      const params = {
        Bucket: targetBucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      };
      
      const result = await this.s3.listObjectsV2(params).promise();
      
      return result.Contents.map(object => ({
        key: object.Key,
        size: object.Size,
        lastModified: object.LastModified,
        etag: object.ETag,
        url: this.generateCDNUrl(object.Key)
      }));
      
    } catch (error) {
      console.error('File listing failed:', error);
      throw error;
    }
  }
  
  // CDN Management
  generateCDNUrl(key, type = 'content') {
    return `https://${this.cdnDomain}/${key}`;
  }
  
  async invalidateCDNCache(paths) {
    try {
      if (!this.distributionId) {
        console.warn('CloudFront distribution ID not configured');
        return;
      }
      
      const params = {
        DistributionId: this.distributionId,
        InvalidationBatch: {
          CallerReference: `invalidation-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths.map(path => `/${path}`)
          }
        }
      };
      
      return await this.cloudfront.createInvalidation(params).promise();
      
    } catch (error) {
      console.error('CDN cache invalidation failed:', error);
      throw error;
    }
  }
  
  // Backup Management
  async createBackup(data, backupType, userId) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${backupType}/${userId}/${timestamp}.json.gz`;
      
      // Compress data
      const zlib = await import('zlib');
      const compressed = zlib.gzipSync(JSON.stringify(data));
      
      // Upload to backup bucket
      const result = await this.uploadToS3(
        this.buckets.backups,
        filename,
        compressed,
        'application/gzip',
        {
          metadata: {
            backupType,
            userId,
            timestamp
          }
        }
      );
      
      // Track backup
      await this.trackFileOperation(userId, 'backup', {
        filename,
        type: backupType,
        size: compressed.length
      });
      
      return {
        filename,
        size: compressed.length,
        url: result.Location,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }
  
  async restoreBackup(filename, userId) {
    try {
      // Download backup
      const backup = await this.downloadFile(filename, this.buckets.backups);
      
      // Decompress data
      const zlib = await import('zlib');
      const decompressed = zlib.gunzipSync(backup.buffer);
      const data = JSON.parse(decompressed.toString());
      
      // Track restore
      await this.trackFileOperation(userId, 'restore', {
        filename,
        size: backup.size
      });
      
      return data;
      
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw error;
    }
  }
  
  async listBackups(userId, backupType = null) {
    try {
      const prefix = backupType ? `${backupType}/${userId}/` : `${userId}/`;
      return await this.listFiles(prefix, this.buckets.backups);
    } catch (error) {
      console.error('Backup listing failed:', error);
      throw error;
    }
  }
  
  async cleanupOldBackups(retentionDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const allBackups = await this.listFiles('', this.buckets.backups);
      const oldBackups = allBackups.filter(backup => 
        backup.lastModified < cutoffDate
      );
      
      const deletePromises = oldBackups.map(backup => 
        this.deleteFile(backup.key, this.buckets.backups)
      );
      
      await Promise.all(deletePromises);
      
      return {
        deleted: oldBackups.length,
        totalSize: oldBackups.reduce((sum, backup) => sum + backup.size, 0)
      };
      
    } catch (error) {
      console.error('Backup cleanup failed:', error);
      throw error;
    }
  }
  
  // File Sharing
  async createShareableLink(key, expiresIn = 86400, bucket = null) {
    try {
      const signedUrl = await this.getSignedUrl(key, bucket, expiresIn);
      
      return {
        url: signedUrl,
        expiresAt: new Date(Date.now() + (expiresIn * 1000)),
        key
      };
      
    } catch (error) {
      console.error('Shareable link creation failed:', error);
      throw error;
    }
  }
  
  async createPublicLink(key, bucket = null) {
    try {
      const targetBucket = bucket || this.buckets.content;
      
      // Make object public
      const params = {
        Bucket: targetBucket,
        Key: key,
        ACL: 'public-read'
      };
      
      await this.s3.putObjectAcl(params).promise();
      
      return this.generateCDNUrl(key);
      
    } catch (error) {
      console.error('Public link creation failed:', error);
      throw error;
    }
  }
  
  // Analytics and Monitoring
  async trackFileOperation(userId, operation, data) {
    try {
      await Analytics.create({
        userId,
        eventType: 'file_operation',
        eventData: {
          operation,
          ...data
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track file operation:', error);
    }
  }
  
  async getStorageUsage(userId) {
    try {
      const userFiles = await this.listFiles(`content/${userId}/`);
      const userBackups = await this.listFiles(`${userId}/`, this.buckets.backups);
      const userExports = await this.listFiles(`export/${userId}/`, this.buckets.exports);
      
      const contentSize = userFiles.reduce((sum, file) => sum + file.size, 0);
      const backupSize = userBackups.reduce((sum, file) => sum + file.size, 0);
      const exportSize = userExports.reduce((sum, file) => sum + file.size, 0);
      
      return {
        content: {
          files: userFiles.length,
          size: contentSize,
          formatted: this.formatFileSize(contentSize)
        },
        backups: {
          files: userBackups.length,
          size: backupSize,
          formatted: this.formatFileSize(backupSize)
        },
        exports: {
          files: userExports.length,
          size: exportSize,
          formatted: this.formatFileSize(exportSize)
        },
        total: {
          files: userFiles.length + userBackups.length + userExports.length,
          size: contentSize + backupSize + exportSize,
          formatted: this.formatFileSize(contentSize + backupSize + exportSize)
        }
      };
      
    } catch (error) {
      console.error('Storage usage calculation failed:', error);
      throw error;
    }
  }
  
  // Utility Methods
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }
  
  isImageFile(filename) {
    const ext = this.getFileExtension(filename);
    return this.supportedTypes.images.includes(ext);
  }
  
  isDocumentFile(filename) {
    const ext = this.getFileExtension(filename);
    return this.supportedTypes.documents.includes(ext);
  }
  
  // Health Check
  async healthCheck() {
    try {
      // Test S3 connectivity
      const s3Health = await this.s3.headBucket({ 
        Bucket: this.buckets.content 
      }).promise();
      
      // Test CDN connectivity (basic)
      const cdnHealth = this.cdnDomain ? 'healthy' : 'not_configured';
      
      return {
        s3: 'healthy',
        cdn: cdnHealth,
        buckets: {
          content: this.buckets.content,
          backups: this.buckets.backups,
          exports: this.buckets.exports,
          assets: this.buckets.assets
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('File management health check failed:', error);
      return {
        s3: 'unhealthy',
        cdn: 'unknown',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

export default FileManagementService;