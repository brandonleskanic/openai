import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AzureSearchService } from '../services/azure';

const router = express.Router();
const azureSearchService = new AzureSearchService();

// Direct Azure AI Search endpoint
router.post(
  '/search',
  asyncHandler(async (req, res) => {
    const {
      searchServiceEndpoint,
      indexName,
      query,
      kNearestNeighbors,
      searchColumn,
      useHybridQuery,
      category,
    } = req.body;

    // Validate required fields
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    try {
      const results = await azureSearchService.vectorSearch({
        searchServiceEndpoint,
        indexName,
        query,
        kNearestNeighbors: kNearestNeighbors || 3,
        searchColumn: searchColumn || 'content_vector',
        useHybridQuery: useHybridQuery !== false,
        category,
      });

      res.json(results);
    } catch (error) {
      console.error('Azure search error:', error);
      throw error;
    }
  })
);

// Get index information
router.get(
  '/index-info',
  asyncHandler(async (req, res) => {
    try {
      const indexInfo = await azureSearchService.getIndexInfo();
      res.json(indexInfo);
    } catch (error) {
      console.error('Azure index info error:', error);
      throw error;
    }
  })
);

// Create or update index
router.post(
  '/index',
  asyncHandler(async (req, res) => {
    const { indexName, fields } = req.body;

    if (!indexName) {
      return res.status(400).json({ error: 'Index name is required' });
    }

    try {
      const result = await azureSearchService.createOrUpdateIndex(
        indexName,
        fields
      );
      res.json(result);
    } catch (error) {
      console.error('Azure index creation error:', error);
      throw error;
    }
  })
);

// Upload documents to index
router.post(
  '/documents',
  asyncHandler(async (req, res) => {
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: 'Documents array is required' });
    }

    try {
      const result = await azureSearchService.uploadDocuments(documents);
      res.json(result);
    } catch (error) {
      console.error('Azure document upload error:', error);
      throw error;
    }
  })
);

// Delete documents from index
router.delete(
  '/documents',
  asyncHandler(async (req, res) => {
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds)) {
      return res.status(400).json({ error: 'Document IDs array is required' });
    }

    try {
      const result = await azureSearchService.deleteDocuments(documentIds);
      res.json(result);
    } catch (error) {
      console.error('Azure document deletion error:', error);
      throw error;
    }
  })
);

// Test Azure connection
router.get(
  '/test-connection',
  asyncHandler(async (req, res) => {
    try {
      const isConnected = await azureSearchService.testConnection();
      res.json({
        connected: isConnected,
        endpoint: process.env.AZURE_SEARCH_ENDPOINT,
        indexName: process.env.AZURE_SEARCH_INDEX_NAME,
      });
    } catch (error) {
      console.error('Azure connection test error:', error);
      res.json({
        connected: false,
        error:
          error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  })
);

export default router;
