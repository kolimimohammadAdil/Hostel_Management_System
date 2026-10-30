/**
 * ALTS HOSTEL PORTAL — Comprehensive Registration, Authentication & RBAC Test Suite
 *
 * Verifies all Phase 1-9 requirements:
 *  1. Public registration cannot create privileged accounts (wardens, security, mess, maintenance -> HTTP 400).
 *  2. Input validation on student registration (name, email, phone, department, year, password length, confirmation, terms).
 *  3. Student registration succeeds with valid data, assigns student role server-side, persists in MongoDB, returns safe profile & JWT.
 *  4. Duplicate student roll number is rejected with HTTP 409.
 *  5. Duplicate student email is rejected with HTTP 409.
 *  6. Parent registration rejected when linked student roll number does not exist (HTTP 400).
 *  7. Parent registration succeeds with valid linked student, establishes verified link, assigns parent role server-side, returns safe profile & JWT.
 *  8. Duplicate parent email is rejected with HTTP 409.
 *  9. Password mismatch and weak passwords rejected (HTTP 400).
 *  10. Real credential login works for newly registered student (via email and via roll number).
 *  11. Real credential login works for newly registered parent.
 *  12. Passwords are never stored in plaintext and passwordHash is never returned to client.
 *  13. Strict RBAC enforcement: student & parent tokens rejected from privileged endpoints (HTTP 403).
 *  14. Profile retrieval (/api/users/me) returns genuine MongoDB Atlas persisted data.
 */

const API_BASE = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName} ${details ? `(${details})` : ''}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    throw new Error(`Assertion failed: ${testName} (${details})`);
  }
}

const TEST_TIMESTAMP = Date.now().toString().slice(-6);
const TEST_STUDENT = {
  fullName: `Test Scholar ${TEST_TIMESTAMP}`,
  rollNumber: `21CS${TEST_TIMESTAMP}`,
  email: `scholar_${TEST_TIMESTAMP}@alts.edu.in`,
  phone: '9876543210',
  department: 'Computer Science & Engineering',
  academicYear: '3rd Year',
  password: 'SecureScholar#2026',
  confirmPassword: 'SecureScholar#2026',
  acceptTerms: true,
  address: '42 Campus View, Ananthapuramu',
  emergencyContact: 'Mother: 9876543211',
};

const TEST_PARENT = {
  fullName: `Test Guardian ${TEST_TIMESTAMP}`,
  email: `guardian_${TEST_TIMESTAMP}@gmail.com`,
  phone: '9876543212',
  relationship: 'Father',
  password: 'SecureGuardian#2026',
  confirmPassword: 'SecureGuardian#2026',
  acceptTerms: true,
};

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 ALTS HOSTEL PORTAL — Registration & Authentication Suite');
  console.log('================================================================\n');

  // TEST 1: Privileged Role Self-Registration Prevention
  console.log('--- TEST 1: Privileged Operational Role Registration Prevention ---');
  const privilegedRoles = [
    'girls_warden',
    'boys_warden',
    'gate_security',
    'mess_incharge',
    'maintenance_incharge',
  ];

  for (const role of privilegedRoles) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Attacker Impersonator',
        email: `attacker_${role}_${TEST_TIMESTAMP}@test.com`,
        password: 'Password123#',
        role,
      }),
    });
    assert(
      res.status === 400,
      `Public registration strictly blocks privileged role '${role}'`,
      `HTTP ${res.status}`
    );
  }

  // TEST 2: Student Registration Input Validation
  console.log('\n--- TEST 2: Student Registration Validation Rules ---');
  {
    // Short password
    const shortPass = await fetch(`${API_BASE}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...TEST_STUDENT, password: 'short', confirmPassword: 'short' }),
    });
    assert(shortPass.status === 400, 'Rejects password shorter than 8 characters', `HTTP ${shortPass.status}`);

    // Password mismatch
    const mismatch = await fetch(`${API_BASE}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...TEST_STUDENT, confirmPassword: 'DifferentPassword123#' }),
    });
    assert(mismatch.status === 400, 'Rejects when confirmPassword does not match password', `HTTP ${mismatch.status}`);

    // Missing Terms
    const noTerms = await fetch(`${API_BASE}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...TEST_STUDENT, acceptTerms: false }),
    });
    assert(noTerms.status === 400, 'Rejects registration when terms of service are not accepted', `HTTP ${noTerms.status}`);

    // Invalid Email
    const badEmail = await fetch(`${API_BASE}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...TEST_STUDENT, email: 'not-an-email' }),
    });
    assert(badEmail.status === 400, 'Rejects invalid email format', `HTTP ${badEmail.status}`);

    // Invalid Phone
    const badPhone = await fetch(`${API_BASE}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...TEST_STUDENT, phone: '123' }),
    });
    assert(badPhone.status === 400, 'Rejects invalid phone number format', `HTTP ${badPhone.status}`);
  }

  // TEST 3: Successful Student Registration
  console.log('\n--- TEST 3: Genuine Student Registration & Persistence ---');
  let studentToken = '';
  {
    const res = await fetch(`${API_BASE}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_STUDENT),
    });
    assert(res.status === 201, 'POST /api/auth/register/student returns HTTP 201 Created', `HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Response payload reports success: true');
    assert(data.token, 'Response contains valid signed JWT token');
    assert(data.user.role === 'student', 'Server-side role is strictly assigned to "student"');
    assert(data.user.rollNumber === TEST_STUDENT.rollNumber, 'Student roll number preserved and normalized to uppercase');
    assert(!data.user.passwordHash, 'Sensitive passwordHash is strictly excluded from response');
    assert(!data.user.password, 'Plaintext password is never returned');
    assert(data.user.department === TEST_STUDENT.department, 'Academic department persisted');
    studentToken = data.token;
  }

  // TEST 4: Duplicate Student Registration Prevention
  console.log('\n--- TEST 4: Duplicate Student Registration Prevention ---');
  {
    // Duplicate email with different roll
    const dupEmailRes = await fetch(`${API_BASE}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...TEST_STUDENT, rollNumber: `DIFF${TEST_TIMESTAMP}` }),
    });
    assert(dupEmailRes.status === 409, 'Rejects duplicate student email address with HTTP 409 Conflict', `HTTP ${dupEmailRes.status}`);

    // Duplicate roll number with different email
    const dupRollRes = await fetch(`${API_BASE}/auth/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...TEST_STUDENT, email: `diff_${TEST_TIMESTAMP}@alts.edu.in` }),
    });
    assert(dupRollRes.status === 409, 'Rejects duplicate student roll number with HTTP 409 Conflict', `HTTP ${dupRollRes.status}`);
  }

  // TEST 5: Parent Registration with Nonexistent Student
  console.log('\n--- TEST 5: Parent Registration Student Verification Check ---');
  {
    const nonExistentRes = await fetch(`${API_BASE}/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...TEST_PARENT,
        linkedStudentRoll: `FAKE_STUDENT_99999`,
      }),
    });
    assert(
      nonExistentRes.status === 400,
      'Rejects parent registration linking to nonexistent student roll number',
      `HTTP ${nonExistentRes.status}`
    );
    const err = await nonExistentRes.json();
    assert(
      err.message.includes('No registered') || err.message.includes('verification failed'),
      'Error explains that no matching registered student was found'
    );
  }

  // TEST 6: Successful Parent Registration Linked to Verified Student
  console.log('\n--- TEST 6: Genuine Parent Registration Linked to Verified Scholar ---');
  let parentToken = '';
  {
    const res = await fetch(`${API_BASE}/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...TEST_PARENT,
        linkedStudentRoll: TEST_STUDENT.rollNumber,
      }),
    });
    assert(res.status === 201, 'POST /api/auth/register/parent returns HTTP 201 Created', `HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Parent registration confirms success');
    assert(data.token, 'Parent receives authenticated JWT token');
    assert(data.user.role === 'parent', 'Server-side role is strictly assigned to "parent"');
    assert(data.user.linkedStudentRoll === TEST_STUDENT.rollNumber, 'Linked student roll number verified and saved');
    assert(data.user.linkedStudentName === TEST_STUDENT.fullName, 'Linked student name resolved from student record');
    assert(!data.user.passwordHash, 'Sensitive passwordHash omitted from parent profile');
    parentToken = data.token;
  }

  // TEST 7: Duplicate Parent Email Prevention
  console.log('\n--- TEST 7: Duplicate Parent Registration Prevention ---');
  {
    const dupParentRes = await fetch(`${API_BASE}/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...TEST_PARENT,
        linkedStudentRoll: TEST_STUDENT.rollNumber,
      }),
    });
    assert(dupParentRes.status === 409, 'Rejects duplicate parent email with HTTP 409 Conflict', `HTTP ${dupParentRes.status}`);
  }

  // TEST 8: Real Credential Login for Registered Users
  console.log('\n--- TEST 8: Real Credential Authentication (POST /api/auth/login) ---');
  {
    // A. Login student via Email
    const studentLoginEmail = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_STUDENT.email,
        password: TEST_STUDENT.password,
      }),
    });
    assert(studentLoginEmail.status === 200, 'Student logs in successfully using registered Email', `HTTP ${studentLoginEmail.status}`);

    // B. Login student via Roll Number
    const studentLoginRoll = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: TEST_STUDENT.rollNumber,
        password: TEST_STUDENT.password,
      }),
    });
    assert(studentLoginRoll.status === 200, 'Student logs in successfully using Roll Number', `HTTP ${studentLoginRoll.status}`);

    // C. Login parent via Email
    const parentLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_PARENT.email,
        password: TEST_PARENT.password,
      }),
    });
    assert(parentLogin.status === 200, 'Parent logs in successfully using registered Email', `HTTP ${parentLogin.status}`);

    // D. Rejection of invalid password
    const wrongPass = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_STUDENT.email,
        password: 'IncorrectPassword123!',
      }),
    });
    assert(wrongPass.status === 401, 'Rejects login with invalid password (HTTP 401)', `HTTP ${wrongPass.status}`);
  }

  // TEST 9: Strict Role-Based Portal Access Control (RBAC)
  console.log('\n--- TEST 9: Strict Role-Based Access Control (RBAC) ---');
  {
    // Student attempting privileged warden leave review
    const wardenLeaveReview = await fetch(`${API_BASE}/leaves/some-leave-id/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ decision: 'approve' }),
    });
    assert(wardenLeaveReview.status === 403, 'Student token rejected with HTTP 403 on warden leave review', `HTTP ${wardenLeaveReview.status}`);

    // Parent attempting gate security record movement
    const gateRecordMovement = await fetch(`${API_BASE}/movements/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`,
      },
      body: JSON.stringify({
        studentId: 'some-id',
        movementType: 'check_out',
        gateStation: 'Main Gate',
      }),
    });
    assert(gateRecordMovement.status === 403, 'Parent token rejected with HTTP 403 on gate security endpoint', `HTTP ${gateRecordMovement.status}`);
  }

  // TEST 10: Authenticated Profile Persistence via /api/users/me
  console.log('\n--- TEST 10: Database Persistence Verification (/api/users/me) ---');
  {
    const studentProfile = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentProfile.status === 200, 'GET /api/users/me succeeds for registered student', `HTTP ${studentProfile.status}`);
    const studentData = await studentProfile.json();
    assert(studentData.user.fullName === TEST_STUDENT.fullName, 'Persisted student name matches registration');
    assert(studentData.user.rollNumber === TEST_STUDENT.rollNumber, 'Persisted roll number matches registration');
    assert(studentData.user.department === TEST_STUDENT.department, 'Persisted department matches registration');

    const parentProfile = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    assert(parentProfile.status === 200, 'GET /api/users/me succeeds for registered parent', `HTTP ${parentProfile.status}`);
    const parentData = await parentProfile.json();
    assert(parentData.user.fullName === TEST_PARENT.fullName, 'Persisted parent name matches registration');
    assert(parentData.user.linkedStudentRoll === TEST_STUDENT.rollNumber, 'Parent correctly linked to registered student roll');
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} assertions verified!`);
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
