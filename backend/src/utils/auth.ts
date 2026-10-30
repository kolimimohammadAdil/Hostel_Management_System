import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../models/user.model';

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
}

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds.
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a candidate plaintext password with a stored bcrypt hash.
 */
export const comparePassword = async (
  candidate: string,
  hash: string
): Promise<boolean> => {
  if (!candidate || !hash) return false;
  return bcrypt.compare(candidate, hash);
};

/**
 * Generates and signs a JSON Web Token.
 * Never includes sensitive data like password hashes in the payload.
 */
export const signToken = (
  payload: TokenPayload,
  expiresIn?: string
): string => {
  const options: SignOptions = {
    expiresIn: (expiresIn || config.jwtExpiresIn || '7d') as any,
  };
  return jwt.sign(payload, config.jwtSecret, options);
};

/**
 * Verifies and decodes a JSON Web Token.
 * Throws an error if the token is invalid, tampered with, or expired.
 */
export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, config.jwtSecret);
  return decoded as TokenPayload;
};

