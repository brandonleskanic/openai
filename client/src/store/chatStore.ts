import { create } from 'zustand';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: SearchResult[];
  isLoading?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  category?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentView: 'chat' | 'documents';
  isTyping: boolean;
  searchSettings: {
    useHybridSearch: boolean;
    kNearestNeighbors: number;
    searchColumn: 'content_vector' | 'title_vector';
    category?: string;
  };
}

interface ChatActions {
  createSession: () => string;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
  clearMessages: (sessionId: string) => void;
  setCurrentView: (view: 'chat' | 'documents') => void;
  setIsTyping: (isTyping: boolean) => void;
  updateSearchSettings: (settings: Partial<ChatState['searchSettings']>) => void;
  getCurrentSession: () => ChatSession | null;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  currentView: 'chat',
  isTyping: false,
  searchSettings: {
    useHybridSearch: true,
    kNearestNeighbors: 3,
    searchColumn: 'content_vector',
  },

  createSession: () => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: ChatSession = {
      id: sessionId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      sessions: [newSession, ...state.sessions],
      currentSessionId: sessionId,
    }));

    return sessionId;
  },

  deleteSession: (sessionId: string) => {
    set((state) => {
      const newSessions = state.sessions.filter(s => s.id !== sessionId);
      const newCurrentSessionId = state.currentSessionId === sessionId
        ? (newSessions.length > 0 ? newSessions[0].id : null)
        : state.currentSessionId;

      return {
        sessions: newSessions,
        currentSessionId: newCurrentSessionId,
      };
    });
  },

  setCurrentSession: (sessionId: string) => {
    set({ currentSessionId: sessionId });
  },

  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullMessage: Message = {
      ...message,
      id: messageId,
      timestamp: new Date(),
    };

    set((state) => ({
      sessions: state.sessions.map(session =>
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, fullMessage],
              updatedAt: new Date(),
              title: session.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                : session.title
            }
          : session
      )
    }));
  },

  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => {
    set((state) => ({
      sessions: state.sessions.map(session =>
        session.id === sessionId
          ? {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
              updatedAt: new Date(),
            }
          : session
      )
    }));
  },

  clearMessages: (sessionId: string) => {
    set((state) => ({
      sessions: state.sessions.map(session =>
        session.id === sessionId
          ? { ...session, messages: [], updatedAt: new Date() }
          : session
      )
    }));
  },

  setCurrentView: (view: 'chat' | 'documents') => {
    set({ currentView: view });
  },

  setIsTyping: (isTyping: boolean) => {
    set({ isTyping });
  },

  updateSearchSettings: (settings: Partial<ChatState['searchSettings']>) => {
    set((state) => ({
      searchSettings: { ...state.searchSettings, ...settings }
    }));
  },

  getCurrentSession: () => {
    const state = get();
    return state.sessions.find(s => s.id === state.currentSessionId) || null;
  },
}));
