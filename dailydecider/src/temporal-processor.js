class TemporalProcessor {
    constructor() {
        this.seasonalPatterns = {
            spring: { energy: 0.8, optimism: 0.9, growth: 0.95, risk: 0.7 },
            summer: { energy: 0.95, optimism: 0.85, growth: 0.8, risk: 0.8 },
            fall: { energy: 0.6, optimism: 0.7, growth: 0.6, risk: 0.4 },
            winter: { energy: 0.4, optimism: 0.5, growth: 0.7, risk: 0.3 }
        };
        
        this.dailyPatterns = {
            morning: { 
                clarity: 0.9, energy: 0.8, creativity: 0.6, analysis: 0.9,
                decisionBias: 0.15, riskTolerance: 0.7, optimism: 0.8
            },
            afternoon: { 
                clarity: 0.7, energy: 0.6, creativity: 0.8, analysis: 0.7,
                decisionBias: 0.05, riskTolerance: 0.6, optimism: 0.6
            },
            evening: { 
                clarity: 0.5, energy: 0.4, creativity: 0.9, analysis: 0.8,
                decisionBias: -0.1, riskTolerance: 0.4, optimism: 0.5
            },
            night: { 
                clarity: 0.3, energy: 0.2, creativity: 0.7, analysis: 0.6,
                decisionBias: -0.2, riskTolerance: 0.3, optimism: 0.4
            }
        };
        
        this.weekdayPatterns = {
            monday: { motivation: 0.6, stress: 0.8, planning: 0.9, risk: 0.5 },
            tuesday: { motivation: 0.8, stress: 0.6, planning: 0.8, risk: 0.7 },
            wednesday: { motivation: 0.7, stress: 0.7, planning: 0.7, risk: 0.6 },
            thursday: { motivation: 0.8, stress: 0.7, planning: 0.6, risk: 0.7 },
            friday: { motivation: 0.9, stress: 0.5, planning: 0.5, risk: 0.8 },
            saturday: { motivation: 0.7, stress: 0.3, planning: 0.8, risk: 0.6 },
            sunday: { motivation: 0.5, stress: 0.4, planning: 0.9, risk: 0.4 }
        };
        
        this.moonPhases = {
            'new': { intuition: 0.9, newBeginnings: 0.95, risk: 0.8 },
            'waxing': { growth: 0.9, momentum: 0.85, risk: 0.7 },
            'full': { energy: 0.95, intensity: 0.9, risk: 0.6 },
            'waning': { reflection: 0.9, release: 0.85, risk: 0.5 }
        };
    }

    analyze(timestamp = Date.now()) {
        const date = new Date(timestamp);
        const analysis = {
            timestamp,
            timeOfDay: this.getTimeOfDay(date),
            dayOfWeek: this.getDayOfWeek(date),
            season: this.getSeason(date),
            moonPhase: this.getMoonPhase(date),
            temporalFactors: {},
            recommendations: [],
            decisionBias: 0,
            optimalDecisionWindow: null
        };

        analysis.temporalFactors = this.combineTemporalFactors(analysis);
        analysis.decisionBias = this.calculateDecisionBias(analysis);
        analysis.recommendations = this.generateTemporalRecommendations(analysis);
        analysis.optimalDecisionWindow = this.calculateOptimalWindow(date);

        return analysis;
    }

    getTimeOfDay(date) {
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    }

    getDayOfWeek(date) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    }

    getSeason(date) {
        const month = date.getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    getMoonPhase(date) {
        const daysSinceNew = this.daysSinceNewMoon(date);
        if (daysSinceNew < 2) return 'new';
        if (daysSinceNew < 8) return 'waxing';
        if (daysSinceNew < 16) return 'full';
        return 'waning';
    }

    daysSinceNewMoon(date) {
        const knownNewMoon = new Date('2024-01-11');
        const daysDiff = Math.floor((date - knownNewMoon) / (1000 * 60 * 60 * 24));
        return daysDiff % 29.5;
    }

    combineTemporalFactors(analysis) {
        const dailyPattern = this.dailyPatterns[analysis.timeOfDay] || {};
        const weeklyPattern = this.weekdayPatterns[analysis.dayOfWeek] || {};
        const seasonalPattern = this.seasonalPatterns[analysis.season] || {};
        const lunarPattern = this.moonPhases[analysis.moonPhase] || {};

        const combined = {};
        const allKeys = new Set([
            ...Object.keys(dailyPattern),
            ...Object.keys(weeklyPattern),
            ...Object.keys(seasonalPattern),
            ...Object.keys(lunarPattern)
        ]);

        for (const key of allKeys) {
            const values = [
                dailyPattern[key],
                weeklyPattern[key],
                seasonalPattern[key],
                lunarPattern[key]
            ].filter(v => v !== undefined);

            if (values.length > 0) {
                combined[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
            }
        }

        combined.overallScore = Object.values(combined).reduce((sum, v) => sum + v, 0) / Object.keys(combined).length;

        return combined;
    }

    calculateDecisionBias(analysis) {
        let bias = 0;
        const factors = analysis.temporalFactors;

        bias += (factors.clarity || 0.5 - 0.5) * 0.3;
        bias += (factors.energy || 0.5 - 0.5) * 0.2;
        bias += (factors.optimism || 0.5 - 0.5) * 0.2;
        bias += (factors.riskTolerance || 0.5 - 0.5) * 0.1;

        const timeBonus = this.getTimeOfDayBonus(analysis.timeOfDay);
        const dayBonus = this.getDayOfWeekBonus(analysis.dayOfWeek);
        
        bias += timeBonus + dayBonus;

        return Math.max(-0.5, Math.min(0.5, bias));
    }

    getTimeOfDayBonus(timeOfDay) {
        const bonuses = {
            morning: 0.15,
            afternoon: 0.05,
            evening: -0.05,
            night: -0.15
        };
        return bonuses[timeOfDay] || 0;
    }

    getDayOfWeekBonus(dayOfWeek) {
        const bonuses = {
            monday: -0.1,
            tuesday: 0.05,
            wednesday: 0,
            thursday: 0.05,
            friday: 0.1,
            saturday: 0.05,
            sunday: -0.05
        };
        return bonuses[dayOfWeek] || 0;
    }

    generateTemporalRecommendations(analysis) {
        const recommendations = [];
        const factors = analysis.temporalFactors;

        if (factors.clarity && factors.clarity > 0.8) {
            recommendations.push("Your mental clarity is high right now - great time for important decisions");
        } else if (factors.clarity && factors.clarity < 0.4) {
            recommendations.push("Consider waiting for better mental clarity if this decision isn't urgent");
        }

        if (factors.energy && factors.energy > 0.8) {
            recommendations.push("Your energy levels suggest you're ready to take action");
        } else if (factors.energy && factors.energy < 0.4) {
            recommendations.push("Low energy might affect decision quality - consider rest first");
        }

        if (analysis.timeOfDay === 'morning') {
            recommendations.push("Morning decisions tend to be more optimistic and action-oriented");
        } else if (analysis.timeOfDay === 'evening') {
            recommendations.push("Evening reflection can provide valuable perspective on complex decisions");
        }

        if (analysis.dayOfWeek === 'friday') {
            recommendations.push("End-of-week timing may influence risk tolerance positively");
        } else if (analysis.dayOfWeek === 'monday') {
            recommendations.push("Start-of-week energy can be channeled into decisive action");
        }

        if (analysis.season === 'spring') {
            recommendations.push("Spring energy supports new beginnings and growth-oriented choices");
        } else if (analysis.season === 'fall') {
            recommendations.push("Autumn timing favors careful consideration and preparation");
        }

        return recommendations;
    }

    calculateOptimalWindow(currentDate) {
        const windows = [];
        
        for (let i = 0; i < 7; i++) {
            const futureDate = new Date(currentDate.getTime() + (i * 24 * 60 * 60 * 1000));
            const analysis = this.analyze(futureDate.getTime());
            
            windows.push({
                date: futureDate,
                score: analysis.temporalFactors.overallScore || 0.5,
                timeOfDay: analysis.timeOfDay,
                factors: analysis.temporalFactors
            });
        }

        windows.sort((a, b) => b.score - a.score);
        
        const optimal = windows[0];
        return {
            date: optimal.date,
            score: optimal.score,
            reasoning: `Optimal decision window: ${optimal.timeOfDay} on ${optimal.date.toLocaleDateString()}`,
            factors: optimal.factors,
            alternativeWindows: windows.slice(1, 3)
        };
    }

    getContextualAdvice(analysis) {
        const advice = {
            timing: '',
            approach: '',
            considerations: []
        };

        if (analysis.temporalFactors.clarity > 0.7) {
            advice.timing = "This is an excellent time for decision-making";
            advice.approach = "Trust your analytical thinking and move forward confidently";
        } else if (analysis.temporalFactors.clarity < 0.4) {
            advice.timing = "Consider delaying non-urgent decisions";
            advice.approach = "Focus on gathering information rather than making final choices";
        } else {
            advice.timing = "Decent timing for decisions, with some considerations";
            advice.approach = "Proceed thoughtfully, weighing pros and cons carefully";
        }

        if (analysis.timeOfDay === 'morning') {
            advice.considerations.push("Morning decisions tend to be more optimistic");
            advice.considerations.push("Good time for important or challenging choices");
        } else if (analysis.timeOfDay === 'evening') {
            advice.considerations.push("Evening perspective can reveal overlooked concerns");
            advice.considerations.push("Consider sleeping on major decisions");
        }

        if (analysis.temporalFactors.stress && analysis.temporalFactors.stress > 0.7) {
            advice.considerations.push("High stress levels may cloud judgment");
            advice.considerations.push("Take time to center yourself before deciding");
        }

        return advice;
    }

    getSeasonalInfluence(season) {
        const influences = {
            spring: {
                description: "Spring brings renewal energy and optimism for new ventures",
                bias: "Favors starting new projects and taking calculated risks",
                caution: "Avoid overcommitting due to seasonal enthusiasm"
            },
            summer: {
                description: "Summer energy supports active decisions and social connections",
                bias: "Encourages bold moves and collaboration",
                caution: "High energy might lead to impulsive choices"
            },
            fall: {
                description: "Autumn promotes reflection and careful preparation",
                bias: "Favors conservative, well-planned decisions",
                caution: "May lean toward excessive caution or pessimism"
            },
            winter: {
                description: "Winter energy supports deep thinking and strategic planning",
                bias: "Encourages thorough analysis and patience",
                caution: "Seasonal mood effects might delay necessary action"
            }
        };

        return influences[season] || influences.spring;
    }
}