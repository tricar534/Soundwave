import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// SW-104 (fallback: authentication is not available in Sprint 4).
// Additional negative catalog/search route tests. Expected behavior comes from the
// SW-105 manual negative session (docs/cicd/sw-105-negative-session-output.txt).
// The database is mocked so these tests run without PostgreSQL.
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../src/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

describe('Negative route tests (catalog and search)', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('GET /api/tracks/:id rejects malformed IDs before touching the database', () => {
    const badIds: Array<[string, string]> = [
      ['letters', 'abc'],
      ['negative number', '-1'],
      ['decimal', '1.5'],
      ['zero', '0'],
      ['leading zero', '007'],
      ['20-digit overflow', '99999999999999999999'],
      ['one above the BIGINT maximum', '9223372036854775808'],
      ['encoded null byte', '%00'],
      ['encoded space', '%20'],
    ];

    it.each(badIds)('returns 400 JSON for %s (%s)', async (_label, id) => {
      const response = await request(app).get(`/api/tracks/${id}`);

      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toEqual({ error: 'Invalid track ID' });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('accepts the largest valid BIGINT and returns 404 when it is not in the catalog', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/api/tracks/9223372036854775807');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Track not found' });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/search input handling', () => {
    it('accepts a query of exactly 100 characters', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app).get(`/api/search?q=${'a'.repeat(100)}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tracks: [], count: 0 });
    });

    it('trims spaces before checking the length', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app).get(`/api/search?q=%20%20${'a'.repeat(100)}%20%20`);

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [`%${'a'.repeat(100)}%`]);
    });

    it('returns 400 when q is repeated (array instead of string)', async () => {
      const response = await request(app).get('/api/search?q=one&q=two');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Search query must be between 1 and 100 characters',
      });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('treats SQL-style text as data, passing it as a parameter and never in the SQL string', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const attack = "' OR 1=1 --";

      const response = await request(app).get('/api/search').query({ q: attack });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tracks: [], count: 0 });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).not.toContain(attack);
      expect(sql).toMatch(/ILIKE\s+\$1/);
      expect(params).toEqual([`%${attack}%`]);
    });

    it('returns 500 JSON without leaking database details when the search fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        mockQuery.mockRejectedValue(new Error('password=hunter2 host=db.internal'));

        const response = await request(app).get('/api/search?q=love');

        expect(response.status).toBe(500);
        expect(response.headers['content-type']).toMatch(/json/);
        expect(response.body).toEqual({ error: 'Internal server error' });
        expect(JSON.stringify(response.body)).not.toMatch(/hunter2|db\.internal|stack/i);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Unexpected parameters and unsupported methods', () => {
    it('ignores unexpected query parameters on the catalog', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/api/tracks?foo=bar');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ tracks: [], count: 0 });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    type UnsupportedMethod = 'post' | 'put' | 'delete' | 'patch';
    const unsupported: Array<[UnsupportedMethod, string]> = [
      ['post', '/api/tracks'],
      ['put', '/api/tracks'],
      ['delete', '/api/tracks/1'],
      ['patch', '/api/tracks/1'],
      ['post', '/api/search?q=love'],
    ];

    it.each(unsupported)('rejects %s %s without touching the database', async (method, path) => {
      const response = await request(app)[method](path);

      // Currently 404 (SW-105 defect D2); 405 would also be correct, so accept either.
      expect([404, 405]).toContain(response.status);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  // Known gaps found in the SW-105 session. Left as todos until the standardized
  // error handler is merged (same dependency as SW-103).
  it.todo('returns a JSON 404 for unknown routes (SW-105 defect D2)');
  it.todo('returns a JSON 400 without a stack trace for an invalid JSON body (SW-105 defect D1)');
});
