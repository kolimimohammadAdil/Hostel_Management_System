import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export enum LeaveType {
  HOME = 'home',
  OUTING = 'outing',
  EMERGENCY = 'emergency',
  MEDICAL = 'medical',
  VACATION = 'vacation',
  OTHER = 'other',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHECKED_OUT = 'checked_out',
  RETURNED = 'returned',
}

export interface ILeaveBiometricTemplate {
  embedding?: number[];
  enrolledAt: Date;
  modelVersion: string;
  status: 'enrolled' | 'verified_checkout' | 'verified_checkin' | 'expired';
  consentGiven: boolean;
  consentTimestamp: Date;
  capturedFacePreview?: string;
}

export interface ILeaveApplication extends Document {
  student: Types.ObjectId;
  leaveType: LeaveType;
  reason: string;
  destination: string;
  departureTime: Date;
  expectedReturnTime: Date;
  status: LeaveStatus;
  reviewingWarden?: Types.ObjectId;
  reviewRemarks?: string;
  reviewedAt?: Date;
  actualDepartureTime?: Date;
  actualReturnTime?: Date;
  biometricTemplate?: ILeaveBiometricTemplate;
  isLate?: boolean;
  lateDetectedAt?: Date;
  lateNotificationSent?: boolean;
  lateGracePeriodMinutes?: number;
  wardenDelayNotes?: string;
  wardenMessageSent?: {
    message: string;
    sentAt: Date;
    sentBy: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const leaveApplicationSchema = new Schema<ILeaveApplication>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    leaveType: {
      type: String,
      enum: {
        values: Object.values(LeaveType),
        message: '{VALUE} is not a valid leave type',
      },
      required: [true, 'Leave type is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    destination: {
      type: String,
      required: [true, 'Destination address/city is required'],
      trim: true,
      minlength: [2, 'Destination must be at least 2 characters'],
      maxlength: [200, 'Destination cannot exceed 200 characters'],
    },
    departureTime: {
      type: Date,
      required: [true, 'Departure date and time is required'],
      index: true,
    },
    expectedReturnTime: {
      type: Date,
      required: [true, 'Expected return date and time is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(LeaveStatus),
        message: '{VALUE} is not a valid leave status',
      },
      default: LeaveStatus.PENDING,
      index: true,
    },
    reviewingWarden: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reviewRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Review remarks cannot exceed 500 characters'],
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    actualDepartureTime: {
      type: Date,
      default: null,
    },
    actualReturnTime: {
      type: Date,
      default: null,
    },
    biometricTemplate: {
      embedding: {
        type: [Number],
        select: false, // Critical: raw biometric vectors must NEVER be exposed via normal queries
      },
      enrolledAt: {
        type: Date,
        default: Date.now,
      },
      modelVersion: {
        type: String,
        default: 'OpenCV_SFace_128D_v1',
      },
      status: {
        type: String,
        enum: ['enrolled', 'verified_checkout', 'verified_checkin', 'expired'],
        default: 'enrolled',
      },
      consentGiven: {
        type: Boolean,
        default: true,
      },
      consentTimestamp: {
        type: Date,
        default: Date.now,
      },
      capturedFacePreview: {
        type: String, // Data URL or safe thumbnail preview for warden visual inspection
        default: null,
      },
    },
    isLate: {
      type: Boolean,
      default: false,
      index: true,
    },
    lateDetectedAt: {
      type: Date,
      default: null,
    },
    lateNotificationSent: {
      type: Boolean,
      default: false,
    },
    lateGracePeriodMinutes: {
      type: Number,
      default: 15,
    },
    wardenDelayNotes: {
      type: String,
      trim: true,
      default: null,
    },
    wardenMessageSent: {
      message: { type: String, trim: true },
      sentAt: { type: Date },
      sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid portal queries
leaveApplicationSchema.index({ student: 1, status: 1 });
leaveApplicationSchema.index({ status: 1, departureTime: -1 });
leaveApplicationSchema.index({ status: 1, isLate: 1 });
leaveApplicationSchema.index({ createdAt: -1 });

export const LeaveApplication: Model<ILeaveApplication> =
  mongoose.models.LeaveApplication ||
  mongoose.model<ILeaveApplication>('LeaveApplication', leaveApplicationSchema);

export default LeaveApplication;

