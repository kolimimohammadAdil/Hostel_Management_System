import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('=======================================================');
console.log('🚀 Starting ALTS Hostel Portal (Frontend & Backend)');
console.log('🏛️  Institution: Anantha Lakshmi Institute of Technology & Sciences');
console.log('=======================================================\n');

function runService(name, cwd, prefix) {
  const child = spawn(npmCmd, ['run', 'dev'], {
    cwd,
    stdio: 'pipe',
    shell: isWindows,
    env: { ...process.env, FORCE_COLOR: '1' }
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
    console.log(`${prefix} Process exited with code ${code}`);
  });

  return child;
}

const backendProcess = runService(
  'backend',
  path.join(rootDir, 'backend'),
  '[\x1b[34mBACKEND\x1b[0m]'
);

const frontendProcess = runService(
  'frontend',
  path.join(rootDir, 'frontend'),
  '[\x1b[32mFRONTEND\x1b[0m]'
);

function cleanup() {
  console.log('\nShutting down ALTS services...');
  if (isWindows) {
    if (backendProcess.pid) spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
    if (frontendProcess.pid) spawn('taskkill', ['/pid', frontendProcess.pid, '/f', '/t']);
  } else {
    backendProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

