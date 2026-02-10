import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { Neo4jError } from 'neo4j-driver';

export interface ApiError {
  fallback: boolean;
  message: string;
  code?: string;
  details?: any;
}

export class ApiError extends Error {
  fallback: boolean;
  code?: string;
  details?: any;

  constructor(message: string, fallback: boolean = false, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.fallback = fallback;
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(error: unknown, req: Request, res: Response, next: NextFunction) {
  console.error('API Error:', error);

  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof PrismaClientKnownRequestError) {
    apiError = new ApiError(
      'Database operation failed',
      true,
      'DATABASE_ERROR',
      { code: error.code, meta: error.meta }
    );
  } else if (error instanceof Neo4jError) {
    apiError = new ApiError(
      'Knowledge graph service unavailable',
      true,
      'NEO4J_ERROR',
      { code: error.code }
    );
  } else if (error instanceof Error) {
    apiError = new ApiError(
      error.message || 'Internal server error',
      false,
      'INTERNAL_ERROR'
    );
  } else {
    apiError = new ApiError('Unknown error occurred', false, 'UNKNOWN_ERROR');
  }

  const status = apiError.fallback ? 503 : 500;

  res.status(status).json({
    error: apiError.message,
    code: apiError.code,
    fallback: apiError.fallback,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      details: apiError.details,
      stack: error instanceof Error ? error.stack : undefined
    })
  });
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, false, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, true, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}