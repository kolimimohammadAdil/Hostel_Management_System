import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config/env';
import { verifyToken, TokenPayload } from '../utils/auth';

let io: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      email: string;
      role: string;
    };
  };
}

/**
 * Socket.IO Authentication Middleware
 * Validates JWT from handshake auth token or authorization header.
 * Discards unauthenticated connections with descriptive errors.
 */
export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
): void => {
  try {
    let rawToken: string | undefined = socket.handshake.auth?.token;

    if (!rawToken && socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        rawToken = authHeader.slice(7).trim();
      } else if (typeof authHeader === 'string') {
        rawToken = authHeader.trim();
      }
    }

    if (!rawToken) {
      return next(new Error('Authentication failed: Missing authorization token'));
    }

    // Verify token using JWT utility
    let payload: TokenPayload;
    try {
      payload = verifyToken(rawToken);
    } catch (jwtErr: any) {
      return next(new Error(`Authentication failed: ${jwtErr.message || 'Invalid token'}`));
    }

    if (!payload || !payload.sub) {
      return next(new Error('Authentication failed: Invalid token payload'));
    }

    // Attach verified user identity to socket instance
    socket.data.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error: any) {
    next(new Error(`Socket authentication error: ${error.message}`));
  }
};

/**
 * Initializes and binds Socket.IO server to the HTTP server instance.
 */
export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  const allowedOrigins = Array.from(
    new Set([
      config.frontendUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5000',
    ].filter(Boolean))
  );

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, test runners)
        if (!origin || allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for socket connection from ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const user = socket.data.user;

    // Security invariant: Private channels are strictly derived from verified JWT.
    // Never trust client-supplied user IDs.
    const userRoom = `user:${user.id}`;
    const roleRoom = `role:${user.role}`;

    socket.join(userRoom);
    socket.join(roleRoom);

    console.log(`🔌 [Socket.IO] User connected: ${user.email} (${user.role}) | ID: ${user.id} -> joined [${userRoom}, ${roleRoom}]`);

    // Acknowledge connection to client with verified identity
    socket.emit('connection:ready', {
      connected: true,
      userId: user.id,
      role: user.role,
      timestamp: new Date().toISOString(),
    });

    // Guard against malicious subscription attempts
    socket.on('subscribe:user', () => {
      // Intentionally ignored: room assignment is immutable and strictly tied to verified JWT
      socket.emit('error:unauthorized', {
        message: 'Cannot manually subscribe to user channels. Channels are automatically assigned via verified JWT.',
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.IO] User disconnected: ${user.email} (${reason})`);
    });
  });

  return io;
};

/**
 * Returns active Socket.IO server instance or null if not yet initialized.
 */
export const getIO = (): SocketIOServer | null => {
  return io;
};

/**
 * Emits real-time event to an authenticated user's private channel.
 */
export const emitToUser = (userId: string, event: string, data: any): boolean => {
  if (!io) return false;
  io.to(`user:${userId}`).emit(event, data);
  return true;
};

/**
 * Emits real-time event to all active sockets belonging to a specific role.
 */
export const emitToRole = (role: string, event: string, data: any): boolean => {
  if (!io) return false;
  io.to(`role:${role}`).emit(event, data);
  return true;
};
