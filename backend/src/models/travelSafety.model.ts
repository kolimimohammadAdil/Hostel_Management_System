import mongoose, { Schema, Document, Model } from 'mongoose';

export type TravelSafetyStatus =
  | 'NOT_STARTED'
  | 'WAITING_FOR_CONSENT'
  | 'GPS_ACTIVE'
  | 'LOCATION_UNAVAILABLE'
  | 'SAFE_ARRIVAL_CONFIRMED'
  | 'TRACKING_STOPPED';

export interface ILocationCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  addressLabel?: string;
}

export interface ISafeArrivalConfirmation {
  confirmedByRole: 'STUDENT' | 'PARENT' | 'WARDEN' | 'ADMIN';
  confirmedByUser: mongoose.Types.ObjectId;
  confirmedByName: string;
  confirmedAt: Date;
  remarks?: string;
}

export interface ITravelSafetySession extends Document {
  leaveApplication: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  studentName: string;
  studentRollNo: string;
  hostelName: string;
  destination: string;
  departureTime: Date;
  expectedArrivalTime: Date;
  consentGranted: boolean;
  consentTimestamp?: Date;
  status: TravelSafetyStatus;
  lastKnownLocation?: ILocationCoordinate;
  locationHistory: ILocationCoordinate[]; // Limited retention for journey safety
  safeArrivalConfirmation?: ISafeArrivalConfirmation;
  trackingStartedAt?: Date;
  trackingStoppedAt?: Date;
  stoppedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const locationCoordinateSchema = new Schema<ILocationCoordinate>(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    addressLabel: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const travelSafetySessionSchema = new Schema<ITravelSafetySession>(
  {
    leaveApplication: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveApplication',
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentRollNo: {
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
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    departureTime: {
      type: Date,
      required: true,
    },
    expectedArrivalTime: {
      type: Date,
      required: true,
    },
    consentGranted: {
      type: Boolean,
      default: false,
    },
    consentTimestamp: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        'NOT_STARTED',
        'WAITING_FOR_CONSENT',
        'GPS_ACTIVE',
        'LOCATION_UNAVAILABLE',
        'SAFE_ARRIVAL_CONFIRMED',
        'TRACKING_STOPPED',
      ],
      default: 'WAITING_FOR_CONSENT',
      index: true,
    },
    lastKnownLocation: locationCoordinateSchema,
    locationHistory: {
      type: [locationCoordinateSchema],
      default: [],
    },
    safeArrivalConfirmation: {
      confirmedByRole: {
        type: String,
        enum: ['STUDENT', 'PARENT', 'WARDEN', 'ADMIN'],
      },
      confirmedByUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      confirmedByName: {
        type: String,
        trim: true,
      },
      confirmedAt: {
        type: Date,
      },
      remarks: {
        type: String,
        trim: true,
      },
    },
    trackingStartedAt: {
      type: Date,
    },
    trackingStoppedAt: {
      type: Date,
    },
    stoppedReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TravelSafetySession: Model<ITravelSafetySession> =
  mongoose.models.TravelSafetySession ||
  mongoose.model<ITravelSafetySession>('TravelSafetySession', travelSafetySessionSchema);

