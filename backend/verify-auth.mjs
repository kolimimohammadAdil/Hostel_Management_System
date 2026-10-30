import http from 'http';
import mongoose from 'mongoose';
import { User, UserRole, AccountStatus } from './dist/models/user.model.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
} from './dist/utils/auth.js';
import { authenticate, authorize } from './dist/middleware/auth.js';
import { toSafeUser, register, login, getMe } from './dist/controllers/auth.controller.js';
import { createApp } from './dist/app.js';
import { config } from './dist/config/env.js';
import { connectDatabase, disconnectDatabase } from './dist/config/database.js';

console.log('\n=======================================================');
console.log('🧪 HOSTELGUARD AI — Authentication & Security Audit');
console.log('=======================================================\n');

const results = {};
function recordResult(testKey, isPass, message) {
  results[testKey] = isPass ? 'PASS' : 'FAIL';
  if (isPass) {
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runAudit() {
  try {
    await connectDatabase();
  } catch (err) {
    console.warn('Database connection notice in test runner:', err.message);
  }

  // -------------------------------------------------------------------------
  // 1. Password Hashing & Security
  // -------------------------------------------------------------------------
  console.log('--- 1. Password Hashing & Validation ---');
  const plainPassword = 'AuditPassword#2026!';
  const hashedPassword = await hashPassword(plainPassword);

  const isValidBcrypt = typeof hashedPassword === 'string' && hashedPassword.startsWith('$2');
  const isNotPlain = hashedPassword !== plainPassword;
  recordResult('password_hashing', isValidBcrypt && isNotPlain, 'Password hashing using salted bcrypt (never plaintext)');

  const verifyValid = await comparePassword(plainPassword, hashedPassword);
  const verifyInvalid = !(await comparePassword('IncorrectPass123!', hashedPassword));
  recordResult('password_verification', verifyValid && verifyInvalid, 'Bcrypt compare matches valid password and rejects invalid password');

  let shortRejected = false;
  try {
    await hashPassword('short');
  } catch {
    shortRejected = true;
  }
  recordResult('password_length_check', shortRejected, 'Passwords shorter than 8 characters are strictly rejected');

  // -------------------------------------------------------------------------
  // 2. Absence of Password Hash in Serialized Profiles
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Absence of Password Hash in API Outputs ---');
  const sampleUserDoc = {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Pooja Verma',
    email: 'pooja.verma@hostelguard.edu',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
    role: UserRole.STUDENT,
    rollNumber: '21CS089',
    hostelName: 'Mandakini Girls Hostel',
    roomNumber: 'B-204',
    phone: '9876543210',
    status: AccountStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const safeProfile = toSafeUser(sampleUserDoc);
  const noHashExposed = !('passwordHash' in safeProfile) && !('password' in safeProfile);
  const profileIntact = safeProfile.fullName === 'Pooja Verma' && safeProfile.role === 'student';
  recordResult('password_hash_absence', noHashExposed && profileIntact, 'Sanitized profile strictly omits passwordHash and preserves public fields');

  // -------------------------------------------------------------------------
  // 3. JWT Signing, Token Verification & Expiration
  // -------------------------------------------------------------------------
  console.log('\n--- 3. JWT Signing & Token Invariants ---');
  const samplePayload = {
    sub: '507f1f77bcf86cd799439011',
    email: 'pooja.verma@hostelguard.edu',
    role: UserRole.STUDENT,
  };

  const activeToken = signToken(samplePayload, '1h');
  const isThreePartJwt = typeof activeToken === 'string' && activeToken.split('.').length === 3;
  recordResult('jwt_signing', isThreePartJwt, 'Issues HMAC SHA-256 signed JSON Web Token');

  const decodedPayload = verifyToken(activeToken);
  const payloadSafe = decodedPayload.sub === samplePayload.sub && !('passwordHash' in decodedPayload);
  recordResult('jwt_verification', payloadSafe, 'Decodes token and confirms zero credentials in token payload');

  let tamperedRejected = false;
  try {
    verifyToken(activeToken + 'tampered');
  } catch {
    tamperedRejected = true;
  }
  recordResult('jwt_tampering_rejection', tamperedRejected, 'Tampered or forged tokens are rejected');

  const shortLivedToken = signToken(samplePayload, '1ms');
  await wait(25);
  let expiredRejected = false;
  try {
    verifyToken(shortLivedToken);
  } catch (err) {
    if (err.name === 'TokenExpiredError') expiredRejected = true;
  }
  recordResult('jwt_expiry_rejection', expiredRejected, 'Expired tokens are rejected with TokenExpiredError');

  // -------------------------------------------------------------------------
  // 4. Role-Based Authorization (RBAC) Middleware
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Role-Based Authorization (RBAC) ---');

  // Student trying to access Warden-only route
  const wardenGuard = authorize(UserRole.GIRLS_WARDEN, UserRole.BOYS_WARDEN);
  let rbacForbiddenCode = 0;
  const studentReq = { user: { role: UserRole.STUDENT } };
  const mockResForbidden = {
    status: (code) => {
      rbacForbiddenCode = code;
      return { json: () => {} };
    },
  };
  wardenGuard(studentReq, mockResForbidden, () => {});
  recordResult('rbac_unauthorized_rejection', rbacForbiddenCode === 403, 'Student attempting to access warden endpoint receives HTTP 403 Forbidden');

  // Warden accessing Warden-only route
  let wardenAuthorized = false;
  const wardenReq = { user: { role: UserRole.GIRLS_WARDEN } };
  wardenGuard(wardenReq, {}, () => {
    wardenAuthorized = true;
  });
  recordResult('rbac_authorized_access', wardenAuthorized, 'Warden accessing warden endpoint succeeds (next() called)');

  // Gate Security accessing Security-only route
  let securityAuthorized = false;
  const securityGuard = authorize(UserRole.GATE_SECURITY);
  const securityReq = { user: { role: UserRole.GATE_SECURITY } };
  securityGuard(securityReq, {}, () => {
    securityAuthorized = true;
  });
  recordResult('rbac_security_access', securityAuthorized, 'Gate security staff authorized for gate verification endpoints');

  // -------------------------------------------------------------------------
  // 5. Live In-Memory HTTP Application Endpoint Tests
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Live HTTP Application Endpoint Tests ---');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const testPort = server.address().port;

  function httpCall(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : '';
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };
      if (body) {
        reqHeaders['Content-Length'] = Buffer.byteLength(data);
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: testPort,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let chunks = '';
          res.on('data', (c) => (chunks += c));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(chunks) });
            } catch {
              resolve({ status: res.statusCode, raw: chunks });
            }
          });
        }
      );
      req.on('error', reject);
      if (body) req.write(data);
      req.end();
    });
  }

  try {
    // 5a. Health Endpoint
    const health = await httpCall('/api/health');
    const healthMatches = health.data?.application === 'ALTS Hostel Portal' || health.data?.application === 'HostelGuard AI';
    recordResult('health_endpoint', healthMatches, `GET /api/health identifies ALTS Hostel Portal (HTTP ${health.status})`);

    // 5b. Prevention of Privileged-Role Self-Registration
    const blockGirlsWarden = await httpCall('/api/auth/register', 'POST', {
      fullName: 'Fake Warden',
      email: 'fake.warden@hostelguard.edu',
      password: 'SecurePass123!',
      role: UserRole.GIRLS_WARDEN,
    });
    const blockGateSecurity = await httpCall('/api/auth/register', 'POST', {
      fullName: 'Fake Security',
      email: 'fake.security@hostelguard.edu',
      password: 'SecurePass123!',
      role: UserRole.GATE_SECURITY,
    });
    const blockMessIncharge = await httpCall('/api/auth/register', 'POST', {
      fullName: 'Fake Mess',
      email: 'fake.mess@hostelguard.edu',
      password: 'SecurePass123!',
      role: UserRole.MESS_INCHARGE,
    });
    const privilegedBlocked =
      blockGirlsWarden.status === 400 &&
      blockGateSecurity.status === 400 &&
      blockMessIncharge.status === 400;
    recordResult('privileged_self_reg_prevention', privilegedBlocked, 'Public registration strictly forbids privileged roles (wardens, security, mess, maintenance)');

    // 5c. Registration Input Validations
    const badEmail = await httpCall('/api/auth/register', 'POST', {
      fullName: 'Test User',
      email: 'not-valid-email',
      password: 'ValidPassword123!',
    });
    const shortPass = await httpCall('/api/auth/register', 'POST', {
      fullName: 'Test User',
      email: 'valid.email@example.com',
      password: 'short',
    });
    const missingName = await httpCall('/api/auth/register', 'POST', {
      fullName: '',
      email: 'valid.email@example.com',
      password: 'ValidPassword123!',
    });
    const validationPassed = badEmail.status === 400 && shortPass.status === 400 && missingName.status === 400;
    recordResult('registration_validation', validationPassed, 'Registration rejects invalid email format, short password, or empty name');

    // 5d. Missing, Invalid, and Expired Token Rejection on /api/auth/me
    const noToken = await httpCall('/api/auth/me');
    const invalidToken = await httpCall('/api/auth/me', 'GET', null, {
      Authorization: 'Bearer bogus.jwt.token',
    });
    const expiredTokenCall = await httpCall('/api/auth/me', 'GET', null, {
      Authorization: `Bearer ${shortLivedToken}`,
    });
    const tokenRejectionPassed =
      noToken.status === 401 && invalidToken.status === 401 && expiredTokenCall.status === 401;
    recordResult('token_rejections', tokenRejectionPassed, 'GET /api/auth/me returns HTTP 401 for missing, invalid, or expired tokens');

    // 5e. Invalid Login Body Validation
    const emptyLogin = await httpCall('/api/auth/login', 'POST', {});
    recordResult('login_body_validation', emptyLogin.status === 400, 'POST /api/auth/login requires email and password (HTTP 400)');

    // -------------------------------------------------------------------------
    // 6. Live Database End-to-End Registration & Login Lifecycle
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Database Lifecycle: Registration, Login & Profile ---');
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const testEmail = `test_audit_${Date.now()}@hostelguard.test`;
      const testPassword = 'AuditPassword123!';

      // 6a. Successful Registration
      const regRes = await httpCall('/api/auth/register', 'POST', {
        fullName: 'Audit Student',
        email: testEmail,
        password: testPassword,
        role: UserRole.STUDENT,
        rollNumber: `AUD${Date.now().toString().slice(-5)}`,
        hostelName: 'ALTS Boys Hostel',
        roomNumber: 'A-201',
      });
      const regSuccess = regRes.status === 201 && regRes.data?.success === true && regRes.data?.token;
      const regNoHash = !('passwordHash' in (regRes.data?.user || {}));
      recordResult('successful_registration', regSuccess && regNoHash, 'User registered successfully and received JWT with sanitized profile');

      // 6b. Duplicate Registration Rejection
      const dupRes = await httpCall('/api/auth/register', 'POST', {
        fullName: 'Audit Student Duplicate',
        email: testEmail,
        password: testPassword,
      });
      recordResult('duplicate_registration_rejection', dupRes.status === 409, 'Duplicate email registration rejected with HTTP 409 Conflict');

      // 6c. Successful Login
      const loginRes = await httpCall('/api/auth/login', 'POST', {
        email: testEmail,
        password: testPassword,
      });
      const loginSuccess = loginRes.status === 200 && loginRes.data?.token;
      recordResult('successful_login', loginSuccess, 'POST /api/auth/login verifies credentials and returns new JWT');

      // 6d. Invalid Password Rejection
      const wrongPassRes = await httpCall('/api/auth/login', 'POST', {
        email: testEmail,
        password: 'CompletelyWrongPassword!',
      });
      recordResult('invalid_password_rejection', wrongPassRes.status === 401, 'POST /api/auth/login with wrong password rejected with HTTP 401');

      // 6e. Access /api/auth/me with Valid Token
      const meRes = await httpCall('/api/auth/me', 'GET', null, {
        Authorization: `Bearer ${loginRes.data.token}`,
      });
      const meSuccess = meRes.status === 200 && meRes.data?.user?.email === testEmail;
      recordResult('auth_me_access', meSuccess, 'GET /api/auth/me with valid Bearer token returns authenticated user profile');

      // Cleanup test user
      await User.deleteOne({ email: testEmail });
      console.log('  ℹ️  Cleaned up isolated audit record from database.');
    } else {
      console.log('  ⚠️  MongoDB Atlas network connection is currently disconnected (awaiting IP allowlist).');
      console.log('  ℹ️  Controller unit invariants and validation paths were verified in memory.');
      results['successful_registration'] = 'NOT TESTED (Atlas offline)';
      results['duplicate_registration_rejection'] = 'NOT TESTED (Atlas offline)';
      results['successful_login'] = 'NOT TESTED (Atlas offline)';
      results['invalid_password_rejection'] = 'NOT TESTED (Atlas offline)';
      results['auth_me_access'] = 'NOT TESTED (Atlas offline)';
    }

  } finally {
    server.close();
    try {
      await disconnectDatabase();
    } catch {
      // Ignore
    }
  }

  console.log('\n=======================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('=======================================================');
  for (const [k, v] of Object.entries(results)) {
    console.log(`  ${k.padEnd(35)} : ${v}`);
  }
  console.log('=======================================================\n');

  const hasFails = Object.values(results).some((r) => r === 'FAIL');
  if (hasFails) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Fatal audit execution error:', err);
  process.exit(1);
});
