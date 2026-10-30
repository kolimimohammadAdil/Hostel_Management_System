import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Resolve .env from the backend directory regardless of working directory.
// Strategy: try backend/.env relative to this compiled file first,
// then fall back to ./backend/.env (when run from project root),
// then ./.env (when run from backend/).
const candidates = [
  path.resolve(__dirname, '../../.env'),     // dist/config/env.js -> backend/.env (production build)
  path.resolve(process.cwd(), 'backend/.env'), // project-root -> backend/.env
  path.resolve(process.cwd(), 'server/.env'),  // backward compatibility fallback
  path.resolve(process.cwd(), '.env'),          // backend/ -> .env (when cwd is backend)
];

for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  faceServiceUrl: string;
}

const parsedPort = Number(process.env.PORT);

export const config: AppConfig = {
  port: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'hostelguard_ai_development_jwt_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  faceServiceUrl: process.env.FACE_SERVICE_URL || 'http://127.0.0.1:5001',
};
