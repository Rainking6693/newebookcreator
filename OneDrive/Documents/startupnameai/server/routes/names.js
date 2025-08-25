const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const nameGenerator = require('../services/nameGenerator');
const domainChecker = require('../services/domainChecker');
const { AppError, logger } = require('../middleware/errorHandler');
const { pool } = require('../config/database');

const router = express.Router();

// Specialized rate limiting for name generation
const nameGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes per IP
  message: {
    error: 'Too many naming requests. Please wait 15 minutes before trying again.',
    resetTime: new Date(Date.now() + 15 * 60 * 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Input validation middleware
const validateNameRequest = [
  body('keywords')
    .isArray({ min: 1, max: 5 })
    .withMessage('Keywords must be an array with 1-5 items'),
  body('keywords.*')
    .isLength({ min: 2, max: 30 })
    .matches(/^[a-zA-Z0-9\s-]+$/)
    .withMessage('Each keyword must be 2-30 characters, alphanumeric only'),
  body('industry')
    .optional()
    .isIn(['tech', 'health', 'fintech', 'ecommerce', 'saas', 'education', 'food', 'travel'])
    .withMessage('Invalid industry selection'),
  body('style')
    .optional()
    .isIn(['modern', 'classic', 'creative', 'professional'])
    .withMessage('Invalid style selection'),
  body('count')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('Count must be between 10 and 100')
];

// POST /api/names/generate - Master-level name generation endpoint
router.post('/generate', nameGenerationLimiter, validateNameRequest, async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: errors.array()
      });
    }

    const {
      keywords,
      industry = 'tech',
      style = 'modern',
      count = 50,
      userId = null,
      sessionToken = null
    } = req.body;

    // Log the request for analytics
    logger.info('Name generation request:', {
      keywords,
      industry,
      style,
      count,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Create session record
    const sessionId = await createNamingSession({
      userId,
      sessionToken: sessionToken || generateSessionToken(),
      keywords,
      industry,
      style,
      count
    });

    // Generate names using AI
    const generatedNames = await nameGenerator.generateNames({
      keywords,
      industry,
      style,
      count
    });

    // Save generated names to database
    await saveGeneratedNames(sessionId, generatedNames);

    // Update session as completed
    await updateSessionStatus(sessionId, 'completed');

    // Return response with session info
    res.status(200).json({
      success: true,
      message: `Successfully generated ${generatedNames.length} startup names`,
      data: {
        sessionId,
        sessionToken: sessionToken || generateSessionToken(),
        names: generatedNames,
        metadata: {
          keywords,
          industry,
          style,
          totalGenerated: generatedNames.length,
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
      }
    });

  } catch (error) {
    logger.error('Name generation failed:', error);
    next(new AppError('Name generation failed. Please try again.', 500));
  }
});

// GET /api/names/session/:sessionId - Retrieve naming session results
router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || !/^\d+$/.test(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }

    const session = await getNamingSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }

    const names = await getSessionNames(sessionId);

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session.id,
          keywords: session.keywords,
          industry: session.industry,
          style: session.style,
          status: session.status,
          createdAt: session.created_at,
          completedAt: session.completed_at
        },
        names,
        metadata: {
          totalNames: names.length,
          availableDomains: names.filter(n => n.domain_info?.available?.['.com']).length,
          averageBrandabilityScore: names.reduce((sum, n) => sum + (n.brandability_score || 0), 0) / names.length
        }
      }
    });

  } catch (error) {
    logger.error('Session retrieval failed:', error);
    next(new AppError('Failed to retrieve session data', 500));
  }
});

// POST /api/names/analyze - Analyze a custom name
router.post('/analyze', [
  body('name')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Name must be 2-50 characters, alphanumeric and hyphens only')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid name format',
        errors: errors.array()
      });
    }

    const { name } = req.body;

    // Perform comprehensive name analysis
    const [domainInfo, brandabilityAnalysis] = await Promise.all([
      domainChecker.checkAvailability(name),
      nameGenerator.analyzeBrandability ? nameGenerator.analyzeBrandability(name) : null
    ]);

    const analysis = {
      name,
      domain_analysis: domainInfo,
      brandability_analysis: brandabilityAnalysis,
      seo_analysis: {
        length_seo_score: name.length <= 12 ? 9 : name.length <= 15 ? 7 : 5,
        memorability_score: calculateMemorabilityScore(name),
        type_ability_score: /^[a-zA-Z]+$/.test(name) ? 10 : 6
      },
      recommendations: generateNameRecommendations(name, domainInfo, brandabilityAnalysis),
      analyzed_at: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Name analysis failed:', error);
    next(new AppError('Name analysis failed', 500));
  }
});

// GET /api/names/trending - Get trending naming patterns
router.get('/trending', async (req, res, next) => {
  try {
    const trends = await getTrendingPatterns();
    
    res.status(200).json({
      success: true,
      data: {
        trends,
        period: 'last_30_days',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Trending patterns retrieval failed:', error);
    next(new AppError('Failed to get trending patterns', 500));
  }
});

// POST /api/names/export - Export names to PDF
router.post('/export', [
  body('sessionId').isInt().withMessage('Session ID required'),
  body('format').optional().isIn(['pdf', 'csv', 'json']).withMessage('Invalid export format')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sessionId, format = 'pdf' } = req.body;

    const session = await getNamingSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const names = await getSessionNames(sessionId);

    let exportData;
    let contentType;
    let fileName;

    switch (format) {
      case 'pdf':
        exportData = await generatePDFReport(session, names);
        contentType = 'application/pdf';
        fileName = `startup-names-${sessionId}.pdf`;
        break;
      case 'csv':
        exportData = await generateCSVReport(names);
        contentType = 'text/csv';
        fileName = `startup-names-${sessionId}.csv`;
        break;
      case 'json':
        exportData = JSON.stringify({ session, names }, null, 2);
        contentType = 'application/json';
        fileName = `startup-names-${sessionId}.json`;
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(exportData);

  } catch (error) {
    logger.error('Export failed:', error);
    next(new AppError('Export failed', 500));
  }
});

// Helper functions
async function createNamingSession(data) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO naming_sessions (user_id, session_token, keywords, industry, style, name_count)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.userId, data.sessionToken, data.keywords, data.industry, data.style, data.count]
    );
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

async function saveGeneratedNames(sessionId, names) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const name of names) {
      await client.query(
        `INSERT INTO generated_names (session_id, name, explanation, brandability_score, domain_available, domain_extensions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          sessionId,
          name.name,
          name.explanation,
          name.brandability_score,
          name.domain_info?.available?.['.com'] || false,
          JSON.stringify(name.domain_info || {})
        ]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateSessionStatus(sessionId, status) {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE naming_sessions SET status = $1, completed_at = NOW() WHERE id = $2',
      [status, sessionId]
    );
  } finally {
    client.release();
  }
}

async function getNamingSession(sessionId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM naming_sessions WHERE id = $1 AND created_at > NOW() - INTERVAL \'7 days\'',
      [sessionId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

async function getSessionNames(sessionId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM generated_names WHERE session_id = $1 ORDER BY brandability_score DESC',
      [sessionId]
    );
    return result.rows.map(row => ({
      ...row,
      domain_extensions: JSON.parse(row.domain_extensions || '{}')
    }));
  } finally {
    client.release();
  }
}

function generateSessionToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

function calculateMemorabilityScore(name) {
  let score = 10;
  if (name.length > 15) score -= 3;
  if (!/[aeiou]/i.test(name)) score -= 2;
  if (/(.)\1{2,}/.test(name)) score -= 2;
  return Math.max(1, score);
}

function generateNameRecommendations(name, domainInfo, brandabilityAnalysis) {
  const recommendations = [];
  
  if (!domainInfo?.available?.['.com']) {
    recommendations.push('Consider name variations - .com domain not available');
  }
  
  if (brandabilityAnalysis?.overall_score < 6) {
    recommendations.push('Name could be more brandable - consider simplifying');
  }
  
  if (name.length > 12) {
    recommendations.push('Shorter names are often more memorable and brandable');
  }
  
  return recommendations;
}

async function getTrendingPatterns() {
  // This would analyze recent naming sessions for patterns
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT industry, style, COUNT(*) as count
      FROM naming_sessions 
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY industry, style
      ORDER BY count DESC
      LIMIT 10
    `);
    
    return result.rows;
  } finally {
    client.release();
  }
}

async function generatePDFReport(session, names) {
  // PDF generation would be implemented here
  // For now, return placeholder
  return Buffer.from('PDF report would be generated here');
}

async function generateCSVReport(names) {
  const headers = 'Name,Explanation,Brandability Score,Domain Available\n';
  const rows = names.map(name => 
    `"${name.name}","${name.explanation}",${name.brandability_score},${name.domain_available}`
  ).join('\n');
  
  return headers + rows;
}

module.exports = router;