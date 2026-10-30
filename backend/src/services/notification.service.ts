import mongoose, { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/notification.model';
import { User, UserRole, AccountStatus } from '../models/user.model';
import { emitToUser, emitToRole } from './socket.service';

export interface CreateNotificationInput {
  recipient: Types.ObjectId | string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: Record<string, unknown>;
}

export interface SafeNotificationDTO {
  id: string;
  recipient: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export const toSafeNotification = (notif: INotification): SafeNotificationDTO => {
  return {
    id: notif._id.toString(),
    recipient: notif.recipient.toString(),
    title: notif.title,
    message: notif.message,
    type: notif.type,
    isRead: notif.isRead,
    readAt: notif.readAt || null,
    createdAt: notif.createdAt,
    metadata: notif.metadata,
  };
};

/**
 * Validates input, persists the notification in MongoDB Atlas,
 * and emits a real-time event to the recipient's private socket room.
 */
export const createAndDeliverNotification = async (
  input: CreateNotificationInput
): Promise<INotification | null> => {
  const { recipient, title, message, type = NotificationType.GENERAL, metadata = {} } = input;

  if (!recipient) {
    throw new Error('Notification recipient is required');
  }

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    throw new Error('Notification title must be at least 2 characters long');
  }

  if (!message || typeof message !== 'string' || message.trim().length < 2) {
    throw new Error('Notification message must be at least 2 characters long');
  }

  const recipientId =
    typeof recipient === 'string' ? new Types.ObjectId(recipient) : recipient;

  // 1. Persistence in MongoDB Atlas
  let notification: INotification | null = null;
  if (mongoose.connection.readyState === 1) {
    try {
      notification = await Notification.create({
        recipient: recipientId,
        title: title.trim(),
        message: message.trim(),
        type,
        isRead: false,
        readAt: undefined,
        metadata,
      });
    } catch (err: any) {
      console.error('Failed to persist notification in MongoDB:', err.message);
      // If persistence fails, do not deliver unpersisted notification
      return null;
    }
  }

  // 2. Real-Time Delivery via Socket.IO
  const recipientStr = recipientId.toString();
  const safeData = notification
    ? toSafeNotification(notification)
    : {
        id: `ephem_${Date.now()}`,
        recipient: recipientStr,
        title: title.trim(),
        message: message.trim(),
        type,
        isRead: false,
        createdAt: new Date(),
        metadata,
      };

  // Deliver to recipient's private room
  emitToUser(recipientStr, 'notification:new', safeData);

  // If in MongoDB, query and emit updated unread count
  if (mongoose.connection.readyState === 1) {
    Notification.countDocuments({ recipient: recipientId, isRead: false })
      .then((unreadCount) => {
        emitToUser(recipientStr, 'notification:unread-count', { unreadCount });
      })
      .catch(() => {});
  }

  return notification;
};

/**
 * Creates and delivers notifications to all active users with a specific role.
 */
export const createAndDeliverRoleNotification = async (
  role: UserRole,
  input: Omit<CreateNotificationInput, 'recipient'>
): Promise<number> => {
  if (mongoose.connection.readyState !== 1) {
    // Deliver to role room directly in degraded mode
    emitToRole(role, 'notification:new', {
      id: `ephem_role_${Date.now()}`,
      title: input.title,
      message: input.message,
      type: input.type || NotificationType.GENERAL,
      isRead: false,
      createdAt: new Date(),
      metadata: input.metadata || {},
    });
    return 0;
  }

  const targetUsers = await User.find({ role, status: AccountStatus.ACTIVE }).select('_id');
  let deliveredCount = 0;

  for (const user of targetUsers) {
    try {
      await createAndDeliverNotification({
        ...input,
        recipient: (user as any)._id as Types.ObjectId,
      });
      deliveredCount++;
    } catch {
      // Continue delivering to remaining users
    }
  }

  return deliveredCount;
};
