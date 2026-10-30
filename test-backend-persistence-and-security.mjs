/**
 * Comprehensive Backend Security and Persistence Verification Suite
 */

const BASE_URL = 'http://localhost:5000/api';

console.log('=======================================================');
console.log('🧪 Testing Task 4 & 5: Security & Backend Persistence');
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
  // 1. Get tokens for testing via real MongoDB credentials
  const defaultPassword = 'HostelGuard#2026';
  async function fetchToken(email) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: defaultPassword }),
    });
    const d = await res.json();
    if (!res.ok || !d.token) throw new Error(`Login failed for ${email}: ${d.message}`);
    return d.token;
  }

  const studentToken = await fetchToken('student.priya@hostelguard.edu');
  const girlsWardenToken = await fetchToken('warden.girls@hostelguard.edu');
  const boysWardenToken = await fetchToken('warden.boys@hostelguard.edu');
  const gateToken = await fetchToken('security.gate@hostelguard.edu');
  const parentToken = await fetchToken('parent.sharma@hostelguard.edu');
  const messToken = await fetchToken('mess.incharge@hostelguard.edu');
  const maintenanceToken = await fetchToken('maintenance.incharge@hostelguard.edu');

  // --- SECTION 1: ENDPOINT AUTHENTICATION REQUIREMENT ---
  console.log('--- 1. Protected Endpoints Reject Unauthenticated Requests ---');
  const protectedEndpoints = [
    { method: 'GET', url: '/auth/me' },
    { method: 'POST', url: '/leaves' },
    { method: 'GET', url: '/leaves/my' },
    { method: 'GET', url: '/leaves' },
    { method: 'PATCH', url: '/leaves/123/review' },
    { method: 'GET', url: '/movements/active-passes' },
    { method: 'POST', url: '/movements/record' },
    { method: 'GET', url: '/movements' },
    { method: 'GET', url: '/parent/student' },
    { method: 'POST', url: '/parent/payments/simulate' },
    { method: 'POST', url: '/maintenance' },
    { method: 'GET', url: '/maintenance' },
    { method: 'PATCH', url: '/maintenance/123' },
    { method: 'GET', url: '/notifications' },
    { method: 'PATCH', url: '/notifications/123/read' },
  ];

  for (const ep of protectedEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.url}`, { method: ep.method });
    assert(res.status === 401, `Endpoint ${ep.method} ${ep.url} strictly requires JWT authentication`, `HTTP ${res.status}`);
  }

  // --- SECTION 2: RBAC SECURITY INVARIANTS ---
  console.log('\n--- 2. Independent Backend Authorization Checks ---');
  
  // Student cannot approve leave
  const studentApprove = await fetch(`${BASE_URL}/leaves/123/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ decision: 'approve' }),
  });
  assert(studentApprove.status === 403, 'Student cannot review or approve leave applications', `HTTP ${studentApprove.status}`);

  // Student cannot access warden queue
  const studentWardenQueue = await fetch(`${BASE_URL}/leaves`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(studentWardenQueue.status === 403, 'Student cannot access warden leave queue', `HTTP ${studentWardenQueue.status}`);

  // Parent cannot access warden queue
  const parentWardenQueue = await fetch(`${BASE_URL}/leaves`, {
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  assert(parentWardenQueue.status === 403, 'Parent cannot access warden leave queue', `HTTP ${parentWardenQueue.status}`);

  // Student cannot record gate movement
  const studentGateRecord = await fetch(`${BASE_URL}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ studentId: '123', eventType: 'check_out' }),
  });
  assert(studentGateRecord.status === 403, 'Student cannot record gate turnstile movement', `HTTP ${studentGateRecord.status}`);

  // Gate staff cannot access parent financial details
  const gateParentFee = await fetch(`${BASE_URL}/parent/payments/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({ amount: 1000, paymentMethod: 'UPI' }),
  });
  assert(gateParentFee.status === 403, 'Gate Security cannot execute parent payment operations', `HTTP ${gateParentFee.status}`);

  // --- SECTION 3: ABSENCE OF SECRETS IN API OUTPUTS ---
  console.log('\n--- 3. Secret & Password Hash Sanitization ---');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, '/auth/me returns profile for authenticated token', `HTTP ${meRes.status}`);
  assert(!('passwordHash' in (meData.user || {})), 'passwordHash is completely excluded from /auth/me');
  assert(!('password' in (meData.user || {})), 'password is completely excluded from /auth/me');
  assert(typeof meData.user?.role === 'string', 'User profile specifies valid role string');

  // --- SECTION 4: BACKEND PERSISTENCE VERIFICATION (IN-PROCESS STATE) ---
  console.log('\n--- 4. Backend Persistence Lifecycle Tests (Mess & Parent) ---');

  // 4a. Create unique isolated food complaint
  const testComplaintId = `CMP-AUDIT-${Date.now()}`;
  const complaintRes = await fetch(`${BASE_URL}/mess/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      id: testComplaintId,
      studentName: 'Audit Test Scholar',
      rollNumber: '21CS999',
      category: 'Food Quality',
      meal: 'Lunch',
      description: 'Audit test grievance: testing backend persistence independently of frontend.',
    }),
  });
  assert(complaintRes.status === 201, 'POST /mess/complaints creates persistent complaint record in backend', `HTTP ${complaintRes.status}`);

  // Retrieve complaints from backend to verify record was persisted
  const getComplaintsRes = await fetch(`${BASE_URL}/mess/complaints`, {
    headers: { Authorization: `Bearer ${messToken}` },
  });
  const complaintsData = await getComplaintsRes.json();
  const complaintsList = complaintsData.complaints || complaintsData;
  const foundComplaint = complaintsList.find((c) => c.description?.includes('Audit test grievance'));
  assert(!!foundComplaint, 'Record retrieved again from backend GET /mess/complaints (proves persistence in backend)');

  // Update status on backend
  const updateComplaintRes = await fetch(`${BASE_URL}/mess/complaints/${foundComplaint?.id || testComplaintId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${messToken}`,
    },
    body: JSON.stringify({
      status: 'Resolved',
      response: 'Resolved by audit test technician.',
    }),
  });
  assert(updateComplaintRes.status === 200, 'PATCH /mess/complaints/:id updates record status in backend', `HTTP ${updateComplaintRes.status}`);

  // Verify status updated in backend
  const verifyUpdatedRes = await fetch(`${BASE_URL}/mess/complaints`, {
    headers: { Authorization: `Bearer ${messToken}` },
  });
  const verifyData = await verifyUpdatedRes.json();
  const verifyList = verifyData.complaints || verifyData;
  const verifyItem = verifyList.find((c) => c.description?.includes('Audit test grievance'));
  assert(verifyItem?.status === 'Resolved', 'Updated status is persisted in backend state');

  // 4b. Mess Schedule Update & Persistence
  const uniqueNote = `Audit operational broadcast note ${Date.now()}`;
  const patchScheduleRes = await fetch(`${BASE_URL}/mess/schedule`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${messToken}`,
    },
    body: JSON.stringify({
      operationalNote: uniqueNote,
    }),
  });
  assert(patchScheduleRes.status === 200, 'PATCH /mess/schedule updates broadcast note in backend', `HTTP ${patchScheduleRes.status}`);

  const getScheduleRes = await fetch(`${BASE_URL}/mess/schedule`);
  const scheduleData = await getScheduleRes.json();
  const activeNote = scheduleData.schedule?.operationalNote || scheduleData.operationalNote;
  assert(activeNote === uniqueNote, 'Operational note persisted and retrieved via GET /mess/schedule');

  // 4c. Parent Simulated Payment & Ledger Update
  const initialFeesRes = await fetch(`${BASE_URL}/parent/fees`, {
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  const initialFees = await initialFeesRes.json();
  const initialOutstanding = initialFees.account.outstandingAmount;

  const paymentAmount = 2500;
  const payRes = await fetch(`${BASE_URL}/parent/payments/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${parentToken}`,
    },
    body: JSON.stringify({
      amount: paymentAmount,
      paymentMethod: 'UPI',
    }),
  });
  const payData = await payRes.json();
  assert(payRes.status === 200, 'POST /parent/payments/simulate processes transaction in backend', `HTTP ${payRes.status}`);

  const updatedFeesRes = await fetch(`${BASE_URL}/parent/fees`, {
    headers: { Authorization: `Bearer ${parentToken}` },
  });
  const updatedFees = await updatedFeesRes.json();
  assert(
    updatedFees.account.outstandingAmount === initialOutstanding - paymentAmount,
    `Backend fee ledger decremented outstanding balance from ₹${initialOutstanding} to ₹${updatedFees.account.outstandingAmount}`
  );
  assert(
    updatedFees.account.transactions.some((t) => t.receiptNumber === payData.receiptNumber),
    `Transaction receipt #${payData.receiptNumber} successfully appended to backend ledger`
  );

  console.log('\n=======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('=======================================================');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
