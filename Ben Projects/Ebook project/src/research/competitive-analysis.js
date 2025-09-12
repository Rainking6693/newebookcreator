/**
 * Competitive Analysis Module
 * Analyzes existing AI writing tools and identifies market gaps
 */

export const competitorAnalysis = {
  jasper: {
    name: "Jasper AI",
    url: "https://www.jasper.ai",
    strengths: [
      "Strong marketing copy generation",
      "Multiple content templates",
      "Team collaboration features",
      "Brand voice customization",
      "SEO optimization tools"
    ],
    weaknesses: [
      "Limited long-form book generation",
      "High pricing for individual users",
      "No built-in publishing workflow",
      "Limited genre specialization",
      "No revenue sharing model"
    ],
    pricing: {
      starter: 49, // per month
      boss: 99,
      business: "Custom"
    },
    targetAudience: "Marketing teams, agencies, content creators",
    bookGenerationCapability: "Limited - mainly blog posts and articles",
    marketPosition: "Premium marketing content tool"
  },

  copyAI: {
    name: "Copy.ai",
    url: "https://www.copy.ai",
    strengths: [
      "User-friendly interface",
      "Affordable pricing",
      "Good for short-form content",
      "Multiple language support",
      "Free tier available"
    ],
    weaknesses: [
      "Very limited long-form capabilities",
      "No book-specific features",
      "Basic editing tools",
      "No publishing integration",
      "Limited customization"
    ],
    pricing: {
      free: 0,
      pro: 36, // per month
      team: 186
    },
    targetAudience: "Small businesses, freelancers, marketers",
    bookGenerationCapability: "None - focused on marketing copy",
    marketPosition: "Affordable marketing copy assistant"
  },

  sudowrite: {
    name: "Sudowrite",
    url: "https://www.sudowrite.com",
    strengths: [
      "Specifically designed for creative writing",
      "Story development tools",
      "Character and plot assistance",
      "Rewriting and expansion features",
      "Fiction-focused interface"
    ],
    weaknesses: [
      "Limited to fiction writing",
      "No non-fiction/self-help capabilities",
      "No publishing workflow",
      "No subscription tiers for readers",
      "Limited export options"
    ],
    pricing: {
      hobby: 10, // per month
      professional: 25,
      max: 100
    },
    targetAudience: "Fiction writers, novelists",
    bookGenerationCapability: "Good for fiction, limited for other genres",
    marketPosition: "Creative writing assistant"
  },

  novelAI: {
    name: "NovelAI",
    url: "https://novelai.net",
    strengths: [
      "AI-powered storytelling",
      "Image generation",
      "Adventure mode",
      "Customizable AI models",
      "Privacy-focused"
    ],
    weaknesses: [
      "Primarily for interactive fiction",
      "No structured book creation",
      "Limited professional features",
      "No business model for authors",
      "Niche audience"
    ],
    pricing: {
      paper: 10, // per month
      tablet: 15,
      scroll: 25
    },
    targetAudience: "Interactive fiction enthusiasts, gamers",
    bookGenerationCapability: "Interactive stories, not traditional books",
    marketPosition: "Interactive storytelling platform"
  },

  writesonic: {
    name: "Writesonic",
    url: "https://writesonic.com",
    strengths: [
      "Multiple content types",
      "AI article writer",
      "SEO optimization",
      "Bulk content generation",
      "API access"
    ],
    weaknesses: [
      "Limited book-specific features",
      "Focus on marketing content",
      "No publishing integration",
      "Basic editing capabilities",
      "No genre specialization"
    ],
    pricing: {
      free: 0,
      longForm: 13, // per month
      custom: "Enterprise"
    },
    targetAudience: "Content marketers, agencies",
    bookGenerationCapability: "Limited - mainly articles and blogs",
    marketPosition: "Content marketing tool"
  }
};

export const marketGaps = {
  identifiedOpportunities: [
    {
      gap: "Complete Book Generation Pipeline",
      description: "No competitor offers end-to-end book creation from concept to published format",
      ourSolution: "Full pipeline from AI generation to EPUB/PDF export with professional formatting"
    },
    {
      gap: "Genre-Specific Optimization",
      description: "Most tools are generic; none specialize in mystery and self-help genres",
      ourSolution: "Specialized prompts and templates for mystery novels and self-help books"
    },
    {
      gap: "Hybrid Revenue Model",
      description: "All competitors use subscription-only models",
      ourSolution: "Upfront payment + revenue sharing model for published books"
    },
    {
      gap: "Market Analytics Integration",
      description: "No competitor provides market research and trend analysis for book topics",
      ourSolution: "Built-in bestseller analysis and keyword research tools"
    },
    {
      gap: "Professional Publishing Workflow",
      description: "Limited export options and no publishing platform integration",
      ourSolution: "Professional formatting, multiple export formats, future KDP integration"
    },
    {
      gap: "Tiered Word Limits",
      description: "Most have unlimited or very limited word counts",
      ourSolution: "Structured tiers (75k/100k/150k words) matching real book lengths"
    },
    {
      gap: "Content Quality Controls",
      description: "Basic or overly restrictive content filtering",
      ourSolution: "Minimal filtering (pornographic content only) with humanization features"
    },
    {
      gap: "Author Business Intelligence",
      description: "No tools help authors understand market opportunities",
      ourSolution: "Market analytics dashboard with trend analysis and competitive insights"
    }
  ],

  competitiveAdvantages: [
    "First platform designed specifically for complete book generation",
    "Genre specialization with optimized AI prompts",
    "Innovative hybrid pricing model",
    "Integrated market research and analytics",
    "Professional publishing workflow",
    "Minimal content restrictions",
    "Revenue sharing incentivizes platform success",
    "Comprehensive export options"
  ],

  marketSize: {
    globalEbookMarket: "28.8 billion USD (2023)",
    selfPublishingMarket: "2.3 billion USD (2023)",
    aiWritingToolsMarket: "1.1 billion USD (2023)",
    projectedGrowth: "15.3% CAGR through 2028",
    targetMarketSegment: "Self-publishing authors and aspiring writers"
  }
};

export const pricingAnalysis = {
  competitorPricing: {
    averageMonthlySubscription: 35, // USD
    range: { min: 10, max: 100 },
    mostCommonTier: "25-50 USD/month",
    freeTrialsCommon: true,
    annualDiscounts: "20-30% typical"
  },

  ourPricingStrategy: {
    basic: {
      price: 29.99,
      wordLimit: 75000,
      positioning: "Below average competitor pricing",
      valueProposition: "Complete book generation at lower cost"
    },
    pro: {
      price: 49.99,
      wordLimit: 100000,
      positioning: "Competitive with premium tools",
      valueProposition: "Professional features + market analytics"
    },
    author: {
      price: 99.99,
      wordLimit: 150000,
      positioning: "Premium tier for serious authors",
      valueProposition: "Full business intelligence + revenue sharing"
    },
    revenueShare: {
      percentage: 30,
      minimumPayout: 100,
      positioning: "Unique in market",
      valueProposition: "Platform success tied to author success"
    }
  }
};

export const userPersonas = {
  aspiringAuthor: {
    name: "Sarah - Aspiring Mystery Writer",
    age: 34,
    background: "Marketing professional, always wanted to write",
    painPoints: [
      "Lacks confidence in writing ability",
      "Limited time due to full-time job",
      "Doesn't know market trends",
      "Overwhelmed by publishing process"
    ],
    goals: [
      "Write first mystery novel",
      "Understand what readers want",
      "Professional-looking final product",
      "Potential passive income"
    ],
    preferredTier: "Pro",
    keyFeatures: ["Genre templates", "Market research", "Professional formatting"]
  },

  selfHelpCoach: {
    name: "Marcus - Life Coach",
    age: 42,
    background: "Certified life coach with 10 years experience",
    painPoints: [
      "Wants to scale beyond 1:1 coaching",
      "Struggles with long-form writing",
      "Needs credible, research-backed content",
      "Limited marketing knowledge"
    ],
    goals: [
      "Create signature book for credibility",
      "Generate passive income",
      "Reach wider audience",
      "Establish thought leadership"
    ],
    preferredTier: "Author",
    keyFeatures: ["Research integration", "Business analytics", "Revenue sharing"]
  },

  retiredProfessional: {
    name: "Linda - Retired Teacher",
    age: 67,
    background: "Recently retired, wants to share knowledge",
    painPoints: [
      "Not tech-savvy",
      "Fixed income concerns",
      "Intimidated by modern publishing",
      "Wants simple, guided process"
    ],
    goals: [
      "Share life experiences",
      "Leave a legacy",
      "Supplement retirement income",
      "Simple, guided process"
    ],
    preferredTier: "Basic",
    keyFeatures: ["Easy interface", "Step-by-step guidance", "Affordable pricing"]
  }
};

export default {
  competitorAnalysis,
  marketGaps,
  pricingAnalysis,
  userPersonas
};