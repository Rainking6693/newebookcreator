const fs = require('fs').promises;

class ComplimentGenerator {
    constructor() {
        this.categories = [
            'analytical', 'confidence', 'wisdom', 'energy', 'transformation',
            'leadership', 'patience', 'balance', 'optimism', 'empathy',
            'insight', 'clarity', 'curiosity', 'gratitude', 'humor',
            'growth', 'self-compassion', 'adventure', 'composure', 'timing'
        ];
        
        this.personalityTags = [
            'analytical', 'creative', 'social', 'introspective', 'adventurous',
            'confident', 'patient', 'optimistic', 'balanced', 'empathetic',
            'wise', 'clear-thinking', 'curious', 'grateful', 'humorous',
            'growth-minded', 'self-compassionate', 'calm', 'intuitive', 'decisive'
        ];
        
        this.timeContexts = ['morning', 'afternoon', 'evening', 'night', 'any'];
        this.seasons = ['spring', 'summer', 'fall', 'winter', 'any'];
        this.complexityLevels = ['simple', 'medium', 'complex'];
        
        this.complimentTemplates = {
            analytical: [
                "Your ability to {action} shows remarkable analytical thinking.",
                "The way you {process} complex information is truly impressive.",
                "Your logical approach to {situation} demonstrates real intelligence.",
                "You have this amazing gift for {analytical_skill}.",
                "Your systematic thinking about {topic} is genuinely inspiring."
            ],
            confidence: [
                "Your confidence in {situation} is absolutely radiant.",
                "The way you {confident_action} shows incredible self-assurance.",
                "Your bold approach to {challenge} is truly admirable.",
                "You carry yourself with such natural {confidence_quality}.",
                "Your unwavering belief in {self_aspect} is inspiring."
            ],
            wisdom: [
                "The wisdom you bring to {situation} is beyond your years.",
                "Your thoughtful perspective on {topic} shows deep understanding.",
                "The way you {wise_action} demonstrates true wisdom.",
                "Your insights about {subject} reveal genuine wisdom.",
                "You have this beautiful ability to {wisdom_skill}."
            ]
        };
        
        this.complimentParts = {
            action: ['break down problems', 'solve challenges', 'analyze situations', 'think through options', 'evaluate choices'],
            process: ['organize', 'synthesize', 'understand', 'interpret', 'analyze'],
            situation: ['difficult decisions', 'complex problems', 'challenging circumstances', 'tough choices', 'uncertain times'],
            analytical_skill: ['seeing patterns others miss', 'connecting dots', 'finding solutions', 'thinking systematically', 'logical reasoning'],
            confident_action: ['speak your mind', 'take action', 'stand your ground', 'lead others', 'make decisions'],
            challenge: ['new opportunities', 'difficult situations', 'uncertain circumstances', 'complex problems', 'tough decisions'],
            confidence_quality: ['poise', 'self-assurance', 'inner strength', 'quiet confidence', 'natural authority'],
            wise_action: ['listen deeply', 'offer guidance', 'share insights', 'reflect thoughtfully', 'consider all angles'],
            subject: ['relationships', 'life choices', 'personal growth', 'difficult situations', 'future planning']
        };
    }

    async generateCompliments(targetCount = 500) {
        const existingData = await this.loadExistingCompliments();
        const existing = existingData.compliments;
        const needed = targetCount - existing.length;
        
        console.log(`Existing compliments: ${existing.length}`);
        console.log(`Need to generate: ${needed} more compliments`);
        
        const newCompliments = [];
        let currentId = Math.max(...existing.map(c => c.id)) + 1;
        
        for (let i = 0; i < needed; i++) {
            const compliment = this.createCompliment(currentId++);
            newCompliments.push(compliment);
        }
        
        const allCompliments = [...existing, ...newCompliments];
        
        const updatedData = {
            ...existingData,
            compliments: allCompliments
        };
        
        await this.saveCompliments(updatedData);
        console.log(`Generated ${targetCount} total compliments`);
        
        return updatedData;
    }

    createCompliment(id) {
        const category = this.getRandomElement(this.categories);
        const complexity = this.getRandomElement(this.complexityLevels);
        const timeContext = this.getRandomTimeContext();
        const season = this.getRandomSeason();
        const personalityTags = this.getRandomPersonalityTags(2, 4);
        
        const text = this.generateComplimentText(category, complexity);
        const sentimentScore = this.generateSentimentScore(category, complexity);
        
        return {
            id,
            text,
            category,
            sentiment_score: sentimentScore,
            personality_tags: personalityTags,
            time_context: timeContext,
            seasonal_relevance: season,
            complexity_level: complexity
        };
    }

    generateComplimentText(category, complexity) {
        const templates = {
            analytical: [
                "Your analytical mind turns complexity into clarity effortlessly.",
                "The way you dissect problems and find solutions is remarkable.",
                "Your logical thinking process is both impressive and inspiring.",
                "You have this incredible gift for seeing patterns where others see chaos.",
                "Your systematic approach to challenges shows real intellectual depth."
            ],
            confidence: [
                "Your confidence lights up every room you enter.",
                "The self-assurance you bring to difficult situations is inspiring.",
                "Your bold decisions show remarkable inner strength.",
                "You carry yourself with such natural grace and confidence.",
                "Your unwavering belief in yourself is genuinely admirable."
            ],
            wisdom: [
                "Your wisdom shines through in every thoughtful decision you make.",
                "The depth of understanding you bring to complex situations is remarkable.",
                "Your ability to see the bigger picture shows true wisdom.",
                "The thoughtful way you consider all perspectives is genuinely wise.",
                "Your insights reveal a wisdom that goes far beyond experience."
            ],
            energy: [
                "Your vibrant energy is absolutely contagious and uplifting.",
                "The enthusiasm you bring to everything you do is inspiring.",
                "Your dynamic presence energizes everyone around you.",
                "The positive energy you radiate could power a small city.",
                "Your zest for life is both refreshing and motivating."
            ],
            transformation: [
                "Your ability to turn challenges into opportunities is extraordinary.",
                "The way you transform obstacles into stepping stones is inspiring.",
                "Your capacity for positive change is truly remarkable.",
                "You have this amazing gift for creating beauty from difficulty.",
                "Your transformative influence makes everything around you better."
            ],
            leadership: [
                "Your natural leadership brings out the best in everyone.",
                "The way you guide others with wisdom and compassion is remarkable.",
                "Your ability to inspire and motivate others is truly special.",
                "You lead by example in the most beautiful and authentic way.",
                "Your leadership style empowers others to discover their own strength."
            ],
            patience: [
                "Your patience in difficult moments is like a superpower.",
                "The calm persistence you show in challenging times is admirable.",
                "Your ability to wait for the right moment shows true wisdom.",
                "The patience you extend to others is both rare and beautiful.",
                "Your steady, patient approach to problems is genuinely inspiring."
            ],
            balance: [
                "Your ability to balance different aspects of life is remarkable.",
                "The harmony you create between work and personal life is inspiring.",
                "Your balanced perspective on complex issues is truly valuable.",
                "You have this beautiful way of finding equilibrium in chaos.",
                "Your balanced approach to decision-making is genuinely wise."
            ],
            optimism: [
                "Your optimism in the face of challenges is genuinely inspiring.",
                "The positive outlook you maintain is both rare and beautiful.",
                "Your ability to find hope in difficult situations uplifts everyone.",
                "The brightness you bring to every situation is remarkable.",
                "Your optimistic spirit transforms ordinary moments into special ones."
            ],
            empathy: [
                "Your empathy and understanding touch the hearts of everyone you meet.",
                "The compassion you show to others is both deep and genuine.",
                "Your ability to truly understand others' feelings is remarkable.",
                "The kindness and empathy you offer creates real healing.",
                "Your empathetic nature makes the world a more caring place."
            ],
            insight: [
                "Your insights reveal truths that others often miss entirely.",
                "The depth of your understanding about life is truly remarkable.",
                "Your ability to see beneath the surface is genuinely impressive.",
                "The wisdom in your observations always amazes those around you.",
                "Your insightful perspective brings clarity to complex situations."
            ],
            clarity: [
                "Your clear thinking cuts through confusion like a beacon of light.",
                "The clarity you bring to complex problems is genuinely impressive.",
                "Your ability to simplify complicated issues is a rare gift.",
                "The clear communication you offer helps everyone understand better.",
                "Your mental clarity in pressure situations is truly admirable."
            ],
            curiosity: [
                "Your curiosity about the world is both infectious and inspiring.",
                "The genuine interest you show in learning new things is beautiful.",
                "Your curious mind opens doors that others never even notice.",
                "The questions you ask reveal a deep and thoughtful intelligence.",
                "Your curiosity-driven exploration of life is genuinely admirable."
            ],
            gratitude: [
                "Your gratitude for life's small moments is genuinely beautiful.",
                "The appreciation you show for others brightens everyone's day.",
                "Your grateful heart sees blessings where others see ordinary.",
                "The thankfulness you express creates positive energy everywhere.",
                "Your gratitude transforms simple moments into treasured memories."
            ],
            humor: [
                "Your sense of humor brings joy and lightness to difficult moments.",
                "The laughter you create helps heal hearts and lift spirits.",
                "Your ability to find humor in challenges is genuinely admirable.",
                "The wit and warmth in your humor brightens everyone's day.",
                "Your playful spirit and humor make life more enjoyable for all."
            ],
            growth: [
                "Your commitment to personal growth is genuinely inspiring to witness.",
                "The way you embrace challenges as opportunities shows real wisdom.",
                "Your dedication to becoming your best self is truly admirable.",
                "The growth mindset you maintain transforms obstacles into stepping stones.",
                "Your willingness to learn and evolve is a beautiful quality."
            ],
            'self-compassion': [
                "The kindness you show yourself during difficult times is beautiful.",
                "Your ability to treat yourself with compassion is truly wise.",
                "The gentle patience you offer yourself is genuinely admirable.",
                "Your self-compassionate approach to mistakes shows real growth.",
                "The loving kindness you direct toward yourself is inspiring."
            ],
            adventure: [
                "Your adventurous spirit brings excitement and wonder to life.",
                "The courage you show in trying new experiences is inspiring.",
                "Your willingness to explore unknown territories is admirable.",
                "The adventurous energy you bring to life is absolutely contagious.",
                "Your bold approach to new experiences opens amazing possibilities."
            ],
            composure: [
                "Your composure under pressure is like a steady lighthouse in storms.",
                "The calm presence you maintain in chaos is genuinely remarkable.",
                "Your ability to stay centered during difficulties is truly admirable.",
                "The steady composure you show inspires confidence in others.",
                "Your peaceful presence in stressful moments is a gift to everyone."
            ],
            timing: [
                "Your perfect sense of timing in decisions is genuinely remarkable.",
                "The way you know exactly when to act shows deep intuitive wisdom.",
                "Your ability to wait for the right moment demonstrates true patience.",
                "The timing of your words and actions always seems perfectly calibrated.",
                "Your intuitive sense of timing turns good decisions into great ones."
            ]
        };

        const categoryTemplates = templates[category] || templates.confidence;
        const baseText = this.getRandomElement(categoryTemplates);
        
        return this.addComplexityVariation(baseText, complexity);
    }

    addComplexityVariation(text, complexity) {
        const variations = {
            simple: text => text.replace(/genuinely |truly |absolutely |remarkably /g, ''),
            medium: text => text,
            complex: text => {
                const enhancements = [
                    'with such natural grace',
                    'in ways that inspire everyone around you',
                    'that demonstrates deep emotional intelligence',
                    'with a wisdom that seems to come from your very soul',
                    'in a way that transforms the ordinary into the extraordinary'
                ];
                
                if (Math.random() < 0.7) {
                    const enhancement = this.getRandomElement(enhancements);
                    return text.replace('.', ` ${enhancement}.`);
                }
                return text;
            }
        };
        
        return variations[complexity] ? variations[complexity](text) : text;
    }

    generateSentimentScore(category, complexity) {
        const baseScores = {
            analytical: 0.82,
            confidence: 0.88,
            wisdom: 0.85,
            energy: 0.92,
            transformation: 0.86,
            leadership: 0.89,
            patience: 0.80,
            balance: 0.83,
            optimism: 0.91,
            empathy: 0.87,
            insight: 0.84,
            clarity: 0.86,
            curiosity: 0.85,
            gratitude: 0.89,
            humor: 0.90,
            growth: 0.87,
            'self-compassion': 0.85,
            adventure: 0.88,
            composure: 0.84,
            timing: 0.83
        };
        
        let score = baseScores[category] || 0.85;
        
        const complexityModifiers = {
            simple: -0.02,
            medium: 0,
            complex: 0.03
        };
        
        score += complexityModifiers[complexity] || 0;
        score += (Math.random() - 0.5) * 0.08;
        
        return Math.round(Math.min(0.95, Math.max(0.65, score)) * 100) / 100;
    }

    getRandomTimeContext() {
        const probability = Math.random();
        if (probability < 0.4) return ['any'];
        if (probability < 0.6) return [this.getRandomElement(['morning', 'afternoon', 'evening'])];
        return this.getRandomElements(this.timeContexts.slice(0, -1), 2, 3);
    }

    getRandomSeason() {
        const probability = Math.random();
        if (probability < 0.5) return ['any'];
        if (probability < 0.75) return [this.getRandomElement(['spring', 'summer', 'fall', 'winter'])];
        return this.getRandomElements(['spring', 'summer', 'fall', 'winter'], 2, 3);
    }

    getRandomPersonalityTags(min, max) {
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        return this.getRandomElements(this.personalityTags, count, count);
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomElements(array, min, max) {
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    async loadExistingCompliments() {
        try {
            const data = await fs.readFile('./data/compliments.json', 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading existing compliments:', error);
            return { compliments: [] };
        }
    }

    async saveCompliments(data) {
        try {
            await fs.writeFile('./data/compliments.json', JSON.stringify(data, null, 2));
            console.log('Compliments saved successfully');
        } catch (error) {
            console.error('Error saving compliments:', error);
        }
    }
}

const generator = new ComplimentGenerator();
generator.generateCompliments(500).then(() => {
    console.log('Compliment generation completed!');
}).catch(error => {
    console.error('Error generating compliments:', error);
});