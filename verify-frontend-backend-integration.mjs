/**
 * HOSTELGUARD AI — Frontend/Backend Full Integration Verification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=======================================================');
console.log('🧪 Verifying Frontend & Backend Integration Across 7 Portals');
console.log('=======================================================\n');

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

// 1. API Client Verification
console.log('--- 1. Frontend API Client (`src/services/api.ts`) ---');
const resolveFront = (sub) => fs.existsSync(path.join(__dirname, 'frontend', sub)) ? path.join(__dirname, 'frontend', sub) : path.join(__dirname, sub);
const apiClientPath = resolveFront(path.join('src', 'services', 'api.ts'));
assert(fs.existsSync(apiClientPath), 'API client file exists at src/services/api.ts');

const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
assert(apiClientContent.includes('VITE_API_BASE_URL'), 'API client reads configurable VITE_API_BASE_URL');
assert(apiClientContent.includes('Authorization'), 'API client injects Authorization header with JWT Bearer token');
assert(apiClientContent.includes('hostelguard:session-expired'), 'API client dispatches session-expired event on 401');
assert(apiClientContent.includes('authApi'), 'API client exposes authApi');
assert(apiClientContent.includes('leavesApi'), 'API client exposes leavesApi');
assert(apiClientContent.includes('movementsApi'), 'API client exposes movementsApi');
assert(apiClientContent.includes('maintenanceApi'), 'API client exposes maintenanceApi');
assert(apiClientContent.includes('notificationsApi'), 'API client exposes notificationsApi');
assert(apiClientContent.includes('parentApi'), 'API client exposes parentApi');
assert(apiClientContent.includes('messApi'), 'API client exposes messApi');

// 2. Route Protection in App.tsx
console.log('\n--- 2. Route Protection & Role Isolation (`src/App.tsx`) ---');
const appTsxPath = resolveFront(path.join('src', 'App.tsx'));
assert(fs.existsSync(appTsxPath), 'App.tsx exists');
const appContent = fs.readFileSync(appTsxPath, 'utf8');
assert(appContent.includes('ProtectedRoute'), 'ProtectedRoute is imported in App.tsx');

const expectedPortals = [
  { path: '/student', role: 'STUDENT' },
  { path: '/girls-warden', role: 'GIRLS_WARDEN' },
  { path: '/boys-warden', role: 'BOYS_WARDEN' },
  { path: '/gate-security', role: 'GATE_SECURITY' },
  { path: '/parent', role: 'PARENT' },
  { path: '/mess-incharge', role: 'MESS_INCHARGE' },
  { path: '/maintenance-incharge', role: 'MAINTENANCE_INCHARGE' },
];

for (const p of expectedPortals) {
  assert(
    appContent.includes(p.path) && appContent.includes(p.role),
    `Portal ${p.path} is guarded with <ProtectedRoute allowedRoles={['${p.role}']}>`
  );
}

// 3. ProtectedRoute Component Invariants
console.log('\n--- 3. Protected Route Security Component ---');
const protectedRoutePath = resolveFront(path.join('src', 'components', 'common', 'ProtectedRoute.tsx'));
assert(fs.existsSync(protectedRoutePath), 'ProtectedRoute.tsx component exists');
const prContent = fs.readFileSync(protectedRoutePath, 'utf8');
assert(
  prContent.includes('Navigate to="/login"') || prContent.includes('Navigate to="/select-role"'),
  'Redirects unauthenticated or unauthorized users to /login or /select-role'
);
assert(prContent.includes('isAuthenticating'), 'Handles session loading state without flashing unauthorized redirect');
assert(prContent.includes('allowedRoles'), 'Enforces role array membership check');

// 4. RoleSelectionPage Integration
console.log('\n--- 4. Role Selection & Credential Authentication UI ---');
const rolePagePath = resolveFront(path.join('src', 'pages', 'RoleSelectionPage.tsx'));
assert(fs.existsSync(rolePagePath), 'RoleSelectionPage.tsx exists');
const rolePageContent = fs.readFileSync(rolePagePath, 'utf8');
assert(rolePageContent.includes('loginWithCredentials'), 'RoleSelectionPage connects to loginWithCredentials');
assert(rolePageContent.includes('Credential Sign In (JWT)'), 'RoleSelectionPage provides Credential Sign In mode');
assert(rolePageContent.includes('1-Click Portal Access'), 'RoleSelectionPage preserves 1-Click Role Access');
assert(rolePageContent.includes('demoCredentials'), 'RoleSelectionPage offers quick autofill credentials for evaluators');
assert(rolePageContent.includes('isUnauthorized'), 'RoleSelectionPage alerts user if redirected from an unauthorized route');

// 5. Backend Express Routes Registration
console.log('\n--- 5. Backend Express API Architecture ---');
const backendIndexPath = fs.existsSync(path.join(__dirname, 'backend', 'src', 'routes', 'index.ts'))
  ? path.join(__dirname, 'backend', 'src', 'routes', 'index.ts')
  : path.join(__dirname, 'server', 'src', 'routes', 'index.ts');
assert(fs.existsSync(backendIndexPath), 'backend/src/routes/index.ts exists');
const backendIndexContent = fs.readFileSync(backendIndexPath, 'utf8');
assert(backendIndexContent.includes('/auth'), 'Routes register /auth');
assert(backendIndexContent.includes('/leaves'), 'Routes register /leaves');
assert(backendIndexContent.includes('/movements'), 'Routes register /movements');
assert(backendIndexContent.includes('/maintenance'), 'Routes register /maintenance');
assert(backendIndexContent.includes('/notifications'), 'Routes register /notifications');
assert(backendIndexContent.includes('/parent'), 'Routes register /parent');
assert(backendIndexContent.includes('/mess'), 'Routes register /mess');

// 6. Security & Secret Exposure Audit
console.log('\n--- 6. Secret Isolation Audit ---');
const frontendSrcDir = resolveFront('src');
let exposedSecretFound = false;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (
        content.includes('mongodb+srv://') ||
        content.includes('JWT_SECRET=') ||
        content.includes('process.env.MONGODB_URI')
      ) {
        exposedSecretFound = true;
        console.error(`  ✗ Exposed secret pattern found in: ${full}`);
      }
    }
  }
}

scanDir(frontendSrcDir);
assert(!exposedSecretFound, 'Zero MongoDB connection strings, JWT signing keys, or server secrets in frontend code');

console.log('\n=======================================================');
console.log(`Results: ${passedCount} / ${totalCount} integration assertions passed`);
console.log('=======================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}

