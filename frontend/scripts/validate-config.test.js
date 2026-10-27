import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const validator = join(process.cwd(), 'scripts', 'validate-config.mjs');
const tempDirs = [];

function runWithConfig(config, extraEnvironment = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'soundwave-config-test-'));
  tempDirs.push(directory);
  writeFileSync(join(directory, '.env'), config, 'utf8');
  const safeEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith('VITE_'))
  );
  return spawnSync(process.execPath, [validator], {
    cwd: directory,
    encoding: 'utf8',
    env: { ...safeEnvironment, ...extraEnvironment },
  });
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('SW-223 frontend sensitive configuration safeguard', () => {
  it('accepts approved public frontend URLs', () => {
    const result = runWithConfig(
      'VITE_API_URL=http://localhost:4000/api\nVITE_BACKEND_URL=http://localhost:4000\n'
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('PASS:');
  });

  it('rejects a synthetic sensitive configuration without printing its value', () => {
    const marker = 'SYNTHETIC_TEST_SECRET_NEVER_REAL';
    const result = runWithConfig(`VITE_DATABASE_PASSWORD=${marker}\n`);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FAIL:');
    expect(result.stderr).toContain('VITE_DATABASE_PASSWORD');
    expect(result.stderr).not.toContain(marker);
  });

  it('rejects credentials embedded in an otherwise approved URL', () => {
    const marker = 'SYNTHETIC_PASSWORD';
    const result = runWithConfig(`VITE_API_URL=https://demo:${marker}@example.org/api\n`);
    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toContain(marker);
  });

  it('rejects inherited sensitive VITE_ environment variables', () => {
    const marker = 'SYNTHETIC_TOKEN';
    const result = runWithConfig('', { VITE_API_TOKEN: marker });
    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toContain(marker);
  });

  it('avoids false positives for benign comments and public URL paths', () => {
    // Password/token text in a comment or public URL path is not a credential.
    const result = runWithConfig([
      '# Reminder: never publish a password or token in frontend variables',
      '# VITE_DATABASE_PASSWORD=SYNTHETIC_COMMENT_ONLY',
      'VITE_API_URL=https://example.test/token-help',
      'VITE_BACKEND_URL=http://localhost:4000',
      '',
    ].join('\n'));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('PASS:');
  });
});
