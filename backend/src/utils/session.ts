import crypto from 'node:crypto';

// Sessions last 7 days. SW-123 middleware and any session expiry tests reuse this value.
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Create a random session token (256 bits). It is returned to the client once and never stored.
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Only this hash is stored in the sessions table.
// SHA-256 is enough here because the token is already 256 bits of randomness,
// so there is nothing to brute-force. Passwords use Argon2id instead.
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
