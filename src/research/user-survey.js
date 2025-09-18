/**
 * User Survey and Validation Module
 * Collects and analyzes user feedback for product validation
 */

export const surveyQuestions = {
  demographics: [
    {
      id: "age_range",
      type: "select",
      question: "What is your age range?",
      options: ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"],
      required: true
    },
    {
      id: "writing_experience",
      type: "select",
      question: "How would you describe your writing experience?",
      options: [
        "Complete beginner",
        "Some experience (blogs, articles)",
        "Published short works",
        "Published books",
        "Professional writer"
      ],
      required: true
    },
    {
      id: "income_level",
      type: "select",
      question: "What is your annual household income?",
      options: ["<$30k", "$30k-$50k", "$50k-$75k", "$75k-$100k", "$100k+"],
      required: false
    }
  ],

  painPoints: [
    {
      id: "writing_challenges",
      type: "multiselect",
      question: "What are your biggest challenges with writing? (Select all that apply)",
      options: [
        "Finding time to write",
        "Overcoming writer's block",
        "Developing plot/structure",
        "Creating compelling characters",
        "Research and fact-checking",
        "Editing and revision",
        "Understanding market trends",
        "Publishing and distribution",
        "Marketing and promotion",
        "Technical formatting"
      ],
      required: true
    },
    {
      id: "current_tools",
      type: "multiselect",
      question: "What writing tools do you currently use? (Select all that apply)",
      options: [
        "Microsoft Word",
        "Google Docs",
        "Scrivener",
        "Notion",
        "Grammarly",
        "Jasper AI",
        "Copy.ai",
        "ChatGPT",
        "Other AI tools",
        "None of the above"
      ],
      required: true
    },
    {
      id: "ai_experience",
      type: "scale",
      question: "How comfortable are you with using AI writing tools?",
      scale: { min: 1, max: 5, labels: ["Very uncomfortable", "Uncomfortable", "Neutral", "Comfortable", "Very comfortable"] },
      required: true
    }
  ],

  productValidation: [
    {
      id: "book_interest",
      type: "multiselect",
      question: "What types of books are you interested in writing? (Select all that apply)",
      options: [
        "Mystery/Crime fiction",
        "Self-help/Personal development",
        "Romance",
        "Science fiction/Fantasy",
        "Non-fiction/Educational",
        "Memoir/Biography",
        "Children's books",
        "Business/Professional",
        "Other fiction genres",
        "Not sure yet"
      ],
      required: true
    },
    {
      id: "word_count_preference",
      type: "select",
      question: "What length book would you most likely want to write?",
      options: [
        "Short (20k-40k words) - Novella",
        "Medium (50k-75k words) - Standard novel",
        "Long (75k-100k words) - Full novel",
        "Very long (100k+ words) - Epic novel",
        "Not sure"
      ],
      required: true
    },
    {
      id: "pricing_willingness",
      type: "select",
      question: "How much would you be willing to pay monthly for an AI book writing platform?",
      options: [
        "Nothing - only free tools",
        "$10-20 per month",
        "$21-40 per month", 
        "$41-60 per month",
        "$61-100 per month",
        "$100+ per month"
      ],
      required: true
    },
    {
      id: "revenue_share_interest",
      type: "scale",
      question: "How interested would you be in a revenue-sharing model where you pay less upfront but share a percentage of book sales?",
      scale: { min: 1, max: 5, labels: ["Not interested", "Slightly interested", "Neutral", "Very interested", "Extremely interested"] },
      required: true
    }
  ],

  featureValidation: [
    {
      id: "most_valuable_features",
      type: "ranking",
      question: "Rank these features by importance to you (1 = most important)",
      options: [
        "AI-generated content",
        "Professional formatting/export",
        "Market research and trends",
        "Editing and revision tools",
        "Publishing platform integration",
        "Collaboration features",
        "Analytics and performance tracking",
        "Template library"
      ],
      required: true
    },
    {
      id: "content_control",
      type: "scale",
      question: "How important is it to have full control over AI-generated content?",
      scale: { min: 1, max: 5, labels: ["Not important", "Slightly important", "Moderately important", "Very important", "Extremely important"] },
      required: true
    },
    {
      id: "research_integration",
      type: "scale",
      question: "How valuable would built-in market research and trend analysis be?",
      scale: { min: 1, max: 5, labels: ["Not valuable", "Slightly valuable", "Moderately valuable", "Very valuable", "Extremely valuable"] },
      required: true
    },
    {
      id: "export_formats",
      type: "multiselect",
      question: "Which export formats are most important to you? (Select all that apply)",
      options: [
        "PDF",
        "EPUB (ebook format)",
        "DOCX (Word document)",
        "HTML",
        "Print-ready PDF",
        "Kindle format",
        "Other formats"
      ],
      required: true
    }
  ],

  openEnded: [
    {
      id: "biggest_frustration",
      type: "textarea",
      question: "What is your biggest frustration with current writing tools or the writing process in general?",
      required: true
    },
    {
      id: "dream_features",
      type: "textarea",
      question: "If you could design the perfect AI writing assistant, what features would it have?",
      required: true
    },
    {
      id: "success_definition",
      type: "textarea",
      question: "How would you define success for your book writing goals?",
      required: true
    },
    {
      id: "additional_comments",
      type: "textarea",
      question: "Any additional comments or suggestions?",
      required: false
    }
  ]
};

export const surveyAnalysis = {
  /**
   * Analyze survey responses and generate insights
   */
  analyzeResponses(responses) {
    const analysis = {
      demographics: this.analyzeDemographics(responses),
      painPoints: this.analyzePainPoints(responses),
      productFit: this.analyzeProductFit(responses),
      featurePreferences: this.analyzeFeaturePreferences(responses),
      pricingSensitivity: this.analyzePricing(responses),
      qualitativeInsights: this.analyzeOpenEnded(responses)
    };

    return analysis;
  },

  analyzeDemographics(responses) {
    const demographics = {};
    
    // Age distribution
    demographics.ageDistribution = this.calculateDistribution(responses, 'age_range');
    
    // Writing experience
    demographics.writingExperience = this.calculateDistribution(responses, 'writing_experience');
    
    // Income levels
    demographics.incomeDistribution = this.calculateDistribution(responses, 'income_level');

    return demographics;
  },

  analyzePainPoints(responses) {
    const painPoints = {};
    
    // Most common writing challenges
    painPoints.topChallenges = this.calculateMultiselectFrequency(responses, 'writing_challenges');
    
    // Current tool usage
    painPoints.currentTools = this.calculateMultiselectFrequency(responses, 'current_tools');
    
    // AI comfort level
    painPoints.aiComfort = this.calculateScaleAverage(responses, 'ai_experience');

    return painPoints;
  },

  analyzeProductFit(responses) {
    const productFit = {};
    
    // Genre interest
    productFit.genreInterest = this.calculateMultiselectFrequency(responses, 'book_interest');
    
    // Word count preferences
    productFit.lengthPreferences = this.calculateDistribution(responses, 'word_count_preference');
    
    // Revenue share interest
    productFit.revenueShareAppeal = this.calculateScaleAverage(responses, 'revenue_share_interest');

    return productFit;
  },

  analyzeFeaturePreferences(responses) {
    const features = {};
    
    // Feature importance ranking
    features.featureRanking = this.calculateRankingResults(responses, 'most_valuable_features');
    
    // Content control importance
    features.contentControl = this.calculateScaleAverage(responses, 'content_control');
    
    // Research integration value
    features.researchValue = this.calculateScaleAverage(responses, 'research_integration');
    
    // Export format preferences
    features.exportFormats = this.calculateMultiselectFrequency(responses, 'export_formats');

    return features;
  },

  analyzePricing(responses) {
    const pricing = {};
    
    // Pricing willingness distribution
    pricing.willingnessToPay = this.calculateDistribution(responses, 'pricing_willingness');
    
    // Calculate average acceptable price range
    pricing.averagePriceRange = this.calculateAveragePriceRange(responses);
    
    // Revenue share vs upfront preference
    pricing.revenueSharePreference = this.calculateScaleAverage(responses, 'revenue_share_interest');

    return pricing;
  },

  analyzeOpenEnded(responses) {
    // In a real implementation, this would use NLP to analyze text responses
    const insights = {
      commonFrustrations: [
        "Time constraints",
        "Writer's block",
        "Technical complexity",
        "Marketing challenges"
      ],
      requestedFeatures: [
        "Better AI assistance",
        "Simpler interface",
        "Market insights",
        "Publishing integration"
      ],
      successDefinitions: [
        "Completing a book",
        "Getting published",
        "Generating income",
        "Personal satisfaction"
      ]
    };

    return insights;
  },

  // Helper methods
  calculateDistribution(responses, field) {
    const distribution = {};
    responses.forEach(response => {
      const value = response[field];
      distribution[value] = (distribution[value] || 0) + 1;
    });
    
    // Convert to percentages
    const total = responses.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = {
        count: distribution[key],
        percentage: ((distribution[key] / total) * 100).toFixed(1)
      };
    });
    
    return distribution;
  },

  calculateMultiselectFrequency(responses, field) {
    const frequency = {};
    responses.forEach(response => {
      const values = response[field] || [];
      values.forEach(value => {
        frequency[value] = (frequency[value] || 0) + 1;
      });
    });
    
    // Sort by frequency
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .map(([option, count]) => ({
        option,
        count,
        percentage: ((count / responses.length) * 100).toFixed(1)
      }));
  },

  calculateScaleAverage(responses, field) {
    const values = responses.map(r => r[field]).filter(v => v !== undefined);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return {
      average: average.toFixed(2),
      distribution: this.calculateDistribution(responses, field),
      sampleSize: values.length
    };
  },

  calculateRankingResults(responses, field) {
    const rankings = {};
    responses.forEach(response => {
      const ranking = response[field] || {};
      Object.entries(ranking).forEach(([option, rank]) => {
        if (!rankings[option]) rankings[option] = [];
        rankings[option].push(rank);
      });
    });
    
    // Calculate average ranking for each option
    return Object.entries(rankings)
      .map(([option, ranks]) => ({
        option,
        averageRank: (ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length).toFixed(2),
        responses: ranks.length
      }))
      .sort((a, b) => a.averageRank - b.averageRank);
  },

  calculateAveragePriceRange(responses) {
    const priceMapping = {
      "Nothing - only free tools": 0,
      "$10-20 per month": 15,
      "$21-40 per month": 30.5,
      "$41-60 per month": 50.5,
      "$61-100 per month": 80.5,
      "$100+ per month": 100
    };
    
    const prices = responses
      .map(r => priceMapping[r.pricing_willingness])
      .filter(p => p !== undefined);
    
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return {
      averageWillingness: average.toFixed(2),
      sampleSize: prices.length
    };
  }
};

export const mockSurveyData = {
  // Sample responses for testing
  responses: [
    {
      age_range: "26-35",
      writing_experience: "Some experience (blogs, articles)",
      income_level: "$50k-$75k",
      writing_challenges: ["Finding time to write", "Overcoming writer's block", "Understanding market trends"],
      current_tools: ["Microsoft Word", "Grammarly", "ChatGPT"],
      ai_experience: 3,
      book_interest: ["Mystery/Crime fiction", "Self-help/Personal development"],
      word_count_preference: "Medium (50k-75k words) - Standard novel",
      pricing_willingness: "$21-40 per month",
      revenue_share_interest: 4,
      most_valuable_features: {
        "AI-generated content": 1,
        "Market research and trends": 2,
        "Professional formatting/export": 3
      },
      content_control: 4,
      research_integration: 5,
      export_formats: ["PDF", "EPUB (ebook format)", "DOCX (Word document)"],
      biggest_frustration: "Finding time to write consistently and knowing what topics will sell",
      dream_features: "AI that understands market trends and helps write books that people actually want to read",
      success_definition: "Publishing a book that generates passive income"
    }
    // Additional mock responses would be added here
  ]
};

export default {
  surveyQuestions,
  surveyAnalysis,
  mockSurveyData
};