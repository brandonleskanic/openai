import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // OpenAI API errors
  if (err.message.includes('OpenAI')) {
    statusCode = 503;
    message = 'OpenAI service temporarily unavailable';
  }

  // Azure API errors
  if (err.message.includes('Azure')) {
    statusCode = 503;
    message = 'Azure service temporarily unavailable';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid input data';
  }

  // File upload errors
  if (err.message.includes('File too large')) {
    statusCode = 413;
    message = 'File size too large. Maximum size is 10MB.';
  }

  // Rate limit errors
  if (err.message.includes('Too many requests')) {
    statusCode = 429;
    message = 'Too many requests. Please try again later.';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong!';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
