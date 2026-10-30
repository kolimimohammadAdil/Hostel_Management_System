import mongoose from 'mongoose';
import { config } from './env';
import { seedDemoAccounts } from '../services/seed.service';

/**
 * MongoDB connection state labels mapped from Mongoose readyState values.
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
const READY_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Returns the current Mongoose connection state as a human-readable string.
 */
export const getDbStatus = (): { connected: boolean; status: string } => {
  const state = mongoose.connection.readyState;
  return {
    connected: state === 1,
    status: READY_STATES[state] || 'unknown',
  };
};

/**
 * Helper to retrieve current public IP for diagnostic guidance when Atlas rejects connection.
 */
export const getPublicIp = async (): Promise<string | null> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    const data = (await res.json()) as any;
    return data?.ip || null;
  } catch {
    return null;
  }
};

/**
 * Connects to MongoDB Atlas using the MONGODB_URI environment variable.
 *
 * Rules:
 * - Validates that MONGODB_URI is configured before attempting connection.
 * - Never logs the connection string or credentials.
 * - Prevents duplicate connections (checks readyState first).
 * - Seeds demo accounts on initial connection.
 * - Displays actionable IP whitelist diagnosis on connection failure.
 */
export const connectDatabase = async (): Promise<void> => {
  const uri = config.mongodbUri;

  if (!uri || uri.trim() === '') {
    throw new Error(
      'MONGODB_URI is not configured. Set it in server/.env before starting the application.'
    );
  }

  // Prevent duplicate connections
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    console.log('🔌 Connecting to MongoDB Atlas...');

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000, // Fast failover and diagnostic
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Atlas connected successfully.');
    await seedDemoAccounts();
  } catch (error: unknown) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const safeMessage = rawMessage.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '<redacted-uri>');
    console.error(`❌ MongoDB connection failed: ${safeMessage}`);

    // If it's an IP whitelist or reachability error, provide immediate diagnostics
    const publicIp = await getPublicIp();
    console.error(`\n=======================================================`);
    console.error(`⚠️  MONGODB ATLAS ACCESS BLOCKED (IP WHITELIST ISSUE)`);
    if (publicIp) {
      console.error(`📍 Your current public IP is: ${publicIp}`);
    }
    console.error(`👉 Quick 30-Second Fix in MongoDB Atlas:`);
    console.error(`   1. Open: https://cloud.mongodb.com`);
    console.error(`   2. In the left sidebar under "Security", click "Network Access"`);
    console.error(`   3. Click "+ ADD IP ADDRESS"`);
    console.error(`   4. Select "ALLOW ACCESS FROM ANYWHERE" (adds 0.0.0.0/0)`);
    console.error(`   5. Click "Confirm"`);
    console.error(`(Setting 0.0.0.0/0 permanently prevents dynamic ISP/hotspot IPs from disconnecting)`);
    console.error(`=======================================================\n`);

    throw new Error(`Database connection failed: ${safeMessage}`);
  }

  // Attach lifecycle event listeners (idempotent: mongoose emits per-connection)
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected.');
  });

  mongoose.connection.on('error', (err: Error) => {
    const safe = err.message.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '<redacted-uri>');
    console.error(`❌ MongoDB runtime error: ${safe}`);
  });
};

/**
 * Gracefully closes the Mongoose connection.
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('🔒 MongoDB connection closed.');
  }
};

