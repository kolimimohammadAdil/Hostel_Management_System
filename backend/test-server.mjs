import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fetchUrl(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests(mode = 'dev') {
  console.log(`\n======================================================`);
  console.log(`🧪 Testing Backend Server in Mode: [${mode.toUpperCase()}]`);
  console.log(`======================================================`);

  const serverScript =
    mode === 'dev'
      ? path.join(__dirname, 'node_modules/tsx/dist/cli.mjs')
      : path.join(__dirname, 'dist/server.js');

  const args = mode === 'dev' ? [path.join(__dirname, 'src/server.ts')] : [];

  const child = spawn(process.execPath, [serverScript, ...args], {
    cwd: __dirname,
    env: { ...process.env, PORT: '5000', NODE_ENV: mode === 'dev' ? 'development' : 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (d) => {
    process.stdout.write(`[SERVER] ${d.toString()}`);
  });
  child.stderr.on('data', (d) => {
    process.stderr.write(`[SERVER ERR] ${d.toString()}`);
  });

  // Give server time to bind port
  await wait(1800);

  try {
    // 1. Root /
    console.log('\n--- 1. Testing GET / ---');
    const rootRes = await fetchUrl('http://localhost:5000/');
    console.log('Status:', rootRes.status);
    console.log('Response:', JSON.stringify(rootRes.body, null, 2));
    if (rootRes.status !== 200 || !rootRes.body?.success) {
      throw new Error(`GET / failed with status ${rootRes.status}`);
    }

    // 2. Health /api/health
    console.log('\n--- 2. Testing GET /api/health ---');
    const healthRes = await fetchUrl('http://localhost:5000/api/health');
    console.log('Status:', healthRes.status);
    console.log('Response:', JSON.stringify(healthRes.body, null, 2));
    if (healthRes.status !== 200 || healthRes.body?.status !== 'healthy') {
      throw new Error(`GET /api/health failed with status ${healthRes.status}`);
    }

    // 3. 404 Unmatched Route /api/unknown-test
    console.log('\n--- 3. Testing GET /api/unknown-test (404 Handler) ---');
    const notFoundRes = await fetchUrl('http://localhost:5000/api/unknown-test');
    console.log('Status:', notFoundRes.status);
    console.log('Response:', JSON.stringify(notFoundRes.body, null, 2));
    if (notFoundRes.status !== 404 || notFoundRes.body?.success !== false) {
      throw new Error(`GET /api/unknown-test did not return 404 JSON, got ${notFoundRes.status}`);
    }

    console.log(`\n✅ All tests in mode [${mode.toUpperCase()}] passed with flying colors!`);
  } finally {
    console.log(`\nStopping server process (PID: ${child.pid})...`);
    child.kill('SIGINT');
    await wait(400);
    child.kill('SIGKILL');
  }
}

async function main() {
  try {
    await runTests('dev');
    await wait(800);
    await runTests('production');
    console.log('\n🎉 ALL BACKEND VERIFICATIONS COMPLETED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  }
}

main();

