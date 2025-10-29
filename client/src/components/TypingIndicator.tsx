import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <div className="flex space-x-1">
        <div className="typing-dot bg-gray-400"></div>
        <div className="typing-dot bg-gray-400"></div>
        <div className="typing-dot bg-gray-400"></div>
      </div>
      <span className="text-sm">AI is thinking...</span>
    </div>
  );
};

export default TypingIndicator;
