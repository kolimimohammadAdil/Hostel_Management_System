import mongoose from 'mongoose';
import {
  User,
  UserRole,
  AccountStatus,
  LeaveApplication,
  LeaveType,
  LeaveStatus,
  MovementLog,
  MovementType,
  Notification,
  NotificationType,
  MaintenanceRequest,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from './dist/models/index.js';

console.log('\n=======================================================');
console.log('🧪 Verifying HostelGuard AI Mongoose Models');
console.log('=======================================================\n');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAILED: ${message}`);
  }
}

// 1. User Model Verification
console.log('--- 1. User Model ---');
assert(User && User.modelName === 'User', 'User model is registered with name "User"');
const userPaths = User.schema.paths;
assert(userPaths.fullName?.instance === 'String' && userPaths.fullName.isRequired, 'User has required fullName');
assert(userPaths.email?.instance === 'String' && userPaths.email.isRequired, 'User has required email');
assert(userPaths.passwordHash?.options?.select === false, 'passwordHash has select: false for security');
assert(userPaths.role?.options?.enum?.values?.length >= 7, 'User role has institutional roles including hostel_admin');
assert(userPaths.rollNumber?.options?.sparse === true, 'rollNumber has sparse index');
assert(userPaths.status?.defaultValue === AccountStatus.ACTIVE, 'Default status is active');
assert(userPaths.avatarUrl?.instance === 'String', 'User schema includes optional avatarUrl');
assert(userPaths.address?.instance === 'String', 'User schema includes optional address');
assert(userPaths.department?.instance === 'String', 'User schema includes optional department');
assert(userPaths.academicYear?.instance === 'String', 'User schema includes optional academicYear');
assert(userPaths.employeeId?.instance === 'String', 'User schema includes optional employeeId');
assert(userPaths.assignedHostel?.instance === 'String', 'User schema includes optional assignedHostel');
assert(userPaths.dutyAssignment?.instance === 'String', 'User schema includes optional dutyAssignment');
assert(userPaths.relationship?.instance === 'String', 'User schema includes optional relationship');
assert(userPaths.linkedStudentRoll?.instance === 'String', 'User schema includes optional linkedStudentRoll');
assert(userPaths.linkedStudentName?.instance === 'String', 'User schema includes optional linkedStudentName');
assert(userPaths.messAssignment?.instance === 'String', 'User schema includes optional messAssignment');
assert(userPaths.assignedResponsibilities?.instance === 'String', 'User schema includes optional assignedResponsibilities');

// 2. LeaveApplication Model Verification
console.log('\n--- 2. LeaveApplication Model ---');
assert(LeaveApplication && LeaveApplication.modelName === 'LeaveApplication', 'LeaveApplication model is registered');
const leavePaths = LeaveApplication.schema.paths;
assert(leavePaths.student?.options?.ref === 'User', 'student references User');
assert(leavePaths.leaveType?.instance === 'String', 'leaveType field exists');
assert(leavePaths.reason?.instance === 'String' && leavePaths.reason.isRequired, 'reason is required');
assert(leavePaths.destination?.instance === 'String', 'destination is required');
assert(leavePaths.departureTime?.instance === 'Date', 'departureTime is a Date');
assert(leavePaths.expectedReturnTime?.instance === 'Date', 'expectedReturnTime is a Date');
assert(leavePaths.status?.defaultValue === LeaveStatus.PENDING, 'Default status is pending');
assert(leavePaths.reviewingWarden?.options?.ref === 'User', 'reviewingWarden references User');
assert(leavePaths['biometricTemplate.embedding']?.options?.select === false, 'biometricTemplate.embedding has select: false for security');
assert(leavePaths['biometricTemplate.status']?.instance === 'String', 'biometricTemplate.status field exists');
assert(leavePaths['biometricTemplate.modelVersion']?.instance === 'String', 'biometricTemplate.modelVersion field exists');
assert(leavePaths.isLate?.instance === 'Boolean', 'LeaveApplication has isLate boolean');

// 3. MovementLog Model Verification
console.log('\n--- 3. MovementLog Model ---');
assert(MovementLog && MovementLog.modelName === 'MovementLog', 'MovementLog model is registered');
const movePaths = MovementLog.schema.paths;
assert(movePaths.student?.options?.ref === 'User', 'student references User');
assert(movePaths.eventType?.options?.enum?.values?.includes('check_out'), 'eventType includes check_out');
assert(movePaths.eventType?.options?.enum?.values?.includes('check_in'), 'eventType includes check_in');
assert(movePaths.recordedBy?.options?.ref === 'User', 'recordedBy references User');
assert(movePaths.leaveApplication?.options?.ref === 'LeaveApplication', 'leaveApplication references LeaveApplication');

// 4. Notification Model Verification
console.log('\n--- 4. Notification Model ---');
assert(Notification && Notification.modelName === 'Notification', 'Notification model is registered');
const notifPaths = Notification.schema.paths;
assert(notifPaths.recipient?.options?.ref === 'User', 'recipient references User');
assert(notifPaths.title?.instance === 'String', 'title field exists');
assert(notifPaths.message?.instance === 'String', 'message field exists');
assert(notifPaths.isRead?.defaultValue === false, 'Default isRead is false');

// 5. MaintenanceRequest Model Verification
console.log('\n--- 5. MaintenanceRequest Model ---');
assert(MaintenanceRequest && MaintenanceRequest.modelName === 'MaintenanceRequest', 'MaintenanceRequest model is registered');
const maintPaths = MaintenanceRequest.schema.paths;
assert(maintPaths.submittedBy?.options?.ref === 'User', 'submittedBy references User');
assert(maintPaths.hostelName?.instance === 'String', 'hostelName is required string');
assert(maintPaths.roomNumber?.instance === 'String', 'roomNumber is required string');
assert(maintPaths.category?.instance === 'String', 'category field exists');
assert(maintPaths.priority?.defaultValue === MaintenancePriority.MEDIUM, 'Default priority is medium');
assert(maintPaths.status?.defaultValue === MaintenanceStatus.SUBMITTED, 'Default status is submitted');
assert(maintPaths.assignedStaff?.options?.ref === 'User', 'assignedStaff references User');

console.log('\n=======================================================');
console.log(`Results: ${passed} / ${total} assertions passed`);
console.log('=======================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}

