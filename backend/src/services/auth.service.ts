import { User, IUser, UserRole, AccountStatus } from '../models/user.model';
import { hashPassword, comparePassword, signToken, verifyToken, TokenPayload } from '../utils/auth';

export class AuthService {
  /**
   * Hashes a password string.
   */
  static async hash(password: string): Promise<string> {
    return hashPassword(password);
  }

  /**
   * Compares candidate password with stored hash.
   */
  static async compare(candidate: string, hash: string): Promise<boolean> {
    return comparePassword(candidate, hash);
  }

  /**
   * Issues JWT token for a user.
   */
  static generateToken(user: IUser, expiresIn?: string): string {
    const payload: TokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return signToken(payload, expiresIn);
  }

  /**
   * Verifies a JWT token string.
   */
  static verify(token: string): TokenPayload {
    return verifyToken(token);
  }
}

export default AuthService;

