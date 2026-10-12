#!/usr/bin/env node
'use strict';
/* global process, console, require, __dirname */

/**
 * SW-207 - Reproducible, test-only environment for Role E's SW-203 runner.
 *
 * From backend/:
 *   npm run ci:integration:env:check  # configuration validation only
 *   npm run ci:integration:env        # validation + existing SW-203 runner
 *
 * Local: load backend/.env.integration.local (gitignored).
 * CI:    supply the same variables as job environment variables.
 *
 * This file does not define test cases, run migrations/seed data, or modify
 * .github/workflows/ci.yml. SW-203 remains the test execution owner.
 */
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const backendDir = path.resolve(__dirname, '..');
const defaultEnvPath = path.join(backendDir, '.env.integration.local');
const checkOnly = process.argv.slice(2).includes('--check');

function fail(message) {
  console.error(`[SW-207] FAIL: ${message}`);
  process.exitCode = 1;
}

function hasValue(name) {
  return typeof process.env[name] === 'string' && process.env[name].trim().length > 0;
}

function main() {
  let dotenv;
  try {
    ({ config: dotenv } = require('dotenv'));
  } catch {
    fail('Backend dependencies missing. Run npm ci --include=dev from backend/.');
    return;
  }

  const envPath = process.env.INTEGRATION_ENV_FILE
    ? path.resolve(backendDir, process.env.INTEGRATION_ENV_FILE)
    : defaultEnvPath;

  if (fs.existsSync(envPath)) {
    const loaded = dotenv({ path: envPath, quiet: true, override: false });
    if (loaded.error) {
      fail('Could not load the integration environment file.');
      return;
    }
    console.log('[SW-207] Loaded local integration environment (process variables take precedence).');
  } else if (process.env.INTEGRATION_ENV_FILE) {
    fail('INTEGRATION_ENV_FILE points to a file that does not exist.');
    return;
  } else {
    console.log('[SW-207] Using environment variables provided by the CI job or shell.');
  }

  const required = [
    'NODE_ENV', 'INTEGRATION_TEST_DB',
    'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  ];
  const missing = required.filter((key) => !hasValue(key));
  if (missing.length) {
    fail(`Missing integration environment variable(s): ${missing.join(', ')}. Copy backend/.env.integration.example to backend/.env.integration.local, or configure CI variables.`);
    return;
  }

  // Require an explicit opt-in to a dedicated test database.
  if (process.env.NODE_ENV !== 'test') {
    fail('NODE_ENV must be test. Refusing to run integration checks in another environment.');
    return;
  }
  if (process.env.INTEGRATION_TEST_DB !== '1') {
    fail('INTEGRATION_TEST_DB must be 1 to acknowledge this is a test-only database.');
    return;
  }
  if (!/(_test|_ci)$/i.test(process.env.DB_NAME)) {
    fail('DB_NAME must end in _test or _ci; do not run these checks on a shared/production database.');
    return;
  }

  const port = Number(process.env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    fail('DB_PORT must be a valid integer from 1 to 65535.');
    return;
  }

  // Guard against accidental configuration with a clearly production-labeled host.
  // Naming checks are a safety aid, not an alternative to database isolation.
  if (/(^|[.\-_])prod(?:uction)?([.\-_]|$)/i.test(process.env.DB_HOST)) {
    fail('DB_HOST appears to reference production. Use a dedicated local/CI database.');
    return;
  }

  console.log('[SW-207] PASS: test-only integration environment validated.');
  if (checkOnly) return;

  const runnerPath = path.join(backendDir, 'scripts', 'run-integration.cjs');
  if (!fs.existsSync(runnerPath)) {
    fail('SW-203 runner not found at backend/scripts/run-integration.cjs.');
    return;
  }

  // SW-203 uses process.env first, so these values take precedence over backend/.env.
  // Preserve its exit status so GitHub Actions can report failures accurately.
  const result = spawnSync(process.execPath, [runnerPath], {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env },
  });
  if (result.error) {
    fail(`Unable to start SW-203 (${result.error.code || 'unknown error'}).`);
  } else if (result.status !== 0) {
    fail(`SW-203 exited unsuccessfully (${result.status ?? result.signal ?? 'unknown'}).`);
  }
}

try {
  main();
} catch {
  fail('Unexpected environment setup error.');
}
