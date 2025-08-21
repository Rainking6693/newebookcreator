const crypto = require('crypto');

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

// Bot detection patterns
const BOT_PATTERNS = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /headless/i, /phantom/i, /selenium/i
];

// Suspicious patterns
const SUSPICIOUS_PATTERNS = {
    tooFast: 100, // ms between requests
    tooManyRequests: 100, // requests per minute
    invalidUserAgent: /^[\w\s\-\.\/\(\);:,]*$/,
    honeypotTriggered: false
};

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Allow': 'POST',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse request
        const body = JSON.parse(event.body || '{}');
        const clientIP = getClientIP(event);
        const userAgent = event.headers['user-agent'] || '';
        const timestamp = Date.now();

        // Security checks
        const securityCheck = await performSecurityChecks(clientIP, userAgent, body, timestamp);
        if (!securityCheck.allowed) {
            console.log(`🚫 Security check failed: ${securityCheck.reason}`);
            return createErrorResponse(403, securityCheck.reason);
        }

        // Validate payload
        const validation = validateAnalyticsPayload(body);
        if (!validation.valid) {
            return createErrorResponse(400, validation.error);
        }

        // Process analytics data
        const processedData = await processAnalyticsData(body, {
            clientIP,
            userAgent,
            timestamp,
            fingerprint: generateFingerprint(event)
        });

        // Store analytics (in production, use a database)
        await storeAnalyticsData(processedData);

        // Update rate limiting
        updateRateLimit(clientIP, timestamp);

        console.log(`✅ Analytics processed: ${processedData.events.length} events`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: JSON.stringify({
                success: true,
                processed: processedData.events.length,
                timestamp: Date.now()
            })
        };

    } catch (error) {
        console.error('❌ Analytics error:', error);
        return createErrorResponse(500, 'Internal server error');
    }
};

async function performSecurityChecks(clientIP, userAgent, body, timestamp) {
    // Check for bot patterns
    if (BOT_PATTERNS.some(pattern => pattern.test(userAgent))) {
        return { allowed: false, reason: 'Bot detected' };
    }

    // Rate limiting check
    const rateLimitCheck = checkRateLimit(clientIP, timestamp);
    if (!rateLimitCheck.allowed) {
        return { allowed: false, reason: 'Rate limit exceeded' };
    }

    // Validate user agent
    if (!userAgent || userAgent.length < 10 || userAgent.length > 500) {
        return { allowed: false, reason: 'Invalid user agent' };
    }

    // Check for suspicious patterns
    if (body.events && body.events.length > 100) {
        return { allowed: false, reason: 'Too many events in single request' };
    }

    // Basic DDoS protection
    if (JSON.stringify(body).length > 50000) {
        return { allowed: false, reason: 'Payload too large' };
    }

    // Geographic restrictions (if needed)
    // const geoCheck = await checkGeolocation(clientIP);
    // if (!geoCheck.allowed) {
    //     return { allowed: false, reason: 'Geographic restriction' };
    // }

    return { allowed: true };
}

function checkRateLimit(clientIP, timestamp) {
    const key = `rate_limit_${clientIP}`;
    const windowSize = 60 * 1000; // 1 minute
    const maxRequests = 60; // 60 requests per minute

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, windowStart: timestamp });
        return { allowed: true };
    }

    const limit = rateLimitStore.get(key);
    
    // Reset window if needed
    if (timestamp - limit.windowStart > windowSize) {
        rateLimitStore.set(key, { count: 1, windowStart: timestamp });
        return { allowed: true };
    }

    // Check if limit exceeded
    if (limit.count >= maxRequests) {
        return { allowed: false, reason: 'Rate limit exceeded' };
    }

    // Increment counter
    limit.count++;
    return { allowed: true };
}

function updateRateLimit(clientIP, timestamp) {
    const key = `rate_limit_${clientIP}`;
    if (rateLimitStore.has(key)) {
        const limit = rateLimitStore.get(key);
        limit.count++;
    }
}

function validateAnalyticsPayload(body) {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Invalid payload format' };
    }

    if (!body.events || !Array.isArray(body.events)) {
        return { valid: false, error: 'Events array required' };
    }

    if (body.events.length === 0) {
        return { valid: false, error: 'At least one event required' };
    }

    // Validate each event
    for (const event of body.events) {
        if (!event.eventType || typeof event.eventType !== 'string') {
            return { valid: false, error: 'Event type required' };
        }

        if (!event.sessionId || typeof event.sessionId !== 'string') {
            return { valid: false, error: 'Session ID required' };
        }

        if (!event.timestamp || typeof event.timestamp !== 'number') {
            return { valid: false, error: 'Timestamp required' };
        }

        // Validate timestamp is reasonable (within last 24 hours)
        const now = Date.now();
        if (event.timestamp > now + 60000 || event.timestamp < now - 86400000) {
            return { valid: false, error: 'Invalid timestamp' };
        }
    }

    return { valid: true };
}

async function processAnalyticsData(body, metadata) {
    const processedEvents = body.events.map(event => ({
        ...event,
        clientIP: hashIP(metadata.clientIP),
        userAgent: metadata.userAgent,
        serverTimestamp: metadata.timestamp,
        fingerprint: metadata.fingerprint,
        processed: true
    }));

    return {
        events: processedEvents,
        meta: {
            ...body.meta,
            serverProcessedAt: metadata.timestamp,
            clientIP: hashIP(metadata.clientIP),
            fingerprint: metadata.fingerprint
        }
    };
}

async function storeAnalyticsData(data) {
    // In production, this would store to a database
    // For now, we'll just log it
    console.log(`📊 Storing analytics data: ${data.events.length} events`);
    
    // You could store to:
    // - PostgreSQL/MySQL
    // - MongoDB
    // - BigQuery
    // - InfluxDB
    // - etc.
    
    // Example structure for database storage:
    /*
    for (const event of data.events) {
        await db.query(`
            INSERT INTO analytics_events (
                event_type, session_id, user_id, timestamp,
                data, client_ip_hash, user_agent, fingerprint
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            event.eventType,
            event.sessionId,
            event.userId,
            event.timestamp,
            JSON.stringify(event.data),
            event.clientIP,
            event.userAgent,
            event.fingerprint
        ]);
    }
    */
}

function getClientIP(event) {
    return event.headers['x-forwarded-for']?.split(',')[0].trim() ||
           event.headers['x-real-ip'] ||
           event.requestContext?.identity?.sourceIp ||
           'unknown';
}

function hashIP(ip) {
    // Hash IP for privacy compliance
    return crypto.createHash('sha256').update(ip + 'daily_decider_salt').digest('hex').substring(0, 16);
}

function generateFingerprint(event) {
    const data = [
        event.headers['user-agent'] || '',
        event.headers['accept-language'] || '',
        event.headers['accept-encoding'] || '',
        getClientIP(event)
    ].join('|');
    
    return crypto.createHash('md5').update(data).digest('hex').substring(0, 12);
}

function createErrorResponse(statusCode, message) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
            error: message,
            timestamp: Date.now()
        })
    };
}

// Cleanup function for rate limiting store
setInterval(() => {
    const now = Date.now();
    const windowSize = 60 * 1000;
    
    for (const [key, value] of rateLimitStore.entries()) {
        if (now - value.windowStart > windowSize * 5) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Cleanup every minute