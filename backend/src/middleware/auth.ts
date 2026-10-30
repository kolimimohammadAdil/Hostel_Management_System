import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { verifyToken } from '../utils/auth';
import { User, IUser, UserRole, AccountStatus } from '../models/user.model';
import { DEMO_ACCOUNTS } from '../services/seed.service';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Middleware: Verifies JWT Bearer token and attaches authenticated user to req.user.
 * Rejects with HTTP 401 if token is missing, invalid, or expired.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required: No token provided',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required: Malformed authorization header',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr: any) {
      const isExpired = jwtErr.name === 'TokenExpiredError';
      res.status(401).json({
        success: false,
        message: isExpired
          ? 'Authentication failed: Token has expired'
          : 'Authentication failed: Invalid token',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    let user: any = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.sub);
      } catch {
        // Fall back to decoded payload if query fails during connection fluctuation
      }
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication failed: User account not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    } else {
      // Degraded / demonstration mode fallback using cryptographically verified JWT payload
      const demoAccount = DEMO_ACCOUNTS.find(
        (a) =>
          a.email.toLowerCase() === String(decoded.email || '').toLowerCase() ||
          a.role === decoded.role
      );
      user = {
        _id: decoded.sub,
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        fullName: demoAccount?.fullName || decoded.email,
        status: AccountStatus.ACTIVE,
        hostelName: demoAccount?.hostelName,
        roomNumber: demoAccount?.roomNumber,
        rollNumber: demoAccount?.rollNumber,
        phone: demoAccount?.phone,
      };
    }

    if (user.status !== AccountStatus.ACTIVE) {
      res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Please contact the hostel administration.`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC).
 * Ensures req.user possesses at least one of the specified roles.
 * Returns HTTP 403 if authenticated user lacks requisite privileges.
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization check',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Required role: [${allowedRoles.join(
          ', '
        )}], but your role is '${req.user.role}'`,
        userRole: req.user.role,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

