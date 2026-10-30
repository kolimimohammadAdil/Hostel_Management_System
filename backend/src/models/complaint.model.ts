import mongoose, { Schema, Document, Model } from 'mongoose';

export type ComplaintCategory =
  | 'MESS_FOOD'
  | 'HOSTEL_MAINTENANCE'
  | 'ROOM_CLEANING'
  | 'WATER_SUPPLY'
  | 'ELECTRICITY'
  | 'SECURITY'
  | 'OTHER';

export type ComplaintStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REOPENED';

export type DepartmentType =
  | 'MESS'
  | 'MAINTENANCE'
  | 'WARDEN'
  | 'SECURITY'
  | 'ADMINISTRATION';

export interface IComplaintComment {
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  comment: string;
  createdAt: Date;
}

export interface IComplaint extends Document {
  complaintId: string;
  student: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber: string;
  hostelName: string;
  roomNumber: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  submissionDate: Date;
  assignedDepartment: DepartmentType;
  assignedStaff?: mongoose.Types.ObjectId;
  assignedStaffName?: string;
  status: ComplaintStatus;
  resolutionDetails?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedByName?: string;
  reopenedReason?: string;
  reopenedAt?: Date;
  comments: IComplaintComment[];
  createdAt: Date;
  updatedAt: Date;
}

const complaintCommentSchema = new Schema<IComplaintComment>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorRole: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const complaintSchema = new Schema<IComplaint>(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    hostelName: {
      type: String,
      required: true,
      index: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'MESS_FOOD',
        'HOSTEL_MAINTENANCE',
        'ROOM_CLEANING',
        'WATER_SUPPLY',
        'ELECTRICITY',
        'SECURITY',
        'OTHER',
      ],
      required: [true, 'Complaint category is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Subject/Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    assignedDepartment: {
      type: String,
      enum: ['MESS', 'MAINTENANCE', 'WARDEN', 'SECURITY', 'ADMINISTRATION'],
      default: 'ADMINISTRATION',
      index: true,
    },
    assignedStaff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedStaffName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'],
      default: 'PENDING',
      index: true,
    },
    resolutionDetails: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedByName: {
      type: String,
      trim: true,
    },
    reopenedReason: {
      type: String,
      trim: true,
    },
    reopenedAt: {
      type: Date,
    },
    comments: [complaintCommentSchema],
  },
  {
    timestamps: true,
  }
);

export const Complaint: Model<IComplaint> =
  mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', complaintSchema);

