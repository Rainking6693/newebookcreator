class DailyDeciderApp {
    constructor() {
        this.decisionEngine = new AdvancedDecisionEngine();
        this.complimentEngine = new ComplimentEngine();
        this.analytics = window.dailyDeciderAnalytics;
        this.initialized = false;
        this.currentSession = {
            decisions: [],
            compliments: [],
            startTime: Date.now()
        };
        
        this.init();
    }

    async init() {
        if (this.initialized) return;
        
        try {
            await this.complimentEngine.initialize();
            this.setupEventListeners();
            this.setupFormHandling();
            this.setupUIEnhancements();
            await this.displayDailyCompliment();
            
            this.initialized = true;
            console.log('Daily Decider App initialized successfully');
            
            if (this.analytics) {
                this.analytics.trackConversionFunnel('interest');
            }
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showErrorMessage('Failed to initialize the application. Please refresh and try again.');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('decisionForm');
        const complimentBtn = document.getElementById('complimentBtn');
        const addOptionBtn = document.getElementById('addOption');
        
        if (form) {
            form.addEventListener('submit', (e) => this.handleDecisionSubmit(e));
        }
        
        if (complimentBtn) {
            complimentBtn.addEventListener('click', (e) => this.handleComplimentRequest(e));
        }
        
        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', (e) => this.addOptionInput(e));
        }
        
        // Setup dynamic option removal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-option')) {
                this.removeOptionInput(e.target);
            }
        });
        
        // Track form interactions
        document.addEventListener('focus', (e) => {
            if (e.target.matches('#question, input[type="text"]')) {
                this.analytics?.trackConversionFunnel('consideration');
            }
        });
    }

    setupFormHandling() {
        const questionField = document.getElementById('question');
        
        if (questionField) {
            questionField.addEventListener('input', this.debounce((e) => {
                this.validateQuestion(e.target.value);
                this.provideLiveGuidance(e.target.value);
            }, 500));
        }
        
        // Auto-resize textarea
        if (questionField) {
            questionField.addEventListener('input', () => {
                questionField.style.height = 'auto';
                questionField.style.height = (questionField.scrollHeight) + 'px';
            });
        }
    }

    setupUIEnhancements() {
        // Add loading states
        this.createLoadingIndicator();
        
        // Setup keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleDecisionSubmit();
                }
                if (e.key === 'k') {
                    e.preventDefault();
                    document.getElementById('question')?.focus();
                }
            }
        });
        
        // Add tooltip for shortcuts
        this.addKeyboardShortcutHints();
    }

    validateQuestion(question) {
        const questionField = document.getElementById('question');
        const submitBtn = document.getElementById('submitBtn');
        
        if (!questionField || !submitBtn) return;
        
        const isValid = question.trim().length >= 10;
        
        if (isValid) {
            questionField.classList.remove('invalid');
            submitBtn.disabled = false;
        } else {
            questionField.classList.add('invalid');
            submitBtn.disabled = true;
        }
    }

    provideLiveGuidance(question) {
        if (question.length < 20) return;
        
        // Analyze question and provide helpful hints
        const guidance = this.analyzeQuestionForGuidance(question);
        this.showGuidanceMessage(guidance);
    }

    analyzeQuestionForGuidance(question) {
        const lowerQ = question.toLowerCase();
        
        if (lowerQ.includes('should i') && !lowerQ.includes('or')) {
            return {
                type: 'suggestion',
                message: 'Consider adding specific options to get more targeted guidance.'
            };
        }
        
        if (question.length > 200) {
            return {
                type: 'tip',
                message: 'Try to keep your question focused for the best results.'
            };
        }
        
        if (!question.includes('?') && !lowerQ.includes('should')) {
            return {
                type: 'tip',
                message: 'Frame this as a decision you need to make for better guidance.'
            };
        }
        
        return null;
    }

    showGuidanceMessage(guidance) {
        if (!guidance) return;
        
        const existing = document.querySelector('.guidance-message');
        if (existing) existing.remove();
        
        const guidanceEl = document.createElement('div');
        guidanceEl.className = `guidance-message guidance-${guidance.type}`;
        guidanceEl.innerHTML = `
            <span class="guidance-icon">${guidance.type === 'tip' ? '💡' : '🎯'}</span>
            <span class="guidance-text">${guidance.message}</span>
        `;
        
        const form = document.getElementById('decisionForm');
        form?.appendChild(guidanceEl);
        
        setTimeout(() => guidanceEl.remove(), 5000);
    }

    async handleDecisionSubmit(e) {
        if (e) e.preventDefault();
        
        const questionField = document.getElementById('question');
        const question = questionField?.value.trim();
        
        if (!question || question.length < 10) {
            this.showErrorMessage('Please enter a question with at least 10 characters.');
            return;
        }
        
        try {
            this.showLoadingState(true);
            
            const options = this.getDecisionOptions();
            const context = this.buildDecisionContext();
            
            // Track decision request
            const decisionData = this.analytics?.trackDecisionRequest(question, options);
            
            const result = await this.decisionEngine.makeDecision(question, options, context);
            
            // Track decision response
            this.analytics?.trackDecisionResponse(decisionData, result);
            
            this.displayDecisionResult(result);
            this.currentSession.decisions.push({ question, options, result, timestamp: Date.now() });
            
            // Track conversion
            this.analytics?.trackConversionFunnel('action');
            
        } catch (error) {
            console.error('Decision error:', error);
            this.showErrorMessage('Unable to process your decision right now. Please try again.');
        } finally {
            this.showLoadingState(false);
        }
    }

    getDecisionOptions() {
        const optionInputs = document.querySelectorAll('.option-input input');
        return Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(option => option.length > 0);
    }

    buildDecisionContext() {
        return {
            sessionId: this.analytics?.sessionId,
            timestamp: Date.now(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            sessionDecisions: this.currentSession.decisions.length,
            sessionCompliments: this.currentSession.compliments.length
        };
    }

    displayDecisionResult(result) {
        const resultSection = document.getElementById('resultSection');
        if (!resultSection) return;
        
        // Update confidence badge
        const confidenceBadge = document.getElementById('confidenceBadge');
        if (confidenceBadge) {
            const confidence = result.confidence;
            let level, text;
            
            if (confidence >= 0.8) {
                level = 'high';
                text = 'High Confidence';
            } else if (confidence >= 0.6) {
                level = 'medium';
                text = 'Medium Confidence';
            } else {
                level = 'low';
                text = 'Low Confidence';
            }
            
            confidenceBadge.className = `confidence-badge confidence-${level}`;
            confidenceBadge.textContent = `${text} (${Math.round(confidence * 100)}%)`;
        }
        
        // Update decision result
        const decisionResult = document.getElementById('decisionResult');
        if (decisionResult) {
            decisionResult.textContent = result.decision;
        }
        
        // Update reasoning
        const reasoning = document.getElementById('reasoning');
        if (reasoning) {
            reasoning.textContent = result.reasoning;
        }
        
        // Update factors
        this.displayDecisionFactors(result.factors);
        
        // Show follow-up suggestions
        this.displayFollowUpSuggestions(result.followUpSuggestions);
        
        // Show result section with animation
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Add feedback option
        this.addFeedbackOption(result);
    }

    displayDecisionFactors(factors) {
        const factorsContainer = document.getElementById('factors');
        if (!factorsContainer || !factors) return;
        
        factorsContainer.innerHTML = '';
        
        const factorMappings = {
            temporal: { label: 'Timing', icon: '⏰' },
            sentiment: { label: 'Sentiment', icon: '🎭' },
            pattern: { label: 'Patterns', icon: '🔄' },
            contextual: { label: 'Context', icon: '🌍' },
            personalAlignment: { label: 'Personal Fit', icon: '👤' },
            complexity: { label: 'Complexity', icon: '🧩' }
        };
        
        Object.entries(factors).forEach(([key, value]) => {
            const mapping = factorMappings[key];
            if (!mapping || typeof value !== 'object') return;
            
            const factorEl = document.createElement('div');
            factorEl.className = 'factor';
            
            const score = typeof value === 'number' ? value : 
                         value.overallScore || value.clarity || value.polarity || 0;
            const percentage = Math.round(Math.abs(score) * 100);
            
            factorEl.innerHTML = `
                <div class="factor-label">${mapping.icon} ${mapping.label}</div>
                <div class="factor-value">${percentage}%</div>
            `;
            
            factorsContainer.appendChild(factorEl);
        });
    }

    displayFollowUpSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) return;
        
        const existingSuggestions = document.querySelector('.follow-up-suggestions');
        if (existingSuggestions) existingSuggestions.remove();
        
        const suggestionsEl = document.createElement('div');
        suggestionsEl.className = 'follow-up-suggestions';
        suggestionsEl.innerHTML = `
            <h4>Follow-up Suggestions:</h4>
            <ul>
                ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
        `;
        
        const resultSection = document.getElementById('resultSection');
        resultSection?.appendChild(suggestionsEl);
    }

    addFeedbackOption(result) {
        const existingFeedback = document.querySelector('.decision-feedback');
        if (existingFeedback) existingFeedback.remove();
        
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'decision-feedback';
        feedbackEl.innerHTML = `
            <div class="feedback-question">How helpful was this decision guidance?</div>
            <div class="feedback-buttons">
                <button class="feedback-btn" data-rating="1">😞</button>
                <button class="feedback-btn" data-rating="3">😐</button>
                <button class="feedback-btn" data-rating="5">😊</button>
                <button class="feedback-btn" data-rating="7">😄</button>
                <button class="feedback-btn" data-rating="10">🤩</button>
            </div>
        `;
        
        feedbackEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('feedback-btn')) {
                const rating = parseInt(e.target.dataset.rating);
                this.handleDecisionFeedback(result, rating);
                feedbackEl.style.display = 'none';
            }
        });
        
        const resultSection = document.getElementById('resultSection');
        resultSection?.appendChild(feedbackEl);
    }

    handleDecisionFeedback(result, rating) {
        const feedback = {
            rating: rating / 10,
            timestamp: Date.now(),
            decision: result.decision,
            confidence: result.confidence
        };
        
        this.analytics?.trackUserFeedback('decision_satisfaction', feedback);
        
        // Update user patterns based on feedback
        this.decisionEngine.patternMatcher?.updatePatterns(
            result.questionHash,
            result,
            feedback
        );
        
        this.showFeedbackThankYou(rating);
    }

    showFeedbackThankYou(rating) {
        const messages = {
            1: "Thanks for the feedback. We'll work on improving the guidance quality.",
            3: "Thank you! We're always working to provide better decision support.",
            5: "Thanks! Your feedback helps us improve the decision-making experience.",
            7: "Great! We're glad the guidance was helpful for your decision.",
            10: "Wonderful! Thanks for letting us know the guidance hit the mark perfectly."
        };
        
        this.showSuccessMessage(messages[rating] || "Thank you for your feedback!");
    }

    async handleComplimentRequest(e) {
        e?.preventDefault();
        
        try {
            this.showLoadingState(true, 'Getting your compliment...');
            
            const context = this.buildDecisionContext();
            const compliment = await this.complimentEngine.getPersonalizedCompliment(context);
            
            this.displayCompliment(compliment);
            this.currentSession.compliments.push({ compliment, timestamp: Date.now() });
            
            this.analytics?.trackComplimentView(compliment);
            
        } catch (error) {
            console.error('Compliment error:', error);
            this.showErrorMessage('Unable to get your compliment right now. Please try again.');
        } finally {
            this.showLoadingState(false);
        }
    }

    displayCompliment(compliment) {
        const complimentSection = document.getElementById('complimentSection');
        const complimentText = document.getElementById('complimentText');
        const complimentCategory = document.getElementById('complimentCategory');
        
        if (!complimentSection || !complimentText || !complimentCategory) return;
        
        complimentText.textContent = compliment.text;
        complimentCategory.textContent = compliment.category.replace('-', ' ').toUpperCase();
        
        complimentSection.classList.remove('hidden');
        complimentSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Add compliment feedback
        this.addComplimentFeedback(compliment);
    }

    async displayDailyCompliment() {
        // Show a compliment on page load
        setTimeout(async () => {
            try {
                const context = this.buildDecisionContext();
                const compliment = await this.complimentEngine.getPersonalizedCompliment(context);
                this.displayCompliment(compliment);
            } catch (error) {
                console.error('Error displaying daily compliment:', error);
            }
        }, 2000);
    }

    addComplimentFeedback(compliment) {
        const existingFeedback = document.querySelector('.compliment-feedback');
        if (existingFeedback) existingFeedback.remove();
        
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'compliment-feedback';
        feedbackEl.innerHTML = `
            <div class="feedback-question">Did this brighten your day?</div>
            <div class="feedback-buttons">
                <button class="feedback-btn" data-helpful="false">Not really</button>
                <button class="feedback-btn" data-helpful="true">Yes! ✨</button>
            </div>
        `;
        
        feedbackEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('feedback-btn')) {
                const helpful = e.target.dataset.helpful === 'true';
                this.handleComplimentFeedback(compliment, helpful);
                feedbackEl.style.display = 'none';
            }
        });
        
        const complimentSection = document.getElementById('complimentSection');
        complimentSection?.appendChild(feedbackEl);
    }

    handleComplimentFeedback(compliment, helpful) {
        const feedback = {
            helpful,
            timestamp: Date.now(),
            category: compliment.category,
            sentiment: compliment.sentiment
        };
        
        this.analytics?.trackUserFeedback('compliment_satisfaction', feedback);
        
        const message = helpful ? 
            "So glad it brightened your day! 🌟" : 
            "Thanks for the feedback. We'll keep improving our compliments.";
        
        this.showSuccessMessage(message);
    }

    addOptionInput(e) {
        e?.preventDefault();
        
        const optionsContainer = document.getElementById('optionsContainer');
        const optionCount = optionsContainer.querySelectorAll('.option-input').length;
        
        if (optionCount >= 6) {
            this.showErrorMessage('Maximum of 6 options allowed.');
            return;
        }
        
        const optionEl = document.createElement('div');
        optionEl.className = 'option-input';
        optionEl.innerHTML = `
            <input type="text" placeholder="Option ${optionCount + 1}">
            <button type="button" class="remove-option">×</button>
        `;
        
        optionsContainer.appendChild(optionEl);
        optionEl.querySelector('input').focus();
        
        // Animate in
        optionEl.style.opacity = '0';
        optionEl.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            optionEl.style.opacity = '1';
            optionEl.style.transform = 'translateY(0)';
        }, 50);
    }

    removeOptionInput(button) {
        const optionInput = button.closest('.option-input');
        const optionsContainer = document.getElementById('optionsContainer');
        
        if (optionsContainer.querySelectorAll('.option-input').length <= 2) {
            this.showErrorMessage('Minimum of 2 options required.');
            return;
        }
        
        // Animate out
        optionInput.style.opacity = '0';
        optionInput.style.transform = 'translateY(-10px)';
        setTimeout(() => optionInput.remove(), 200);
    }

    showLoadingState(loading, message = 'Processing your decision...') {
        const submitBtn = document.getElementById('submitBtn');
        
        if (loading) {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('btn-loading');
                submitBtn.textContent = message;
            }
        } else {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-loading');
                submitBtn.textContent = 'Get My Decision';
            }
        }
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existing = document.querySelector('.app-message');
        if (existing) existing.remove();
        
        const messageEl = document.createElement('div');
        messageEl.className = `app-message app-message-${type}`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        // Auto remove after 5 seconds
        setTimeout(() => messageEl.remove(), 5000);
        
        // Click to dismiss
        messageEl.addEventListener('click', () => messageEl.remove());
    }

    createLoadingIndicator() {
        if (document.querySelector('.loading-indicator')) return;
        
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-indicator hidden';
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Processing...</div>
        `;
        
        document.body.appendChild(loadingEl);
    }

    addKeyboardShortcutHints() {
        const hints = document.createElement('div');
        hints.className = 'keyboard-hints';
        hints.innerHTML = `
            <div class="hint">
                <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit
            </div>
            <div class="hint">
                <kbd>Ctrl</kbd> + <kbd>K</kbd> to focus question
            </div>
        `;
        
        document.body.appendChild(hints);
    }

    debounce(func, wait) {
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

    // Public API methods
    getSessionSummary() {
        return {
            ...this.currentSession,
            sessionDuration: Date.now() - this.currentSession.startTime,
            analytics: this.analytics?.getAnalyticsSummary()
        };
    }

    resetSession() {
        this.currentSession = {
            decisions: [],
            compliments: [],
            startTime: Date.now()
        };
        
        // Clear UI
        document.getElementById('question').value = '';
        document.getElementById('resultSection').classList.add('hidden');
        document.getElementById('complimentSection').classList.add('hidden');
        
        // Reset options to default
        const optionsContainer = document.getElementById('optionsContainer');
        const options = optionsContainer.querySelectorAll('.option-input');
        options.forEach((option, index) => {
            if (index < 2) {
                option.querySelector('input').value = '';
            } else {
                option.remove();
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dailyDeciderApp = new DailyDeciderApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailyDeciderApp;
}