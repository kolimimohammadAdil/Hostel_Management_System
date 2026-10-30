import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHostelRoom extends Document {
  roomNumber: string;
  floor: number;
  hostelName: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel';
  block?: string;
  capacity: number;
  assignedStudents: mongoose.Types.ObjectId[];
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  createdAt: Date;
  updatedAt: Date;
}

const hostelRoomSchema = new Schema<IHostelRoom>(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: 0,
      max: 10,
    },
    hostelName: {
      type: String,
      required: [true, 'Hostel name is required'],
      enum: ['Chakrika Girls Hostel', 'ALTS Boys Hostel'],
      index: true,
    },
    block: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 4,
      min: 1,
      max: 8,
    },
    assignedStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'],
      default: 'AVAILABLE',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of room per hostel
hostelRoomSchema.index({ hostelName: 1, roomNumber: 1 }, { unique: true });

export const HostelRoom: Model<IHostelRoom> =
  mongoose.models.HostelRoom || mongoose.model<IHostelRoom>('HostelRoom', hostelRoomSchema);

