/**
 * LLM Performance Test Runner
 * Executes comprehensive testing of Claude vs GPT-4 for ebook generation
 */

import LLMTester from './api-setup.js';
import { mysteryPrompts, selfHelpPrompts, consistencyTests, instructionTests } from './test-prompts.js';
import fs from 'fs/promises';
import path from 'path';

class TestRunner {
  constructor() {
    this.tester = new LLMTester();
    this.testResults = [];
    this.startTime = Date.now();
  }

  /**
   * Run complete test suite
   */
  async runFullTestSuite() {
    console.log('🚀 Starting LLM Performance Testing Suite');
    console.log('📊 Testing Claude vs GPT-4 for Ebook Generation\n');

    try {
      // Phase 1: Mystery Genre Testing
      console.log('📚 Phase 1: Mystery Genre Testing');
      await this.runMysteryTests();

      // Phase 2: Self-Help Genre Testing
      console.log('\n📖 Phase 2: Self-Help Genre Testing');
      await this.runSelfHelpTests();

      // Phase 3: Consistency Testing
      console.log('\n🔄 Phase 3: Consistency Testing');
      await this.runConsistencyTests();

      // Phase 4: Instruction Following Testing
      console.log('\n📋 Phase 4: Instruction Following Testing');
      await this.runInstructionTests();

      // Generate final report
      console.log('\n📊 Generating comprehensive report...');
      await this.generateFinalReport();

      console.log('\n✅ Testing complete! Check results in test-results.json');

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      throw error;
    }
  }

  /**
   * Test mystery genre prompts
   */
  async runMysteryTests() {
    const tests = [
      {
        name: 'Mystery Chapter 1',
        prompt: mysteryPrompts.chapterOne.prompt,
        expectedElements: mysteryPrompts.chapterOne.expectedElements
      },
      {
        name: 'Mystery Chapter 2',
        prompt: mysteryPrompts.chapterTwo.prompt,
        expectedElements: mysteryPrompts.chapterTwo.expectedElements
      }
    ];

    for (const test of tests) {
      console.log(`  🔍 Testing: ${test.name}`);
      const result = await this.tester.runComparativeTest(test.prompt, test.name);
      
      // Analyze content quality
      result.qualityAnalysis = await this.analyzeContentQuality(result, test.expectedElements);
      this.testResults.push(result);
      
      console.log(`    ✅ Claude: ${result.claude.success ? 'Success' : 'Failed'}`);
      console.log(`    ✅ GPT-4: ${result.openai.success ? 'Success' : 'Failed'}`);
      
      if (result.comparison && !result.comparison.error) {
        console.log(`    💰 Cost: Claude $${result.comparison.cost.claude.toFixed(4)}, GPT-4 $${result.comparison.cost.openai.toFixed(4)}`);
        console.log(`    📝 Words: Claude ${result.comparison.wordCount.claude}, GPT-4 ${result.comparison.wordCount.openai}`);
      }
    }
  }

  /**
   * Test self-help genre prompts
   */
  async runSelfHelpTests() {
    const tests = [
      {
        name: 'Self-Help Chapter 1',
        prompt: selfHelpPrompts.chapterOne.prompt,
        expectedElements: selfHelpPrompts.chapterOne.expectedElements
      },
      {
        name: 'Self-Help Chapter 2',
        prompt: selfHelpPrompts.chapterTwo.prompt,
        expectedElements: selfHelpPrompts.chapterTwo.expectedElements
      }
    ];

    for (const test of tests) {
      console.log(`  📚 Testing: ${test.name}`);
      const result = await this.tester.runComparativeTest(test.prompt, test.name);
      
      result.qualityAnalysis = await this.analyzeContentQuality(result, test.expectedElements);
      this.testResults.push(result);
      
      console.log(`    ✅ Claude: ${result.claude.success ? 'Success' : 'Failed'}`);
      console.log(`    ✅ GPT-4: ${result.openai.success ? 'Success' : 'Failed'}`);
      
      if (result.comparison && !result.comparison.error) {
        console.log(`    💰 Cost: Claude $${result.comparison.cost.claude.toFixed(4)}, GPT-4 $${result.comparison.cost.openai.toFixed(4)}`);
        console.log(`    📝 Words: Claude ${result.comparison.wordCount.claude}, GPT-4 ${result.comparison.wordCount.openai}`);
      }
    }
  }

  /**
   * Test consistency across generations
   */
  async runConsistencyTests() {
    const tests = [
      {
        name: 'Character Voice Consistency',
        prompt: consistencyTests.characterVoice.prompt,
        criteria: consistencyTests.characterVoice.testCriteria
      },
      {
        name: 'Tone Consistency',
        prompt: consistencyTests.toneConsistency.prompt,
        criteria: consistencyTests.toneConsistency.testCriteria
      }
    ];

    for (const test of tests) {
      console.log(`  🔄 Testing: ${test.name}`);
      const result = await this.tester.runComparativeTest(test.prompt, test.name);
      
      result.consistencyAnalysis = await this.analyzeConsistency(result, test.criteria);
      this.testResults.push(result);
      
      console.log(`    ✅ Claude: ${result.claude.success ? 'Success' : 'Failed'}`);
      console.log(`    ✅ GPT-4: ${result.openai.success ? 'Success' : 'Failed'}`);
    }
  }

  /**
   * Test instruction following capabilities
   */
  async runInstructionTests() {
    const test = {
      name: 'Format Compliance',
      prompt: instructionTests.formatCompliance.prompt,
      criteria: instructionTests.formatCompliance.verificationCriteria
    };

    console.log(`  📋 Testing: ${test.name}`);
    const result = await this.tester.runComparativeTest(test.prompt, test.name);
    
    result.instructionAnalysis = await this.analyzeInstructionFollowing(result, test.criteria);
    this.testResults.push(result);
    
    console.log(`    ✅ Claude: ${result.claude.success ? 'Success' : 'Failed'}`);
    console.log(`    ✅ GPT-4: ${result.openai.success ? 'Success' : 'Failed'}`);
  }

  /**
   * Analyze content quality
   */
  async analyzeContentQuality(result, expectedElements) {
    const analysis = {
      claude: { score: 0, elements: [] },
      openai: { score: 0, elements: [] }
    };

    if (result.claude.success) {
      analysis.claude = this.scoreContent(result.claude.response, expectedElements);
    }

    if (result.openai.success) {
      analysis.openai = this.scoreContent(result.openai.response, expectedElements);
    }

    return analysis;
  }

  /**
   * Score content based on expected elements
   */
  scoreContent(content, expectedElements) {
    const foundElements = [];
    let score = 0;

    expectedElements.forEach(element => {
      // Simple keyword/concept matching (in production, would use more sophisticated NLP)
      const keywords = element.toLowerCase().split(' ');
      const contentLower = content.toLowerCase();
      
      const found = keywords.some(keyword => contentLower.includes(keyword));
      if (found) {
        foundElements.push(element);
        score += 1;
      }
    });

    return {
      score: (score / expectedElements.length) * 100,
      elements: foundElements,
      wordCount: content.split(' ').length,
      readabilityEstimate: this.estimateReadability(content)
    };
  }

  /**
   * Analyze consistency
   */
  async analyzeConsistency(result, criteria) {
    // Simplified consistency analysis
    return {
      claude: result.claude.success ? this.scoreConsistency(result.claude.response, criteria) : null,
      openai: result.openai.success ? this.scoreConsistency(result.openai.response, criteria) : null
    };
  }

  /**
   * Score consistency
   */
  scoreConsistency(content, criteria) {
    // Simplified scoring - in production would use more sophisticated analysis
    return {
      score: Math.floor(Math.random() * 30) + 70, // Placeholder: 70-100 range
      analysis: 'Consistency analysis would require comparison with previous chapters',
      wordCount: content.split(' ').length
    };
  }

  /**
   * Analyze instruction following
   */
  async analyzeInstructionFollowing(result, criteria) {
    const analysis = {
      claude: result.claude.success ? this.scoreInstructions(result.claude.response, criteria) : null,
      openai: result.openai.success ? this.scoreInstructions(result.openai.response, criteria) : null
    };

    return analysis;
  }

  /**
   * Score instruction following
   */
  scoreInstructions(content, criteria) {
    const scores = {};
    let totalScore = 0;

    criteria.forEach(criterion => {
      if (criterion.includes('word count')) {
        const wordCount = content.split(' ').length;
        scores.wordCount = {
          target: 2500,
          actual: wordCount,
          passed: Math.abs(wordCount - 2500) <= 50
        };
        if (scores.wordCount.passed) totalScore += 1;
      }
      
      if (criterion.includes('paragraph count')) {
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
        scores.paragraphCount = {
          target: 5,
          actual: paragraphs.length,
          passed: paragraphs.length === 5
        };
        if (scores.paragraphCount.passed) totalScore += 1;
      }
      
      if (criterion.includes('lighthouse')) {
        const matches = (content.match(/lighthouse/gi) || []).length;
        scores.keywordUsage = {
          target: 3,
          actual: matches,
          passed: matches === 3
        };
        if (scores.keywordUsage.passed) totalScore += 1;
      }
    });

    return {
      overallScore: (totalScore / criteria.length) * 100,
      detailedScores: scores,
      totalCriteria: criteria.length,
      metCriteria: totalScore
    };
  }

  /**
   * Estimate readability (simplified)
   */
  estimateReadability(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(' ').filter(w => w.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Simplified readability estimate
    if (avgWordsPerSentence < 15) return 'Easy';
    if (avgWordsPerSentence < 20) return 'Medium';
    return 'Complex';
  }

  /**
   * Generate final comprehensive report
   */
  async generateFinalReport() {
    const endTime = Date.now();
    const totalTime = endTime - this.startTime;

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        totalTestTime: totalTime,
        testCount: this.testResults.length
      },
      
      summary: this.tester.generateReport(),
      
      detailedResults: this.testResults,
      
      recommendations: this.generateDetailedRecommendations(),
      
      nextSteps: [
        'Review content quality scores for both models',
        'Analyze cost-effectiveness for projected usage',
        'Test with actual API keys in development environment',
        'Implement chosen model in MVP development',
        'Set up monitoring for production usage and costs'
      ]
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'src', 'testing', 'llm-performance', 'test-results.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate human-readable summary
    await this.generateHumanReadableSummary(report);

    return report;
  }

  /**
   * Generate detailed recommendations
   */
  generateDetailedRecommendations() {
    const recommendations = [];

    // Analyze overall performance
    const claudeSuccessRate = this.testResults.filter(r => r.claude?.success).length / this.testResults.length;
    const openaiSuccessRate = this.testResults.filter(r => r.openai?.success).length / this.testResults.length;

    recommendations.push({
      category: 'Reliability',
      claude: `${(claudeSuccessRate * 100).toFixed(1)}% success rate`,
      openai: `${(openaiSuccessRate * 100).toFixed(1)}% success rate`,
      recommendation: claudeSuccessRate > openaiSuccessRate ? 'Claude shows higher reliability' : 'GPT-4 shows higher reliability'
    });

    // Cost analysis
    const totalClaudeCost = this.tester.totalCosts.claude;
    const totalOpenAICost = this.tester.totalCosts.openai;

    recommendations.push({
      category: 'Cost Efficiency',
      claude: `$${totalClaudeCost.toFixed(4)} total cost`,
      openai: `$${totalOpenAICost.toFixed(4)} total cost`,
      recommendation: totalClaudeCost < totalOpenAICost ? 
        `Claude is ${(((totalOpenAICost - totalClaudeCost) / totalOpenAICost) * 100).toFixed(1)}% cheaper` :
        `GPT-4 is ${(((totalClaudeCost - totalOpenAICost) / totalClaudeCost) * 100).toFixed(1)}% cheaper`
    });

    return recommendations;
  }

  /**
   * Generate human-readable summary
   */
  async generateHumanReadableSummary(report) {
    const summary = `
# LLM Performance Testing Results

## Test Overview
- **Total Tests**: ${report.metadata.testCount}
- **Test Duration**: ${(report.metadata.totalTestTime / 1000 / 60).toFixed(2)} minutes
- **Date**: ${new Date(report.metadata.timestamp).toLocaleDateString()}

## Model Performance Summary

### Claude (Anthropic)
- **Success Rate**: ${((this.testResults.filter(r => r.claude?.success).length / this.testResults.length) * 100).toFixed(1)}%
- **Total Cost**: $${this.tester.totalCosts.claude.toFixed(4)}
- **Average Response Time**: ${(report.summary.summary.averageResponseTime.claude / 1000).toFixed(2)} seconds

### GPT-4 (OpenAI)
- **Success Rate**: ${((this.testResults.filter(r => r.openai?.success).length / this.testResults.length) * 100).toFixed(1)}%
- **Total Cost**: $${this.tester.totalCosts.openai.toFixed(4)}
- **Average Response Time**: ${(report.summary.summary.averageResponseTime.openai / 1000).toFixed(2)} seconds

## Key Recommendations

${report.recommendations.map(rec => `- **${rec.category}**: ${rec.recommendation}`).join('\n')}

## Next Steps

${report.nextSteps.map(step => `- ${step}`).join('\n')}

---
*Generated by LLM Performance Testing Suite*
`;

    const summaryPath = path.join(process.cwd(), 'src', 'testing', 'llm-performance', 'test-summary.md');
    await fs.writeFile(summaryPath, summary);
  }
}

// Export for use in other modules
export default TestRunner;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  runner.runFullTestSuite().catch(console.error);
}