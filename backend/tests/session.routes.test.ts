import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { generateToken, hashToken } from '../src/utils/session';

// SW-123: session middleware, logout and a protected route. The database is mocked.
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../src/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

const TOKEN = generateToken();
const AUTH = { Authorization: `Bearer ${TOKEN}` };
const REJECTED = { error: 'Authentication required' };

// Mock a database where the session lookup finds (or does not find) a valid session.
function mockSession(valid: boolean) {
  mockQuery.mockImplementation(async (sql: string) => {
    if (/FROM sessions s/.test(sql)) {
      return { rows: valid ? [{ sessionId: '9', userId: '7' }] : [] };
    }
    if (/FROM users WHERE id/.test(sql)) {
      return { rows: [{ id: '7', username: 'tanu' }] };
    }
    return { rows: [] };
  });
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('requireAuth middleware (GET /api/session/me)', () => {
  it('accepts a valid, unexpired session token', async () => {
    mockSession(true);
    const res = await request(app).get('/api/session/me').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: '7', username: 'tanu' } });
  });

  it('looks the session up by the token hash, never the raw token', async () => {
    mockSession(true);
    await request(app).get('/api/session/me').set(AUTH);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(params).toEqual([hashToken(TOKEN)]);
    expect(JSON.stringify(mockQuery.mock.calls)).not.toContain(TOKEN);
    expect(sql).toMatch(/revoked_at IS NULL/);
    expect(sql).toMatch(/expires_at > now\(\)/);
  });

  it.each([
    ['no Authorization header', undefined],
    ['wrong scheme', `Basic ${TOKEN}`],
    ['empty bearer token', 'Bearer '],
    ['token too short', 'Bearer abc123'],
    ['token with non-hex characters', `Bearer ${'z'.repeat(64)}`],
    ['token with extra text', `Bearer ${TOKEN} extra`],
  ])('rejects %s with 401 and no database lookup', async (_label, header) => {
    const req = request(app).get('/api/session/me');
    const res = await (header === undefined ? req : req.set('Authorization', header));

    expect(res.status).toBe(401);
    expect(res.body).toEqual(REJECTED);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects an unknown, expired or revoked token with the same 401', async () => {
    mockSession(false);
    const res = await request(app).get('/api/session/me').set(AUTH);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(REJECTED);
  });

  it('returns 500 JSON without internal details when the lookup fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error('password=hunter2 host=db.internal'));
    const res = await request(app).get('/api/session/me').set(AUTH);
    spy.mockRestore();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});

describe('POST /api/session/logout', () => {
  it('revokes the active session and returns 204', async () => {
    mockSession(true);
    const res = await request(app).post('/api/session/logout').set(AUTH);

    expect(res.status).toBe(204);
    const update = mockQuery.mock.calls.find(([sql]) => /UPDATE sessions SET revoked_at/.test(sql));
    expect(update).toBeDefined();
    expect(update?.[1]).toEqual(['9']);
  });

  it('requires a valid token to log out', async () => {
    const res = await request(app).post('/api/session/logout');

    expect(res.status).toBe(401);
    expect(res.body).toEqual(REJECTED);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('a revoked session cannot be reused after logout', async () => {
    mockSession(true);
    await request(app).post('/api/session/logout').set(AUTH);

    // After logout the lookup (revoked_at IS NULL) finds nothing.
    mockSession(false);
    const reuse = await request(app).get('/api/session/me').set(AUTH);

    expect(reuse.status).toBe(401);
    expect(reuse.body).toEqual(REJECTED);
  });
});
