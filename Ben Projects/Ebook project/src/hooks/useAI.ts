import { useState, useCallback } from 'react';

interface AIGenerationOptions {
  genre?: string;
  tone?: string;
  length?: number;
  temperature?: number;
}

interface UseAIReturn {
  isGenerating: boolean;
  error: string | null;
  generateContent: (prompt: string, options?: AIGenerationOptions) => Promise<string>;
  generateChapter: (outline: string, options?: AIGenerationOptions) => Promise<string>;
  improveContent: (content: string, improvements: string[]) => Promise<string>;
  generateSuggestions: (content: string) => Promise<string[]>;
  analyzeContent: (content: string) => Promise<{score: number, feedback: string}>;
}

export const useAI = (): UseAIReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = useCallback(async (prompt: string, options: AIGenerationOptions = {}): Promise<string> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Simulate AI generation for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockContent = `Generated content based on: "${prompt}"\n\nGenre: ${options.genre || 'General'}\nTone: ${options.tone || 'Neutral'}\n\nThis is a mock AI-generated response that would normally come from Claude or GPT-4. In a real implementation, this would make an API call to the selected LLM service.`;
      
      return mockContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate content';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateChapter = useCallback(async (outline: string, options: AIGenerationOptions = {}): Promise<string> => {
    return generateContent(`Write a chapter based on this outline: ${outline}`, options);
  }, [generateContent]);

  const improveContent = useCallback(async (content: string, improvements: string[]): Promise<string> => {
    const improvementText = improvements.join(', ');
    return generateContent(`Improve this content with the following suggestions: ${improvementText}\n\nContent: ${content}`);
  }, [generateContent]);

  const generateSuggestions = useCallback(async (content: string): Promise<string[]> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        'Add more descriptive language',
        'Improve character development',
        'Enhance the plot structure',
        'Add dialogue to make it more engaging'
      ];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const analyzeContent = useCallback(async (content: string): Promise<{score: number, feedback: string}> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        score: Math.floor(Math.random() * 40) + 60, // Score between 60-100
        feedback: 'Good structure and flow. Consider adding more specific details and examples.'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze content';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    generateContent,
    generateChapter,
    improveContent,
    generateSuggestions,
    analyzeContent
  };
};