import React from 'react';
import { Toaster } from 'react-hot-toast';
import ChatInterface from './components/ChatInterface';
import DocumentUpload from './components/DocumentUpload';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { useChatStore } from './store/chatStore';
import { useDocumentStore } from './store/documentStore';

function App() {
  const { currentView } = useChatStore();
  const { documents } = useDocumentStore();

  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface />;
      case 'documents':
        return <DocumentUpload />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
