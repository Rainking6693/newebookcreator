/**
 * Book Editor Component
 * Advanced rich text editor with AI assistance and real-time collaboration
 */

// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Wand2, 
  Settings, 
  Eye, 
  EyeOff, 
  MoreHorizontal,
  Undo,
  Redo,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Zap,
  Target,
  BookOpen,
  Clock,
  Users
} from 'lucide-react';

// Components
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Tooltip from '@/components/ui/Tooltip';
import ProgressBar from '@/components/ui/ProgressBar';
import AIAssistantPanel from '@/components/editor/AIAssistantPanel';
import ChapterNavigation from '@/components/editor/ChapterNavigation';
import WritingStats from '@/components/editor/WritingStats';
import CollaborationPanel from '@/components/editor/CollaborationPanel';

// Hooks
import { useBook } from '@/hooks/useBook';
import { useAI } from '@/hooks/useAI';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Services
import { bookService } from '@/services/books';
import { aiService } from '@/services/ai';

// Types
interface BookEditorProps {
  bookId: string;
  chapterId?: string;
  initialContent?: string;
  readOnly?: boolean;
}

interface EditorState {
  content: string;
  wordCount: number;
  characterCount: number;
  readingTime: number;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

const BookEditor: React.FC<BookEditorProps> = ({
  bookId,
  chapterId,
  initialContent = '',
  readOnly = false
}) => {
  // Hooks
  const { book, currentChapter, updateChapter, isLoading } = useBook(bookId, chapterId);
  const { generateContent, improveContent, isGenerating } = useAI();
  
  // State
  const [editorState, setEditorState] = useState<EditorState>({
    content: initialContent,
    wordCount: 0,
    characterCount: 0,
    readingTime: 0,
    lastSaved: null,
    hasUnsavedChanges: false
  });
  
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  
  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // TipTap Editor Configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false
        }
      })
    ],
    content: editorState.content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const text = editor.getText();
      
      setEditorState(prev => ({
        ...prev,
        content,
        wordCount: countWords(text),
        characterCount: text.length,
        readingTime: calculateReadingTime(text),
        hasUnsavedChanges: true
      }));
      
      // Trigger auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(content);
      }, 2000); // Auto-save after 2 seconds of inactivity
    },
    onSelectionUpdate: ({ editor }) => {
      // Handle selection changes for AI assistance
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      
      if (selectedText && showAIPanel) {
        // Update AI panel with selected text
      }
    }
  });
  
  // Auto-save functionality
  const handleAutoSave = useCallback(async (content: string) => {
    if (!chapterId || readOnly) return;
    
    try {
      await updateChapter(chapterId, { content });
      setEditorState(prev => ({
        ...prev,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }));
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [chapterId, updateChapter, readOnly]);
  
  // Manual save
  const handleSave = useCallback(async () => {
    if (!chapterId || !editorState.hasUnsavedChanges) return;
    
    await handleAutoSave(editorState.content);
  }, [chapterId, editorState.content, editorState.hasUnsavedChanges, handleAutoSave]);
  
  // AI Content Generation
  const handleAIGenerate = useCallback(async (prompt: string, options: any = {}) => {
    if (!editor) return;
    
    try {
      const result = await generateContent({
        prompt,
        bookId,
        chapterId,
        genre: book?.genre,
        ...options
      });
      
      // Insert generated content at cursor position
      const { from } = editor.state.selection;
      editor.chain().focus().insertContentAt(from, result.content).run();
      
    } catch (error) {
      console.error('AI generation failed:', error);
    }
  }, [editor, generateContent, bookId, chapterId, book?.genre]);
  
  // AI Content Improvement
  const handleAIImprove = useCallback(async (improvementType: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    if (!selectedText) return;
    
    try {
      const result = await improveContent({
        content: selectedText,
        improvementType,
        bookId,
        chapterId
      });
      
      // Replace selected text with improved version
      editor.chain().focus().deleteRange({ from, to }).insertContent(result.content).run();
      
    } catch (error) {
      console.error('AI improvement failed:', error);
    }
  }, [editor, improveContent, bookId, chapterId]);
  
  // Keyboard Shortcuts
  useKeyboardShortcuts({
    'Ctrl+S': handleSave,
    'Ctrl+Shift+A': () => setShowAIPanel(!showAIPanel),
    'Ctrl+Shift+P': () => setShowPreview(!showPreview),
    'F11': () => setIsFullscreen(!isFullscreen),
    'Ctrl+Shift+F': () => setFocusMode(!focusMode)
  });
  
  // WebSocket for real-time collaboration
  const { isConnected } = useWebSocket({
    enabled: !readOnly && showCollaboration,
    room: `book_${bookId}_chapter_${chapterId}`,
    onMessage: (message) => {
      // Handle collaborative editing messages
      if (message.type === 'content_change' && message.userId !== 'current_user') {
        // Apply remote changes
      }
    }
  });
  
  // Utility functions
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  const calculateReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const words = countWords(text);
    return Math.ceil(words / wordsPerMinute);
  };
  
  // Toolbar component
  const EditorToolbar = () => (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center space-x-2">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-700 pr-2">
          <Tooltip content="Bold (Ctrl+B)">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={editor?.isActive('bold') ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <Bold className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Italic (Ctrl+I)">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={editor?.isActive('italic') ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <Italic className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
        
        {/* Headings */}
        <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-700 pr-2">
          <Tooltip content="Heading 1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor?.isActive('heading', { level: 1 }) ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <Heading1 className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Heading 2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor?.isActive('heading', { level: 2 }) ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <Heading2 className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Heading 3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor?.isActive('heading', { level: 3 }) ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <Heading3 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
        
        {/* Lists */}
        <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-700 pr-2">
          <Tooltip content="Bullet List">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={editor?.isActive('bulletList') ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Numbered List">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={editor?.isActive('orderedList') ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Quote">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={editor?.isActive('blockquote') ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <Quote className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
        
        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <Tooltip content="Undo (Ctrl+Z)">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
            >
              <Undo className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Redo (Ctrl+Y)">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
      
      {/* Right side controls */}
      <div className="flex items-center space-x-2">
        {/* Word count and save status */}
        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-3">
          <span>{editorState.wordCount} words</span>
          <span>{editorState.readingTime} min read</span>
          {editorState.hasUnsavedChanges ? (
            <span className="text-yellow-600 dark:text-yellow-400">Unsaved</span>
          ) : editorState.lastSaved ? (
            <span className="text-green-600 dark:text-green-400">
              Saved {editorState.lastSaved.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
        
        {/* Action buttons */}
        <Tooltip content="AI Assistant (Ctrl+Shift+A)">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={showAIPanel ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}
          >
            <Wand2 className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <Tooltip content="Preview (Ctrl+Shift+P)">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={showPreview ? 'bg-gray-100 dark:bg-gray-700' : ''}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </Tooltip>
        
        <Tooltip content="Save (Ctrl+S)">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!editorState.hasUnsavedChanges}
          >
            <Save className="w-4 h-4" />
          </Button>
        </Tooltip>
        
        <Tooltip content="Settings">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Chapter Navigation */}
      {!focusMode && (
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <ChapterNavigation
            book={book}
            currentChapterId={chapterId}
            onChapterSelect={(id) => window.location.href = `/app/books/${bookId}/chapters/${id}`}
          />
        </div>
      )}
      
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        <EditorToolbar />
        
        <div className="flex-1 flex">
          {/* Editor Content */}
          <div className={`flex-1 flex flex-col ${showPreview ? 'w-1/2' : 'w-full'}`}>
            <div className="flex-1 overflow-auto">
              <div 
                ref={editorRef}
                className={`max-w-4xl mx-auto p-8 ${focusMode ? 'pt-20' : ''}`}
              >
                <EditorContent
                  editor={editor}
                  className="prose prose-lg dark:prose-invert max-w-none focus:outline-none"
                />
              </div>
            </div>
            
            {/* Writing Stats */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <WritingStats
                wordCount={editorState.wordCount}
                characterCount={editorState.characterCount}
                readingTime={editorState.readingTime}
                targetWordCount={currentChapter?.targetWordCount}
                sessionWordCount={0} // Track session-specific words
              />
            </div>
          </div>
          
          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Preview</h3>
              </div>
              <div className="p-8 overflow-auto h-full">
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: editorState.content }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Assistant Panel */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700"
          >
            <AIAssistantPanel
              onGenerate={handleAIGenerate}
              onImprove={handleAIImprove}
              isGenerating={isGenerating}
              selectedText={editor?.state.selection.empty ? '' : editor?.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to
              )}
              bookGenre={book?.genre}
              onClose={() => setShowAIPanel(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Editor Settings"
        size="md"
      >
        <div className="space-y-4">
          {/* Editor preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Size
            </label>
            <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={focusMode}
                onChange={(e) => setFocusMode(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Focus Mode</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showCollaboration}
                onChange={(e) => setShowCollaboration(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable Collaboration</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookEditor;