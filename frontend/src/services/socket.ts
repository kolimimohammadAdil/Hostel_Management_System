import { io, Socket } from 'socket.io-client';
import { getStoredToken } from './api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// Strip trailing /api to connect directly to root Socket.IO server
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '');

let socket: Socket | null = null;
let isConnecting = false;

export interface RealtimeNotificationEvent {
  id: string;
  recipient: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export type NotificationCallback = (notification: RealtimeNotificationEvent) => void;
export type UnreadCountCallback = (data: { unreadCount: number }) => void;
export type StatusCallback = (connected: boolean) => void;

const notificationListeners = new Set<NotificationCallback>();
const unreadCountListeners = new Set<UnreadCountCallback>();
const statusListeners = new Set<StatusCallback>();

/**
 * Initializes and connects the Socket.IO client with the authenticated user's JWT.
 */
export const connectSocket = (customToken?: string): Socket => {
  const token = customToken || getStoredToken();

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  isConnecting = true;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    isConnecting = false;
    statusListeners.forEach((cb) => cb(true));
  });

  socket.on('disconnect', (_reason) => {
    isConnecting = false;
    statusListeners.forEach((cb) => cb(false));
  });

  socket.on('connect_error', (error) => {
    isConnecting = false;
    statusListeners.forEach((cb) => cb(false));
    console.warn('[Socket.IO] Connection error:', error.message);
  });

  socket.on('notification:new', (data: RealtimeNotificationEvent) => {
    notificationListeners.forEach((cb) => cb(data));
  });

  socket.on('notification:unread-count', (data: { unreadCount: number }) => {
    unreadCountListeners.forEach((cb) => cb(data));
  });

  return socket;
};

/**
 * Gracefully disconnects the active socket connection.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnecting = false;
    statusListeners.forEach((cb) => cb(false));
  }
};

/**
 * Returns the current socket instance.
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Returns whether the socket is currently connected.
 */
export const isSocketConnected = (): boolean => {
  return Boolean(socket && socket.connected);
};

/**
 * Subscribes a listener to incoming real-time notifications.
 */
export const onNewNotification = (callback: NotificationCallback): (() => void) => {
  notificationListeners.add(callback);
  return () => {
    notificationListeners.delete(callback);
  };
};

/**
 * Subscribes a listener to unread notification count changes.
 */
export const onUnreadCount = (callback: UnreadCountCallback): (() => void) => {
  unreadCountListeners.add(callback);
  return () => {
    unreadCountListeners.delete(callback);
  };
};

/**
 * Subscribes a listener to socket connection status changes.
 */
export const onSocketStatus = (callback: StatusCallback): (() => void) => {
  statusListeners.add(callback);
  // Emit current state immediately
  callback(isSocketConnected());
  return () => {
    statusListeners.delete(callback);
  };
};

/**
 * Subscribes a listener to a custom named Socket.IO event.
 */
export const onSocketEvent = (event: string, callback: (data: any) => void): (() => void) => {
  const handler = (data: any) => callback(data);
  if (socket) {
    socket.on(event, handler);
  }
  return () => {
    if (socket) {
      socket.off(event, handler);
    }
  };
};

export default {
  connect: connectSocket,
  disconnect: disconnectSocket,
  getSocket,
  isConnected: isSocketConnected,
  onNotification: onNewNotification,
  onUnreadCount,
  onStatus: onSocketStatus,
};

