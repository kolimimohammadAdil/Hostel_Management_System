import mongoose from 'mongoose';
import userMod from './dist/models/user.model.js';
import roomMod from './dist/models/hostelRoom.model.js';
import attMod from './dist/models/attendance.model.js';
import compMod from './dist/models/complaint.model.js';
import travelMod from './dist/models/travelSafety.model.js';

const { User, UserRole } = userMod;
const { HostelRoom } = roomMod;
const { Attendance } = attMod;
const { Complaint } = compMod;
const { TravelSafetySession } = travelMod;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n=======================================================');
console.log('🧪 Verifying New Modules: Attendance, Admin, Complaints & Travel Safety');
console.log('=======================================================\n');

// 1. UserRole & Hostel Admin
console.log('--- 1. UserRole & Hostel Admin ---');
assert(UserRole.HOSTEL_ADMIN === 'hostel_admin', 'UserRole has HOSTEL_ADMIN = "hostel_admin"');
const userRoleEnum = User.schema.path('role').enumValues;
assert(userRoleEnum.includes('hostel_admin'), 'User schema enum includes "hostel_admin"');

// 2. HostelRoom Model
console.log('\n--- 2. HostelRoom Model ---');
assert(HostelRoom.modelName === 'HostelRoom', 'HostelRoom model is registered');
assert(HostelRoom.schema.path('hostelName') !== undefined, 'HostelRoom has hostelName field');
assert(HostelRoom.schema.path('roomNumber') !== undefined, 'HostelRoom has roomNumber field');
assert(HostelRoom.schema.path('floor') !== undefined, 'HostelRoom has floor field');
assert(HostelRoom.schema.path('capacity') !== undefined, 'HostelRoom has capacity field');
assert(HostelRoom.schema.path('assignedStudents') !== undefined, 'HostelRoom has assignedStudents array');

// 3. Attendance Model & Indexes
console.log('\n--- 3. Attendance Model & Compound Indexes ---');
assert(Attendance.modelName === 'Attendance', 'Attendance model is registered');
assert(Attendance.schema.path('hostelName') !== undefined, 'Attendance has hostelName');
assert(Attendance.schema.path('roomNumber') !== undefined, 'Attendance has roomNumber');
assert(Attendance.schema.path('date') !== undefined, 'Attendance has date string (YYYY-MM-DD)');
assert(Attendance.schema.path('session') !== undefined, 'Attendance has session field');
assert(Attendance.schema.path('students') !== undefined, 'Attendance has students roster array');

// Check compound unique index
const attendanceIndexes = Attendance.schema.indexes();
const hasUniqueCompoundIndex = attendanceIndexes.some((idx) => {
  const fields = idx[0];
  const options = idx[1];
  return (
    fields.hostelName === 1 &&
    fields.roomNumber === 1 &&
    fields.date === 1 &&
    fields.session === 1 &&
    options &&
    options.unique === true
  );
});
assert(hasUniqueCompoundIndex, 'Attendance schema has compound unique index on { hostelName: 1, roomNumber: 1, date: 1, session: 1 }');

// 4. Complaint Model & 7 Categories
console.log('\n--- 4. Complaint Model & Department Mapping ---');
assert(Complaint.modelName === 'Complaint', 'Complaint model is registered');
const complaintCategoryEnum = Complaint.schema.path('category').enumValues;
const expectedCategories = [
  'MESS_FOOD',
  'HOSTEL_MAINTENANCE',
  'ROOM_CLEANING',
  'WATER_SUPPLY',
  'ELECTRICITY',
  'SECURITY',
  'OTHER',
];
expectedCategories.forEach((cat) => {
  assert(complaintCategoryEnum.includes(cat), `Complaint category includes "${cat}"`);
});

const complaintStatusEnum = Complaint.schema.path('status').enumValues;
const expectedStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'];
expectedStatuses.forEach((st) => {
  assert(complaintStatusEnum.includes(st), `Complaint status includes "${st}"`);
});
assert(Complaint.schema.path('resolutionDetails') !== undefined, 'Complaint has resolutionDetails for audit trail');
assert(Complaint.schema.path('assignedDepartment') !== undefined, 'Complaint has assignedDepartment field');

// 5. Travel Safety Session Model
console.log('\n--- 5. Travel Safety Session Model ---');
assert(TravelSafetySession.modelName === 'TravelSafetySession', 'TravelSafetySession model is registered');
assert(TravelSafetySession.schema.path('leaveApplication') !== undefined, 'TravelSafetySession references leaveApplication');
assert(TravelSafetySession.schema.path('student') !== undefined, 'TravelSafetySession references student');
assert(TravelSafetySession.schema.path('studentRollNo') !== undefined, 'TravelSafetySession has studentRollNo');
assert(TravelSafetySession.schema.path('consentGranted') !== undefined, 'TravelSafetySession has consentGranted boolean');

const travelStatuses = [
  'NOT_STARTED',
  'WAITING_FOR_CONSENT',
  'GPS_ACTIVE',
  'LOCATION_UNAVAILABLE',
  'SAFE_ARRIVAL_CONFIRMED',
  'TRACKING_STOPPED',
];
const sessionStatusEnum = TravelSafetySession.schema.path('status').enumValues;
travelStatuses.forEach((ts) => {
  assert(sessionStatusEnum.includes(ts), `Travel safety status includes "${ts}"`);
});
assert(TravelSafetySession.schema.path('safeArrivalConfirmation.confirmedByName') !== undefined, 'TravelSafetySession has safeArrivalConfirmation');
assert(TravelSafetySession.schema.path('locationHistory') !== undefined, 'TravelSafetySession has capped locationHistory');

console.log('\n=======================================================');
console.log(`Results: ${passed} / ${passed + failed} assertions passed`);
console.log('=======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
