import { Router } from 'express';
import argon2 from 'argon2';
import { pool } from '../db';
import { SESSION_TTL_MS, generateToken, hashToken } from '../utils/session';

const router = Router();

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const ARGON2_OPTIONS = { type: argon2.argon2id } as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Checked against when the username does not exist, so an unknown user and a
// wrong password take about the same time (prevents username enumeration).
const dummyHash = argon2.hash('timing-equalizer', ARGON2_OPTIONS);
dummyHash.catch(() => {});

// Same body for an unknown username, a wrong password and an inactive account.
const INVALID_CREDENTIALS = { error: 'Invalid username or password' };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// Register a new user with an Argon2id password hash.
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body ?? {};

  if (
    !isNonEmptyString(username) ||
    username.length > 50 ||
    !isNonEmptyString(email) ||
    email.length > 255 ||
    !EMAIL_PATTERN.test(email) ||
    typeof password !== 'string' ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    res.status(400).json({ error: 'Invalid registration data' });
    return;
  }

  try {
    const role = await pool.query('SELECT id FROM roles WHERE name = $1', ['USER']);

    if (role.rows.length === 0) {
      throw new Error('Default USER role is not seeded');
    }

    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

    // updated_at has no database default, so it is set here.
    const result = await pool.query(
      `
      INSERT INTO users (role_id, username, email, password_hash, updated_at)
      VALUES ($1, $2, $3, $4, now())
      RETURNING id::text AS id, username
      `,
      [role.rows[0].id, username, email, passwordHash]
    );

    // The password hash is never returned.
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    // 23505 = unique violation (username or email already exists).
    // Catching it avoids a check-then-insert race between two requests.
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Username or email already in use' });
      return;
    }

    console.error('Failed to register user:', error);

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify credentials and create a session. Only the token hash is stored.
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (
    !isNonEmptyString(username) ||
    typeof password !== 'string' ||
    password.length === 0 ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT id::text AS id, password_hash AS "passwordHash", is_active AS "isActive"
      FROM users
      WHERE username = $1
      LIMIT 1
      `,
      [username]
    );

    const user = result.rows[0];

    let passwordOk = false;
    try {
      passwordOk = await argon2.verify(user?.passwordHash ?? (await dummyHash), password);
    } catch {
      // A malformed stored hash counts as a failed login, never a different error.
      passwordOk = false;
    }

    if (!user || !user.isActive || !passwordOk) {
      res.status(401).json(INVALID_CREDENTIALS);
      return;
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await pool.query(
      `
      INSERT INTO sessions (user_id, token_hash, expires_at)
      VALUES ($1::bigint, $2, $3)
      `,
      [user.id, hashToken(token), expiresAt]
    );

    // The raw token is returned once and is never stored.
    res.status(200).json({ token, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('Failed to log in:', error);

    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
