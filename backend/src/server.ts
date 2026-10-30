import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initSocketServer } from './services/socket.service';
import { startLateReturnMonitoring, stopLateReturnMonitoring } from './services/lateReturnMonitor.service';

/**
 * Application bootstrap: connect to MongoDB first, then listen on HTTP port.
 * If the database connection fails, the process exits with a non-zero code
 * so container orchestrators and process managers can detect the failure.
 */
const bootstrap = async (): Promise<void> => {
  let dbConnected = false;
  try {
    // 1. Attempt connection to MongoDB Atlas
    await connectDatabase();
    dbConnected = true;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`⚠️  Database connection could not be established on startup: ${msg}`);
    console.warn(`⚠️  Server is operating in degraded mode. Health check will report 503.`);
  }

  // 2. Create HTTP server and initialize Socket.IO
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  if (dbConnected) {
    startLateReturnMonitoring(30000);
  }

  const server = httpServer.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 ALTS Hostel Portal Backend Server Running`);
    console.log(`🏛️  Institution: Anantha Lakshmi Institute of Technology & Sciences`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`⚡ WebSocket: Real-time Socket.IO Engine Active`);
    console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Allowed Frontend: ${config.frontendUrl}`);
    console.log(`🗄️  Database: ${dbConnected ? 'Connected' : 'Disconnected (Degraded - Auto-reconnecting)'}`);
    console.log(`=======================================================`);
  });

  // 3. Background Reconnect Loop: If Atlas connection was blocked on boot (e.g. IP whitelist),
  // automatically retry every 5 seconds so it recovers immediately without restarting.
  let reconnectTimer: NodeJS.Timeout | null = null;
  if (!dbConnected) {
    reconnectTimer = setInterval(async () => {
      try {
        await connectDatabase();
        console.log(`\n🎉 [Atlas Reconnect] MongoDB Atlas connection successfully restored! Database is now ONLINE.\n`);
        startLateReturnMonitoring(30000);
        if (reconnectTimer) {
          clearInterval(reconnectTimer);
          reconnectTimer = null;
        }
      } catch {
        // Retry silently until user whitelists IP or network recovers
      }
    }, 5000);
    reconnectTimer.unref();
  }

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${config.port} is already in use by another process or application.`);
      console.error(`👉 Stop the conflicting process using: Get-NetTCPConnection -LocalPort ${config.port} or change PORT in server/.env`);
    } else {
      console.error(`❌ Server error: ${err.message}`);
    }
    process.exit(1);
  });

  // 3. Graceful shutdown handling
  const handleShutdown = async (signal: string): Promise<void> => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    stopLateReturnMonitoring();

    server.close(async () => {
      try {
        await disconnectDatabase();
      } catch {
        // Ignore disconnect errors during shutdown
      }
      console.log('HTTP server and database connections closed cleanly. Exiting process.');
      process.exit(0);
    });

    // Force close if graceful shutdown stalls
    setTimeout(() => {
      console.error('Forceful shutdown triggered after timeout.');
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
};

bootstrap();
