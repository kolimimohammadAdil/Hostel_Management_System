import { Request, Response } from 'express';
import { config } from '../config/env';
import { getDbStatus } from '../config/database';

/**
 * Health check controller.
 * Reports actual backend process status AND real-time MongoDB connection state.
 */
export const getHealth = (_req: Request, res: Response): void => {
  const db = getDbStatus();

  const overallHealthy = db.connected;

  res.status(overallHealthy ? 200 : 503).json({
    success: overallHealthy,
    application: 'ALTS Hostel Portal',
    institution: 'Anantha Lakshmi Institute of Technology & Sciences',
    status: overallHealthy ? 'healthy' : 'degraded',
    message: overallHealthy
      ? 'ALTS Hostel Portal backend service is running and database is connected'
      : 'ALTS Hostel Portal backend is running but the database is not connected',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: db.connected,
      status: db.status,
    },
  });
};
