export type UserRole = 
  | 'STUDENT'
  | 'GIRLS_WARDEN'
  | 'BOYS_WARDEN'
  | 'GATE_SECURITY'
  | 'PARENT'
  | 'MESS_INCHARGE'
  | 'MAINTENANCE_INCHARGE'
  | 'HOSTEL_ADMIN';

export type Gender = 'FEMALE' | 'MALE';

export type HostelType = 'GIRLS' | 'BOYS';
export type Hostel = HostelType;

export type LeaveType = 'DAY_OUTING' | 'NIGHT_OUT' | 'HOME_VISIT' | 'EMERGENCY';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED' | 'CHECKED_OUT' | 'RETURNED';

export type MovementType = 'ENTRY' | 'EXIT';

export interface StudentProfile {
  id: string;
  rollNumber: string;
  name: string;
  gender: Gender;
  hostelBlock: string;
  hostelName: string;
  roomNumber: string;
  branch: string;
  year: string;
  photoUrl: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  studentPhone: string;
  emergencyContact: string;
  currentStatus: 'IN_HOSTEL' | 'OUTSIDE_ON_LEAVE';
  faceEmbeddingId: string;
}

// Aliases for unified data layer terminology
export type Student = StudentProfile;

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  studentPhoto: string;
  gender: Gender;
  hostelName: string;
  roomNumber: string;
  leaveType: LeaveType;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  reason: string;
  destinationAddress: string;
  destination?: string;
  parentContactVerified: boolean;
  status: LeaveStatus;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  gatePassToken?: string;
  isBiometricEnrolled?: boolean;
  capturedFacePreview?: string;
  biometricConsent?: boolean;
  isLate?: boolean;
  lateDetectedAt?: string;
  wardenDelayNotes?: string;
  wardenMessageSent?: boolean;
}

export type LeaveApplication = LeaveRequest;

export interface GateMovementRecord {
  id: string;
  studentId: string;
  studentRollNo: string;
  studentName: string;
  hostelName: string;
  roomNumber: string;
  studentPhoto: string;
  movementType: MovementType;
  timestamp: string;
  gateName: string;
  verificationMethod: 'FACE_RECOGNITION_SIMULATED' | 'MANUAL_OVERRIDE';
  matchScore: number;
  verified: boolean;
  leaveId?: string;
  leaveType?: LeaveType;
  authorized: boolean;
  notes?: string;
}

export type GateMovement = GateMovementRecord;

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  targetRole?: UserRole | 'ALL';
  category?: 'PAYMENT' | 'LEAVE' | 'MAINTENANCE' | 'MESS' | 'SECURITY' | 'ANNOUNCEMENT' | 'GENERAL';
  relatedEntityId?: string;
}

export type Notification = SystemNotification;

export interface AuditActivity {
  id: string;
  actionType: 
    | 'LEAVE_SUBMITTED' 
    | 'LEAVE_APPROVED' 
    | 'LEAVE_REJECTED' 
    | 'GATE_EXIT' 
    | 'GATE_ENTRY' 
    | 'PAYMENT_RECEIVED'
    | 'MENU_UPDATED'
    | 'MESS_STATUS_CHANGED'
    | 'COMPLAINT_LOGGED'
    | 'COMPLAINT_RESOLVED'
    | 'MAINTENANCE_LOGGED'
    | 'MAINTENANCE_UPDATED'
    | 'SYSTEM_RESET';
  timestamp: string;
  entityId: string;
  entityName: string;
  performedBy: string;
  performedByRole: UserRole | 'SYSTEM';
  hostel: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel' | 'ALL';
  details: string;
}

export type PassValidityStatus =
  | 'VALID_ACTIVE'
  | 'NOT_YET_VALID'
  | 'EXPIRED'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'COMPLETED';

export type GateVerificationResult =
  | 'SUCCESS_AUTHORIZED'
  | 'STUDENT_NOT_FOUND'
  | 'NO_APPROVED_LEAVE'
  | 'LEAVE_NOT_YET_VALID'
  | 'LEAVE_EXPIRED'
  | 'WRONG_HOSTEL'
  | 'INVALID_MOVEMENT_STATE';

// ==========================================
// NEW MODULE TYPES: PARENT & FEES
// ==========================================

export interface Parent {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  email: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  address: string;
  occupation?: string;
}

export interface FeeBreakdown {
  roomRent: number;
  messCharges: number;
  cautionDeposit: number;
  utilities: number;
  amenitiesAndWifi: number;
}

export interface FeeAccount {
  id: string;
  studentId: string;
  studentRollNo: string;
  studentName: string;
  hostelName: string;
  roomNumber: string;
  academicYear: string;
  semester: string;
  totalFee: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  status: 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'PENDING';
  breakdown: FeeBreakdown;
}

export interface FeeTransaction {
  id: string; // e.g. "TXN-DEMO-2026-8910"
  studentId: string;
  studentRollNo: string;
  amount: number;
  timestamp: string;
  paymentMethod: 'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD';
  status: 'SUCCESS' | 'FAILED';
  receiptNumber: string;
  mode: 'DEMO_SIMULATION';
  notes?: string;
  payerName?: string;
}

// ==========================================
// NEW MODULE TYPES: ANNOUNCEMENTS
// ==========================================

export type AnnouncementCategory = 
  | 'ACADEMIC' 
  | 'MESS' 
  | 'MAINTENANCE' 
  | 'HOSTEL_ADMIN' 
  | 'SECURITY';

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  author: string;
  authorRole: UserRole;
  targetAudience: 'ALL' | 'STUDENT' | 'PARENT' | 'GIRLS' | 'BOYS';
  hostel?: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel' | 'ALL';
  publishedAt: string;
  expiresAt?: string;
}

// ==========================================
// NEW MODULE TYPES: MESS & DINING
// ==========================================

export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';

export interface MenuItem {
  id: string;
  name: string;
  category: 'VEG' | 'NON_VEG' | 'BEVERAGE' | 'DESSERT' | 'SPECIAL';
  calories?: number;
  isSpecial?: boolean;
}

export interface MealScheduleInfo {
  mealType: MealType;
  startTime: string;
  endTime: string;
  items: MenuItem[];
}

export interface MenuEntry {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  meals: Record<MealType, MealScheduleInfo>;
  lastUpdated: string;
  updatedBy: string;
}

export interface MessSchedule {
  status: 'OPEN' | 'CLOSED';
  currentMeal: MealType | 'NONE';
  nextMeal: MealType;
  nextOpeningTime: string;
  closureReason?: string;
  announcement?: string;
  timings: Record<MealType, { start: string; end: string }>;
  lastUpdated: string;
}

export type FoodComplaintCategory =
  | 'FOOD_QUALITY'
  | 'COLD_FOOD'
  | 'INSUFFICIENT_QUANTITY'
  | 'MENU_MISMATCH'
  | 'HYGIENE'
  | 'OTHER';

export type FoodComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

export interface FoodComplaint {
  id: string; // CMP-2026-001
  studentId: string;
  studentName: string;
  studentRollNo: string;
  hostel: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel';
  roomNumber: string;
  category: FoodComplaintCategory;
  mealType: MealType;
  description: string;
  submittedAt: string;
  status: FoodComplaintStatus;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
}

// ==========================================
// NEW MODULE TYPES: HOSTEL MAINTENANCE
// ==========================================

export type MaintenanceCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'FURNITURE'
  | 'CLEANING'
  | 'INTERNET'
  | 'STRUCTURAL'
  | 'OTHER';

export type MaintenanceStatus =
  | 'REPORTED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REOPENED';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MaintenanceNote {
  id: string;
  author: string;
  authorRole: string;
  timestamp: string;
  note: string;
}

export interface MaintenanceIssue {
  id: string; // MNT-2026-001
  hostel: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel';
  roomNumber: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
  reporter: string;
  reporterRole: UserRole;
  assignedTo?: string;
  status: MaintenanceStatus;
  reportedDate: string;
  lastUpdatedDate: string;
  estimatedResolutionDate?: string;
  progressNotes: MaintenanceNote[];
  resolutionDetails?: string;
  resolvedDate?: string;
}

export interface HostelRoom {
  id: string;
  roomNumber: string;
  hostel: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel' | 'Kaveri Girls Hostel' | 'Ganga Boys Hostel';
  block: string;
  floor: string;
  roomType: 'SINGLE' | 'DOUBLE' | 'TRIPLE';
  capacity: number;
  occupied: number;
  inmates: string[];
  activeIssuesCount: number;
  lastInspected?: string;
}

// ==========================================
// MODULE 1: Room-Wise Attendance Types
// ==========================================
export type AttendanceStudentStatus = 'PRESENT' | 'ABSENT';

export interface StudentAttendanceRecord {
  studentId: string;
  rollNumber: string;
  name: string;
  photoUrl?: string;
  roomNumber: string;
  status: AttendanceStudentStatus;
  remarks?: string;
}

export interface RoomAttendanceData {
  roomNumber: string;
  floor: number;
  hostelName: 'Chakrika Girls Hostel' | 'ALTS Boys Hostel';
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  status: 'COMPLETED' | 'INCOMPLETE';
  students: StudentAttendanceRecord[];
  date: string;
  session: 'NIGHT_ROLL_CALL' | 'MORNING_ROLL_CALL';
  markedBy?: string;
  lastUpdated?: string;
}

// ==========================================
// MODULE 2: Comprehensive Complaints Types
// ==========================================
export type PortalComplaintCategory =
  | 'MESS_FOOD'
  | 'HOSTEL_MAINTENANCE'
  | 'ROOM_CLEANING'
  | 'WATER_SUPPLY'
  | 'ELECTRICITY'
  | 'SECURITY'
  | 'OTHER';

export type PortalComplaintStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REOPENED';

export type PortalDepartment =
  | 'MESS'
  | 'MAINTENANCE'
  | 'WARDEN'
  | 'SECURITY'
  | 'ADMINISTRATION';

export interface ComplaintComment {
  id?: string;
  authorName: string;
  authorRole: string;
  comment: string;
  createdAt: string;
}

export interface UnifiedComplaint {
  id: string;
  complaintId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  hostelName: string;
  roomNumber: string;
  category: PortalComplaintCategory;
  title: string;
  description: string;
  submissionDate: string;
  assignedDepartment: PortalDepartment;
  assignedStaffName?: string;
  status: PortalComplaintStatus;
  resolutionDetails?: string;
  resolutionDate?: string;
  reopenedReason?: string;
  comments: ComplaintComment[];
}

// ==========================================
// MODULE 3: GPS Travel Safety Types
// ==========================================
export type StudentTravelSafetyStatus =
  | 'NOT_STARTED'
  | 'WAITING_FOR_CONSENT'
  | 'GPS_ACTIVE'
  | 'LOCATION_UNAVAILABLE'
  | 'SAFE_ARRIVAL_CONFIRMED'
  | 'TRACKING_STOPPED';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  addressLabel?: string;
}

export interface SafeArrivalRecord {
  confirmedByRole: 'STUDENT' | 'PARENT' | 'WARDEN' | 'ADMIN';
  confirmedByName: string;
  confirmedAt: string;
  remarks?: string;
}

export interface TravelSafetySessionData {
  id: string;
  leaveId: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  hostelName: string;
  destination: string;
  departureTime: string;
  expectedArrivalTime: string;
  consentGranted: boolean;
  consentTimestamp?: string;
  status: StudentTravelSafetyStatus;
  lastKnownLocation?: LocationCoordinate;
  safeArrivalConfirmation?: SafeArrivalRecord;
  trackingStartedAt?: string;
  trackingStoppedAt?: string;
  stoppedReason?: string;
}

