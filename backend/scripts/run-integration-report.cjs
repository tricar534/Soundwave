/* eslint-disable @typescript-eslint/no-require-imports */
/* global require, process, console, __dirname */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const backendDir = path.resolve(__dirname, '..');
const reportDir = path.join(backendDir, 'reports', 'integration');
const jsonPath = path.join(reportDir, 'vitest-results.json');
const junitPath = path.join(reportDir, 'junit.xml');
const summaryPath = path.join(reportDir, 'summary.json');

function numeric(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function safeFailureNames(data) {
  const failures = [];
  for (const suite of data.testResults || []) {
    for (const test of suite.assertionResults || []) {
      if (test.status === 'failed') {
        // Print test titles only; do not include stack traces or connection data.
        failures.push(String(test.fullName || test.title || 'Unnamed test'));
      }
    }
  }
  return failures;
}

function main() {
  fs.mkdirSync(reportDir, { recursive: true });
  // Never treat stale reports from a prior successful run as current results.
  for (const file of [jsonPath, junitPath, summaryPath]) {
    fs.rmSync(file, { force: true });
  }

  console.log('[SW-209] Running integration checks and generating CI-readable results...');
  const script = path.join(backendDir, 'scripts', 'run-integration-env.cjs');
  let exitCode = 1;
  let preflightIssue = '';

  if (!fs.existsSync(script)) {
    preflightIssue = 'SW-207 environment runner is missing.';
  } else {
    const result = spawnSync(process.execPath, [script], {
      cwd: backendDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        SW209_JSON_REPORT: jsonPath,
        SW209_JUNIT_REPORT: junitPath,
      },
    });
    exitCode = Number.isInteger(result.status) ? result.status : 1;
    if (result.error) {
      preflightIssue = `Integration runner could not start (${result.error.code || 'unknown'}).`;
    } else if (!fs.existsSync(jsonPath)) {
      preflightIssue = 'Vitest report was not produced (configuration, database, or runner failed).';
    }
  }

  let data;
  if (fs.existsSync(jsonPath)) {
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch {
      preflightIssue = 'Vitest JSON report could not be read.';
    }
  }

  const passed = numeric(data?.numPassedTests);
  const failed = numeric(data?.numFailedTests);
  const total = numeric(data?.numTotalTests);
  const executed = passed + failed;
  const pending = Math.max(0, total - executed);
  const failedChecks = data ? safeFailureNames(data) : [];
  const junitPresent = fs.existsSync(junitPath);
  const result = exitCode === 0 && data && failed === 0 && junitPresent ? 'PASS' : 'FAIL';
  const summary = {
    task: 'SW-209',
    result,
    executed,
    passed,
    failed,
    pending,
    failedChecks,
    files: {
      json: data ? 'vitest-results.json' : null,
      junit: junitPresent ? 'junit.xml' : null,
    },
    ...(preflightIssue ? { note: preflightIssue } : {}),
  };

  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`[SW-209] Executed: ${executed} | Passed: ${passed} | Failed: ${failed} | Pending/TODO: ${pending}`);
  for (const name of failedChecks) console.error(`[SW-209] Failed check: ${name}`);
  if (preflightIssue) console.error(`[SW-209] ${preflightIssue}`);
  console.log('[SW-209] Reports: backend/reports/integration/');
  console.log(`[SW-209] ${result}: integration result generation ${result === 'PASS' ? 'succeeded' : 'failed'}.`);
  process.exitCode = result === 'PASS' ? 0 : 1;
}

try {
  main();
} catch (error) {
  // Safe error message; avoid including paths that may embed credentials.
  console.error(`[SW-209] FAIL: Could not generate results (${error.code || 'unexpected error'}).`);
  process.exitCode = 1;
}
