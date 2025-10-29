import { create } from 'zustand';

export interface DocumentInfo {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: Date;
  processed: boolean;
  chunks: number;
  category?: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface DocumentState {
  documents: DocumentInfo[];
  isUploading: boolean;
  uploadProgress: { [fileId: string]: number };
  categories: string[];
}

interface DocumentActions {
  addDocument: (document: Omit<DocumentInfo, 'id' | 'uploadedAt'>) => string;
  updateDocument: (id: string, updates: Partial<DocumentInfo>) => void;
  removeDocument: (id: string) => void;
  setIsUploading: (isUploading: boolean) => void;
  updateUploadProgress: (fileId: string, progress: number) => void;
  setCategories: (categories: string[]) => void;
  clearDocuments: () => void;
}

export const useDocumentStore = create<DocumentState & DocumentActions>((set, get) => ({
  documents: [],
  isUploading: false,
  uploadProgress: {},
  categories: ['authentication', 'models', 'techniques', 'tools', 'setup', 'billing_limits', 'other'],

  addDocument: (document: Omit<DocumentInfo, 'id' | 'uploadedAt'>) => {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullDocument: DocumentInfo = {
      ...document,
      id,
      uploadedAt: new Date(),
    };

    set((state) => ({
      documents: [fullDocument, ...state.documents]
    }));

    return id;
  },

  updateDocument: (id: string, updates: Partial<DocumentInfo>) => {
    set((state) => ({
      documents: state.documents.map(doc =>
        doc.id === id ? { ...doc, ...updates } : doc
      )
    }));
  },

  removeDocument: (id: string) => {
    set((state) => ({
      documents: state.documents.filter(doc => doc.id !== id),
      uploadProgress: Object.fromEntries(
        Object.entries(state.uploadProgress).filter(([key]) => key !== id)
      )
    }));
  },

  setIsUploading: (isUploading: boolean) => {
    set({ isUploading });
  },

  updateUploadProgress: (fileId: string, progress: number) => {
    set((state) => ({
      uploadProgress: { ...state.uploadProgress, [fileId]: progress }
    }));
  },

  setCategories: (categories: string[]) => {
    set({ categories });
  },

  clearDocuments: () => {
    set({ documents: [], uploadProgress: {} });
  },
}));
