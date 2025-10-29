import {
  SearchClient,
  SearchIndexClient,
  SearchIndexingBufferedSender,
  AzureKeyCredential,
} from '@azure/search-documents';
import {
  SearchIndex,
  SearchField,
  SearchFieldDataType,
  SimpleField,
  SearchableField,
  VectorSearch,
  VectorSearchAlgorithmKind,
  VectorSearchAlgorithmMetric,
  HnswAlgorithmConfiguration,
  HnswParameters,
  VectorSearchProfile,
} from '@azure/search-documents';
import { VectorizedQuery } from '@azure/search-documents';
import { OpenAIService } from './openai';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  category?: string;
}

export interface DocumentChunk {
  id: string;
  vector_id: string;
  title: string;
  text: string;
  title_vector: number[];
  content_vector: number[];
  category: string;
}

export class AzureSearchService {
  private searchClient: SearchClient;
  private indexClient: SearchIndexClient;
  private openaiService: OpenAIService;
  private endpoint: string;
  private indexName: string;

  constructor() {
    if (!process.env.AZURE_SEARCH_ENDPOINT) {
      throw new Error('AZURE_SEARCH_ENDPOINT environment variable is required');
    }
    if (!process.env.AZURE_SEARCH_API_KEY) {
      throw new Error('AZURE_SEARCH_API_KEY environment variable is required');
    }
    if (!process.env.AZURE_SEARCH_INDEX_NAME) {
      throw new Error(
        'AZURE_SEARCH_INDEX_NAME environment variable is required'
      );
    }

    this.endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    this.indexName = process.env.AZURE_SEARCH_INDEX_NAME;

    const credential = new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY);

    this.searchClient = new SearchClient(
      this.endpoint,
      this.indexName,
      credential
    );
    this.indexClient = new SearchIndexClient(this.endpoint, credential);
    this.openaiService = new OpenAIService();
  }

  async vectorSearch(params: {
    searchServiceEndpoint?: string;
    indexName?: string;
    query: string;
    kNearestNeighbors: number;
    searchColumn: string;
    useHybridQuery: boolean;
    category?: string;
  }): Promise<{ results: SearchResult[] }> {
    try {
      // Generate embedding for the query
      const embedding = await this.openaiService.generateEmbedding(
        params.query
      );

      // Create vector query
      const vectorQuery: VectorizedQuery = {
        vector: embedding.embedding,
        kNearestNeighbors: params.kNearestNeighbors,
        fields: [params.searchColumn],
      };

      // Build search options
      const searchOptions: any = {
        vectorQueries: [vectorQuery],
        select: ['id', 'title', 'text', 'category'],
        top: params.kNearestNeighbors,
      };

      // Add text search for hybrid query
      if (params.useHybridQuery) {
        searchOptions.searchText = params.query;
      }

      // Add category filter if specified
      if (params.category) {
        searchOptions.filter = `category eq '${params.category}'`;
      }

      // Execute search
      const results = await this.searchClient.search('', searchOptions);

      const searchResults: SearchResult[] = [];
      for await (const result of results.results) {
        searchResults.push({
          id: result.document.id,
          title: result.document.title,
          content: result.document.text,
          score: result.score || 0,
          category: result.document.category,
        });
      }

      return { results: searchResults };
    } catch (error) {
      console.error('Azure search error:', error);
      throw new Error(
        `Azure search failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async uploadDocuments(
    documents: DocumentChunk[]
  ): Promise<{ uploaded: number }> {
    try {
      const batchClient = new SearchIndexingBufferedSender(
        this.endpoint,
        this.indexName,
        new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
      );

      // Convert documents to the expected format
      const formattedDocuments = documents.map(doc => ({
        '@search.action': 'mergeOrUpload',
        id: doc.id,
        vector_id: doc.vector_id,
        title: doc.title,
        text: doc.text,
        title_vector: doc.title_vector,
        content_vector: doc.content_vector,
        category: doc.category,
      }));

      // Upload documents
      await batchClient.uploadDocuments(formattedDocuments);
      await batchClient.flush();
      await batchClient.dispose();

      return { uploaded: documents.length };
    } catch (error) {
      console.error('Azure document upload error:', error);
      throw new Error(
        `Document upload failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async deleteDocuments(documentIds: string[]): Promise<{ deleted: number }> {
    try {
      const batchClient = new SearchIndexingBufferedSender(
        this.endpoint,
        this.indexName,
        new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
      );

      const deleteActions = documentIds.map(id => ({
        '@search.action': 'delete',
        id,
      }));

      await batchClient.deleteDocuments(deleteActions);
      await batchClient.flush();
      await batchClient.dispose();

      return { deleted: documentIds.length };
    } catch (error) {
      console.error('Azure document deletion error:', error);
      throw new Error(
        `Document deletion failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async getIndexInfo(): Promise<{
    indexName: string;
    documentCount: number;
    searchServiceEndpoint: string;
  }> {
    try {
      // Get index statistics
      const indexStats = await this.indexClient.getSearchIndexStatistics(
        this.indexName
      );

      return {
        indexName: this.indexName,
        documentCount: indexStats.documentCount,
        searchServiceEndpoint: this.endpoint,
      };
    } catch (error) {
      console.error('Azure index info error:', error);
      throw new Error(
        `Failed to get index info: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async createOrUpdateIndex(
    indexName?: string,
    customFields?: any[]
  ): Promise<{ created: boolean }> {
    try {
      const targetIndexName = indexName || this.indexName;

      // Define default fields for the index
      const fields: SearchField[] = [
        new SimpleField({ name: 'id', type: SearchFieldDataType.String }),
        new SimpleField({
          name: 'vector_id',
          type: SearchFieldDataType.String,
          key: true,
        }),
        new SearchableField({
          name: 'title',
          type: SearchFieldDataType.String,
        }),
        new SearchableField({ name: 'text', type: SearchFieldDataType.String }),
        new SearchField({
          name: 'title_vector',
          type: SearchFieldDataType.Collection(SearchFieldDataType.Single),
          searchable: false,
          vectorSearchDimensions: 1536,
          vectorSearchProfileName: 'my-vector-config',
        }),
        new SearchField({
          name: 'content_vector',
          type: SearchFieldDataType.Collection(SearchFieldDataType.Single),
          searchable: false,
          vectorSearchDimensions: 1536,
          vectorSearchProfileName: 'my-vector-config',
        }),
        new SearchableField({
          name: 'category',
          type: SearchFieldDataType.String,
          filterable: true,
        }),
      ];

      // Vector search configuration
      const vectorSearch: VectorSearch = {
        algorithms: [
          new HnswAlgorithmConfiguration({
            name: 'my-hnsw',
            kind: VectorSearchAlgorithmKind.Hnsw,
            parameters: new HnswParameters({
              m: 4,
              efConstruction: 400,
              efSearch: 500,
              metric: VectorSearchAlgorithmMetric.Cosine,
            }),
          }),
        ],
        profiles: [
          new VectorSearchProfile({
            name: 'my-vector-config',
            algorithmConfigurationName: 'my-hnsw',
          }),
        ],
      };

      // Create the index
      const index: SearchIndex = {
        name: targetIndexName,
        fields: customFields || fields,
        vectorSearch,
      };

      await this.indexClient.createOrUpdateIndex(index);

      return { created: true };
    } catch (error) {
      console.error('Azure index creation error:', error);
      throw new Error(
        `Index creation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to get index information
      await this.indexClient.getSearchIndexStatistics(this.indexName);
      return true;
    } catch (error) {
      console.error('Azure connection test failed:', error);
      return false;
    }
  }

  // Utility method to search with custom client (for direct Azure Function integration)
  static async searchWithCustomClient(params: {
    searchServiceEndpoint: string;
    indexName: string;
    apiKey: string;
    query: string;
    kNearestNeighbors: number;
    searchColumn: string;
    useHybridQuery: boolean;
    category?: string;
  }): Promise<{ results: SearchResult[] }> {
    try {
      const credential = new AzureKeyCredential(params.apiKey);
      const searchClient = new SearchClient(
        params.searchServiceEndpoint,
        params.indexName,
        credential
      );

      const openaiService = new OpenAIService();
      const embedding = await openaiService.generateEmbedding(params.query);

      const vectorQuery: VectorizedQuery = {
        vector: embedding.embedding,
        kNearestNeighbors: params.kNearestNeighbors,
        fields: [params.searchColumn],
      };

      const searchOptions: any = {
        vectorQueries: [vectorQuery],
        select: ['id', 'title', 'text', 'category'],
        top: params.kNearestNeighbors,
      };

      if (params.useHybridQuery) {
        searchOptions.searchText = params.query;
      }

      if (params.category) {
        searchOptions.filter = `category eq '${params.category}'`;
      }

      const results = await searchClient.search('', searchOptions);

      const searchResults: SearchResult[] = [];
      for await (const result of results.results) {
        searchResults.push({
          id: result.document.id,
          title: result.document.title,
          content: result.document.text,
          score: result.score || 0,
          category: result.document.category,
        });
      }

      return { results: searchResults };
    } catch (error) {
      console.error('Custom Azure search error:', error);
      throw new Error(
        `Azure search failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
