/**
 * Prompt Engineering Service
 * Advanced prompt templates and dynamic prompt generation
 */

class PromptEngineeringService {
  constructor() {
    this.templates = this.initializeTemplates();
    this.contextBuilders = this.initializeContextBuilders();
  }
  
  // Generate dynamic prompts based on context
  async generatePrompt(type, context) {
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Unknown prompt type: ${type}`);
    }
    
    const builtContext = await this.buildContext(context);
    return this.interpolateTemplate(template, builtContext);
  }
  
  // Build context from various sources
  async buildContext(context) {
    const builders = {
      book: this.contextBuilders.book,
      character: this.contextBuilders.character,
      plot: this.contextBuilders.plot,
      setting: this.contextBuilders.setting,
      user: this.contextBuilders.user
    };
    
    const builtContext = {};
    
    for (const [key, builder] of Object.entries(builders)) {
      if (context[key]) {
        builtContext[key] = await builder(context[key]);
      }
    }
    
    return { ...context, ...builtContext };
  }
  
  // Interpolate template with context variables
  interpolateTemplate(template, context) {
    let prompt = template.base;
    
    // Replace variables
    Object.entries(context).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(regex, value);
    });
    
    // Add conditional sections
    if (template.conditionals) {
      template.conditionals.forEach(conditional => {
        if (this.evaluateCondition(conditional.condition, context)) {
          prompt += '\n\n' + conditional.content;
        }
      });
    }
    
    // Add quality controls
    if (template.qualityControls) {
      prompt += '\n\n' + template.qualityControls;
    }
    
    return prompt;
  }
  
  evaluateCondition(condition, context) {
    // Simple condition evaluation
    const [key, operator, value] = condition.split(' ');
    const contextValue = context[key];
    
    switch (operator) {
      case '==': return contextValue == value;
      case '!=': return contextValue != value;
      case 'includes': return contextValue && contextValue.includes(value);
      case 'exists': return contextValue !== undefined && contextValue !== null;
      default: return false;
    }
  }
  
  initializeTemplates() {
    return {
      // Mystery Novel Templates
      mysteryChapterOpening: {
        base: `You are writing Chapter {{chapterNumber}} of a {{subgenre}} mystery novel titled "{{bookTitle}}".

STORY CONTEXT:
{{bookContext}}

CHAPTER CONTEXT:
- Chapter Title: {{chapterTitle}}
- Chapter Goal: {{chapterGoal}}
- Previous Events: {{previousEvents}}

MAIN CHARACTER:
{{protagonistDescription}}

TASK: Write the opening scene for this chapter ({{wordCount}} words) that {{sceneObjective}}.

REQUIREMENTS:
- Maintain {{tone}} tone throughout
- Include {{requiredElements}}
- Advance the plot by {{plotAdvancement}}
- Use {{povStyle}} point of view
- Show character development through actions and dialogue`,
        
        conditionals: [
          {
            condition: 'includeClue exists',
            content: 'IMPORTANT: Introduce this clue naturally: {{includeClue}}'
          },
          {
            condition: 'suspenseLevel == high',
            content: 'Focus on building tension and suspense throughout the scene.'
          }
        ],
        
        qualityControls: `
QUALITY REQUIREMENTS:
- Use specific, vivid details about the setting
- Create realistic, engaging dialogue
- Show emotions through actions, not just description
- Maintain mystery genre conventions
- End with a hook that compels readers to continue
- Ensure smooth pacing and natural scene transitions`
      },
      
      mysteryCharacterDevelopment: {
        base: `You are developing {{characterName}}, a {{characterRole}} in the mystery "{{bookTitle}}".

CURRENT CHARACTER PROFILE:
{{characterProfile}}

DEVELOPMENT GOAL: {{developmentGoal}}

SCENE CONTEXT:
{{sceneContext}}

TASK: Write content that develops this character by {{developmentMethod}}.

Focus on:
- Revealing {{characterAspect}} through {{revealMethod}}
- Maintaining consistency with established traits
- Adding depth without contradicting existing story elements`,
        
        conditionals: [
          {
            condition: 'characterRole == detective',
            content: 'Showcase investigative skills and deductive reasoning.'
          },
          {
            condition: 'characterRole == suspect',
            content: 'Create ambiguity about their guilt or innocence.'
          }
        ]
      },
      
      mysteryDialogue: {
        base: `Write dialogue for a scene in "{{bookTitle}}" between {{speaker1}} and {{speaker2}}.

SCENE PURPOSE: {{scenePurpose}}
SETTING: {{setting}}
MOOD: {{mood}}

CHARACTER VOICES:
{{speaker1}}: {{speaker1Voice}}
{{speaker2}}: {{speaker2Voice}}

DIALOGUE GOALS:
- {{dialogueGoal1}}
- {{dialogueGoal2}}
- Reveal information about: {{informationToReveal}}

Write natural, character-appropriate dialogue that advances the plot and reveals character.`,
        
        qualityControls: `
DIALOGUE QUALITY STANDARDS:
- Each character should have a distinct voice
- Include subtext and hidden meanings
- Use realistic speech patterns and interruptions
- Balance exposition with natural conversation
- Include appropriate action beats and descriptions`
      },
      
      // Self-Help Book Templates
      selfHelpFramework: {
        base: `You are writing a section for the self-help book "{{bookTitle}}" focused on {{topic}}.

TARGET AUDIENCE: {{targetAudience}}
CHAPTER GOAL: {{chapterGoal}}
SECTION PURPOSE: {{sectionPurpose}}

TASK: Create a {{frameworkType}} that helps readers {{desiredOutcome}}.

STRUCTURE REQUIREMENTS:
- {{numberOfSteps}} clear, actionable steps
- Real-world examples for each step
- Practical exercises or worksheets
- Measurable outcomes
- Implementation timeline

TONE: {{tone}} and encouraging`,
        
        conditionals: [
          {
            condition: 'includeResearch exists',
            content: 'Include relevant research or statistics: {{includeResearch}}'
          },
          {
            condition: 'targetAudience includes business',
            content: 'Focus on professional applications and workplace scenarios.'
          }
        ],
        
        qualityControls: `
SELF-HELP QUALITY STANDARDS:
- Provide actionable, specific advice
- Include concrete examples and case studies
- Make content immediately implementable
- Use encouraging, empowering language
- Address common obstacles and solutions
- Include progress tracking methods`
      },
      
      selfHelpCaseStudy: {
        base: `Create a case study for "{{bookTitle}}" that demonstrates {{concept}}.

CASE STUDY REQUIREMENTS:
- Subject: {{subjectType}} facing {{challenge}}
- Timeframe: {{timeframe}}
- Specific strategies used: {{strategies}}
- Measurable results: {{results}}

STRUCTURE:
1. Initial situation and challenges
2. Strategy implementation
3. Obstacles encountered and solutions
4. Final outcomes and lessons learned

Make the case study relatable to {{targetAudience}} while maintaining anonymity.`,
        
        qualityControls: `
CASE STUDY QUALITY STANDARDS:
- Use realistic but anonymized details
- Show clear before/after transformation
- Include specific metrics and timelines
- Highlight key learning points
- Make it relatable to target audience
- Demonstrate practical application of concepts`
      },
      
      // Content Improvement Templates
      contentImprovement: {
        base: `Improve the following {{contentType}} by focusing on {{improvementAreas}}.

ORIGINAL CONTENT:
{{originalContent}}

IMPROVEMENT GOALS:
{{improvementGoals}}

CONSTRAINTS:
- Maintain the original meaning and intent
- Keep the same approximate length
- Preserve the author's voice
- {{additionalConstraints}}`,
        
        qualityControls: `
IMPROVEMENT STANDARDS:
- Enhance clarity and readability
- Improve flow and transitions
- Strengthen word choice and imagery
- Ensure grammatical correctness
- Maintain consistency in tone and style`
      },
      
      // Outline Generation Templates
      bookOutline: {
        base: `Create a detailed outline for a {{genre}} book titled "{{bookTitle}}".

BOOK SPECIFICATIONS:
- Target word count: {{targetWordCount}}
- Target audience: {{targetAudience}}
- Main theme: {{mainTheme}}
- Key message: {{keyMessage}}

OUTLINE REQUIREMENTS:
- {{numberOfChapters}} chapters
- Chapter summaries (100-150 words each)
- Character arcs and development
- Plot progression and pacing
- Key scenes and turning points`,
        
        conditionals: [
          {
            condition: 'genre == mystery',
            content: 'Include clue placement, red herrings, and revelation timing.'
          },
          {
            condition: 'genre == self-help',
            content: 'Include learning objectives and practical exercises for each chapter.'
          }
        ]
      },
      
      // Character Creation Templates
      characterCreation: {
        base: `Create a detailed character profile for {{characterRole}} in "{{bookTitle}}".

CHARACTER BASICS:
- Name: {{characterName}}
- Age: {{characterAge}}
- Role in story: {{characterRole}}

DEVELOPMENT AREAS:
- Background and history
- Personality traits and quirks
- Motivations and goals
- Fears and weaknesses
- Relationships with other characters
- Character arc throughout the story

GENRE CONSIDERATIONS:
{{genreSpecificRequirements}}`,
        
        qualityControls: `
CHARACTER QUALITY STANDARDS:
- Create three-dimensional, believable characters
- Ensure character motivations are clear and compelling
- Develop unique voice and mannerisms
- Plan character growth and change
- Consider how character serves the story`
      }
    };
  }
  
  initializeContextBuilders() {
    return {
      book: async (bookData) => {
        return {
          bookTitle: bookData.title,
          bookGenre: bookData.genre,
          bookDescription: bookData.metadata?.description,
          targetWordCount: bookData.metadata?.targetWordCount,
          currentWordCount: bookData.metadata?.currentWordCount,
          bookContext: this.buildBookContext(bookData)
        };
      },
      
      character: async (characterData) => {
        return {
          characterName: characterData.name,
          characterRole: characterData.role,
          characterAge: characterData.age,
          characterProfile: this.buildCharacterProfile(characterData),
          characterVoice: characterData.voice || 'neutral'
        };
      },
      
      plot: async (plotData) => {
        return {
          plotStage: plotData.stage,
          plotTension: plotData.tension,
          previousEvents: plotData.previousEvents,
          upcomingEvents: plotData.upcomingEvents
        };
      },
      
      setting: async (settingData) => {
        return {
          location: settingData.location,
          timeOfDay: settingData.timeOfDay,
          season: settingData.season,
          mood: settingData.mood,
          atmosphere: settingData.atmosphere
        };
      },
      
      user: async (userData) => {
        return {
          writingExperience: userData.writingExperience,
          preferredStyle: userData.preferredStyle,
          targetAudience: userData.targetAudience
        };
      }
    };
  }
  
  buildBookContext(bookData) {
    let context = '';
    
    if (bookData.metadata?.description) {
      context += `Book Description: ${bookData.metadata.description}\n`;
    }
    
    if (bookData.structure?.outline) {
      context += `Plot Outline: ${bookData.structure.outline}\n`;
    }
    
    if (bookData.characters && bookData.characters.length > 0) {
      context += `Main Characters:\n`;
      bookData.characters.forEach(char => {
        context += `- ${char.name}: ${char.description}\n`;
      });
    }
    
    return context;
  }
  
  buildCharacterProfile(characterData) {
    let profile = `Name: ${characterData.name}\n`;
    profile += `Role: ${characterData.role}\n`;
    
    if (characterData.age) profile += `Age: ${characterData.age}\n`;
    if (characterData.background) profile += `Background: ${characterData.background}\n`;
    if (characterData.personality) profile += `Personality: ${characterData.personality}\n`;
    if (characterData.motivations) profile += `Motivations: ${characterData.motivations}\n`;
    
    return profile;
  }
  
  // Generate prompts for specific writing tasks
  async generateChapterPrompt(bookData, chapterData, options = {}) {
    const context = {
      book: bookData,
      chapterNumber: chapterData.number,
      chapterTitle: chapterData.title,
      chapterGoal: chapterData.goal,
      wordCount: options.wordCount || '800-1200',
      tone: options.tone || 'engaging',
      povStyle: options.povStyle || 'third person limited'
    };
    
    const promptType = bookData.genre === 'mystery' ? 'mysteryChapterOpening' : 'selfHelpFramework';
    return await this.generatePrompt(promptType, context);
  }
  
  async generateCharacterPrompt(characterData, developmentGoal, context = {}) {
    const promptContext = {
      character: characterData,
      developmentGoal,
      developmentMethod: context.method || 'showing through actions',
      characterAspect: context.aspect || 'personality',
      revealMethod: context.revealMethod || 'dialogue and behavior',
      ...context
    };
    
    return await this.generatePrompt('mysteryCharacterDevelopment', promptContext);
  }
  
  async generateDialoguePrompt(speaker1, speaker2, sceneContext) {
    const context = {
      speaker1: speaker1.name,
      speaker2: speaker2.name,
      speaker1Voice: speaker1.voice || 'neutral',
      speaker2Voice: speaker2.voice || 'neutral',
      ...sceneContext
    };
    
    return await this.generatePrompt('mysteryDialogue', context);
  }
  
  async generateImprovementPrompt(content, improvementType, instructions = '') {
    const context = {
      originalContent: content,
      contentType: 'narrative text',
      improvementAreas: improvementType,
      improvementGoals: this.getImprovementGoals(improvementType),
      additionalConstraints: instructions
    };
    
    return await this.generatePrompt('contentImprovement', context);
  }
  
  getImprovementGoals(improvementType) {
    const goals = {
      grammar: 'Correct grammatical errors and improve sentence structure',
      style: 'Enhance writing style and narrative flow',
      clarity: 'Improve clarity and readability',
      dialogue: 'Make dialogue more natural and character-appropriate',
      pacing: 'Improve story pacing and rhythm',
      description: 'Enhance descriptive language and imagery'
    };
    
    return goals[improvementType] || 'General content improvement';
  }
  
  // Validate prompt quality
  validatePrompt(prompt) {
    const issues = [];
    
    if (prompt.length < 100) {
      issues.push('Prompt is too short for effective AI generation');
    }
    
    if (prompt.length > 8000) {
      issues.push('Prompt may exceed token limits');
    }
    
    if (!prompt.includes('TASK:')) {
      issues.push('Prompt should clearly define the task');
    }
    
    const variableMatches = prompt.match(/{{[^}]+}}/g);
    if (variableMatches) {
      issues.push(`Unresolved variables: ${variableMatches.join(', ')}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

export default PromptEngineeringService;