import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

/**
 * Centralized error handling middleware.
 * Prevents leaking stack traces or internal diagnostics in production mode.
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const isProduction = config.nodeEnv === 'production';

  const responseBody: Record<string, unknown> = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode,
    timestamp: new Date().toISOString(),
  };

  // Only expose debug stack trace in non-production environments
  if (!isProduction) {
    responseBody.stack = err.stack;
    if (err.details !== undefined) {
      responseBody.details = err.details;
    }
  }

  res.status(statusCode).json(responseBody);
};

