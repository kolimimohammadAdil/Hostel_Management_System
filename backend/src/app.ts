import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import apiRouter from './routes';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

/**
 * Creates and configures the Express application instance.
 */
export const createApp = (): Application => {
  const app: Application = express();

  // 1. Security Headers via Helmet (configured to allow cross-origin image & asset loading)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 2. Configurable Cross-Origin Resource Sharing (CORS)
  const allowedOrigins = Array.from(
    new Set([
      config.frontendUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter(Boolean))
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 3. Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Stale Service Worker Cleanup (Purges conflicting PWA service workers from other projects on port 5000)
  app.get('/sw.js', (_req: Request, res: Response) => {
    res.setHeader('Clear-Site-Data', '"cache", "storage"');
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send(`
      self.addEventListener('install', () => self.skipWaiting());
      self.addEventListener('activate', (event) => {
        event.waitUntil(
          caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .then(() => self.registration.unregister())
        );
      });
    `);
  });

  // 5. Root Welcome Route & Status Dashboard
  app.get('/', (req: Request, res: Response) => {
    res.setHeader('Clear-Site-Data', '"cache"');

    // If accessed via a web browser requesting HTML, display the HostelGuard AI backend portal
    if (req.accepts('html') && !req.accepts('json')) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ALTS Hostel Portal — Backend Server</title>
          <script>
            // Unregister any stale Service Workers from previous projects on this origin
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(registrations => {
                for (const reg of registrations) {
                  reg.unregister().then(() => console.log('Purged stale service worker:', reg.scope));
                }
              });
            }
            if ('caches' in window) {
              caches.keys().then(keys => {
                for (const k of keys) {
                  caches.delete(k);
                }
              });
            }
          </script>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #0b0f19;
              color: #f1f5f9;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .card {
              background: #111827;
              border: 1px solid #1f2937;
              border-radius: 16px;
              padding: 40px;
              max-width: 580px;
              width: 90%;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(16, 185, 129, 0.15);
              color: #10b981;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 13px;
              font-weight: 600;
              margin-bottom: 16px;
            }
            .pulse {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #10b981;
              box-shadow: 0 0 10px #10b981;
            }
            h1 {
              font-size: 24px;
              margin: 0 0 4px 0;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            p.inst {
              color: #38bdf8;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 12px 0;
            }
            p.desc {
              color: #94a3b8;
              margin: 0 0 24px 0;
              font-size: 14px;
              line-height: 1.5;
            }
            .status-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 24px;
            }
            .status-item {
              background: #1f2937;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 13px;
            }
            .status-label {
              color: #64748b;
              font-size: 11px;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .status-val {
              color: #e2e8f0;
              font-weight: 600;
            }
            .actions {
              display: flex;
              gap: 12px;
            }
            a.btn {
              flex: 1;
              text-align: center;
              padding: 10px 16px;
              border-radius: 8px;
              text-decoration: none;
              font-size: 13px;
              font-weight: 600;
              transition: all 0.2s;
            }
            a.btn-primary {
              background: #2563eb;
              color: #ffffff;
            }
            a.btn-primary:hover {
              background: #1d4ed8;
            }
            a.btn-secondary {
              background: #1e293b;
              color: #cbd5e1;
              border: 1px solid #334155;
            }
            a.btn-secondary:hover {
              background: #334155;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge"><div class="pulse"></div>ALTS HOSTEL PORTAL BACKEND ACTIVE</div>
            <h1>ALTS Hostel Portal Service</h1>
            <p class="inst">Anantha Lakshmi Institute of Technology & Sciences</p>
            <p class="desc">Integrated hostel security, digital leave approvals, parent notifications, mess management, and facial biometric gate turnstile backend engine.</p>
            <div class="status-grid">
              <div class="status-item">
                <div class="status-label">Backend API</div>
                <div class="status-val">Port 5000 (Active)</div>
              </div>
              <div class="status-item">
                <div class="status-label">WebSocket Engine</div>
                <div class="status-val">Socket.IO (Live)</div>
              </div>
              <div class="status-item">
                <div class="status-label">Face Recognition</div>
                <div class="status-val">OpenCV CNN (Port 5001)</div>
              </div>
              <div class="status-item">
                <div class="status-label">Allowed Frontend</div>
                <div class="status-val">Port 5173</div>
              </div>
            </div>
            <div class="actions">
              <a href="/api/health" class="btn btn-primary">Check System Health</a>
              <a href="http://localhost:5173" class="btn btn-secondary">Open Portal UI</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Default JSON response for programmatic API calls
    res.status(200).json({
      success: true,
      application: 'ALTS Hostel Portal API',
      institution: 'Anantha Lakshmi Institute of Technology & Sciences',
      version: '1.0.0',
      description: 'Hostel Security and Leave Management System Backend',
      healthCheck: '/api/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Static file serving for uploaded profile photos and static assets
  const baseUploadsDir = path.resolve(__dirname, '../uploads');
  const profilesUploadsDir = path.resolve(baseUploadsDir, 'profiles');
  if (!fs.existsSync(profilesUploadsDir)) {
    fs.mkdirSync(profilesUploadsDir, { recursive: true });
  }

  const staticCorsMiddleware = (_req: Request, res: Response, next: express.NextFunction) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  };

  app.use('/api/uploads/profiles', staticCorsMiddleware, express.static(profilesUploadsDir));
  app.use('/uploads/profiles', staticCorsMiddleware, express.static(profilesUploadsDir));
  app.use('/api/uploads', staticCorsMiddleware, express.static(baseUploadsDir));
  app.use('/uploads', staticCorsMiddleware, express.static(baseUploadsDir));

  // 5. Mount API Routes under /api
  app.use('/api', apiRouter);

  // 6. Central 404 Handler for Unmatched Routes
  app.use(notFoundHandler);

  // 7. Central Error Handling Middleware
  app.use(errorHandler);

  return app;
};

export default createApp();

