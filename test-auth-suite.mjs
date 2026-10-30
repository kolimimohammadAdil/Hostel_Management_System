/**
 * Comprehensive Authentication & Security Suite for HostelGuard AI
 */

const BASE_URL = 'http://localhost:5000/api';

console.log('=======================================================');
console.log('🧪 Running Task 2: Authentication & Authorization Tests');
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

async function runTests() {
  // 1. Privileged Role Registration Prevention
  console.log('--- 1. Privileged Self-Registration Prevention ---');
  const privilegedRoles = ['girls_warden', 'boys_warden', 'gate_security', 'mess_incharge', 'maintenance_incharge'];
  for (const role of privilegedRoles) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Attacker Admin',
        email: `attacker_${role}@test.com`,
        password: 'Password123#',
        role: role,
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 && data.message.includes('Privileged roles'),
      `Public registration strictly blocks privileged role: ${role}`,
      `HTTP ${res.status}`
    );
  }

  // 2. Input Validation on Registration
  console.log('\n--- 2. Registration Input Validation ---');
  const shortPassRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Valid Name',
      email: 'valid@test.com',
      password: '123',
    }),
  });
  assert(shortPassRes.status === 400, 'Rejects password shorter than 8 characters', `HTTP ${shortPassRes.status}`);

  const badEmailRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Valid Name',
      email: 'invalid-email-format',
      password: 'ValidPassword123#',
    }),
  });
  assert(badEmailRes.status === 400, 'Rejects invalid email format', `HTTP ${badEmailRes.status}`);

  const emptyNameRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: ' ',
      email: 'valid@test.com',
      password: 'ValidPassword123#',
    }),
  });
  assert(emptyNameRes.status === 400, 'Rejects empty full name', `HTTP ${emptyNameRes.status}`);

  // 3. Login Validation
  console.log('\n--- 3. Login Input & Credential Validation ---');
  const missingCredsRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert(missingCredsRes.status === 400, 'Rejects login request with missing credentials', `HTTP ${missingCredsRes.status}`);

  // 4. Token & Current-User (/auth/me) Validation
  console.log('\n--- 4. Token Invariants & /auth/me Security ---');
  const missingTokenRes = await fetch(`${BASE_URL}/auth/me`);
  assert(missingTokenRes.status === 401, 'Rejects /auth/me request without Authorization header', `HTTP ${missingTokenRes.status}`);

  const invalidTokenRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: 'Bearer this.is.an.invalid.token' },
  });
  assert(invalidTokenRes.status === 401, 'Rejects /auth/me request with malformed/forged token', `HTTP ${invalidTokenRes.status}`);

  // 5. Demo Login Bypass Rejection & Real User Authentication
  console.log('\n--- 5. Demo Login Bypass Rejection & Real User Authentication ---');
  const demoBypassRes = await fetch(`${BASE_URL}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student' }),
  });
  assert(demoBypassRes.status === 410, 'Demo login bypass is disabled with HTTP 410 Gone', `HTTP ${demoBypassRes.status}`);

  // Authenticate student via real MongoDB credentials
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student.priya@hostelguard.edu', password: 'HostelGuard#2026' }),
  });
  const studentLoginData = await studentLoginRes.json();
  assert(studentLoginRes.status === 200 && studentLoginData.token, 'Real credential login successfully issues signed JWT for student', `HTTP ${studentLoginRes.status}`);
  assert(!studentLoginData.user.passwordHash, 'User profile strictly omits passwordHash field');
  assert(!studentLoginData.user.password, 'User profile strictly omits password field');

  const studentToken = studentLoginData.token;

  // 6. Role-Based Access Control (RBAC)
  console.log('\n--- 6. Role-Based Access Control (RBAC) Enforcement ---');
  // Student attempting warden leave review
  const wardenEndpointRes = await fetch(`${BASE_URL}/leaves/some-leave-id/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ decision: 'approve' }),
  });
  assert(
    wardenEndpointRes.status === 403,
    'Student token is rejected with HTTP 403 Forbidden on Warden leave review endpoint',
    `HTTP ${wardenEndpointRes.status}`
  );

  // Student attempting gate security record movement
  const gateEndpointRes = await fetch(`${BASE_URL}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      studentId: 'test_std',
      eventType: 'check_out',
    }),
  });
  assert(
    gateEndpointRes.status === 403,
    'Student token is rejected with HTTP 403 Forbidden on Gate Security record endpoint',
    `HTTP ${gateEndpointRes.status}`
  );

  // Student attempting parent simulate payment
  const parentEndpointRes = await fetch(`${BASE_URL}/parent/payments/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ amount: 5000, paymentMethod: 'UPI' }),
  });
  assert(
    parentEndpointRes.status === 403,
    'Student token is rejected with HTTP 403 Forbidden on Parent payment endpoint',
    `HTTP ${parentEndpointRes.status}`
  );

  // Warden token accessing warden endpoint
  const wardenLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'warden.girls@hostelguard.edu', password: 'HostelGuard#2026' }),
  });
  const wardenLoginData = await wardenLoginRes.json();
  const wardenToken = wardenLoginData.token;

  // Warden calling GET /leaves (warden queue)
  const wardenLeavesRes = await fetch(`${BASE_URL}/leaves`, {
    headers: { Authorization: `Bearer ${wardenToken}` },
  });
  assert(
    wardenLeavesRes.status === 200,
    'Girls Warden token successfully passes RBAC on GET /leaves endpoint',
    `HTTP ${wardenLeavesRes.status}`
  );

  // Student attempting GET /leaves (warden queue)
  const studentUnauthorizedLeavesRes = await fetch(`${BASE_URL}/leaves`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(
    studentUnauthorizedLeavesRes.status === 403,
    'Student token is rejected with HTTP 403 Forbidden on GET /leaves (Warden Queue)',
    `HTTP ${studentUnauthorizedLeavesRes.status}`
  );

  // Gate Security token on Gate endpoint
  const gateLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'security.gate@hostelguard.edu', password: 'HostelGuard#2026' }),
  });
  const gateLoginData = await gateLoginRes.json();
  const gateToken = gateLoginData.token;

  const gatePassesRes = await fetch(`${BASE_URL}/movements/active-passes`, {
    headers: { Authorization: `Bearer ${gateToken}` },
  });
  assert(
    gatePassesRes.status === 200,
    'Gate Security token successfully passes RBAC on GET /movements/active-passes',
    `HTTP ${gatePassesRes.status}`
  );

  console.log('\n=======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('=======================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
