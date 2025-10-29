import React from 'react';
import { Settings, User, Search, Database } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useDocumentStore } from '../store/documentStore';

const Header: React.FC = () => {
  const { currentView, searchSettings, updateSearchSettings } = useChatStore();
  const { documents } = useDocumentStore();

  const processedDocuments = documents.filter(doc => doc.status === 'completed').length;
  const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Azure AI Search + OpenAI Chat
          </h1>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Database className="w-4 h-4" />
            <span>{processedDocuments} documents</span>
            <span>•</span>
            <span>{totalChunks} chunks indexed</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {currentView === 'chat' && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <select
                  value={searchSettings.searchColumn}
                  onChange={(e) => updateSearchSettings({
                    searchColumn: e.target.value as 'content_vector' | 'title_vector'
                  })}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="content_vector">Content Search</option>
                  <option value="title_vector">Title Search</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={searchSettings.useHybridSearch}
                    onChange={(e) => updateSearchSettings({ useHybridSearch: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Hybrid Search</span>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Results:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={searchSettings.kNearestNeighbors}
                  onChange={(e) => updateSearchSettings({
                    kNearestNeighbors: parseInt(e.target.value) || 3
                  })}
                  className="w-16 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
