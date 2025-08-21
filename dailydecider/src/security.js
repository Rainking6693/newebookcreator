class SecurityManager {
    constructor() {
        this.honeypots = new Map();
        this.rateLimits = new Map();
        this.securityEvents = [];
        this.encryptionKey = this.generateEncryptionKey();
        this.sessionSecurity = {
            maxIdleTime: 30 * 60 * 1000, // 30 minutes
            tokenRotationInterval: 15 * 60 * 1000, // 15 minutes
            maxSessions: 3
        };
        
        this.init();
    }

    init() {
        this.setupCSPViolationReporting();
        this.setupHoneypots();
        this.setupInputSanitization();
        this.setupRateLimiting();
        this.setupSessionSecurity();
        this.monitorDevTools();
        
        console.log('🔒 Security Manager initialized');
    }

    generateEncryptionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    setupCSPViolationReporting() {
        document.addEventListener('securitypolicyviolation', (e) => {
            this.logSecurityEvent('csp_violation', {
                violatedDirective: e.violatedDirective,
                blockedURI: e.blockedURI,
                documentURI: e.documentURI,
                effectiveDirective: e.effectiveDirective,
                lineNumber: e.lineNumber,
                originalPolicy: e.originalPolicy,
                referrer: e.referrer,
                sample: e.sample,
                sourceFile: e.sourceFile,
                statusCode: e.statusCode
            });
        });
    }

    setupHoneypots() {
        // Create invisible honeypot fields
        const honeypotFields = [
            { name: 'email_address', type: 'email' },
            { name: 'user_name', type: 'text' },
            { name: 'confirm_password', type: 'password' }
        ];

        honeypotFields.forEach(field => {
            const honeypot = document.createElement('input');
            honeypot.type = field.type;
            honeypot.name = field.name;
            honeypot.style.cssText = `
                position: absolute !important;
                left: -9999px !important;
                opacity: 0 !important;
                pointer-events: none !important;
                tab-index: -1 !important;
            `;
            honeypot.setAttribute('aria-hidden', 'true');
            honeypot.setAttribute('autocomplete', 'off');
            
            honeypot.addEventListener('input', (e) => {
                this.triggerHoneypot(field.name, e.target.value);
            });
            
            document.body.appendChild(honeypot);
            this.honeypots.set(field.name, honeypot);
        });
    }

    triggerHoneypot(fieldName, value) {
        this.logSecurityEvent('honeypot_triggered', {
            field: fieldName,
            value: value.substring(0, 50), // Limit logged value
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            suspicious: true
        });

        // Implement countermeasures
        this.implementCountermeasures('honeypot');
    }

    setupInputSanitization() {
        // Monitor all form inputs for malicious content
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea')) {
                const sanitized = this.sanitizeInput(e.target.value);
                if (sanitized !== e.target.value) {
                    e.target.value = sanitized;
                    this.logSecurityEvent('input_sanitized', {
                        original: e.target.value.substring(0, 100),
                        sanitized: sanitized.substring(0, 100),
                        element: e.target.tagName + (e.target.id ? '#' + e.target.id : ''),
                        suspicious: true
                    });
                }
            }
        });
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Remove potentially dangerous patterns
        return input
            // Remove script tags
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            // Remove javascript: urls
            .replace(/javascript:/gi, '')
            // Remove on* event handlers
            .replace(/\son\w+\s*=/gi, ' ')
            // Remove data: urls (except images)
            .replace(/data:(?!image\/)/gi, 'data-removed:')
            // Limit length
            .substring(0, 10000);
    }

    setupRateLimiting() {
        const endpoints = [
            { selector: '#decisionForm', limit: 10, window: 60000 }, // 10 decisions per minute
            { selector: '#complimentBtn', limit: 20, window: 60000 }, // 20 compliments per minute
            { selector: 'form', limit: 30, window: 60000 } // 30 form submissions per minute
        ];

        endpoints.forEach(endpoint => {
            const elements = document.querySelectorAll(endpoint.selector);
            elements.forEach(element => {
                element.addEventListener('submit', (e) => {
                    if (!this.checkRateLimit(endpoint.selector, endpoint.limit, endpoint.window)) {
                        e.preventDefault();
                        this.showRateLimitWarning();
                        this.logSecurityEvent('rate_limit_exceeded', {
                            endpoint: endpoint.selector,
                            limit: endpoint.limit,
                            window: endpoint.window
                        });
                    }
                });

                element.addEventListener('click', (e) => {
                    if (!this.checkRateLimit(endpoint.selector, endpoint.limit, endpoint.window)) {
                        e.preventDefault();
                        this.showRateLimitWarning();
                    }
                });
            });
        });
    }

    checkRateLimit(key, limit, window) {
        const now = Date.now();
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, { count: 1, resetTime: now + window });
            return true;
        }

        const rateLimit = this.rateLimits.get(key);
        
        if (now > rateLimit.resetTime) {
            rateLimit.count = 1;
            rateLimit.resetTime = now + window;
            return true;
        }

        if (rateLimit.count >= limit) {
            return false;
        }

        rateLimit.count++;
        return true;
    }

    showRateLimitWarning() {
        const warning = document.createElement('div');
        warning.className = 'security-warning rate-limit-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">Please slow down. You're making requests too quickly.</span>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => warning.remove(), 5000);
    }

    setupSessionSecurity() {
        // Monitor session activity
        let lastActivity = Date.now();
        
        // Update activity timestamp on user interaction
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
            }, { passive: true });
        });

        // Check for session timeout
        setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivity;
            if (timeSinceLastActivity > this.sessionSecurity.maxIdleTime) {
                this.handleSessionTimeout();
            }
        }, 60000); // Check every minute

        // Rotate session token periodically
        setInterval(() => {
            this.rotateSessionToken();
        }, this.sessionSecurity.tokenRotationInterval);
    }

    handleSessionTimeout() {
        this.logSecurityEvent('session_timeout', {
            lastActivity: new Date(lastActivity).toISOString(),
            timeoutDuration: this.sessionSecurity.maxIdleTime
        });

        // Clear sensitive data
        this.clearSensitiveData();
        
        // Optionally reload page or show timeout message
        console.log('🔐 Session timed out due to inactivity');
    }

    rotateSessionToken() {
        const newToken = this.generateSessionToken();
        localStorage.setItem('dd_session_token', newToken);
        
        this.logSecurityEvent('session_token_rotated', {
            timestamp: Date.now()
        });
    }

    generateSessionToken() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    monitorDevTools() {
        let devToolsOpen = false;
        
        const threshold = 160;
        
        const checkDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            
            if ((widthThreshold || heightThreshold) && !devToolsOpen) {
                devToolsOpen = true;
                this.logSecurityEvent('dev_tools_opened', {
                    outerWidth: window.outerWidth,
                    innerWidth: window.innerWidth,
                    outerHeight: window.outerHeight,
                    innerHeight: window.innerHeight,
                    userAgent: navigator.userAgent
                });
            } else if (!widthThreshold && !heightThreshold && devToolsOpen) {
                devToolsOpen = false;
                this.logSecurityEvent('dev_tools_closed', {
                    timestamp: Date.now()
                });
            }
        };

        setInterval(checkDevTools, 500);
        window.addEventListener('resize', checkDevTools);
    }

    encryptData(data) {
        try {
            // Simple encryption for client-side data
            const jsonString = JSON.stringify(data);
            const encoded = btoa(jsonString);
            return encoded;
        } catch (error) {
            console.error('Encryption failed:', error);
            return null;
        }
    }

    decryptData(encryptedData) {
        try {
            const decoded = atob(encryptedData);
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    validateOrigin(origin) {
        const allowedOrigins = [
            'https://dailydecider.app',
            'https://www.dailydecider.app',
            'http://localhost:3000', // Development
            'http://localhost:8000', // Development
        ];

        return allowedOrigins.includes(origin);
    }

    implementCountermeasures(triggerType) {
        console.log(`🚨 Implementing countermeasures for: ${triggerType}`);
        
        switch (triggerType) {
            case 'honeypot':
                this.showFakeLoading();
                this.logSuspiciousActivity('honeypot_interaction');
                break;
                
            case 'rate_limit':
                this.addDelay(2000);
                break;
                
            case 'suspicious_behavior':
                this.increaseSecurity();
                break;
                
            default:
                this.logSecurityEvent('unknown_trigger', { type: triggerType });
        }
    }

    showFakeLoading() {
        // Show fake loading to waste bot time
        const fakeLoader = document.createElement('div');
        fakeLoader.innerHTML = 'Processing...';
        fakeLoader.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10000;
        `;
        
        document.body.appendChild(fakeLoader);
        
        setTimeout(() => {
            fakeLoader.remove();
        }, 5000 + Math.random() * 10000); // 5-15 seconds
    }

    addDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    increaseSecurity() {
        // Implement additional security measures
        this.sessionSecurity.maxIdleTime *= 0.5; // Reduce session timeout
        console.log('🔒 Security level increased');
    }

    logSuspiciousActivity(type) {
        const activity = {
            type,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
        };

        // In production, send to security monitoring service
        console.warn('🚨 Suspicious activity detected:', activity);
    }

    logSecurityEvent(type, data) {
        const event = {
            type,
            timestamp: Date.now(),
            data,
            sessionId: localStorage.getItem('dd_session_id'),
            url: window.location.href
        };

        this.securityEvents.push(event);
        
        // Keep only last 100 events
        if (this.securityEvents.length > 100) {
            this.securityEvents = this.securityEvents.slice(-100);
        }

        // Send critical events immediately
        const criticalEvents = ['csp_violation', 'honeypot_triggered', 'suspicious_behavior'];
        if (criticalEvents.includes(type)) {
            this.reportSecurityEvent(event);
        }
    }

    async reportSecurityEvent(event) {
        try {
            await fetch('/api/security-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Failed to report security event:', error);
        }
    }

    clearSensitiveData() {
        // Clear localStorage items that might contain sensitive data
        const sensitiveKeys = ['dd_user_preferences', 'dd_session_data', 'dd_cache'];
        sensitiveKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        // Clear sessionStorage
        sessionStorage.clear();

        console.log('🗑️  Sensitive data cleared');
    }

    validateRequest(request) {
        // Validate request origin
        if (request.origin && !this.validateOrigin(request.origin)) {
            this.logSecurityEvent('invalid_origin', { origin: request.origin });
            return false;
        }

        // Check for suspicious headers
        const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
        for (const header of suspiciousHeaders) {
            if (request.headers && request.headers[header]) {
                this.logSecurityEvent('suspicious_header', { 
                    header, 
                    value: request.headers[header] 
                });
            }
        }

        return true;
    }

    getSecuritySummary() {
        return {
            totalEvents: this.securityEvents.length,
            eventTypes: [...new Set(this.securityEvents.map(e => e.type))],
            lastEvent: this.securityEvents[this.securityEvents.length - 1],
            honeypotStatus: this.honeypots.size > 0 ? 'active' : 'inactive',
            rateLimitingActive: this.rateLimits.size > 0,
            sessionSecurityLevel: 'enhanced'
        };
    }

    cleanup() {
        this.securityEvents = [];
        this.rateLimits.clear();
        this.honeypots.forEach(honeypot => honeypot.remove());
        this.honeypots.clear();
    }
}

// Initialize security manager
const securityManager = new SecurityManager();
window.dailyDeciderSecurity = securityManager;