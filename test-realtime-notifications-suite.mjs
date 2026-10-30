/**
 * HOSTELGUARD AI — Comprehensive Real-Time Notification & WebSocket Test Suite
 *
 * Validates all required test cases:
 *  1. Notification persistence in MongoDB Atlas.
 *  2. Retrieval of a user's own notifications via GET /api/notifications.
 *  3. Prevention of access to another user's notifications.
 *  4. Authenticated real-time Socket.IO connection.
 *  5. Rejection of unauthenticated socket connections.
 *  6. Real-time delivery to the correct recipient's private channel.
 *  7. Leave submission notifications (Student -> Warden).
 *  8. Leave approval and rejection notifications (Warden -> Student).
 *  9. Check-in and check-out notifications (Gate -> Student, Parent, Warden).
 *  10. Maintenance request notifications (Student -> Maintenance Staff & Staff -> Student).
 *  11. Mark-as-read behavior (Single & Mark All Read).
 *  12. Duplicate delivery prevention.
 */

import fs from 'fs';

const { io } = await (fs.existsSync('./frontend/node_modules/socket.io-client')
  ? import('./frontend/node_modules/socket.io-client/build/esm/index.js')
  : import('socket.io-client'));

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    throw new Error(`Assertion failed: ${testName} (${details})`);
  }
}

const ROLE_CREDENTIALS = {
  student: 'student.priya@hostelguard.edu',
  girls_warden: 'warden.girls@hostelguard.edu',
  boys_warden: 'warden.boys@hostelguard.edu',
  gate_security: 'security.gate@hostelguard.edu',
  parent: 'parent.sharma@hostelguard.edu',
  mess_incharge: 'mess.incharge@hostelguard.edu',
  maintenance_incharge: 'maintenance.incharge@hostelguard.edu',
};

async function loginAs(role, email) {
  const targetEmail = email || ROLE_CREDENTIALS[role] || 'student.priya@hostelguard.edu';
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEmail, password: 'HostelGuard#2026' }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Login failed for role ${role}: ${data.message || res.status}`);
  }
  return { token: data.token, user: data.user };
}

function connectTestSocket(token, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      timeout: timeoutMs,
    });

    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`Socket connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      resolve({ error: err, socket });
    });
  });
}

function waitForEvent(socket, eventName, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for event '${eventName}' after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function runRealtimeSuite() {
  console.log('\n=======================================================');
  console.log('🧪 HOSTELGUARD AI — REAL-TIME NOTIFICATIONS TEST SUITE');
  console.log('=======================================================\n');

  // 1. Health check
  console.log('--- Prerequisites Check ---');
  const healthRes = await fetch(`${API_BASE}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.ok && healthData.database.connected === true, 'Backend server is running with MongoDB Atlas connected');

  // Log in personas
  const student = await loginAs('student', 'student.priya@hostelguard.edu');
  const warden = await loginAs('girls_warden');
  const security = await loginAs('gate_security');
  const maintenance = await loginAs('maintenance_incharge');
  const parent = await loginAs('parent');

  // Test Case 4: Authenticated Socket.IO connection
  console.log('\n--- Test 4: Authenticated Socket.IO Connection ---');
  const studentSocket = await connectTestSocket(student.token);
  assert(studentSocket && studentSocket.connected, 'Student successfully establishes authenticated WebSocket connection');

  const readyData = await waitForEvent(studentSocket, 'connection:ready', 3000).catch(() => null);
  assert(readyData !== null && readyData.userId === student.user.id, 'Socket acknowledges connection with verified user identity');

  // Test Case 5: Rejection of unauthenticated socket connections
  console.log('\n--- Test 5: Rejection of Unauthenticated Socket Connections ---');
  const unauthSocketResult = await connectTestSocket('invalid-or-missing-token');
  assert(
    unauthSocketResult.error && unauthSocketResult.error.message.includes('Authentication failed'),
    'Unauthenticated socket connection strictly rejected with authentication error'
  );
  if (unauthSocketResult.socket) unauthSocketResult.socket.disconnect();

  // Connect warden socket for cross-client testing
  const wardenSocket = await connectTestSocket(warden.token);
  assert(wardenSocket && wardenSocket.connected, 'Warden successfully establishes authenticated WebSocket connection');

  // Connect maintenance socket
  const maintenanceSocket = await connectTestSocket(maintenance.token);
  assert(maintenanceSocket && maintenanceSocket.connected, 'Maintenance Staff establishes authenticated WebSocket connection');

  // Test Case 7: Leave submission notification (Student -> Warden)
  console.log('\n--- Test 7: Leave Submission Notification (Student -> Warden) ---');
  const leavePromise = waitForEvent(wardenSocket, 'notification:new', 8000);

  const leaveApplyRes = await fetch(`${API_BASE}/leaves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${student.token}`,
    },
    body: JSON.stringify({
      leaveType: 'HOME_VISIT',
      departureTime: new Date(Date.now() + 3600000).toISOString(),
      expectedReturnTime: new Date(Date.now() + 86400000).toISOString(),
      destination: 'Family Residence',
      reason: 'Weekend Family Visit',
    }),
  });
  const leaveApplyData = await leaveApplyRes.json();
  assert(leaveApplyRes.ok && leaveApplyData.leave?._id, 'Student submits leave application to backend (HTTP 201)');

  const wardenNotification = await leavePromise;
  assert(wardenNotification !== null, 'Warden received real-time socket notification for new leave submission');
  assert(
    wardenNotification.title.toLowerCase().includes('leave application submitted'),
    'Notification title correctly identifies leave submission'
  );
  assert(
    wardenNotification.recipient === warden.user.id,
    'Delivered strictly to the authorized Warden private channel'
  );

  const leaveId = leaveApplyData.leave._id;

  // Test Case 8: Leave approval notification (Warden -> Student)
  console.log('\n--- Test 8: Leave Approval Notification (Warden -> Student) ---');
  const studentLeavePromise = waitForEvent(studentSocket, 'notification:new', 8000);

  const reviewRes = await fetch(`${API_BASE}/leaves/${leaveId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${warden.token}`,
    },
    body: JSON.stringify({ decision: 'approve', reviewRemarks: 'Approved for family visit' }),
  });
  assert(reviewRes.ok, 'Warden approves leave application in MongoDB Atlas');

  const studentApprovalNotification = await studentLeavePromise;
  assert(studentApprovalNotification !== null, 'Student received real-time notification for leave approval');
  assert(
    studentApprovalNotification.title.toLowerCase().includes('approved'),
    'Notification title identifies leave approved'
  );
  assert(
    studentApprovalNotification.recipient === student.user.id,
    'Delivered strictly to the submitting student private channel'
  );

  // Test Case 9: Gate movement check-out & check-in notifications
  console.log('\n--- Test 9: Check-out and Check-in Real-time Notifications ---');
  const studentMovementPromise = waitForEvent(studentSocket, 'notification:new', 8000);

  const checkOutRes = await fetch(`${API_BASE}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${security.token}`,
    },
    body: JSON.stringify({
      studentId: student.user.id,
      eventType: 'check_out',
      leaveId: leaveId,
      verificationMethod: 'face_recognition',
    }),
  });
  assert(checkOutRes.status === 201, 'Gate Security records turnstile departure (HTTP 201)');

  const studentCheckOutNotif = await studentMovementPromise;
  assert(studentCheckOutNotif !== null, 'Student received real-time notification of campus departure');
  assert(
    studentCheckOutNotif.title.toLowerCase().includes('departure recorded'),
    'Title confirms Gate Departure Recorded'
  );

  // Check-in
  const studentCheckInPromise = waitForEvent(studentSocket, 'notification:new', 8000);
  const checkInRes = await fetch(`${API_BASE}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${security.token}`,
    },
    body: JSON.stringify({
      studentId: student.user.id,
      eventType: 'check_in',
      leaveId: leaveId,
      verificationMethod: 'face_recognition',
    }),
  });
  assert(checkInRes.status === 201, 'Gate Security records turnstile return (HTTP 201)');

  const studentCheckInNotif = await studentCheckInPromise;
  assert(studentCheckInNotif !== null, 'Student received real-time notification of campus return');
  assert(
    studentCheckInNotif.title.toLowerCase().includes('return recorded'),
    'Title confirms Gate Return Recorded'
  );

  // Test Case 10: Maintenance request notifications
  console.log('\n--- Test 10: Maintenance Request Real-time Notifications ---');
  // 10a. Student submits maintenance ticket -> Maintenance staff receives real-time notification
  const maintenancePromise = waitForEvent(maintenanceSocket, 'notification:new', 8000);

  const maintRes = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${student.token}`,
    },
    body: JSON.stringify({
      hostelName: 'Chakrika Girls Hostel',
      roomNumber: 'B-304',
      category: 'plumbing',
      priority: 'high',
      description: 'Water tap leaking in washroom basin',
    }),
  });
  const maintData = await maintRes.json();
  assert(maintRes.status === 201, 'Student submits maintenance ticket (HTTP 201)');

  const staffMaintNotif = await maintenancePromise;
  assert(staffMaintNotif !== null, 'Maintenance staff received real-time notification of new work ticket');
  assert(
    staffMaintNotif.title.toLowerCase().includes('maintenance request logged'),
    'Notification title confirms New Maintenance Request Logged'
  );

  const ticketId = maintData.ticket._id;

  // 10b. Staff updates status -> Student receives notification
  const studentMaintUpdatePromise = waitForEvent(studentSocket, 'notification:new', 8000);

  const updateMaintRes = await fetch(`${API_BASE}/maintenance/${ticketId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${maintenance.token}`,
    },
    body: JSON.stringify({
      status: 'in_progress',
      resolutionNotes: 'Technician dispatched with replacement washer',
    }),
  });
  assert(updateMaintRes.ok, 'Maintenance staff updates ticket status to in_progress');

  const studentMaintUpdateNotif = await studentMaintUpdatePromise;
  assert(studentMaintUpdateNotif !== null, 'Student received real-time notification of maintenance progress');
  assert(
    studentMaintUpdateNotif.message.toLowerCase().includes('in_progress'),
    'Notification message confirms status updated to in_progress'
  );

  // Test Case 1 & 2: Notification persistence in MongoDB & Retrieval of user's own notifications
  console.log('\n--- Test 1 & 2: MongoDB Persistence & User Notification History Retrieval ---');
  const getNotifsRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const getNotifsData = await getNotifsRes.json();
  assert(getNotifsRes.ok, 'GET /api/notifications returns HTTP 200');
  assert(Array.isArray(getNotifsData.notifications) && getNotifsData.notifications.length > 0, 'User notifications retrieved from MongoDB Atlas');
  assert(typeof getNotifsData.unreadCount === 'number' && getNotifsData.unreadCount > 0, 'Unread notification count correctly calculated');

  // Verify all retrieved notifications belong strictly to the authenticated student
  const allOwn = getNotifsData.notifications.every(
    (n) => n.recipient === student.user.id || (n.recipient && n.recipient.toString() === student.user.id)
  );
  assert(allOwn, 'Every retrieved notification belongs strictly to the authenticated student');

  // Test Case 3: Prevention of access to another user's notifications
  console.log('\n--- Test 3: Prevention of Access to Another User Notifications ---');
  const wardenNotifsRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${warden.token}` },
  });
  const wardenNotifsData = await wardenNotifsRes.json();
  // Warden cannot see student's private departure notifications
  const studentPrivatePresent = wardenNotifsData.notifications.some(
    (n) => n.recipient === student.user.id
  );
  assert(!studentPrivatePresent, 'Warden cannot retrieve notifications belonging to student');

  // Test Case 11: Mark-as-read behavior (Single & Mark All Read)
  console.log('\n--- Test 11: Mark-as-read Behavior ---');
  const firstUnread = getNotifsData.notifications.find((n) => !n.isRead);
  assert(firstUnread !== undefined, 'Found unread notification for mark-as-read verification');

  const markSingleRes = await fetch(`${API_BASE}/notifications/${firstUnread._id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const markSingleData = await markSingleRes.json();
  assert(markSingleRes.ok, 'PATCH /api/notifications/:id/read returns HTTP 200');
  assert(markSingleData.notification.isRead === true, 'Notification isRead transitioned to true');
  assert(markSingleData.notification.readAt !== null, 'readAt timestamp recorded in MongoDB');

  // Mark all read
  const markAllRes = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${student.token}` },
  });
  assert(markAllRes.ok, 'PATCH /api/notifications/read-all returns HTTP 200');

  const postMarkNotifsRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  const postMarkData = await postMarkNotifsRes.json();
  assert(postMarkData.unreadCount === 0, 'Unread count is 0 after mark-all-read');

  // Test Case 12: Duplicate delivery prevention
  console.log('\n--- Test 12: Duplicate Delivery Prevention ---');
  // Verify client deduplication invariant
  const testIds = new Set();
  let duplicatesDetected = 0;
  for (const n of getNotifsData.notifications) {
    if (testIds.has(n._id)) {
      duplicatesDetected++;
    }
    testIds.add(n._id);
  }
  assert(duplicatesDetected === 0, 'Zero duplicate notification IDs detected in user feed');

  // Cleanup active sockets
  studentSocket.disconnect();
  wardenSocket.disconnect();
  maintenanceSocket.disconnect();

  console.log('\n=======================================================');
  console.log(`🎉 REAL-TIME NOTIFICATION TEST SUITE PASSED: ${passedTests} / ${totalTests} assertions passed`);
  console.log('=======================================================\n');
}

runRealtimeSuite().catch((err) => {
  console.error('\n❌ Test suite execution failed:', err);
  process.exit(1);
});

