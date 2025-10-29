import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { OpenAIService } from '../services/openai';

const router = express.Router();
const openaiService = new OpenAIService();

// Generate embedding for text
router.post(
  '/embedding',
  asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res
        .status(400)
        .json({ error: 'Text is required and must be a string' });
    }

    if (text.length > 8000) {
      return res
        .status(400)
        .json({
          error: 'Text is too long. Maximum length is 8000 characters.',
        });
    }

    try {
      const result = await openaiService.generateEmbedding(text);
      res.json(result);
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw error;
    }
  })
);

// Generate chat completion
router.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content) {
        return res
          .status(400)
          .json({ error: 'Each message must have role and content' });
      }
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        return res
          .status(400)
          .json({ error: 'Message role must be system, user, or assistant' });
      }
    }

    try {
      const result = await openaiService.chatCompletion({ messages, context });
      res.json(result);
    } catch (error) {
      console.error('OpenAI chat completion error:', error);
      throw error;
    }
  })
);

// Generate multiple embeddings in batch
router.post(
  '/embeddings/batch',
  asyncHandler(async (req, res) => {
    const { texts } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    if (texts.length > 100) {
      return res
        .status(400)
        .json({ error: 'Maximum 100 texts allowed per batch' });
    }

    // Validate each text
    for (const text of texts) {
      if (typeof text !== 'string') {
        return res.status(400).json({ error: 'All texts must be strings' });
      }
      if (text.length > 8000) {
        return res
          .status(400)
          .json({ error: 'Each text must be under 8000 characters' });
      }
    }

    try {
      const results = await Promise.all(
        texts.map(text => openaiService.generateEmbedding(text))
      );

      res.json({
        embeddings: results.map(result => result.embedding),
        totalTokens: results.reduce((sum, result) => sum + result.tokens, 0),
      });
    } catch (error) {
      console.error('OpenAI batch embedding error:', error);
      throw error;
    }
  })
);

// Get available models
router.get(
  '/models',
  asyncHandler(async (req, res) => {
    try {
      const models = await openaiService.getAvailableModels();
      res.json(models);
    } catch (error) {
      console.error('OpenAI models error:', error);
      throw error;
    }
  })
);

// Test OpenAI connection
router.get(
  '/test-connection',
  asyncHandler(async (req, res) => {
    try {
      const isConnected = await openaiService.testConnection();
      res.json({
        connected: isConnected,
        model: process.env.EMBEDDINGS_MODEL || 'text-embedding-3-small',
      });
    } catch (error) {
      console.error('OpenAI connection test error:', error);
      res.json({
        connected: false,
        error:
          error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  })
);

// Count tokens in text
router.post(
  '/tokens/count',
  asyncHandler(async (req, res) => {
    const { text, model } = req.body;

    if (!text || typeof text !== 'string') {
      return res
        .status(400)
        .json({ error: 'Text is required and must be a string' });
    }

    try {
      const tokenCount = await openaiService.countTokens(text, model);
      res.json({ tokens: tokenCount });
    } catch (error) {
      console.error('OpenAI token count error:', error);
      throw error;
    }
  })
);

export default router;
