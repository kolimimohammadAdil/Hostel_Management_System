import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const pythonCmd = isWindows ? 'python' : 'python3';

console.log('=======================================================');
console.log('🚀 Starting ALTS Hostel Portal Full Stack (All Services)');
console.log('🏛️  Institution: Anantha Lakshmi Institute of Technology & Sciences');
console.log('📍 Services: Frontend (5173), Backend (5000), Face AI (5001)');
console.log('=======================================================\n');

function runService(name, command, args, cwd, prefix) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: isWindows,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${prefix} ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${prefix} ${line}`);
      }
    });
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${prefix} Process exited with code ${code}`);
    }
  });

  return child;
}

// 1. Backend REST & WebSocket API (Port 5000)
const backendProcess = runService(
  'backend',
  npmCmd,
  ['run', 'dev'],
  path.join(rootDir, 'backend'),
  '[\x1b[34mBACKEND\x1b[0m]'
);

// 2. Frontend React 19 + Vite Application (Port 5173)
const frontendProcess = runService(
  'frontend',
  npmCmd,
  ['run', 'dev'],
  path.join(rootDir, 'frontend'),
  '[\x1b[32mFRONTEND\x1b[0m]'
);

// 3. OpenCV YuNet + SFace Biometric Microservice (Port 5001)
const faceProcess = runService(
  'face_service',
  pythonCmd,
  [path.join('face_service', 'service.py')],
  rootDir,
  '[\x1b[35mFACE-AI\x1b[0m]'
);

function cleanup() {
  console.log('\nShutting down ALTS services...');
  if (isWindows) {
    if (backendProcess.pid) spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
    if (frontendProcess.pid) spawn('taskkill', ['/pid', frontendProcess.pid, '/f', '/t']);
    if (faceProcess.pid) spawn('taskkill', ['/pid', faceProcess.pid, '/f', '/t']);
  } else {
    backendProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
    faceProcess.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
