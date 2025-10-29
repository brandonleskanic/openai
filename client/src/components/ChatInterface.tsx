import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ExternalLink } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { chatApi } from '../services/api';
import toast from 'react-hot-toast';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    sessions,
    currentSessionId,
    createSession,
    setCurrentSession,
    addMessage,
    updateMessage,
    searchSettings,
    getCurrentSession,
  } = useChatStore();

  const currentSession = getCurrentSession();

  // Create initial session if none exists
  useEffect(() => {
    if (sessions.length === 0 || !currentSessionId) {
      const sessionId = createSession();
      setCurrentSession(sessionId);
    }
  }, [sessions.length, currentSessionId, createSession, setCurrentSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentSessionId) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    addMessage(currentSessionId, {
      content: userMessage,
      role: 'user',
    });

    // Add loading assistant message
    const assistantMessageId = `msg_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    addMessage(currentSessionId, {
      content: '',
      role: 'assistant',
      isLoading: true,
    });

    try {
      const response = await chatApi.sendMessage({
        message: userMessage,
        searchSettings,
      });

      // Update assistant message with response
      updateMessage(currentSessionId, assistantMessageId, {
        content: response.message,
        sources: response.sources,
        isLoading: false,
      });
    } catch (error) {
      console.error('Chat error:', error);
      updateMessage(currentSessionId, assistantMessageId, {
        content:
          'Sorry, I encountered an error processing your request. Please try again.',
        isLoading: false,
      });
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {currentSession.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500">
                Ask me anything about your documents. I can search through your
                knowledge base and provide relevant answers with source
                citations.
              </p>
            </div>
          </div>
        ) : (
          <>
            {currentSession.messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="flex items-end space-x-4">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-12 h-12 rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Search mode:</span>
            <span className="font-medium">
              {searchSettings.useHybridSearch ? 'Hybrid' : 'Vector Only'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
