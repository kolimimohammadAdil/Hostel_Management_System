/**
 * Comprehensive Live MongoDB Atlas Persistence Test Suite for HOSTELGUARD AI
 */

const BASE_URL = 'http://localhost:5000/api';

console.log('=======================================================');
console.log('🧪 Live MongoDB Atlas End-to-End Persistence Audit');
console.log('=======================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName} ${detail ? `(${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function run() {
  // --- 1. HEALTH CHECK ---
  console.log('--- 1. Live Health Check & MongoDB State ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  assert(healthRes.status === 200, 'GET /api/health returns HTTP 200 OK');
  assert(health.database.connected === true, 'Database reports connected: true in MongoDB Atlas');
  assert(health.database.status === 'connected', 'Database status reports connected');

  // --- 2. AUTHENTICATION VIA MONGO-SEEDED USERS ---
  console.log('\n--- 2. Credential Login Against MongoDB Seeded Accounts ---');
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student.priya@hostelguard.edu',
      password: 'HostelGuard#2026',
    }),
  });
  const studentLoginData = await studentLoginRes.json();
  assert(studentLoginRes.status === 200, 'Priya Sharma login with hashed password verified in MongoDB', `HTTP ${studentLoginRes.status}`);
  assert(!!studentLoginData.token, 'Live JWT token issued for Priya Sharma');
  const priyaToken = studentLoginData.token;
  const priyaId = studentLoginData.user.id;

  const wardenGirlsLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'warden.girls@hostelguard.edu',
      password: 'HostelGuard#2026',
    }),
  });
  const wardenGirlsData = await wardenGirlsLoginRes.json();
  assert(wardenGirlsLoginRes.status === 200, 'Dr. Sarah Mathews (Girls Warden) login verified in MongoDB');
  const girlsWardenToken = wardenGirlsData.token;

  const gateSecurityLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'security.gate@hostelguard.edu',
      password: 'HostelGuard#2026',
    }),
  });
  const gateSecurityData = await gateSecurityLoginRes.json();
  assert(gateSecurityLoginRes.status === 200, 'Officer Rajesh Kumar (Gate Security) login verified in MongoDB');
  const gateToken = gateSecurityData.token;

  const maintenanceLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'maintenance.incharge@hostelguard.edu',
      password: 'HostelGuard#2026',
    }),
  });
  const maintenanceData = await maintenanceLoginRes.json();
  assert(maintenanceLoginRes.status === 200, 'Er. Kailash Verma (Maintenance) login verified in MongoDB');
  const maintenanceToken = maintenanceData.token;

  // --- 3. LEAVE APPLICATION PERSISTENCE ---
  console.log('\n--- 3. Leave Application Workflow in MongoDB Atlas ---');
  const depTime = new Date(Date.now() + 86400000).toISOString();
  const retTime = new Date(Date.now() + 86400000 * 3).toISOString();

  const applyRes = await fetch(`${BASE_URL}/leaves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${priyaToken}`,
    },
    body: JSON.stringify({
      leaveType: 'HOME_VISIT',
      departureTime: depTime,
      expectedReturnTime: retTime,
      destination: 'Pune, Maharashtra',
      reason: 'Live MongoDB persistence audit test submission',
    }),
  });
  const applyData = await applyRes.json();
  assert(applyRes.status === 201, 'POST /leaves creates LeaveApplication document in MongoDB Atlas', `HTTP ${applyRes.status}`);
  assert(!!applyData.leave?._id, `Document assigned real MongoDB ObjectId: ${applyData.leave?._id}`);
  const createdLeaveId = applyData.leave._id;

  // Verify retrieval from MongoDB via GET /leaves/my
  const myLeavesRes = await fetch(`${BASE_URL}/leaves/my`, {
    headers: { Authorization: `Bearer ${priyaToken}` },
  });
  const myLeavesData = await myLeavesRes.json();
  const foundLeave = myLeavesData.leaves.find((l) => l._id === createdLeaveId);
  assert(!!foundLeave, 'Created leave retrieved from MongoDB Atlas via GET /leaves/my');
  assert(foundLeave?.status === 'pending', 'Leave status is initially "pending" in MongoDB');

  // Warden retrieves leave from queue via GET /leaves
  const wardenQueueRes = await fetch(`${BASE_URL}/leaves`, {
    headers: { Authorization: `Bearer ${girlsWardenToken}` },
  });
  const wardenQueueData = await wardenQueueRes.json();
  const inQueue = wardenQueueData.leaves.find((l) => l._id === createdLeaveId);
  assert(!!inQueue, 'Leave appears in Girls Warden queue via GET /leaves');

  // Warden approves leave via PATCH /leaves/:id/review
  const reviewRes = await fetch(`${BASE_URL}/leaves/${createdLeaveId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${girlsWardenToken}`,
    },
    body: JSON.stringify({
      decision: 'approve',
      reviewRemarks: 'Approved live in MongoDB Atlas following parental consent verification',
    }),
  });
  const reviewData = await reviewRes.json();
  assert(reviewRes.status === 200, 'PATCH /leaves/:id/review updates leave status to "approved" in MongoDB', `HTTP ${reviewRes.status}`);
  assert(reviewData.leave.status === 'approved', 'Leave status confirmed as "approved" in MongoDB response');

  // --- 4. GATE SECURITY ACTIVE PASSES & MOVEMENT LOGS IN MONGODB ---
  console.log('\n--- 4. Gate Turnstile Movement Workflow in MongoDB Atlas ---');
  const activePassesRes = await fetch(`${BASE_URL}/movements/active-passes?query=Priya`, {
    headers: { Authorization: `Bearer ${gateToken}` },
  });
  const activePassesData = await activePassesRes.json();
  const passForPriya = activePassesData.passes.find((p) => p._id === createdLeaveId);
  assert(!!passForPriya, 'Approved leave pass retrieved by Gate Security via GET /movements/active-passes');

  // Record Check-Out
  const checkOutRes = await fetch(`${BASE_URL}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({
      studentId: priyaId,
      eventType: 'check_out',
      leaveId: createdLeaveId,
      notes: 'Turnstile outbound passage authorized under approved leave',
    }),
  });
  const checkOutData = await checkOutRes.json();
  assert(checkOutRes.status === 201, 'POST /movements/record persists check_out MovementLog in MongoDB', `HTTP ${checkOutRes.status}`);
  assert(checkOutData.leave?.status === 'checked_out', 'LeaveApplication status transitioned to "checked_out" in MongoDB Atlas');

  // Record Check-In
  const checkInRes = await fetch(`${BASE_URL}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({
      studentId: priyaId,
      eventType: 'check_in',
      leaveId: createdLeaveId,
      notes: 'Turnstile inbound return passage recorded',
    }),
  });
  const checkInData = await checkInRes.json();
  assert(checkInRes.status === 201, 'POST /movements/record persists check_in MovementLog in MongoDB', `HTTP ${checkInRes.status}`);
  assert(checkInData.leave?.status === 'returned', 'LeaveApplication status transitioned to "returned" in MongoDB Atlas');

  // --- 5. MAINTENANCE TICKETS IN MONGODB ---
  console.log('\n--- 5. Maintenance Tickets Workflow in MongoDB Atlas ---');
  const createMaintRes = await fetch(`${BASE_URL}/maintenance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${girlsWardenToken}`,
    },
    body: JSON.stringify({
      hostelName: 'Chakrika Girls Hostel',
      roomNumber: 'B-204',
      category: 'plumbing',
      description: 'Audit test: water faucet valve replacement needed',
      priority: 'medium',
    }),
  });
  const createMaintData = await createMaintRes.json();
  assert(createMaintRes.status === 201, 'POST /maintenance persists MaintenanceRequest in MongoDB Atlas', `HTTP ${createMaintRes.status}`);
  const maintTicketId = createMaintData.ticket._id;

  // Retrieve maintenance ticket
  const getMaintRes = await fetch(`${BASE_URL}/maintenance`, {
    headers: { Authorization: `Bearer ${maintenanceToken}` },
  });
  const getMaintData = await getMaintRes.json();
  const foundTicket = getMaintData.tickets.find((t) => t._id === maintTicketId);
  assert(!!foundTicket, 'Created ticket retrieved from MongoDB Atlas via GET /maintenance');

  // Update ticket status
  const updateMaintRes = await fetch(`${BASE_URL}/maintenance/${maintTicketId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${maintenanceToken}`,
    },
    body: JSON.stringify({
      status: 'in_progress',
      estimatedResolutionDate: '2026-10-31',
      resolutionNotes: 'Technician dispatched with replacement washer and faucet head',
    }),
  });
  const updateMaintData = await updateMaintRes.json();
  assert(updateMaintRes.status === 200, 'PATCH /maintenance/:id updates ticket status in MongoDB Atlas', `HTTP ${updateMaintRes.status}`);
  assert(updateMaintData.ticket.status === 'in_progress', 'Ticket status confirmed as "in_progress" in MongoDB Atlas');

  // --- 6. NOTIFICATIONS IN MONGODB ---
  console.log('\n--- 6. Notifications Workflow in MongoDB Atlas ---');
  const notifsRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${priyaToken}` },
  });
  const notifsData = await notifsRes.json();
  assert(notifsRes.status === 200, 'GET /notifications retrieves user notifications from MongoDB Atlas', `HTTP ${notifsRes.status}`);
  assert(Array.isArray(notifsData.notifications), 'Notifications returned as an array from MongoDB');

  if (notifsData.notifications.length > 0) {
    const targetNotifId = notifsData.notifications[0]._id;
    const markReadRes = await fetch(`${BASE_URL}/notifications/${targetNotifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${priyaToken}` },
    });
    const markReadData = await markReadRes.json();
    assert(markReadRes.status === 200, 'PATCH /notifications/:id/read updates notification in MongoDB Atlas', `HTTP ${markReadRes.status}`);
    assert(markReadData.notification.isRead === true, 'isRead is confirmed true in MongoDB Atlas');
  }

  console.log('\n=======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('=======================================================');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

