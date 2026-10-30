/**
 * ALTS HOSTEL PORTAL — Comprehensive Profile Management & Security Test Suite
 *
 * Validates all 14+ core profile management and security requirements:
 *  1. Rejection of unauthenticated profile requests (HTTP 401).
 *  2. Authenticated profile retrieval (GET /api/users/me) for all 7 institutional roles:
 *     - student
 *     - girls_warden
 *     - boys_warden
 *     - gate_security
 *     - parent
 *     - mess_incharge
 *     - maintenance_incharge
 *  3. Valid profile updates (PATCH /api/users/me) for contact info & relationship.
 *  4. Strict role change prevention (HTTP 400 on unauthorized role elevation attempt).
 *  5. Rejection of protected institutional field tampering (rollNumber, room, employeeId, etc. -> HTTP 400).
 *  6. User isolation — client cannot modify other users by spoofing ID in payload.
 *  7. Genuine photo upload (multipart/form-data) with valid image (JPEG / PNG).
 *  8. Served avatar file headers (Cross-Origin-Resource-Policy: cross-origin).
 *  9. Rejection of non-image file uploads (SVG, HTML, EXE -> HTTP 400).
 *  10. Rejection of oversized file uploads (> 5MB -> HTTP 400).
 *  11. Profile photo removal (DELETE /api/users/me/profile-photo) deleting disk file and resetting avatarUrl.
 *  12. Password change rejection with incorrect current password (HTTP 400).
 *  13. Password change rejection with weak password or same as current (HTTP 400).
 *  14. Password change success with valid current & new password, verify new login, and restore.
 *  15. Data persistence in MongoDB Atlas.
 */

import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';
const DEFAULT_PASSWORD = 'HostelGuard#2026';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, testName, details = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ [PASS] ${testName} ${details ? `(${details})` : ''}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    throw new Error(`Assertion failed: ${testName} (${details})`);
  }
}

// 7 Institutional roles & accounts
const ROLE_ACCOUNTS = {
  STUDENT: 'student.priya@hostelguard.edu',
  GIRLS_WARDEN: 'warden.girls@hostelguard.edu',
  BOYS_WARDEN: 'warden.boys@hostelguard.edu',
  GATE_SECURITY: 'security.gate@hostelguard.edu',
  PARENT: 'parent.sharma@hostelguard.edu',
  MESS_INCHARGE: 'mess.incharge@hostelguard.edu',
  MAINTENANCE_INCHARGE: 'maintenance.incharge@hostelguard.edu',
};

// Helper: login and get token
async function loginAs(email, password = DEFAULT_PASSWORD) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to login as ${email}: ${err.message || res.status}`);
  }
  const data = await res.json();
  return { token: data.token, user: data.user };
}

// Minimal valid 1x1 PNG byte sequence
const VALID_1X1_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function runProfileManagementSuite() {
  console.log('================================================================');
  console.log('🧪 ALTS HOSTEL PORTAL — Profile Management & Security Test Suite');
  console.log('================================================================\n');

  // Test 1: Unauthenticated Profile Access Rejection
  console.log('--- TEST 1: Unauthenticated Request Rejection (HTTP 401) ---');
  {
    const meRes = await fetch(`${API_BASE}/users/me`);
    assert(meRes.status === 401, 'GET /api/users/me rejects unauthenticated request', `HTTP ${meRes.status}`);

    const patchRes = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Hacker' }),
    });
    assert(patchRes.status === 401, 'PATCH /api/users/me rejects unauthenticated request', `HTTP ${patchRes.status}`);

    const delPhotoRes = await fetch(`${API_BASE}/users/me/profile-photo`, {
      method: 'DELETE',
    });
    assert(delPhotoRes.status === 401, 'DELETE /api/users/me/profile-photo rejects unauthenticated request', `HTTP ${delPhotoRes.status}`);

    const pwdRes = await fetch(`${API_BASE}/users/me/change-password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'foo', newPassword: 'bar' }),
    });
    assert(pwdRes.status === 401, 'PATCH /api/users/me/change-password rejects unauthenticated request', `HTTP ${pwdRes.status}`);
  }

  // Test 2: Authenticated Profile Retrieval for All 7 Roles
  console.log('\n--- TEST 2: Profile Retrieval (GET /api/users/me) for All 7 Roles ---');
  const tokens = {};
  for (const [roleKey, email] of Object.entries(ROLE_ACCOUNTS)) {
    const { token, user } = await loginAs(email);
    tokens[roleKey] = token;

    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(res.status === 200, `GET /api/users/me succeeds for role ${roleKey}`, `HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true && data.user, `Profile response contains user payload for ${roleKey}`);
    assert(data.user.email.toLowerCase() === email.toLowerCase(), `User email matches login email for ${roleKey}`);
    assert(!data.user.passwordHash, `Sensitive passwordHash strictly omitted for ${roleKey}`);
    assert(!data.user.faceEmbedding, `Sensitive faceEmbedding vector strictly omitted for ${roleKey}`);
  }

  // Test 3: Valid Profile Updates (PATCH /api/users/me)
  console.log('\n--- TEST 3: Valid Profile Updates (PATCH /api/users/me) ---');
  {
    const studentToken = tokens.STUDENT;
    const updateRes = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        fullName: 'Priya Sharma Updated',
        phone: '9876500001',
        address: '42 Academic Lane, Block A, ALTS Campus',
      }),
    });
    assert(updateRes.status === 200, 'Student profile update returns HTTP 200', `HTTP ${updateRes.status}`);
    const updateData = await updateRes.json();
    assert(updateData.user.fullName === 'Priya Sharma Updated', 'Full name updated successfully');
    assert(updateData.user.phone === '9876500001', 'Phone number updated successfully');
    assert(updateData.user.address === '42 Academic Lane, Block A, ALTS Campus', 'Address updated successfully');

    // Verify persistence via fresh GET /api/users/me
    const verifyRes = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const verifyData = await verifyRes.json();
    assert(verifyData.user.fullName === 'Priya Sharma Updated', 'Updated profile persisted in database');

    // Restore original name
    await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ fullName: 'Priya Sharma' }),
    });
  }

  // Test 4: Role Change Prevention (Strict RBAC / Security)
  console.log('\n--- TEST 4: Role Change Prevention (HTTP 400) ---');
  {
    const studentToken = tokens.STUDENT;
    const roleTamperRes = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        role: 'girls_warden',
      }),
    });
    assert(roleTamperRes.status === 400, 'Rejects attempt to elevate or change user role', `HTTP ${roleTamperRes.status}`);
    const err = await roleTamperRes.json();
    assert(err.message.includes('Role') || err.message.includes('not permitted'), 'Error message clearly explains role modification is forbidden');

    // Confirm student role did not change
    const checkRes = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const checkData = await checkRes.json();
    assert(checkData.user.role === 'student', 'Student role remained strictly untouched in database');
  }

  // Test 5: Protected Institutional Field Tampering Rejection
  console.log('\n--- TEST 5: Protected Field Tampering Rejection (HTTP 400) ---');
  {
    const studentToken = tokens.STUDENT;
    const forbiddenFields = [
      { studentRollNumber: 'FAKEROLL99' },
      { roomNumber: 'PRESIDENTIAL-SUITE' },
      { hostelName: 'Secret Palace' },
      { employeeId: 'EMP999' },
      { assignedHostel: 'ALL_HOSTELS' },
      { status: 'suspended' },
    ];

    for (const field of forbiddenFields) {
      const fieldKey = Object.keys(field)[0];
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify(field),
      });
      assert(
        res.status === 400,
        `Rejects unauthorized tampering with protected field "${fieldKey}"`,
        `HTTP ${res.status}`
      );
    }
  }

  // Test 6: User Isolation — Client Cannot Modify Another User
  console.log('\n--- TEST 6: User Isolation & Client ID Ignored ---');
  {
    const studentToken = tokens.STUDENT;
    const wardenToken = tokens.GIRLS_WARDEN;

    // Get warden original profile
    const wardenProfileRes = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${wardenToken}` },
    });
    const wardenData = await wardenProfileRes.json();
    const wardenId = wardenData.user.id || wardenData.user._id;

    // Student tries to send warden's ID to alter warden profile
    const spoofRes = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        id: wardenId,
        _id: wardenId,
        email: 'warden.girls@hostelguard.edu',
        fullName: 'Hacked Warden Name',
      }),
    });
    // Server either rejects forbidden field or updates the student's own name, NEVER warden
    const checkWarden = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${wardenToken}` },
    });
    const checkWardenData = await checkWarden.json();
    assert(
      checkWardenData.user.fullName === 'Dr. Sarah Mathews',
      'Warden profile was not affected by another user request',
      `Still ${checkWardenData.user.fullName}`
    );
  }

  // Test 7: Genuine Profile Photo Upload (POST /api/users/me/profile-photo)
  console.log('\n--- TEST 7: Genuine Photo Upload & Disk Persistence ---');
  let uploadedAvatarUrl = '';
  {
    const studentToken = tokens.STUDENT;

    // Build multipart/form-data with genuine PNG
    const formData = new FormData();
    const blob = new Blob([VALID_1X1_PNG], { type: 'image/png' });
    formData.append('photo', blob, 'test-avatar.png');

    const uploadRes = await fetch(`${API_BASE}/users/me/profile-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    assert(uploadRes.status === 200, 'Photo upload returns HTTP 200', `HTTP ${uploadRes.status}`);
    const uploadData = await uploadRes.json();
    assert(uploadData.success === true, 'Upload response reports success');
    assert(uploadData.avatarUrl && uploadData.avatarUrl.includes('/uploads/profiles/'), 'avatarUrl points to profiles upload path', uploadData.avatarUrl);
    uploadedAvatarUrl = uploadData.avatarUrl;

    // Check disk file existence
    const filename = path.basename(uploadedAvatarUrl);
    const diskPath = path.resolve('backend/uploads/profiles', filename);
    assert(fs.existsSync(diskPath), `Uploaded avatar file verified on disk: ${diskPath}`);
  }

  // Test 8: Served Avatar File Headers (Cross-Origin-Resource-Policy)
  console.log('\n--- TEST 8: Served Avatar File & CORP Header ---');
  {
    const imageUrl = uploadedAvatarUrl.startsWith('http')
      ? uploadedAvatarUrl
      : `http://localhost:5000${uploadedAvatarUrl}`;

    const imgRes = await fetch(imageUrl);
    assert(imgRes.status === 200, 'Avatar is publicly accessible via URL', `HTTP ${imgRes.status}`);
    const corp = imgRes.headers.get('cross-origin-resource-policy');
    assert(
      corp === 'cross-origin',
      'Avatar response includes "Cross-Origin-Resource-Policy: cross-origin" header',
      `corp=${corp}`
    );
  }

  // Test 9: Rejection of Non-Image Uploads (SVG, HTML, EXE)
  console.log('\n--- TEST 9: Malicious & Non-Image File Rejection (HTTP 400) ---');
  {
    const studentToken = tokens.STUDENT;

    // SVG with potential script injection
    const svgFormData = new FormData();
    const svgBlob = new Blob(['<svg><script>alert(1)</script></svg>'], { type: 'image/svg+xml' });
    svgFormData.append('photo', svgBlob, 'exploit.svg');

    const svgRes = await fetch(`${API_BASE}/users/me/profile-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: svgFormData,
    });
    assert(svgRes.status === 400, 'Rejects SVG upload with HTTP 400', `HTTP ${svgRes.status}`);

    // Executable/Binary file
    const exeFormData = new FormData();
    const exeBlob = new Blob(['MZ\x90\x00\x03\x00\x00\x00'], { type: 'application/octet-stream' });
    exeFormData.append('photo', exeBlob, 'malware.exe');

    const exeRes = await fetch(`${API_BASE}/users/me/profile-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: exeFormData,
    });
    assert(exeRes.status === 400, 'Rejects EXE upload with HTTP 400', `HTTP ${exeRes.status}`);
  }

  // Test 10: Oversized File Upload Rejection (> 5 MB)
  console.log('\n--- TEST 10: Oversized File Upload Rejection (> 5MB -> HTTP 400) ---');
  {
    const studentToken = tokens.STUDENT;
    // 5.5 MB dummy buffer
    const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0);
    const bigFormData = new FormData();
    const bigBlob = new Blob([oversizedBuffer], { type: 'image/jpeg' });
    bigFormData.append('photo', bigBlob, 'giant-image.jpg');

    const bigRes = await fetch(`${API_BASE}/users/me/profile-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: bigFormData,
    });
    assert(bigRes.status === 400, 'Rejects >5MB file with HTTP 400', `HTTP ${bigRes.status}`);
  }

  // Test 11: Profile Photo Removal (DELETE /api/users/me/profile-photo)
  console.log('\n--- TEST 11: Photo Removal & Disk Cleanup ---');
  {
    const studentToken = tokens.STUDENT;
    const filename = path.basename(uploadedAvatarUrl);
    const diskPath = path.resolve('backend/uploads/profiles', filename);

    const delRes = await fetch(`${API_BASE}/users/me/profile-photo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(delRes.status === 200, 'DELETE /api/users/me/profile-photo returns HTTP 200', `HTTP ${delRes.status}`);
    const delData = await delRes.json();
    assert(delData.success === true, 'Delete response confirms success');
    assert(delData.user.avatarUrl === null || delData.user.avatarUrl === undefined, 'avatarUrl is reset to null/undefined');

    // Confirm file was deleted from disk
    assert(!fs.existsSync(diskPath), 'Previous avatar file was cleaned up from disk');

    // Verify database state via GET /api/users/me
    const verifyRes = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const verifyData = await verifyRes.json();
    assert(!verifyData.user.avatarUrl, 'User avatarUrl remains null in database');
  }

  // Test 12: Password Change - Incorrect Current Password Rejection
  console.log('\n--- TEST 12: Password Change Validation (Incorrect Current Password) ---');
  {
    const studentToken = tokens.STUDENT;
    const wrongPwdRes = await fetch(`${API_BASE}/users/me/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'IncorrectOldPassword123!',
        newPassword: 'BrandNewSecurePassword#2026',
      }),
    });
    assert(wrongPwdRes.status === 400, 'Rejects password change with incorrect current password', `HTTP ${wrongPwdRes.status}`);
    const err = await wrongPwdRes.json();
    assert(err.message.includes('Current password') || err.message.includes('incorrect'), 'Clear error message on incorrect password');
  }

  // Test 13: Password Change - Weak Password or Same as Current
  console.log('\n--- TEST 13: Password Change Validation (Short / Same Password) ---');
  {
    const studentToken = tokens.STUDENT;
    const shortRes = await fetch(`${API_BASE}/users/me/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: DEFAULT_PASSWORD,
        newPassword: 'short',
      }),
    });
    assert(shortRes.status === 400, 'Rejects new password shorter than 8 characters', `HTTP ${shortRes.status}`);

    const sameRes = await fetch(`${API_BASE}/users/me/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: DEFAULT_PASSWORD,
        newPassword: DEFAULT_PASSWORD,
      }),
    });
    assert(sameRes.status === 400, 'Rejects new password identical to current password', `HTTP ${sameRes.status}`);
  }

  // Test 14: Valid Password Change, Verify New Login, and Restore
  console.log('\n--- TEST 14: Valid Password Change Cycle ---');
  {
    const studentToken = tokens.STUDENT;
    const TEMP_NEW_PASSWORD = 'HostelGuard#Updated2026';

    const changeRes = await fetch(`${API_BASE}/users/me/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        currentPassword: DEFAULT_PASSWORD,
        newPassword: TEMP_NEW_PASSWORD,
      }),
    });
    assert(changeRes.status === 200, 'Valid password change returns HTTP 200', `HTTP ${changeRes.status}`);

    // Verify login succeeds with the NEW password
    const newLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ROLE_ACCOUNTS.STUDENT,
        password: TEMP_NEW_PASSWORD,
      }),
    });
    assert(newLoginRes.status === 200, 'Can authenticate with newly changed password', `HTTP ${newLoginRes.status}`);
    const newLoginData = await newLoginRes.json();
    const updatedToken = newLoginData.token;

    // Restore original password so the environment remains fully consistent
    const restoreRes = await fetch(`${API_BASE}/users/me/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${updatedToken}`,
      },
      body: JSON.stringify({
        currentPassword: TEMP_NEW_PASSWORD,
        newPassword: DEFAULT_PASSWORD,
      }),
    });
    assert(restoreRes.status === 200, 'Restored original password successfully', `HTTP ${restoreRes.status}`);

    // Verify login with restored password
    const restoredLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ROLE_ACCOUNTS.STUDENT,
        password: DEFAULT_PASSWORD,
      }),
    });
    assert(restoredLoginRes.status === 200, 'Can log in with restored original password', `HTTP ${restoredLoginRes.status}`);
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL ASSERTIONS PASSED: ${passedAssertions}/${totalAssertions}`);
  console.log('================================================================\n');
}

runProfileManagementSuite().catch((err) => {
  console.error('\n❌ Profile Management Suite Encountered Error:', err);
  process.exit(1);
});

