import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { OpenAIService } from '../services/openai';
import { AzureSearchService } from '../services/azure';

const router = express.Router();
const openaiService = new OpenAIService();
const azureSearchService = new AzureSearchService();

// Send message and get AI response with context
router.post('/message', asyncHandler(async (req, res) => {
  const { message, searchSettings } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string' });
  }

  if (!searchSettings) {
    return res.status(400).json({ error: 'Search settings are required' });
  }

  try {
    // Step 1: Search for relevant documents
    const searchResults = await azureSearchService.vectorSearch({
      query: message,
      kNearestNeighbors: searchSettings.kNearestNeighbors || 3,
      searchColumn: searchSettings.searchColumn || 'content_vector',
      useHybridQuery: searchSettings.useHybridSearch || true,
      category: searchSettings.category,
    });

    // Step 2: Prepare context from search results
    const context = searchResults.results
      .map(result => `Title: ${result.title}\nContent: ${result.content}`)
      .join('\n\n');

    // Step 3: Generate AI response with context
    const aiResponse = await openaiService.chatCompletion({
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant that answers questions based on the provided context.
                   If the context doesn't contain relevant information, say so politely.
                   Always cite your sources when possible and be accurate.

                   Context:
                   ${context}`
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    res.json({
      message: aiResponse.message,
      sources: searchResults.results,
      tokens: aiResponse.tokens,
    });

  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}));

// Search documents without AI response
router.post('/search', asyncHandler(async (req, res) => {
  const { query, searchSettings } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required and must be a string' });
  }

  if (!searchSettings) {
    return res.status(400).json({ error: 'Search settings are required' });
  }

  try {
    const searchResults = await azureSearchService.vectorSearch({
      query,
      kNearestNeighbors: searchSettings.kNearestNeighbors || 3,
      searchColumn: searchSettings.searchColumn || 'content_vector',
      useHybridQuery: searchSettings.useHybridSearch || true,
      category: searchSettings.category,
    });

    res.json(searchResults);

  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}));

export default router;
