import React from 'react';
import { MessageCircle, FileText, Plus, Trash2, Settings } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

const Sidebar: React.FC = () => {
  const {
    sessions,
    currentSessionId,
    currentView,
    createSession,
    setCurrentSession,
    deleteSession,
    setCurrentView
  } = useChatStore();

  const handleNewChat = () => {
    const sessionId = createSession();
    setCurrentView('chat');
  };

  const handleSessionClick = (sessionId: string) => {
    setCurrentSession(sessionId);
    setCurrentView('chat');
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSession(sessionId);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-gray-700">
        <nav className="space-y-2">
          <button
            onClick={() => setCurrentView('chat')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'chat'
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setCurrentView('documents')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'documents'
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Documents</span>
          </button>
        </nav>
      </div>

      {/* Chat Sessions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Recent Chats
          </h3>

          {sessions.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">
              No chat sessions yet
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {session.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(session.updatedAt)} • {session.messages.length} messages
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
