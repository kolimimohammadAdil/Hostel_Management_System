/**
 * HOSTELGUARD AI — Comprehensive Real Facial Biometric Recognition Test Suite
 *
 * Validates all 13 required test cases:
 *  1. Valid face detection and 128-D embedding extraction.
 *  2. No face detected (rejection).
 *  3. Multiple faces detected (rejection).
 *  4. Known enrolled identity match (high similarity score > 80%).
 *  5. Unknown/un-enrolled identity match rejection (below threshold).
 *  6. Corrupted/invalid image format handling.
 *  7. Unauthorized enrollment attempt (RBAC: Gate Security / Student rejected).
 *  8. Unauthorized verification attempt (RBAC: Unauthenticated rejected).
 *  9. Face match with NO active approved leave (access blocked).
 *  10. Face match WITH active approved leave (gate clearance granted).
 *  11. Duplicate check-out attempt prevention (rejected).
 *  12. Invalid check-in without prior check-out prevention (rejected).
 *  13. MongoDB Atlas biometric template persistence & data integrity.
 */

import fs from 'fs';

// Native fetch is available in Node 18+

const API_BASE = 'http://localhost:5000/api';
const FACE_SERVICE_BASE = 'http://127.0.0.1:5001';

// Sample face test images
const PRIYA_FACE_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
const AARAV_FACE_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400';
const UNKNOWN_FACE_URL = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400';
const MULTI_FACE_URL = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600';
// 1x1 blank PNG
const BLANK_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

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
  return data.token;
}

async function runTestSuite() {
  console.log('\n=======================================================');
  console.log('🧪 HOSTELGUARD AI — REAL FACE RECOGNITION TEST SUITE');
  console.log('=======================================================\n');

  // Verify health of services
  console.log('--- Prerequisites Check ---');
  const faceHealthRes = await fetch(`${FACE_SERVICE_BASE}/health`);
  const faceHealth = await faceHealthRes.json();
  assert(faceHealthRes.ok && faceHealth.status === 'healthy', 'Face Recognition microservice is running and healthy');
  assert(faceHealth.embeddingDimensions === 128, 'Face service produces 128-dimensional embeddings');

  const backendHealthRes = await fetch(`${API_BASE}/health`);
  const backendHealth = await backendHealthRes.json();
  assert(backendHealthRes.ok && backendHealth.database.connected === true, 'Express backend is connected to MongoDB Atlas');

  // Obtain authentication tokens for RBAC tests
  const wardenToken = await loginAs('girls_warden');
  const gateToken = await loginAs('gate_security');
  const studentToken = await loginAs('student', 'student.priya@hostelguard.edu');

  // Test Case 1: Valid face detection & embedding extraction
  console.log('\n--- Test 1: Valid Face Detection & 128-D Embedding Extraction ---');
  const extractRes = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  const extractData = await extractRes.json();
  assert(extractRes.ok, 'HTTP 200 returned for valid face frame');
  assert(extractData.success === true, 'Extraction reports success');
  assert(extractData.facesDetected === 1, 'Exactly 1 face detected');
  assert(Array.isArray(extractData.embedding) && extractData.embedding.length === 128, 'Produces genuine 128-D float embedding vector');
  assert(typeof extractData.confidence === 'number' && extractData.confidence > 0.8, 'Face confidence score exceeds 0.8');

  // Test Case 2: No face detected rejection
  console.log('\n--- Test 2: No Face Detected (Rejection) ---');
  const noFaceRes = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: BLANK_IMAGE_BASE64 }),
  });
  const noFaceData = await noFaceRes.json();
  assert(noFaceRes.status === 400, 'HTTP 400 returned when no face is present');
  assert(noFaceData.success === false, 'Extraction reports failure');
  assert(noFaceData.facesDetected === 0, 'facesDetected is 0');
  assert(typeof noFaceData.error === 'string' && noFaceData.error.toLowerCase().includes('no face'), 'Returns descriptive no-face error message');

  // Test Case 3: Multiple faces detected rejection
  console.log('\n--- Test 3: Multiple Faces Detected (Rejection) ---');
  const multiFaceRes = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: MULTI_FACE_URL }),
  });
  const multiFaceData = await multiFaceRes.json();
  assert(multiFaceRes.status === 400, 'HTTP 400 returned when multiple faces are detected');
  assert(multiFaceData.success === false, 'Extraction reports failure for multi-face frame');
  assert(multiFaceData.facesDetected > 1, `facesDetected indicates multiple (${multiFaceData.facesDetected})`);
  assert(multiFaceData.error.toLowerCase().includes('multiple faces'), 'Returns turnstile single-subject safety restriction message');

  // Test Case 4: Known enrolled identity match
  console.log('\n--- Test 4: Known Enrolled Identity Match ---');
  // First enroll Priya Sharma if not already enrolled
  const priyaUser = await fetch(`${API_BASE}/movements/active-passes`, {
    headers: { Authorization: `Bearer ${gateToken}` },
  });
  // Query Priya's ID
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const priyaProfile = (await meRes.json()).user;
  const priyaId = priyaProfile.id || priyaProfile._id;

  const enrollRes = await fetch(`${API_BASE}/biometrics/enroll/${priyaId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${wardenToken}`,
    },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  assert(enrollRes.ok, 'Warden successfully enrolls Priya Sharma face biometric template');

  // Now verify with Gate Security
  const verifyKnownRes = await fetch(`${API_BASE}/biometrics/verify-face`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  const verifyKnownData = await verifyKnownRes.json();
  assert(verifyKnownRes.ok, 'Turnstile verification endpoint returns HTTP 200');
  assert(verifyKnownData.matched === true, 'Facial biometric matched enrolled student');
  assert(verifyKnownData.student.id === priyaId, 'Correct student identity identified (Priya Sharma)');
  assert(verifyKnownData.biometricVerification.similarityScore >= 80, `High biometric similarity score (${verifyKnownData.biometricVerification.similarityScore}%)`);
  assert(verifyKnownData.biometricVerification.cosineSimilarity >= 0.38, `Cosine similarity (${verifyKnownData.biometricVerification.cosineSimilarity}) satisfies calibrated threshold`);

  // Test Case 5: Unknown/un-enrolled identity rejection
  console.log('\n--- Test 5: Unknown / Un-enrolled Identity (Rejection) ---');
  const verifyUnknownRes = await fetch(`${API_BASE}/biometrics/verify-face`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({ image: UNKNOWN_FACE_URL }),
  });
  const verifyUnknownData = await verifyUnknownRes.json();
  assert(verifyUnknownRes.ok, 'Verification endpoint handles unknown faces gracefully');
  assert(verifyUnknownData.matched === false, 'Biometric match rejected for un-enrolled face');
  assert(verifyUnknownData.canClearGate === false, 'Gate clearance blocked for unrecognized face');

  // Test Case 6: Corrupted/invalid image format handling
  console.log('\n--- Test 6: Corrupted / Invalid Image Format Handling ---');
  const badImageRes = await fetch(`${API_BASE}/biometrics/verify-face`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({ image: 'not-a-valid-base64-or-image' }),
  });
  assert(badImageRes.status === 400, 'HTTP 400 returned for corrupted image payload');
  const badImageData = await badImageRes.json();
  assert(badImageData.success === false, 'Corrupted payload gracefully rejected without crashing');

  // Test Case 7: Unauthorized enrollment attempt (RBAC)
  console.log('\n--- Test 7: Unauthorized Biometric Enrollment Rejection (RBAC) ---');
  const gateEnrollRes = await fetch(`${API_BASE}/biometrics/enroll/${priyaId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  assert(gateEnrollRes.status === 403, 'Gate Security role forbidden from enrolling biometric templates (HTTP 403)');

  const studentEnrollRes = await fetch(`${API_BASE}/biometrics/enroll/${priyaId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  assert(studentEnrollRes.status === 403, 'Student role forbidden from self-enrolling templates (HTTP 403)');

  // Test Case 8: Unauthorized verification attempt (RBAC)
  console.log('\n--- Test 8: Unauthorized Turnstile Verification Rejection (RBAC) ---');
  const unauthVerifyRes = await fetch(`${API_BASE}/biometrics/verify-face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  assert(unauthVerifyRes.status === 401, 'Unauthenticated verification request rejected with HTTP 401');

  // Test Case 9: Face match with NO active approved leave
  console.log('\n--- Test 9: Face Match with NO Active Approved Leave (Access Blocked) ---');
  // At this moment, Priya has no active approved leave
  const matchNoLeaveRes = await fetch(`${API_BASE}/biometrics/verify-face`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  const matchNoLeaveData = await matchNoLeaveRes.json();
  assert(matchNoLeaveData.matched === true, 'Face correctly identifies the student');
  assert(matchNoLeaveData.leaveAuthorization.hasActiveLeave === false, 'Backend independently confirms student has no active approved leave');
  assert(matchNoLeaveData.canClearGate === false, 'Gate clearance strictly blocked despite successful biometric match');

  // Test Case 10: Face match WITH active approved leave (Gate Clearance Granted)
  console.log('\n--- Test 10: Face Match WITH Active Approved Leave (Clearance Granted) ---');
  // 10a. Student applies for leave
  const applyRes = await fetch(`${API_BASE}/leaves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      leaveType: 'HOME_VISIT',
      reason: 'Biometric Turnstile Integration Verification Test',
      destination: 'Bangalore Family Residence',
      departureTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (valid window)
      expectedReturnTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    }),
  });
  const leaveData = await applyRes.json();
  assert(applyRes.ok && leaveData.leave?._id, 'Student submits valid leave application');
  const leaveId = leaveData.leave._id;

  // 10b. Warden approves the leave
  const approveRes = await fetch(`${API_BASE}/leaves/${leaveId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${wardenToken}`,
    },
    body: JSON.stringify({ decision: 'approve', reviewRemarks: 'Authorized for biometric clearance test' }),
  });
  assert(approveRes.ok, 'Warden authorizes the leave pass');

  // 10c. Now Gate Security runs verify-face
  const verifyWithLeaveRes = await fetch(`${API_BASE}/biometrics/verify-face`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  const verifyWithLeaveData = await verifyWithLeaveRes.json();
  assert(verifyWithLeaveData.matched === true, 'Biometric identity matched');
  assert(verifyWithLeaveData.leaveAuthorization.hasActiveLeave === true, 'Valid approved leave recognized by backend');
  assert(verifyWithLeaveData.leaveAuthorization.isWindowValid === true, 'Leave departure window verified as currently valid');
  assert(verifyWithLeaveData.canClearGate === true, 'Gate turnstile clearance granted');

  // 10d. Record check-out movement
  const recordExitRes = await fetch(`${API_BASE}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({
      studentId: priyaId,
      eventType: 'check_out',
      leaveId: leaveId,
      verificationMethod: 'face_recognition',
    }),
  });
  const recordExitData = await recordExitRes.json();
  assert(recordExitRes.status === 201, 'Turnstile check-out movement recorded successfully');
  assert(recordExitData.leave.status === 'checked_out', 'Leave application transitioned to checked_out');

  // Test Case 11: Duplicate check-out attempt prevention
  console.log('\n--- Test 11: Duplicate Check-Out Attempt Prevention ---');
  const duplicateExitRes = await fetch(`${API_BASE}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({
      studentId: priyaId,
      eventType: 'check_out',
      leaveId: leaveId,
      verificationMethod: 'face_recognition',
    }),
  });
  const duplicateExitData = await duplicateExitRes.json();
  assert(duplicateExitRes.status === 400, 'Duplicate check-out rejected with HTTP 400');
  assert(duplicateExitData.message.toLowerCase().includes('already marked as checked out'), 'Descriptive duplicate check-out rejection message returned');

  // Test Case 12: Invalid check-in without prior check-out prevention
  console.log('\n--- Test 12: Invalid Check-In Without Prior Check-Out Prevention ---');
  // Aarav Patel is currently in hostel (not checked out)
  // Retrieve Aarav's user ID
  const aaravMeRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student.aarav@hostelguard.edu', password: 'HostelGuard#2026' }),
  });
  const aaravProfile = (await aaravMeRes.json()).user;
  const aaravId = aaravProfile.id || aaravProfile._id;

  const invalidCheckInRes = await fetch(`${API_BASE}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({
      studentId: aaravId,
      eventType: 'check_in',
      verificationMethod: 'face_recognition',
    }),
  });
  const invalidCheckInData = await invalidCheckInRes.json();
  assert(
    invalidCheckInRes.status === 400,
    'Invalid check-in rejected with HTTP 400',
    `received status ${invalidCheckInRes.status}: ${JSON.stringify(invalidCheckInData)}`
  );
  assert(invalidCheckInData.message.toLowerCase().includes('check-in rejected'), 'Prevented entry check-in without prior checked-out record');

  // Conclude Priya's movement by checking back in
  const checkInPriyaRes = await fetch(`${API_BASE}/movements/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gateToken}`,
    },
    body: JSON.stringify({
      studentId: priyaId,
      eventType: 'check_in',
      leaveId: leaveId,
      verificationMethod: 'face_recognition',
    }),
  });
  assert(checkInPriyaRes.status === 201, 'Valid return check-in recorded successfully');

  // Test Case 13: Biometric enrollment MongoDB persistence & integrity
  console.log('\n--- Test 13: Biometric Template MongoDB Persistence & Integrity ---');
  // Import user model and connect to DB to directly inspect document in Atlas
  const { User } = await (fs.existsSync('./backend/dist/models/user.model.js')
    ? import('./backend/dist/models/user.model.js')
    : import('./server/dist/models/user.model.js'));
  const { connectDatabase, disconnectDatabase } = await (fs.existsSync('./backend/dist/config/database.js')
    ? import('./backend/dist/config/database.js')
    : import('./server/dist/config/database.js'));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await connectDatabase();
      break;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const studentInDb = await User.findById(priyaId).select('+faceEmbedding');
  assert(studentInDb !== null, 'Student document retrieved from MongoDB Atlas');
  assert(Array.isArray(studentInDb.faceEmbedding) && studentInDb.faceEmbedding.length === 128, '128-D embedding vector persisted in MongoDB');
  assert(studentInDb.faceEnrolledAt instanceof Date, 'faceEnrolledAt timestamp persisted in MongoDB');

  // Test right to erasure / biometric template deletion
  const deleteBioRes = await fetch(`${API_BASE}/biometrics/${priyaId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${wardenToken}` },
  });
  assert(deleteBioRes.ok, 'Warden successfully erases student biometric template (Right to Erasure compliance)');

  const erasedStudentInDb = await User.findById(priyaId).select('+faceEmbedding');
  assert(!erasedStudentInDb.faceEnrolledAt, 'faceEnrolledAt cleared from MongoDB after deletion');

  // Re-enroll Priya's template to leave the database in active state
  await fetch(`${API_BASE}/biometrics/enroll/${priyaId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${wardenToken}`,
    },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });

  await disconnectDatabase();

  console.log('\n=======================================================');
  console.log(`🎉 ALL 13 TEST CASES PASSED: ${passedTests} / ${totalTests} assertions passed`);
  console.log('=======================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite execution failed:', err);
  process.exit(1);
});
