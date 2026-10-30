import mongoose, { Schema, Document, Model } from 'mongoose';

export type AttendanceStudentStatus = 'PRESENT' | 'ABSENT';

export interface IStudentAttendanceItem {
  student: mongoose.Types.ObjectId;
  rollNumber: string;
  studentName: string;
  photoUrl?: string;
  status: AttendanceStudentStatus;
  remarks?: string;
}

export interface IAttendance extends Document {
  hostelName: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel';
  roomNumber: string;
  floor: number;
  date: string; // YYYY-MM-DD
  session: 'NIGHT_ROLL_CALL' | 'MORNING_ROLL_CALL';
  markedBy: mongoose.Types.ObjectId;
  markedByName: string;
  students: IStudentAttendanceItem[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  status: 'COMPLETED' | 'IN_PROGRESS';
  createdAt: Date;
  updatedAt: Date;
}

const studentAttendanceItemSchema = new Schema<IStudentAttendanceItem>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT'],
      required: true,
      default: 'PRESENT',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const attendanceSchema = new Schema<IAttendance>(
  {
    hostelName: {
      type: String,
      required: [true, 'Hostel name is required'],
      enum: ['Chakrika Girls Hostel', 'ALTS Boys Hostel'],
      index: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
      index: true,
    },
    floor: {
      type: Number,
      required: true,
      default: 1,
    },
    date: {
      type: String,
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
      index: true,
    },
    session: {
      type: String,
      enum: ['NIGHT_ROLL_CALL', 'MORNING_ROLL_CALL'],
      default: 'NIGHT_ROLL_CALL',
      required: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    markedByName: {
      type: String,
      required: true,
    },
    students: [studentAttendanceItemSchema],
    totalStudents: {
      type: Number,
      required: true,
      default: 0,
    },
    presentCount: {
      type: Number,
      required: true,
      default: 0,
    },
    absentCount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'IN_PROGRESS'],
      default: 'COMPLETED',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to strictly prevent duplicate attendance records for the same room, date, and session
attendanceSchema.index(
  { hostelName: 1, roomNumber: 1, date: 1, session: 1 },
  { unique: true }
);

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', attendanceSchema);

