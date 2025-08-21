class AdvancedDecisionEngine {
    constructor() {
        this.version = "2.1.0";
        this.weights = {
            temporal: 0.25,
            pattern: 0.30,
            sentiment: 0.20,
            contextual: 0.15,
            randomization: 0.10
        };
        this.userPatterns = new Map();
        this.decisionHistory = [];
        this.sentimentAnalyzer = new SentimentAnalyzer();
        this.temporalProcessor = new TemporalProcessor();
        this.patternMatcher = new PatternMatcher();
    }

    async makeDecision(question, options = [], context = {}) {
        const startTime = performance.now();
        const sessionId = context.sessionId || this.generateSessionId();
        
        try {
            const analysis = await this.analyzeDecisionRequest(question, options, context);
            const decision = await this.processDecision(analysis);
            const confidence = this.calculateConfidence(analysis, decision);
            
            const result = {
                decision: decision.choice,
                reasoning: decision.reasoning,
                confidence: confidence,
                processingTime: performance.now() - startTime,
                algorithm: this.version,
                factors: analysis.factors,
                alternatives: decision.alternatives,
                followUpSuggestions: this.generateFollowUps(decision, analysis)
            };

            await this.recordDecision(sessionId, question, result);
            await this.updateUserPatterns(sessionId, analysis, result);
            
            return result;
        } catch (error) {
            console.error('Decision engine error:', error);
            return this.fallbackDecision(question, options);
        }
    }

    async analyzeDecisionRequest(question, options, context) {
        const factors = {};
        
        factors.temporal = this.temporalProcessor.analyze(context.timestamp || Date.now());
        factors.sentiment = await this.sentimentAnalyzer.analyze(question);
        factors.pattern = this.patternMatcher.findPatterns(question, this.decisionHistory);
        factors.contextual = this.analyzeContext(context);
        factors.complexity = this.assessComplexity(question, options);
        
        const userProfile = await this.getUserProfile(context.sessionId);
        factors.personalAlignment = this.calculatePersonalAlignment(factors, userProfile);
        
        return {
            question,
            options,
            context,
            factors,
            userProfile,
            timestamp: Date.now()
        };
    }

    async processDecision(analysis) {
        const { question, options, factors } = analysis;
        
        if (options.length === 0) {
            return this.generateOpenEndedDecision(analysis);
        }
        
        if (options.length === 2) {
            return this.processBinaryDecision(analysis);
        }
        
        return this.processMultipleChoiceDecision(analysis);
    }

    processBinaryDecision(analysis) {
        const { factors, options } = analysis;
        
        let score = 0.5;
        
        score += factors.sentiment.polarity * this.weights.sentiment;
        score += factors.temporal.decisionBias * this.weights.temporal;
        score += factors.pattern.recommendationStrength * this.weights.pattern;
        score += factors.contextual.urgencyFactor * this.weights.contextual;
        score += (Math.random() - 0.5) * this.weights.randomization;
        
        score = Math.max(0, Math.min(1, score));
        
        const choice = score > 0.5 ? options[1] || "Yes" : options[0] || "No";
        const confidence = Math.abs(score - 0.5) * 2;
        
        return {
            choice,
            reasoning: this.generateReasoning(analysis, score, confidence),
            alternatives: [options[0] || "No", options[1] || "Yes"],
            score,
            confidence
        };
    }

    processMultipleChoiceDecision(analysis) {
        const { factors, options } = analysis;
        const scores = options.map(() => Math.random());
        
        scores.forEach((score, index) => {
            scores[index] += factors.sentiment.polarity * this.weights.sentiment * (Math.random() * 0.5 + 0.5);
            scores[index] += factors.temporal.decisionBias * this.weights.temporal * (Math.random() * 0.3 + 0.7);
            scores[index] += factors.pattern.optionBias[index] || 0;
        });
        
        const maxIndex = scores.indexOf(Math.max(...scores));
        const choice = options[maxIndex];
        const confidence = (Math.max(...scores) - Math.min(...scores)) / Math.max(...scores);
        
        return {
            choice,
            reasoning: this.generateMultiChoiceReasoning(analysis, scores, maxIndex),
            alternatives: options.filter((_, i) => i !== maxIndex),
            scores,
            confidence
        };
    }

    generateOpenEndedDecision(analysis) {
        const templates = [
            "Based on your question, I suggest focusing on {focus_area}",
            "Consider approaching this from a {approach} perspective",
            "The key factor here seems to be {key_factor}",
            "Your best path forward likely involves {action_type}"
        ];
        
        const focusAreas = ["the long-term benefits", "immediate impact", "personal growth", "practical considerations", "emotional well-being"];
        const approaches = ["analytical", "creative", "systematic", "intuitive", "collaborative"];
        const keyFactors = ["timing", "resources", "relationships", "personal values", "future goals"];
        const actionTypes = ["careful planning", "bold action", "seeking advice", "gathering more information", "trusting your instincts"];
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        const choice = template
            .replace("{focus_area}", focusAreas[Math.floor(Math.random() * focusAreas.length)])
            .replace("{approach}", approaches[Math.floor(Math.random() * approaches.length)])
            .replace("{key_factor}", keyFactors[Math.floor(Math.random() * keyFactors.length)])
            .replace("{action_type}", actionTypes[Math.floor(Math.random() * actionTypes.length)]);
        
        return {
            choice,
            reasoning: "This guidance considers your question's context, current timing, and potential outcomes.",
            alternatives: [],
            confidence: 0.75
        };
    }

    generateReasoning(analysis, score, confidence) {
        const reasons = [];
        
        if (analysis.factors.temporal.timeOfDay === "morning") {
            reasons.push("Morning energy favors decisive action");
        } else if (analysis.factors.temporal.timeOfDay === "evening") {
            reasons.push("Evening reflection supports thoughtful choices");
        }
        
        if (analysis.factors.sentiment.polarity > 0.3) {
            reasons.push("Your positive framing suggests readiness for this step");
        } else if (analysis.factors.sentiment.polarity < -0.3) {
            reasons.push("Consider addressing underlying concerns first");
        }
        
        if (confidence > 0.7) {
            reasons.push("Multiple factors align strongly with this choice");
        } else if (confidence < 0.3) {
            reasons.push("This appears to be a balanced decision either way");
        }
        
        return reasons.join(". ") || "Based on current context and timing factors.";
    }

    calculateConfidence(analysis, decision) {
        let confidence = decision.confidence || 0.5;
        
        if (analysis.factors.pattern.historicalAccuracy > 0.8) {
            confidence += 0.1;
        }
        
        if (analysis.factors.personalAlignment > 0.7) {
            confidence += 0.15;
        }
        
        if (analysis.factors.contextual.clarity > 0.6) {
            confidence += 0.1;
        }
        
        return Math.min(1, confidence);
    }

    async getUserProfile(sessionId) {
        if (!sessionId || !this.userPatterns.has(sessionId)) {
            return this.createDefaultProfile();
        }
        
        return this.userPatterns.get(sessionId);
    }

    createDefaultProfile() {
        return {
            decisionStyle: "balanced",
            riskTolerance: 0.5,
            preferredComplexity: "medium",
            timePreferences: {
                morning: 0.33,
                afternoon: 0.34,
                evening: 0.33
            },
            personalityTraits: {
                analytical: 0.5,
                creative: 0.5,
                decisive: 0.5,
                cautious: 0.5
            },
            historicalSatisfaction: 0.75,
            adaptationRate: 0.1
        };
    }

    calculatePersonalAlignment(factors, userProfile) {
        let alignment = 0.5;
        
        if (factors.complexity.level === userProfile.preferredComplexity) {
            alignment += 0.2;
        }
        
        const timePreference = userProfile.timePreferences[factors.temporal.timeOfDay] || 0.33;
        alignment += (timePreference - 0.33) * 0.5;
        
        return Math.max(0, Math.min(1, alignment));
    }

    generateFollowUps(decision, analysis) {
        const suggestions = [];
        
        if (decision.confidence < 0.6) {
            suggestions.push("Consider gathering more information before finalizing");
            suggestions.push("Set a specific timeframe for making this decision");
        }
        
        if (analysis.factors.sentiment.polarity < 0) {
            suggestions.push("Reflect on what might make this decision feel more positive");
        }
        
        suggestions.push("Check back in 24-48 hours to see how you feel about this choice");
        
        return suggestions;
    }

    generateSessionId() {
        return 'dd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async recordDecision(sessionId, question, result) {
        const record = {
            sessionId,
            questionHash: this.hashQuestion(question),
            timestamp: Date.now(),
            result,
            version: this.version
        };
        
        this.decisionHistory.push(record);
        
        if (this.decisionHistory.length > 1000) {
            this.decisionHistory = this.decisionHistory.slice(-500);
        }
        
        await this.persistDecisionHistory();
    }

    hashQuestion(question) {
        let hash = 0;
        for (let i = 0; i < question.length; i++) {
            const char = question.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    fallbackDecision(question, options) {
        if (options.length === 2) {
            return {
                decision: Math.random() > 0.5 ? options[1] : options[0],
                reasoning: "Random selection due to processing constraints",
                confidence: 0.5,
                processingTime: 0,
                algorithm: "fallback",
                factors: {},
                alternatives: options,
                followUpSuggestions: ["Try asking again for a more detailed analysis"]
            };
        }
        
        if (options.length > 2) {
            return {
                decision: options[Math.floor(Math.random() * options.length)],
                reasoning: "Random selection from available options",
                confidence: 0.4,
                processingTime: 0,
                algorithm: "fallback",
                factors: {},
                alternatives: options.slice(0, -1),
                followUpSuggestions: ["Try asking again for a more detailed analysis"]
            };
        }
        
        return {
            decision: "Consider taking some time to think this through carefully",
            reasoning: "Open-ended guidance",
            confidence: 0.6,
            processingTime: 0,
            algorithm: "fallback",
            factors: {},
            alternatives: [],
            followUpSuggestions: ["Break down your question into specific options"]
        };
    }
}