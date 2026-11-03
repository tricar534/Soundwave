import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// SW-223: Only these public URLs are currently used by Soundwave's frontend.
const APPROVED_PUBLIC_KEYS = new Set(['VITE_API_URL', 'VITE_BACKEND_URL']);
const SENSITIVE_NAME = /(PASSWORD|PASSWD|SECRET|TOKEN|PRIVATE|CREDENTIAL|DATABASE_URL|API_KEY|ACCESS_KEY)/i;

function parseEnvVariables(contents) {
  const entries = [];
  for (const line of contents.split(/\r?\n/)) {
    if (/^\s*(#|$)/.test(line)) continue;
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, name, raw] = match;
    let value = raw.trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    entries.push([name, value]);
  }
  return entries;
}

function checkEntry(key, value, origin, errors, isFrontendFile) {
  const isVitePublic = key.toUpperCase().startsWith('VITE_');
  if (!isVitePublic && !isFrontendFile) return;

  if (SENSITIVE_NAME.test(key)) {
    errors.push(`${origin}: prohibited sensitive variable name ${key}`);
    return;
  }
  if (!isVitePublic) return;

  if (!APPROVED_PUBLIC_KEYS.has(key)) {
    errors.push(`${origin}: unapproved public Vite variable ${key}`);
    return;
  }

  // A public URL must not embed credentials, query parameters or fragments.
  if (!value) return; // Soundwave already supports empty values via fallback URLs.
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) ||
        !parsed.hostname || parsed.username || parsed.password ||
        parsed.search || parsed.hash) {
      errors.push(`${origin}: ${key} must be an HTTP(S) URL without credentials, query or fragment`);
    }
  } catch {
    errors.push(`${origin}: ${key} must be an HTTP(S) URL`);
  }
}

export function validateConfig(directory = process.cwd(), environment = process.env) {
  const errors = [];
  const envFiles = readdirSync(directory)
    .filter((name) => /^\.env(?:\..+)?$/.test(name))
    .sort();

  for (const name of envFiles) {
    const content = readFileSync(resolve(directory, name), 'utf8');
    for (const [key, value] of parseEnvVariables(content)) {
      checkEntry(key, value, name, errors, true);
    }
  }
  for (const [key, value] of Object.entries(environment)) {
    if (key.toUpperCase().startsWith('VITE_')) {
      checkEntry(key, value, 'process environment', errors, false);
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateConfig();
  if (errors.length) {
    console.error('FAIL: prohibited frontend configuration detected.');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log('PASS: frontend configuration contains only approved public settings.');
  }
}
