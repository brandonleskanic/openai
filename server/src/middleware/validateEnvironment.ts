import { Request, Response, NextFunction } from 'express';

const requiredEnvVars = [
  'OPENAI_API_KEY',
  'AZURE_SEARCH_API_KEY',
  'AZURE_SEARCH_ENDPOINT',
  'AZURE_SEARCH_INDEX_NAME',
];

const optionalEnvVars = [
  'EMBEDDINGS_MODEL',
  'AZURE_SUBSCRIPTION_ID',
  'AZURE_RESOURCE_GROUP',
];

export const validateEnvironment = (req: Request, res: Response, next: NextFunction) => {
  // Skip validation for health check endpoint
  if (req.path === '/api/health') {
    return next();
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Missing required environment variables',
      missing: missingVars,
    });
  }

  // Log warnings for optional variables
  const missingOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);
  if (missingOptionalVars.length > 0) {
    console.warn('⚠️ Missing optional environment variables:', missingOptionalVars);
  }

  next();
};
