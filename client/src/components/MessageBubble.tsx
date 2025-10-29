import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ExternalLink, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Message } from '../store/chatStore';
import TypingIndicator from './TypingIndicator';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [showSources, setShowSources] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedText(code);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(timestamp);
  };

  const CodeBlock = ({ children, className, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    return match ? (
      <div className="relative">
        <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 text-sm rounded-t-lg">
          <span>{language}</span>
          <button
            onClick={() => handleCopyCode(code)}
            className="flex items-center space-x-1 hover:text-white transition-colors"
          >
            {copiedText === code ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="rounded-t-none"
          {...props}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className="bg-gray-100 text-gray-900 px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    );
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex flex-col items-end max-w-xs md:max-w-md">
          <div className="message-user">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="text-xs text-gray-500 mt-1">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex flex-col max-w-xs md:max-w-2xl w-full">
        <div className="message-assistant">
          {message.isLoading ? (
            <TypingIndicator />
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code: CodeBlock,
                  pre: ({ children }) => <>{children}</>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>

          {message.sources && message.sources.length > 0 && (
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 transition-colors"
            >
              <span>{message.sources.length} sources</span>
              {showSources ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Sources */}
        {showSources && message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Sources:</h4>
            {message.sources.map((source, index) => (
              <div
                key={source.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">
                      {source.title}
                    </h5>
                    {source.category && (
                      <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                        {source.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Score: {(source.score * 100).toFixed(1)}%</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-gray-600 line-clamp-3">
                  {source.content.length > 200
                    ? source.content.substring(0, 200) + '...'
                    : source.content
                  }
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
