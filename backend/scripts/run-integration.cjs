/* eslint-disable @typescript-eslint/no-require-imports */
/* global require, process, console, __dirname */

const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const backendDir = path.resolve(__dirname, '..');
const testFile = 'tests/integration/backendDatabase.smoke.test.ts';
const testPath = path.join(backendDir, testFile);

function fail(message) {
  console.error(`[SW-203] FAIL: ${message}`);
  process.exitCode = 1;
}

async function main() {
  // Resolve packages from backend/node_modules; npm ci installs both.
  let dotenv;
  let Client;
  try {
    ({ config: dotenv } = require('dotenv'));
    ({ Client } = require('pg'));
  } catch {
    fail('Missing backend dependencies. Run: npm ci --include=dev');
    return;
  }

  // Values supplied by CI take precedence over backend/.env.
  dotenv({ path: path.join(backendDir, '.env'), quiet: true });

  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    fail(`Missing required database configuration: ${missing.join(', ')}. Configure backend/.env or CI environment variables.`);
    return;
  }

  const port = Number(process.env.DB_PORT || '5432');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    fail('DB_PORT must be a valid TCP port (1-65535).');
    return;
  }

  if (!fs.existsSync(testPath)) {
    fail(`Integration test file not found: backend/${testFile}`);
    return;
  }

  console.log('[SW-203] Checking PostgreSQL availability...');
  const client = new Client({
    host: process.env.DB_HOST,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
  } catch (error) {
    // Do not print the connection string or error details that might include secrets.
    fail(`PostgreSQL is not ready or rejected the connection (${error.code || 'connection error'}).`);
    return;
  } finally {
    try {
      await client.end();
    } catch {
      // Connection cleanup must not mask the original outcome.
    }
  }

  console.log('[SW-203] PostgreSQL ready. Running SW-132 integration tests...');
  // package.json already provides "test": "vitest run".
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(command, ['test', '--', testFile], {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, RUN_DB_INTEGRATION: '1' },
  });

  if (result.error) {
    fail(`Unable to launch the test command (${result.error.code || 'unknown error'}).`);
  } else if (result.status !== 0) {
    fail(`Integration test command exited with status ${result.status ?? 'unknown'}.`);
  } else {
    console.log('[SW-203] PASS: integration test command succeeded.');
  }
}

main().catch((error) => {
  fail(`Runner encountered an unexpected error (${error.code || 'unexpected error'}).`);
});
