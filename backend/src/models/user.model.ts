import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Seven standard system roles for HostelGuard AI demonstration & operations.
 */
export enum UserRole {
  STUDENT = 'student',
  GIRLS_WARDEN = 'girls_warden',
  BOYS_WARDEN = 'boys_warden',
  GATE_SECURITY = 'gate_security',
  PARENT = 'parent',
  MESS_INCHARGE = 'mess_incharge',
  MAINTENANCE_INCHARGE = 'maintenance_incharge',
  HOSTEL_ADMIN = 'hostel_admin',
}

/**
 * Account lifecycle statuses.
 */
export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * TypeScript interface representing a User document.
 */
export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  rollNumber?: string;
  hostelName?: string;
  roomNumber?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  photoUrl?: string;
  department?: string;
  academicYear?: string;
  employeeId?: string;
  assignedHostel?: string;
  dutyAssignment?: string;
  relationship?: string;
  linkedStudentRoll?: string;
  linkedStudentName?: string;
  emergencyContact?: string;
  messAssignment?: string;
  assignedResponsibilities?: string;
  status: AccountStatus;
  faceEmbedding?: number[];
  faceEnrolledAt?: Date;
  faceEnrolledBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Hidden by default in queries for security
    },
    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: '{VALUE} is not a valid user role',
      },
      required: [true, 'Role is required'],
      index: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },
    hostelName: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
    },
    assignedHostel: {
      type: String,
      trim: true,
    },
    dutyAssignment: {
      type: String,
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
    },
    linkedStudentRoll: {
      type: String,
      trim: true,
    },
    linkedStudentName: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    messAssignment: {
      type: String,
      trim: true,
    },
    assignedResponsibilities: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
      index: true,
    },
    faceEmbedding: {
      type: [Number],
      select: false, // Hidden by default in queries so biometric vectors are never leaked in public user profiles
    },
    faceEnrolledAt: {
      type: Date,
    },
    faceEnrolledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active users by role
userSchema.index({ role: 1, status: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;

