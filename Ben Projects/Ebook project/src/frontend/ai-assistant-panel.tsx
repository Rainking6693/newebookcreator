/**
 * AI Assistant Panel Component
 * Advanced AI writing assistance with context-aware suggestions
 */

// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, 
  Sparkles, 
  RefreshCw, 
  Settings, 
  X, 
  Send,
  BookOpen,
  Lightbulb,
  Edit3,
  Zap,
  Target,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Slider from '@/components/ui/Slider';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Hooks
import { useAI } from '@/hooks/useAI';
import { useSubscription } from '@/hooks/useSubscription';

// Types
interface AIAssistantPanelProps {
  onGenerate: (prompt: string, options: any) => Promise<void>;
  onImprove: (improvementType: string) => Promise<void>;
  isGenerating: boolean;
  selectedText: string;
  bookGenre: string;
  onClose: () => void;
}

interface AITemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'generation' | 'improvement' | 'analysis';
  genre?: string[];
  icon: React.ComponentType<any>;
}

interface AISettings {
  model: 'claude' | 'gpt4' | 'auto';
  temperature: number;
  maxTokens: number;
  tone: string;
  style: string;
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  onGenerate,
  onImprove,
  isGenerating,
  selectedText,
  bookGenre,
  onClose
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'generate' | 'improve' | 'analyze'>('generate');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [aiSettings, setAISettings] = useState<AISettings>({
    model: 'auto',
    temperature: 0.7,
    maxTokens: 4000,
    tone: 'engaging',
    style: 'natural'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [recentSuggestions, setRecentSuggestions] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState<string>('');
  
  // Hooks
  const { currentPlan, usage, canGenerate } = useSubscription();
  const { generateContent, generateSuggestions, analyzeContent, isGenerating: aiGenerating, error } = useAI();
  
  // Refs
  const promptRef = useRef<HTMLTextAreaElement>(null);
  
  // AI Templates
  const templates: AITemplate[] = [
    // Generation Templates
    {
      id: 'continue_scene',
      name: 'Continue Scene',
      description: 'Continue the current scene naturally',
      prompt: 'Continue this scene in a natural and engaging way, maintaining the established tone and pacing.',
      category: 'generation',
      icon: BookOpen
    },
    {
      id: 'add_dialogue',
      name: 'Add Dialogue',
      description: 'Generate realistic dialogue for characters',
      prompt: 'Add realistic dialogue that advances the plot and reveals character personality.',
      category: 'generation',
      icon: MessageSquare
    },
    {
      id: 'describe_setting',
      name: 'Describe Setting',
      description: 'Create vivid setting descriptions',
      prompt: 'Create a vivid, immersive description of the setting that enhances the mood and atmosphere.',
      category: 'generation',
      icon: Target
    },
    {
      id: 'develop_character',
      name: 'Develop Character',
      description: 'Add character development and depth',
      prompt: 'Develop the character further by showing their personality, motivations, and internal conflicts.',
      category: 'generation',
      icon: Lightbulb
    },
    
    // Mystery-specific templates
    {
      id: 'add_clue',
      name: 'Add Clue',
      description: 'Introduce a subtle clue or red herring',
      prompt: 'Introduce a subtle clue that advances the mystery without being too obvious.',
      category: 'generation',
      genre: ['mystery'],
      icon: Sparkles
    },
    {
      id: 'build_suspense',
      name: 'Build Suspense',
      description: 'Increase tension and suspense',
      prompt: 'Build suspense and tension while maintaining the mystery atmosphere.',
      category: 'generation',
      genre: ['mystery'],
      icon: Zap
    },
    
    // Self-help specific templates
    {
      id: 'add_example',
      name: 'Add Example',
      description: 'Provide practical examples',
      prompt: 'Add a practical, real-world example that illustrates the concept clearly.',
      category: 'generation',
      genre: ['self-help'],
      icon: Target
    },
    {
      id: 'create_exercise',
      name: 'Create Exercise',
      description: 'Design actionable exercises',
      prompt: 'Create a practical exercise or worksheet that helps readers apply the concept.',
      category: 'generation',
      genre: ['self-help'],
      icon: Edit3
    },
    
    // Improvement Templates
    {
      id: 'improve_clarity',
      name: 'Improve Clarity',
      description: 'Make text clearer and more readable',
      prompt: 'Improve the clarity and readability of this text while maintaining its meaning.',
      category: 'improvement',
      icon: RefreshCw
    },
    {
      id: 'enhance_style',
      name: 'Enhance Style',
      description: 'Improve writing style and flow',
      prompt: 'Enhance the writing style and flow to make it more engaging and polished.',
      category: 'improvement',
      icon: Sparkles
    },
    {
      id: 'fix_grammar',
      name: 'Fix Grammar',
      description: 'Correct grammar and syntax',
      prompt: 'Correct any grammar, punctuation, and syntax errors while preserving the original voice.',
      category: 'improvement',
      icon: Check
    }
  ];
  
  // Filter templates by genre and category
  const getFilteredTemplates = (category: string) => {
    return templates.filter(template => 
      template.category === category && 
      (!template.genre || template.genre.includes(bookGenre))
    );
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setCustomPrompt(template.prompt);
      if (promptRef.current) {
        promptRef.current.focus();
      }
    }
  };
  
  // Handle AI generation
  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    
    try {
      await onGenerate(customPrompt, {
        ...aiSettings,
        selectedText,
        templateId: selectedTemplate
      });
      
      // Add to recent suggestions
      setRecentSuggestions(prev => [customPrompt, ...prev.slice(0, 4)]);
      setCustomPrompt('');
      setSelectedTemplate('');
      
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };
  
  // Handle improvement
  const handleImprove = async (improvementType: string) => {
    if (!selectedText) return;
    
    try {
      await onImprove(improvementType);
    } catch (error) {
      console.error('Improvement failed:', error);
    }
  };
  
  // Copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };
  
  // Check usage limits
  const canUseAI = () => {
    if (!currentPlan) return false;
    
    const usedBooks = usage.booksGenerated || 0;
    const limit = currentPlan.limits?.booksPerMonth || 0;
    
    return usedBooks < limit;
  };
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tooltip content="Settings">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={showSettings ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Usage Indicator */}
      {currentPlan && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">AI Generations</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {usage.booksGenerated || 0} / {currentPlan.limits?.booksPerMonth || 0}
            </span>
          </div>
          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(
                  ((usage.booksGenerated || 0) / (currentPlan.limits?.booksPerMonth || 1)) * 100,
                  100
                )}%` 
              }}
            />
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'generate', label: 'Generate', icon: Sparkles },
          { id: 'improve', label: 'Improve', icon: RefreshCw },
          { id: 'analyze', label: 'Analyze', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Model
                </label>
                <Select
                  value={aiSettings.model}
                  onChange={(value) => setAISettings(prev => ({ ...prev, model: value as any }))}
                  options={[
                    { value: 'auto', label: 'Auto (Best for task)' },
                    { value: 'claude', label: 'Claude (Creative)' },
                    { value: 'gpt4', label: 'GPT-4 (Structured)' }
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Creativity: {aiSettings.temperature}
                </label>
                <Slider
                  value={aiSettings.temperature}
                  onChange={(value) => setAISettings(prev => ({ ...prev, temperature: value }))}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Conservative</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone
                  </label>
                  <Select
                    value={aiSettings.tone}
                    onChange={(e) => setAISettings(prev => ({ ...prev, tone: e.target.value }))}
                    options={[
                      { value: 'professional', label: 'Professional' },
                      { value: 'engaging', label: 'Engaging' },
                      { value: 'casual', label: 'Casual' },
                      { value: 'formal', label: 'Formal' }
                    ]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Style
                  </label>
                  <Select
                    value={aiSettings.style}
                    onChange={(e) => setAISettings(prev => ({ ...prev, style: e.target.value }))}
                    options={[
                      { value: 'natural', label: 'Natural' },
                      { value: 'descriptive', label: 'Descriptive' },
                      { value: 'concise', label: 'Concise' },
                      { value: 'detailed', label: 'Detailed' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            {/* Quick Templates */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {getFilteredTemplates('generation').slice(0, 6).map(template => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`justify-start text-left h-auto p-3 ${
                      selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    disabled={!canUseAI()}
                  >
                    <div className="flex items-start space-x-2">
                      <template.icon className="w-4 h-4 mt-0.5 text-gray-500" />
                      <div>
                        <div className="font-medium text-xs">{template.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {template.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Custom Prompt
              </label>
              <Textarea
                ref={promptRef}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe what you want the AI to write..."
                rows={4}
                className="w-full"
                disabled={!canUseAI()}
              />
            </div>
            
            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!customPrompt.trim() || isGenerating || !canUseAI()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
            
            {!canUseAI() && (
              <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>AI generation limit reached. Upgrade your plan for more generations.</span>
              </div>
            )}
          </div>
        )}
        
        {/* Improve Tab */}
        {activeTab === 'improve' && (
          <div className="space-y-4">
            {selectedText ? (
              <>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Selected Text ({selectedText.length} characters)
                  </h4>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-auto">
                    {selectedText}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Improvement Options
                  </h4>
                  <div className="space-y-2">
                    {getFilteredTemplates('improvement').map(template => (
                      <Button
                        key={template.id}
                        variant="outline"
                        onClick={() => handleImprove(template.id)}
                        disabled={isGenerating || !canUseAI()}
                        className="w-full justify-start"
                      >
                        <template.icon className="w-4 h-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {template.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Select Text to Improve
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Highlight text in the editor to see improvement options
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Analyze Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-4">
            {selectedText ? (
              <>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Text Analysis
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Word Count</span>
                      <Badge variant="secondary">{selectedText.split(/\s+/).length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Character Count</span>
                      <Badge variant="secondary">{selectedText.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Reading Time</span>
                      <Badge variant="secondary">
                        {Math.ceil(selectedText.split(/\s+/).length / 200)} min
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => {/* Implement detailed analysis */}}
                  disabled={isGenerating || !canUseAI()}
                  className="w-full"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Analyze Writing Quality
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Select Text to Analyze
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Highlight text in the editor to see analysis options
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Recent Suggestions */}
        {recentSuggestions.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Recent Prompts
            </h4>
            <div className="space-y-2">
              {recentSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                    {suggestion}
                  </span>
                  <div className="flex items-center space-x-1 ml-2">
                    <Tooltip content="Copy">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(suggestion)}
                      >
                        {copiedText === suggestion ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </Tooltip>
                    <Tooltip content="Use">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomPrompt(suggestion)}
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Info className="w-3 h-3" />
          <span>AI suggestions are starting points. Always review and edit as needed.</span>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;