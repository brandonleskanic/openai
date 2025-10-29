import axios from 'axios';
import { SearchResult } from '../store/chatStore';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('API Response Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      // Handle timeout
      throw new Error('Request timeout. Please try again.');
    }

    throw error;
  }
);

// Chat API
export const chatApi = {
  sendMessage: async (data: {
    message: string;
    searchSettings: {
      useHybridSearch: boolean;
      kNearestNeighbors: number;
      searchColumn: 'content_vector' | 'title_vector';
      category?: string;
    };
  }): Promise<{
    message: string;
    sources: SearchResult[];
  }> => {
    const response = await apiClient.post('/chat/message', data);
    return response.data;
  },

  searchDocuments: async (data: {
    query: string;
    searchSettings: {
      useHybridSearch: boolean;
      kNearestNeighbors: number;
      searchColumn: 'content_vector' | 'title_vector';
      category?: string;
    };
  }): Promise<{
    results: SearchResult[];
  }> => {
    const response = await apiClient.post('/search/documents', data);
    return response.data;
  },
};

// Document API
export const documentApi = {
  uploadDocument: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    fileId: string;
    filename: string;
    size: number;
  }> => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  processDocument: async (
    fileId: string
  ): Promise<{
    chunks: number;
    category: string;
    processed: boolean;
  }> => {
    const response = await apiClient.post(`/documents/process/${fileId}`);
    return response.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}`);
  },

  getDocuments: async (): Promise<{
    documents: Array<{
      id: string;
      filename: string;
      size: number;
      type: string;
      uploadedAt: string;
      processed: boolean;
      chunks: number;
      category?: string;
      status: string;
    }>;
  }> => {
    const response = await apiClient.get('/documents');
    return response.data;
  },
};

// Azure AI Search API
export const azureSearchApi = {
  vectorSearch: async (data: {
    searchServiceEndpoint: string;
    indexName: string;
    query: string;
    kNearestNeighbors: number;
    searchColumn: string;
    useHybridQuery: boolean;
    category?: string;
  }): Promise<{
    results: SearchResult[];
  }> => {
    const response = await apiClient.post('/azure/search', data);
    return response.data;
  },

  getIndexInfo: async (): Promise<{
    indexName: string;
    documentCount: number;
    searchServiceEndpoint: string;
  }> => {
    const response = await apiClient.get('/azure/index-info');
    return response.data;
  },
};

// OpenAI API
export const openaiApi = {
  generateEmbedding: async (
    text: string
  ): Promise<{
    embedding: number[];
    tokens: number;
  }> => {
    const response = await apiClient.post('/openai/embedding', { text });
    return response.data;
  },

  chatCompletion: async (data: {
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
    context?: string;
  }): Promise<{
    message: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
  }> => {
    const response = await apiClient.post('/openai/chat', data);
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{
    status: string;
    services: {
      openai: boolean;
      azure: boolean;
      database: boolean;
    };
  }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;
