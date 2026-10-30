import { Request, Response, NextFunction } from 'express';

/**
 * Catches all unhandled routes and returns a standard JSON 404 response.
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    success: false,
    message: `Resource not found: Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};

