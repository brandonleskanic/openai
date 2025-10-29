import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { OpenAIService } from '../services/openai';
import { AzureSearchService } from '../services/azure';

const router = express.Router();
const openaiService = new OpenAIService();
const azureSearchService = new AzureSearchService();

// Health check endpoint
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    try {
      // Check all services in parallel
      const [openaiStatus, azureStatus] = await Promise.allSettled([
        openaiService.testConnection(),
        azureSearchService.testConnection(),
      ]);

      const services = {
        openai: openaiStatus.status === 'fulfilled' && openaiStatus.value,
        azure: azureStatus.status === 'fulfilled' && azureStatus.value,
        database: true, // Since we're using in-memory storage for now
      };

      const allServicesHealthy = Object.values(services).every(
        status => status === true
      );
      const responseTime = Date.now() - startTime;

      res.status(allServicesHealthy ? 200 : 503).json({
        status: allServicesHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        services,
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
        configuration: {
          openaiModel: process.env.EMBEDDINGS_MODEL || 'text-embedding-3-small',
          azureEndpoint: process.env.AZURE_SEARCH_ENDPOINT
            ? 'configured'
            : 'missing',
          azureIndex: process.env.AZURE_SEARCH_INDEX_NAME || 'not-configured',
        },
      });
    } catch (error) {
      console.error('Health check error:', error);

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        services: {
          openai: false,
          azure: false,
          database: false,
        },
      });
    }
  })
);

// Detailed service status
router.get(
  '/detailed',
  asyncHandler(async (req, res) => {
    const checks = [];

    // OpenAI service check
    try {
      const openaiConnected = await openaiService.testConnection();
      checks.push({
        service: 'OpenAI',
        status: openaiConnected ? 'healthy' : 'unhealthy',
        details: {
          model: process.env.EMBEDDINGS_MODEL || 'text-embedding-3-small',
          apiKeyConfigured: !!process.env.OPENAI_API_KEY,
        },
      });
    } catch (error) {
      checks.push({
        service: 'OpenAI',
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }

    // Azure Search service check
    try {
      const azureConnected = await azureSearchService.testConnection();
      const indexInfo = azureConnected
        ? await azureSearchService.getIndexInfo()
        : null;

      checks.push({
        service: 'Azure AI Search',
        status: azureConnected ? 'healthy' : 'unhealthy',
        details: {
          endpoint: process.env.AZURE_SEARCH_ENDPOINT,
          indexName: process.env.AZURE_SEARCH_INDEX_NAME,
          apiKeyConfigured: !!process.env.AZURE_SEARCH_API_KEY,
          documentCount: indexInfo?.documentCount || 0,
        },
      });
    } catch (error) {
      checks.push({
        service: 'Azure AI Search',
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }

    // Environment check
    checks.push({
      service: 'Environment',
      status: 'healthy',
      details: {
        nodeEnv: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: `${Math.floor(process.uptime())}s`,
        pid: process.pid,
      },
    });

    const allHealthy = checks.every(check => check.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    });
  })
);

// Liveness probe (simple check that server is running)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe (check if server is ready to handle requests)
router.get(
  '/ready',
  asyncHandler(async (req, res) => {
    // Check if required environment variables are set
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'AZURE_SEARCH_API_KEY',
      'AZURE_SEARCH_ENDPOINT',
      'AZURE_SEARCH_INDEX_NAME',
    ];

    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );

    if (missingVars.length > 0) {
      return res.status(503).json({
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        error: 'Missing required environment variables',
        missing: missingVars,
      });
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
