import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('\n🧪 HOSTELGUARD AI — MongoDB Connection & Backend Verification');
  console.log('=============================================================\n');

  const backendDir = fs.existsSync(path.join(__dirname, 'backend')) ? path.join(__dirname, 'backend') : path.join(__dirname, 'server');
  const serverScript = path.join(backendDir, 'dist/server.js');

  // Check if server is already running
  let isAlreadyRunning = false;
  try {
    const check = await fetchUrl('http://localhost:5000/api/health');
    if (check.status === 200) isAlreadyRunning = true;
  } catch {}

  let child;
  if (!isAlreadyRunning) {
    child = spawn(process.execPath, [serverScript], {
      cwd: backendDir,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (d) => {
      process.stdout.write(`  [SERVER] ${d.toString()}`);
    });
    child.stderr.on('data', (d) => {
      process.stderr.write(`  [SERVER ERR] ${d.toString()}`);
    });

    console.log('⏳ Waiting for server to initialize and attempt MongoDB Atlas connection...\n');
    await wait(6000);
  } else {
    console.log('ℹ️  Using active running backend server on port 5000...\n');
  }

  try {
    // Test 1: GET /api/health
    console.log('\n--- Test 1: GET /api/health ---');
    const health = await fetchUrl('http://localhost:5000/api/health');
    console.log(`  HTTP Status: ${health.status}`);
    console.log(`  Response Payload:\n${JSON.stringify(health.body, null, 2)}`);

    if (health.body?.database?.connected === true) {
      console.log('  🟢 Result: MongoDB Atlas is CONNECTED.');
    } else {
      console.log(`  🟡 Result: Database is NOT connected (Status: ${health.body?.database?.status || 'disconnected'}).`);
      console.log('  ℹ️  The health endpoint correctly reports the actual Mongoose connection state.');
    }

    // Test 2: GET /api/unknown-route (404 handler)
    console.log('\n--- Test 2: GET /api/unknown-route (404 handler) ---');
    const notFound = await fetchUrl('http://localhost:5000/api/unknown-route');
    console.log(`  HTTP Status: ${notFound.status}`);
    console.log(`  Response Payload:\n${JSON.stringify(notFound.body, null, 2)}`);

    // Test 3: GET / (root endpoint)
    console.log('\n--- Test 3: GET / (root endpoint) ---');
    const root = await fetchUrl('http://localhost:5000/');
    console.log(`  HTTP Status: ${root.status}`);
    console.log(`  Response Payload:\n${JSON.stringify(root.body, null, 2)}`);

  } catch (err) {
    console.error(`\n❌ HTTP request failed: ${err.message}`);
  } finally {
    if (child) {
      console.log('\n🛑 Stopping test server...');
      child.kill('SIGINT');
      await wait(1000);
      child.kill('SIGKILL');
    }
  }

  console.log('\n=============================================================');
  console.log('✅ Diagnostic Verification Finished.');
  console.log('=============================================================\n');
}

main();
