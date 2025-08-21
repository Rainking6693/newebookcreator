class AdvancedAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getOrCreateUserId();
        this.events = [];
        this.performanceMetrics = {};
        this.userAgent = navigator.userAgent;
        this.startTime = Date.now();
        this.pageLoadTime = 0;
        this.engagementMetrics = {
            timeOnPage: 0,
            scrollDepth: 0,
            interactionCount: 0,
            decisionsMade: 0,
            complimentsViewed: 0
        };
        
        this.conversionFunnel = {
            awareness: false,
            interest: false,
            consideration: false,
            intent: false,
            evaluation: false,
            action: false
        };
        
        this.privacyCompliant = true;
        this.dataRetentionDays = 30;
        this.initialized = false;
        
        this.init();
    }

    async init() {
        if (this.initialized) return;
        
        this.setupEventListeners();
        this.trackPageLoad();
        this.startEngagementTracking();
        this.setupPerformanceObserver();
        this.trackConversionFunnel('awareness');
        
        this.initialized = true;
        console.log('Advanced Analytics initialized:', this.sessionId);
    }

    generateSessionId() {
        return 'dd_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getOrCreateUserId() {
        let userId = localStorage.getItem('dd_user_id');
        if (!userId) {
            userId = 'dd_user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
            localStorage.setItem('dd_user_id', userId);
        }
        return userId;
    }

    setupEventListeners() {
        window.addEventListener('load', () => this.trackPageLoadComplete());
        window.addEventListener('beforeunload', () => this.trackSessionEnd());
        window.addEventListener('scroll', this.throttle(() => this.trackScrollDepth(), 500));
        
        document.addEventListener('click', (e) => this.trackInteraction(e));
        document.addEventListener('focus', (e) => this.trackFocus(e), true);
        document.addEventListener('blur', (e) => this.trackBlur(e), true);
        
        window.addEventListener('error', (e) => this.trackError(e));
        window.addEventListener('unhandledrejection', (e) => this.trackUnhandledRejection(e));
        
        document.addEventListener('visibilitychange', () => this.trackVisibilityChange());
    }

    trackPageLoad() {
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        if (navigationEntry) {
            this.pageLoadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
        }
        
        this.trackEvent('page_view', {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            connection: this.getConnectionInfo(),
            loadTime: this.pageLoadTime
        });
    }

    trackPageLoadComplete() {
        const loadTime = performance.now();
        this.performanceMetrics.domContentLoaded = loadTime;
        
        this.trackEvent('page_load_complete', {
            loadTime: loadTime,
            performanceMetrics: this.getPerformanceMetrics()
        });
    }

    startEngagementTracking() {
        setInterval(() => {
            if (!document.hidden) {
                this.engagementMetrics.timeOnPage += 1;
            }
        }, 1000);
        
        setInterval(() => {
            this.trackEngagementHeartbeat();
        }, 30000);
    }

    trackEngagementHeartbeat() {
        this.trackEvent('engagement_heartbeat', {
            timeOnPage: this.engagementMetrics.timeOnPage,
            scrollDepth: this.engagementMetrics.scrollDepth,
            interactionCount: this.engagementMetrics.interactionCount,
            timestamp: Date.now()
        });
    }

    trackScrollDepth() {
        const scrollTop = window.pageYOffset;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
        
        if (scrollPercent > this.engagementMetrics.scrollDepth) {
            this.engagementMetrics.scrollDepth = scrollPercent;
            
            const milestones = [25, 50, 75, 100];
            milestones.forEach(milestone => {
                if (scrollPercent >= milestone && !this[`scroll${milestone}Tracked`]) {
                    this[`scroll${milestone}Tracked`] = true;
                    this.trackEvent('scroll_milestone', {
                        milestone: milestone,
                        scrollDepth: scrollPercent
                    });
                }
            });
        }
    }

    trackInteraction(event) {
        this.engagementMetrics.interactionCount++;
        
        const element = event.target;
        const interactionData = {
            type: 'click',
            element: element.tagName.toLowerCase(),
            id: element.id || null,
            className: element.className || null,
            text: element.textContent?.substring(0, 50) || null,
            coordinates: {
                x: event.clientX,
                y: event.clientY
            }
        };
        
        this.trackEvent('user_interaction', interactionData);
        
        if (element.classList.contains('btn-primary')) {
            this.trackConversionFunnel('intent');
        }
        
        if (element.id === 'submitBtn') {
            this.trackConversionFunnel('action');
        }
    }

    trackDecisionRequest(question, options = []) {
        this.engagementMetrics.decisionsMade++;
        
        const decisionData = {
            questionLength: question.length,
            questionType: this.classifyQuestion(question),
            optionCount: options.length,
            decisionType: options.length === 0 ? 'open_ended' : 
                         options.length === 2 ? 'binary' : 'multiple_choice',
            complexity: this.assessQuestionComplexity(question),
            sentiment: this.assessQuestionSentiment(question),
            timeOfDay: this.getTimeOfDay(),
            dayOfWeek: new Date().getDay(),
            timestamp: Date.now()
        };
        
        this.trackEvent('decision_request', decisionData);
        this.trackConversionFunnel('evaluation');
        
        return decisionData;
    }

    trackDecisionResponse(decisionData, response) {
        const responseData = {
            ...decisionData,
            responseTime: response.processingTime,
            confidence: response.confidence,
            algorithm: response.algorithm,
            factors: response.factors,
            satisfaction: null
        };
        
        this.trackEvent('decision_response', responseData);
    }

    trackComplimentView(compliment) {
        this.engagementMetrics.complimentsViewed++;
        
        const complimentData = {
            complimentId: compliment.metadata?.id,
            category: compliment.category,
            sentiment: compliment.sentiment,
            personalityMatch: compliment.personalityMatch,
            timeContext: compliment.timeContext,
            complexity: compliment.complexity,
            timeOfDay: this.getTimeOfDay(),
            timestamp: Date.now()
        };
        
        this.trackEvent('compliment_view', complimentData);
        this.trackConversionFunnel('consideration');
    }

    trackUserFeedback(type, data) {
        const feedbackData = {
            type: type,
            rating: data.rating || null,
            comment: data.comment ? data.comment.substring(0, 200) : null,
            context: data.context || null,
            timestamp: Date.now()
        };
        
        this.trackEvent('user_feedback', feedbackData);
    }

    trackError(event) {
        const errorData = {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack?.substring(0, 500) || null,
            userAgent: this.userAgent,
            url: window.location.href,
            timestamp: Date.now()
        };
        
        this.trackEvent('javascript_error', errorData);
    }

    trackUnhandledRejection(event) {
        const rejectionData = {
            reason: event.reason?.toString().substring(0, 200) || 'Unknown',
            promise: event.promise?.toString().substring(0, 100) || null,
            userAgent: this.userAgent,
            url: window.location.href,
            timestamp: Date.now()
        };
        
        this.trackEvent('unhandled_rejection', rejectionData);
    }

    trackConversionFunnel(stage) {
        if (this.conversionFunnel[stage]) return;
        
        this.conversionFunnel[stage] = true;
        
        this.trackEvent('conversion_funnel', {
            stage: stage,
            funnelState: { ...this.conversionFunnel },
            timestamp: Date.now()
        });
        
        if (stage === 'action') {
            this.trackConversion();
        }
    }

    trackConversion() {
        const conversionData = {
            sessionDuration: Date.now() - this.startTime,
            interactionCount: this.engagementMetrics.interactionCount,
            decisionsMade: this.engagementMetrics.decisionsMade,
            complimentsViewed: this.engagementMetrics.complimentsViewed,
            scrollDepth: this.engagementMetrics.scrollDepth,
            funnelCompletion: Object.values(this.conversionFunnel).filter(Boolean).length,
            timestamp: Date.now()
        };
        
        this.trackEvent('conversion', conversionData);
    }

    trackSessionEnd() {
        const sessionData = {
            duration: Date.now() - this.startTime,
            timeOnPage: this.engagementMetrics.timeOnPage,
            interactionCount: this.engagementMetrics.interactionCount,
            decisionsMade: this.engagementMetrics.decisionsMade,
            complimentsViewed: this.engagementMetrics.complimentsViewed,
            scrollDepth: this.engagementMetrics.scrollDepth,
            bounceRate: this.engagementMetrics.interactionCount === 0 ? 1 : 0,
            conversionFunnel: this.conversionFunnel,
            performanceMetrics: this.getPerformanceMetrics()
        };
        
        this.trackEvent('session_end', sessionData);
        this.sendPendingEvents();
    }

    trackEvent(eventType, data = {}) {
        const event = {
            eventType,
            sessionId: this.sessionId,
            userId: this.userId,
            timestamp: Date.now(),
            data: {
                ...data,
                url: window.location.href,
                userAgent: this.userAgent
            }
        };
        
        this.events.push(event);
        
        if (this.events.length >= 50 || eventType === 'session_end') {
            this.sendPendingEvents();
        }
    }

    async sendPendingEvents() {
        if (this.events.length === 0) return;
        
        const payload = {
            events: [...this.events],
            meta: {
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: Date.now(),
                batchSize: this.events.length
            }
        };
        
        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/analytics', JSON.stringify(payload));
            } else {
                await fetch('/api/analytics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }
            
            this.events = [];
            console.log('Analytics events sent successfully');
        } catch (error) {
            console.error('Failed to send analytics events:', error);
            this.storeEventsLocally(payload);
        }
    }

    storeEventsLocally(payload) {
        try {
            const stored = JSON.parse(localStorage.getItem('dd_pending_events') || '[]');
            stored.push(payload);
            
            if (stored.length > 10) {
                stored.splice(0, stored.length - 10);
            }
            
            localStorage.setItem('dd_pending_events', JSON.stringify(stored));
        } catch (error) {
            console.error('Failed to store events locally:', error);
        }
    }

    async retryPendingEvents() {
        try {
            const pending = JSON.parse(localStorage.getItem('dd_pending_events') || '[]');
            if (pending.length === 0) return;
            
            for (const payload of pending) {
                await fetch('/api/analytics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }
            
            localStorage.removeItem('dd_pending_events');
            console.log('Pending events sent successfully');
        } catch (error) {
            console.error('Failed to retry pending events:', error);
        }
    }

    getPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
            loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            timeToInteractive: this.calculateTimeToInteractive(),
            cumulativeLayoutShift: this.calculateCLS(),
            largestContentfulPaint: this.getLCP()
        };
    }

    calculateTimeToInteractive() {
        const longTasks = performance.getEntriesByType('longtask');
        if (longTasks.length === 0) return performance.now();
        
        const lastLongTask = longTasks[longTasks.length - 1];
        return lastLongTask.startTime + lastLongTask.duration;
    }

    calculateCLS() {
        return new Promise((resolve) => {
            let clsValue = 0;
            
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
            });
            
            observer.observe({ type: 'layout-shift', buffered: true });
            
            setTimeout(() => {
                observer.disconnect();
                resolve(clsValue);
            }, 5000);
        });
    }

    getLCP() {
        return new Promise((resolve) => {
            let lcpValue = 0;
            
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    lcpValue = entry.startTime;
                }
            });
            
            observer.observe({ type: 'largest-contentful-paint', buffered: true });
            
            setTimeout(() => {
                observer.disconnect();
                resolve(lcpValue);
            }, 5000);
        });
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'longtask') {
                        this.trackEvent('long_task', {
                            duration: entry.duration,
                            startTime: entry.startTime
                        });
                    }
                }
            });
            
            observer.observe({ entryTypes: ['longtask', 'layout-shift'] });
        }
    }

    classifyQuestion(question) {
        if (question.includes('?')) return 'question';
        if (question.includes('should')) return 'decision';
        if (question.includes('or')) return 'choice';
        return 'statement';
    }

    assessQuestionComplexity(question) {
        const words = question.split(' ').length;
        if (words < 5) return 'simple';
        if (words < 15) return 'medium';
        return 'complex';
    }

    assessQuestionSentiment(question) {
        const positiveWords = ['good', 'great', 'positive', 'happy', 'love', 'like', 'enjoy'];
        const negativeWords = ['bad', 'terrible', 'negative', 'sad', 'hate', 'dislike', 'worry'];
        
        const words = question.toLowerCase().split(' ');
        const positive = words.filter(word => positiveWords.includes(word)).length;
        const negative = words.filter(word => negativeWords.includes(word)).length;
        
        if (positive > negative) return 'positive';
        if (negative > positive) return 'negative';
        return 'neutral';
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    }

    getConnectionInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        return null;
    }

    trackFocus(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            this.trackEvent('form_focus', {
                element: event.target.tagName.toLowerCase(),
                id: event.target.id,
                placeholder: event.target.placeholder
            });
        }
    }

    trackBlur(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            this.trackEvent('form_blur', {
                element: event.target.tagName.toLowerCase(),
                id: event.target.id,
                valueLength: event.target.value.length,
                completed: event.target.value.length > 0
            });
        }
    }

    trackVisibilityChange() {
        this.trackEvent('visibility_change', {
            hidden: document.hidden,
            visibilityState: document.visibilityState
        });
    }

    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    getAnalyticsSummary() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            sessionDuration: Date.now() - this.startTime,
            engagementMetrics: this.engagementMetrics,
            conversionFunnel: this.conversionFunnel,
            eventCount: this.events.length,
            performanceMetrics: this.performanceMetrics
        };
    }

    cleanup() {
        this.trackSessionEnd();
        window.removeEventListener('beforeunload', this.trackSessionEnd);
    }
}

const analytics = new AdvancedAnalytics();
window.dailyDeciderAnalytics = analytics;