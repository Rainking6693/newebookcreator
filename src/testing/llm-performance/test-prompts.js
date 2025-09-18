/**
 * LLM Performance Testing - Standardized Test Prompts
 * Testing both Claude (Anthropic) and GPT-4 (OpenAI) for ebook generation
 */

// Mystery Genre Test Prompts
export const mysteryPrompts = {
  chapterOne: {
    prompt: `Write Chapter 1 of a mystery novel with the following specifications:
    - Setting: Small coastal town in Maine, present day
    - Main character: Detective Sarah Chen, 35, recently transferred from Boston
    - Tone: Atmospheric, slightly noir, accessible to general audience
    - Length: 5,000-7,000 words
    - Requirements: Establish setting, introduce protagonist, present initial mystery/crime
    - Style: Third person limited POV, past tense
    - Target audience: Adult mystery readers
    
    The chapter should hook readers immediately and establish the central mystery that will drive the entire book. Include vivid descriptions of the coastal setting and create a compelling character voice for Detective Chen.`,
    
    expectedElements: [
      'Character introduction and background',
      'Setting establishment',
      'Initial mystery/crime presentation',
      'Atmospheric descriptions',
      'Hook for continued reading'
    ],
    
    qualityMetrics: {
      wordCount: { min: 5000, max: 7000 },
      readabilityLevel: 'Adult',
      pacing: 'Engaging opening',
      characterDevelopment: 'Strong protagonist introduction'
    }
  },

  chapterTwo: {
    prompt: `Write Chapter 2 of the mystery novel continuing from Chapter 1:
    - Detective Sarah Chen begins investigating the crime scene
    - Introduce 2-3 supporting characters (local police, witnesses, suspects)
    - Reveal first clues and red herrings
    - Length: 5,000-7,000 words
    - Maintain consistent tone and style from Chapter 1
    - Advance the plot while deepening character development
    
    Focus on procedural elements of the investigation while maintaining the atmospheric coastal Maine setting. Each supporting character should have distinct voice and potential motives.`,
    
    expectedElements: [
      'Investigation procedures',
      'Supporting character introductions',
      'Clue revelation',
      'Plot advancement',
      'Consistent tone maintenance'
    ]
  }
};

// Self-Help Genre Test Prompts
export const selfHelpPrompts = {
  chapterOne: {
    prompt: `Write Chapter 1 of a self-help book about productivity and time management:
    - Title: "The Focused Life: Mastering Your Time in a Distracted World"
    - Target audience: Working professionals, entrepreneurs, students
    - Tone: Encouraging, practical, evidence-based
    - Length: 5,000-7,000 words
    - Structure: Introduction to core concepts, personal anecdotes, actionable strategies
    - Style: Second person ("you") with first person examples
    
    The chapter should establish credibility, relate to reader pain points, and provide immediate value while setting up the book's framework. Include research citations and practical exercises.`,
    
    expectedElements: [
      'Problem identification and relatability',
      'Author credibility establishment',
      'Core concept introduction',
      'Practical strategies',
      'Reader engagement exercises'
    ],
    
    qualityMetrics: {
      wordCount: { min: 5000, max: 7000 },
      actionableContent: 'High',
      researchBased: 'Citations included',
      readerEngagement: 'Interactive elements'
    }
  },

  chapterTwo: {
    prompt: `Write Chapter 2 of the productivity self-help book:
    - Focus: "The Science of Attention and Focus"
    - Include neuroscience research on attention and distraction
    - Provide 3-5 evidence-based techniques for improving focus
    - Length: 5,000-7,000 words
    - Maintain encouraging, practical tone
    - Include case studies or real-world examples
    
    Build upon Chapter 1's foundation while diving deeper into the science behind productivity. Make complex concepts accessible to general readers.`,
    
    expectedElements: [
      'Scientific research integration',
      'Practical technique explanations',
      'Case studies or examples',
      'Complex concept simplification',
      'Chapter-to-chapter continuity'
    ]
  }
};

// Consistency Testing Prompts
export const consistencyTests = {
  characterVoice: {
    prompt: `Continue writing as Detective Sarah Chen from the mystery novel. Write a 1,000-word internal monologue where she reflects on her decision to leave Boston and move to this small Maine town. Maintain the same voice, personality, and background established in previous chapters.`,
    
    testCriteria: [
      'Voice consistency with previous chapters',
      'Character background alignment',
      'Personality trait maintenance',
      'Writing style consistency'
    ]
  },

  toneConsistency: {
    prompt: `Write a 1,000-word section for the productivity book that explains the concept of "deep work" while maintaining the same encouraging, practical tone established in previous chapters. Include research citations and actionable advice.`,
    
    testCriteria: [
      'Tone consistency',
      'Style alignment',
      'Content quality maintenance',
      'Structure consistency'
    ]
  }
};

// Instruction Following Tests
export const instructionTests = {
  formatCompliance: {
    prompt: `Write exactly 2,500 words for a mystery novel chapter that:
    1. Uses exactly 5 paragraphs
    2. Includes dialogue between exactly 3 characters
    3. Contains exactly 2 clues about the mystery
    4. Ends with a cliffhanger
    5. Uses the word "lighthouse" exactly 3 times
    
    Test the model's ability to follow specific formatting and content requirements.`,
    
    verificationCriteria: [
      'Word count accuracy (2,500 ±50 words)',
      'Paragraph count (exactly 5)',
      'Character count in dialogue (exactly 3)',
      'Clue count (exactly 2)',
      'Keyword usage ("lighthouse" exactly 3 times)',
      'Cliffhanger ending presence'
    ]
  }
};

// Cost and Performance Tracking
export const performanceMetrics = {
  tokenUsage: {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  },
  
  timing: {
    requestStart: null,
    requestEnd: null,
    responseTime: 0
  },
  
  costs: {
    claudeCost: 0,
    gpt4Cost: 0,
    costPerWord: 0
  },
  
  quality: {
    humanReadabilityScore: 0,
    coherenceScore: 0,
    instructionFollowingScore: 0,
    creativityScore: 0
  }
};

export default {
  mysteryPrompts,
  selfHelpPrompts,
  consistencyTests,
  instructionTests,
  performanceMetrics
};