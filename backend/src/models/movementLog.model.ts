import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export enum MovementType {
  CHECK_OUT = 'check_out',
  CHECK_IN = 'check_in',
}

export interface IMovementLog extends Document {
  student: Types.ObjectId;
  eventType: MovementType;
  timestamp: Date;
  recordedBy: Types.ObjectId;
  leaveApplication?: Types.ObjectId;
  verificationMethod?: string; // e.g. 'face_recognition', 'manual_override', 'rfid_qr'
  notes?: string;
}

const movementLogSchema = new Schema<IMovementLog>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    eventType: {
      type: String,
      enum: {
        values: Object.values(MovementType),
        message: '{VALUE} is not a valid movement event type',
      },
      required: [true, 'Movement event type is required'],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: [true, 'Movement timestamp is required'],
      index: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Security staff reference is required'],
      index: true,
    },
    leaveApplication: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveApplication',
      default: null,
      index: true,
    },
    verificationMethod: {
      type: String,
      trim: true,
      default: 'face_recognition',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Logs are immutable audit trails
  }
);

// High-throughput audit log indexes
movementLogSchema.index({ student: 1, timestamp: -1 });
movementLogSchema.index({ eventType: 1, timestamp: -1 });

export const MovementLog: Model<IMovementLog> =
  mongoose.models.MovementLog ||
  mongoose.model<IMovementLog>('MovementLog', movementLogSchema);

export default MovementLog;

