import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export enum MaintenanceCategory {
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  FURNITURE = 'furniture',
  CLEANING = 'cleaning',
  INTERNET = 'internet',
  STRUCTURAL = 'structural',
  OTHER = 'other',
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MaintenanceStatus {
  SUBMITTED = 'submitted',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export interface IMaintenanceRequest extends Document {
  submittedBy: Types.ObjectId;
  hostelName: string;
  roomNumber: string;
  category: MaintenanceCategory;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedStaff?: Types.ObjectId;
  resolutionNotes?: string;
  resolvedAt?: Date;
  estimatedResolutionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceRequestSchema = new Schema<IMaintenanceRequest>(
  {
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitting user reference is required'],
      index: true,
    },
    hostelName: {
      type: String,
      required: [true, 'Hostel name is required'],
      trim: true,
      index: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: Object.values(MaintenanceCategory),
        message: '{VALUE} is not a valid maintenance category',
      },
      required: [true, 'Category is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    priority: {
      type: String,
      enum: {
        values: Object.values(MaintenancePriority),
        message: '{VALUE} is not a valid priority level',
      },
      default: MaintenancePriority.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(MaintenanceStatus),
        message: '{VALUE} is not a valid maintenance status',
      },
      default: MaintenanceStatus.SUBMITTED,
      index: true,
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters'],
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    estimatedResolutionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High-frequency query indexes
maintenanceRequestSchema.index({ hostelName: 1, status: 1 });
maintenanceRequestSchema.index({ status: 1, priority: 1 });
maintenanceRequestSchema.index({ submittedBy: 1, createdAt: -1 });
maintenanceRequestSchema.index({ assignedStaff: 1, status: 1 });

export const MaintenanceRequest: Model<IMaintenanceRequest> =
  mongoose.models.MaintenanceRequest ||
  mongoose.model<IMaintenanceRequest>(
    'MaintenanceRequest',
    maintenanceRequestSchema
  );

export default MaintenanceRequest;

