import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import app from '../src/app';
import { hashToken } from '../src/utils/session';

// SW-122: register and login. The database is mocked so no PostgreSQL is needed.
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../src/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

const PASSWORD = 'correct-horse-battery';
const VALID_REGISTRATION = { username: 'tanu', email: 'tanu@example.com', password: PASSWORD };

let storedHash: string;

beforeAll(async () => {
  storedHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
});

// Find the INSERT the route ran, so tests can inspect exactly what was stored.
function findCall(pattern: RegExp) {
  return mockQuery.mock.calls.find(([sql]) => pattern.test(String(sql)));
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockQuery.mockImplementation(async (sql: string) => {
      if (/FROM roles/.test(sql)) return { rows: [{ id: '1' }] };
      if (/INSERT INTO users/.test(sql)) return { rows: [{ id: '7', username: 'tanu' }] };
      return { rows: [] };
    });
  });

  it('creates a user with an Argon2id password hash and never returns the hash', async () => {
    const response = await request(app).post('/api/auth/register').send(VALID_REGISTRATION);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ user: { id: '7', username: 'tanu' } });
    expect(JSON.stringify(response.body)).not.toMatch(/argon2|password/i);

    const insert = findCall(/INSERT INTO users/);
    const storedPasswordHash = insert?.[1][3] as string;
    expect(storedPasswordHash.startsWith('$argon2id$')).toBe(true);
    expect(storedPasswordHash).not.toContain(PASSWORD);
    expect(await argon2.verify(storedPasswordHash, PASSWORD)).toBe(true);
  });

  it('returns a controlled 409 for a duplicate username or email', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockQuery.mockImplementation(async (sql: string) => {
      if (/FROM roles/.test(sql)) return { rows: [{ id: '1' }] };
      throw Object.assign(new Error('duplicate key value violates unique constraint "uq_users_email"'), {
        code: '23505',
      });
    });

    const response = await request(app).post('/api/auth/register').send(VALID_REGISTRATION);
    consoleSpy.mockRestore();

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Username or email already in use' });
    expect(JSON.stringify(response.body)).not.toMatch(/constraint|uq_users/i);
  });

  const badInputs: Array<[string, Record<string, unknown>]> = [
    ['missing username', { email: 'a@example.com', password: PASSWORD }],
    ['missing email', { username: 'tanu', password: PASSWORD }],
    ['missing password', { username: 'tanu', email: 'a@example.com' }],
    ['invalid email', { username: 'tanu', email: 'not-an-email', password: PASSWORD }],
    ['password under 8 characters', { username: 'tanu', email: 'a@example.com', password: 'short' }],
    ['password over 128 characters', { username: 'tanu', email: 'a@example.com', password: 'a'.repeat(129) }],
    ['username over 50 characters', { username: 'u'.repeat(51), email: 'a@example.com', password: PASSWORD }],
    ['non-string password', { username: 'tanu', email: 'a@example.com', password: 12345678 }],
  ];

  it.each(badInputs)('returns 400 for %s without touching the database', async (_label, body) => {
    const response = await request(app).post('/api/auth/register').send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid registration data' });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 500 without leaking details when the database fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error('password=hunter2 host=db.internal'));

    const response = await request(app).post('/api/auth/register').send(VALID_REGISTRATION);
    consoleSpy.mockRestore();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});

describe('POST /api/auth/login', () => {
  const activeUser = () => ({ id: '7', passwordHash: storedHash, isActive: true });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('verifies credentials, creates a session, and stores only the token hash with an expiry', async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      if (/FROM users/.test(sql)) return { rows: [activeUser()] };
      return { rows: [] };
    });

    const before = Date.now();
    const response = await request(app).post('/api/auth/login').send({ username: 'tanu', password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.token).toMatch(/^[0-9a-f]{64}$/);

    const insert = findCall(/INSERT INTO sessions/);
    const [userId, tokenHash, expiresAt] = insert?.[1] as [string, string, Date];

    expect(userId).toBe('7');
    expect(tokenHash).toBe(hashToken(response.body.token));
    expect(tokenHash).not.toBe(response.body.token);
    expect(JSON.stringify(insert)).not.toContain(response.body.token);
    expect(expiresAt.getTime()).toBeGreaterThan(before);
    expect(response.body.expiresAt).toBe(expiresAt.toISOString());
  });

  it('returns the same generic error for an unknown user and a wrong password', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const unknownUser = await request(app).post('/api/auth/login').send({ username: 'nobody', password: PASSWORD });

    mockQuery.mockResolvedValueOnce({ rows: [activeUser()] });
    const wrongPassword = await request(app).post('/api/auth/login').send({ username: 'tanu', password: 'wrong-password' });

    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.body).toEqual({ error: 'Invalid username or password' });
    expect(wrongPassword.body).toEqual(unknownUser.body);
    expect(findCall(/INSERT INTO sessions/)).toBeUndefined();
  });

  it('gives an inactive account the same generic error and no session', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...activeUser(), isActive: false }] });

    const response = await request(app).post('/api/auth/login').send({ username: 'tanu', password: PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid username or password' });
    expect(findCall(/INSERT INTO sessions/)).toBeUndefined();
  });

  it('treats a malformed stored hash as a failed login, not a server error', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...activeUser(), passwordHash: 'not-a-real-hash' }] });

    const response = await request(app).post('/api/auth/login').send({ username: 'tanu', password: PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid username or password' });
  });

  it.each([
    ['missing password', { username: 'tanu' }],
    ['missing username', { password: PASSWORD }],
    ['empty body', {}],
  ])('returns 400 for %s without touching the database', async (_label, body) => {
    const response = await request(app).post('/api/auth/login').send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Username and password are required' });
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
