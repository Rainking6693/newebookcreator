/**
 * Export Service
 * Handles book export to various formats (EPUB, PDF, DOCX, HTML)
 */

import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import EPub from 'epub-gen';

class ExportService {
  constructor() {
    this.exportFormats = ['epub', 'pdf', 'docx', 'html'];
    this.tempDir = process.env.TEMP_DIR || './temp';
    this.outputDir = process.env.OUTPUT_DIR || './exports';
    
    this.ensureDirectories();
  }
  
  async ensureDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }
  
  async exportBook(book, format, settings = {}) {
    try {
      if (!this.exportFormats.includes(format)) {
        throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Validate book has content
      if (!book.structure.chapters || book.structure.chapters.length === 0) {
        throw new Error('Book must have at least one chapter to export');
      }
      
      // Generate export based on format
      const exportResult = await this[`export${format.toUpperCase()}`](book, settings);
      
      return {
        success: true,
        format,
        filename: exportResult.filename,
        filepath: exportResult.filepath,
        size: exportResult.size,
        downloadUrl: exportResult.downloadUrl
      };
      
    } catch (error) {
      console.error(`Export failed for format ${format}:`, error);
      throw error;
    }
  }
  
  // EPUB Export
  async exportEPUB(book, settings) {
    const filename = `${this.sanitizeFilename(book.title)}.epub`;
    const filepath = path.join(this.outputDir, filename);
    
    // Prepare content for EPUB
    const chapters = book.structure.chapters
      .filter(chapter => chapter.content && chapter.content.trim().length > 0)
      .map(chapter => ({
        title: chapter.title,
        data: this.formatChapterContent(chapter.content, 'epub', settings)
      }));
    
    if (chapters.length === 0) {
      throw new Error('No chapters with content found for export');
    }
    
    // EPUB options
    const epubOptions = {
      title: book.title,
      author: settings.authorName || 'Unknown Author',
      publisher: settings.publisher || 'AI Ebook Platform',
      description: book.metadata.description || '',
      cover: settings.coverImage || null,
      css: this.getEPUBStyles(settings),
      fonts: settings.fonts || [],
      lang: settings.language || 'en',
      content: chapters,
      verbose: false
    };
    
    // Generate EPUB
    await new Promise((resolve, reject) => {
      new EPub(epubOptions, filepath)
        .promise
        .then(resolve)
        .catch(reject);
    });
    
    const stats = await fs.stat(filepath);
    
    return {
      filename,
      filepath,
      size: stats.size,
      downloadUrl: `/api/v1/exports/download/${filename}`
    };
  }
  
  // PDF Export
  async exportPDF(book, settings) {
    const filename = `${this.sanitizeFilename(book.title)}.pdf`;
    const filepath = path.join(this.outputDir, filename);
    
    // Generate HTML content
    const htmlContent = await this.generateHTMLContent(book, settings);
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });
      
      // PDF options
      const pdfOptions = {
        path: filepath,
        format: settings.pageSize || 'A4',
        margin: {
          top: settings.marginTop || '1in',
          right: settings.marginRight || '1in',
          bottom: settings.marginBottom || '1in',
          left: settings.marginLeft || '1in'
        },
        printBackground: true,
        displayHeaderFooter: settings.includeHeaderFooter !== false,
        headerTemplate: this.getPDFHeader(book, settings),
        footerTemplate: this.getPDFFooter(book, settings)
      };
      
      // Generate PDF
      await page.pdf(pdfOptions);
      
    } finally {
      await browser.close();
    }
    
    const stats = await fs.stat(filepath);
    
    return {
      filename,
      filepath,
      size: stats.size,
      downloadUrl: `/api/v1/exports/download/${filename}`
    };
  }
  
  // DOCX Export
  async exportDOCX(book, settings) {
    const filename = `${this.sanitizeFilename(book.title)}.docx`;
    const filepath = path.join(this.outputDir, filename);
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: this.generateDOCXContent(book, settings)
      }]
    });
    
    // Generate DOCX
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filepath, buffer);
    
    const stats = await fs.stat(filepath);
    
    return {
      filename,
      filepath,
      size: stats.size,
      downloadUrl: `/api/v1/exports/download/${filename}`
    };
  }
  
  // HTML Export
  async exportHTML(book, settings) {
    const filename = `${this.sanitizeFilename(book.title)}.html`;
    const filepath = path.join(this.outputDir, filename);
    
    // Generate HTML content
    const htmlContent = await this.generateHTMLContent(book, settings);
    
    // Write HTML file
    await fs.writeFile(filepath, htmlContent, 'utf8');
    
    const stats = await fs.stat(filepath);
    
    return {
      filename,
      filepath,
      size: stats.size,
      downloadUrl: `/api/v1/exports/download/${filename}`
    };
  }
  
  // Content Generation Helpers
  async generateHTMLContent(book, settings) {
    const chapters = book.structure.chapters
      .filter(chapter => chapter.content && chapter.content.trim().length > 0)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    let html = `
<!DOCTYPE html>
<html lang="${settings.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(book.title)}</title>
    <style>
        ${this.getHTMLStyles(settings)}
    </style>
</head>
<body>
    <div class="book">
        ${this.generateTitlePage(book, settings)}
        ${this.generateTableOfContents(chapters, settings)}
        
        <div class="content">
            ${chapters.map(chapter => this.generateHTMLChapter(chapter, settings)).join('\n')}
        </div>
    </div>
</body>
</html>`;
    
    return html;
  }
  
  generateDOCXContent(book, settings) {
    const content = [];
    
    // Title page
    content.push(
      new Paragraph({
        text: book.title,
        heading: HeadingLevel.TITLE,
        alignment: 'center'
      })
    );
    
    if (settings.authorName) {
      content.push(
        new Paragraph({
          text: `by ${settings.authorName}`,
          alignment: 'center'
        })
      );
    }
    
    // Add page break
    content.push(new Paragraph({ pageBreakBefore: true }));
    
    // Table of contents
    if (settings.includeTableOfContents !== false) {
      content.push(
        new Paragraph({
          text: 'Table of Contents',
          heading: HeadingLevel.HEADING_1
        })
      );
      
      book.structure.chapters
        .filter(chapter => chapter.content && chapter.content.trim().length > 0)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach((chapter, index) => {
          content.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. ${chapter.title}`,
                  break: 1
                })
              ]
            })
          );
        });
      
      content.push(new Paragraph({ pageBreakBefore: true }));
    }
    
    // Chapters
    book.structure.chapters
      .filter(chapter => chapter.content && chapter.content.trim().length > 0)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(chapter => {
        // Chapter title
        content.push(
          new Paragraph({
            text: chapter.title,
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true
          })
        );
        
        // Chapter content
        const paragraphs = chapter.content.split('\n\n');
        paragraphs.forEach(paragraph => {
          if (paragraph.trim()) {
            content.push(
              new Paragraph({
                text: paragraph.trim()
              })
            );
          }
        });
      });
    
    return content;
  }
  
  generateTitlePage(book, settings) {
    return `
        <div class="title-page">
            <h1 class="book-title">${this.escapeHtml(book.title)}</h1>
            ${settings.authorName ? `<h2 class="author">by ${this.escapeHtml(settings.authorName)}</h2>` : ''}
            ${book.metadata.description ? `<p class="description">${this.escapeHtml(book.metadata.description)}</p>` : ''}
        </div>
        <div class="page-break"></div>
    `;
  }
  
  generateTableOfContents(chapters, settings) {
    if (settings.includeTableOfContents === false) return '';
    
    return `
        <div class="table-of-contents">
            <h2>Table of Contents</h2>
            <ul>
                ${chapters.map((chapter, index) => 
                    `<li><a href="#chapter-${index + 1}">${this.escapeHtml(chapter.title)}</a></li>`
                ).join('')}
            </ul>
        </div>
        <div class="page-break"></div>
    `;
  }
  
  generateHTMLChapter(chapter, settings) {
    const chapterNumber = chapter.order || 1;
    
    return `
        <div class="chapter" id="chapter-${chapterNumber}">
            <h2 class="chapter-title">${this.escapeHtml(chapter.title)}</h2>
            <div class="chapter-content">
                ${this.formatChapterContent(chapter.content, 'html', settings)}
            </div>
        </div>
    `;
  }
  
  formatChapterContent(content, format, settings) {
    let formatted = content;
    
    // Basic formatting
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = `<p>${formatted}</p>`;
    
    // Handle dialogue (for mystery novels)
    if (settings.formatDialogue !== false) {
      formatted = formatted.replace(/"([^"]+)"/g, '<span class="dialogue">"$1"</span>');
    }
    
    // Handle emphasis
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    return formatted;
  }
  
  // Styling
  getHTMLStyles(settings) {
    return `
        body {
            font-family: ${settings.fontFamily || 'Georgia, serif'};
            font-size: ${settings.fontSize || '12pt'};
            line-height: ${settings.lineHeight || '1.6'};
            color: ${settings.textColor || '#333'};
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .book {
            background: white;
        }
        
        .title-page {
            text-align: center;
            padding: 100px 0;
        }
        
        .book-title {
            font-size: 2.5em;
            margin-bottom: 20px;
            color: ${settings.titleColor || '#2c3e50'};
        }
        
        .author {
            font-size: 1.5em;
            color: ${settings.authorColor || '#7f8c8d'};
            margin-bottom: 40px;
        }
        
        .description {
            font-style: italic;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .table-of-contents {
            padding: 40px 0;
        }
        
        .table-of-contents h2 {
            border-bottom: 2px solid ${settings.accentColor || '#3498db'};
            padding-bottom: 10px;
        }
        
        .table-of-contents ul {
            list-style: none;
            padding: 0;
        }
        
        .table-of-contents li {
            margin: 10px 0;
            padding: 5px 0;
        }
        
        .table-of-contents a {
            text-decoration: none;
            color: ${settings.linkColor || '#3498db'};
        }
        
        .chapter {
            margin: 40px 0;
            page-break-before: always;
        }
        
        .chapter-title {
            font-size: 1.8em;
            color: ${settings.chapterTitleColor || '#2c3e50'};
            border-bottom: 1px solid ${settings.accentColor || '#3498db'};
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        .chapter-content p {
            margin: 1em 0;
            text-align: justify;
            text-indent: ${settings.paragraphIndent || '1.5em'};
        }
        
        .chapter-content p:first-child {
            text-indent: 0;
        }
        
        .dialogue {
            font-style: italic;
        }
        
        .page-break {
            page-break-after: always;
        }
        
        @media print {
            .page-break {
                page-break-after: always;
            }
            
            .chapter {
                page-break-before: always;
            }
        }
    `;
  }
  
  getEPUBStyles(settings) {
    return `
        body {
            font-family: ${settings.fontFamily || 'Georgia, serif'};
            font-size: ${settings.fontSize || '1em'};
            line-height: ${settings.lineHeight || '1.6'};
            margin: 0;
            padding: 1em;
        }
        
        h1, h2, h3 {
            color: ${settings.headingColor || '#2c3e50'};
        }
        
        p {
            margin: 1em 0;
            text-align: justify;
            text-indent: ${settings.paragraphIndent || '1.5em'};
        }
        
        p:first-child {
            text-indent: 0;
        }
        
        .dialogue {
            font-style: italic;
        }
    `;
  }
  
  getPDFHeader(book, settings) {
    if (settings.includeHeaderFooter === false) return '';
    
    return `
        <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 20px;">
            ${this.escapeHtml(book.title)}
        </div>
    `;
  }
  
  getPDFFooter(book, settings) {
    if (settings.includeHeaderFooter === false) return '';
    
    return `
        <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 20px;">
            <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
    `;
  }
  
  // Utility Methods
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }
  
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
  
  // File Management
  async getExportFile(filename) {
    const filepath = path.join(this.outputDir, filename);
    
    try {
      const stats = await fs.stat(filepath);
      const content = await fs.readFile(filepath);
      
      return {
        content,
        size: stats.size,
        mimeType: this.getMimeType(filename)
      };
      
    } catch (error) {
      throw new Error('Export file not found');
    }
  }
  
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    const mimeTypes = {
      '.epub': 'application/epub+zip',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.html': 'text/html'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  async cleanupOldExports(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();
      
      for (const file of files) {
        const filepath = path.join(this.outputDir, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filepath);
          console.log(`Cleaned up old export: ${file}`);
        }
      }
      
    } catch (error) {
      console.error('Failed to cleanup old exports:', error);
    }
  }
}

export default ExportService;