import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Creates an in-memory IP rate limiter middleware for sensitive endpoints.
 * @param windowMs Time window in milliseconds (default: 15 minutes)
 * @param maxAttempts Maximum allowed requests per window (default: 30)
 */
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  maxAttempts: number = 30
) => {
  const ipStore = new Map<string, RateLimitRecord>();

  // Periodically purge expired records to prevent unbounded memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipStore.entries()) {
      if (now > record.resetTime) {
        ipStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const record = ipStore.get(clientIp);

    if (!record || now > record.resetTime) {
      ipStore.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    record.count++;

    if (record.count > maxAttempts) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        message:
          'Too many authentication attempts from this IP. Please try again later.',
        retryAfterSeconds,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  process.env.NODE_ENV === 'production' ? 30 : 500
);

