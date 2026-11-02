import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { DEFAULT_LIMIT, MAX_LIMIT, MAX_OFFSET, parsePagination } from '../src/utils/validatePagination';

// SW-121: limit and offset on GET /api/tracks. The database is mocked so no PostgreSQL is needed.
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../src/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

const track = {
  id: '1',
  albumId: '1',
  title: 'Midnight Drive',
  trackNumber: 1,
  durationMs: 214000,
  isAvailable: true,
};

describe('parsePagination', () => {
  it('applies the defaults when nothing is given', () => {
    expect(parsePagination({})).toEqual({ ok: true, limit: DEFAULT_LIMIT, offset: 0 });
  });

  it('accepts the boundary values', () => {
    expect(parsePagination({ limit: '1', offset: '0' })).toEqual({ ok: true, limit: 1, offset: 0 });
    expect(parsePagination({ limit: String(MAX_LIMIT), offset: String(MAX_OFFSET) })).toEqual({
      ok: true,
      limit: MAX_LIMIT,
      offset: MAX_OFFSET,
    });
  });

  it.each([
    ['limit 0', { limit: '0' }],
    ['limit above the maximum', { limit: String(MAX_LIMIT + 1) }],
    ['negative limit', { limit: '-1' }],
    ['decimal limit', { limit: '1.5' }],
    ['exponent limit', { limit: '1e2' }],
    ['hex limit', { limit: '0x10' }],
    ['limit with spaces', { limit: ' 5' }],
    ['empty limit', { limit: '' }],
    ['letters in limit', { limit: 'abc' }],
    ['repeated limit (array)', { limit: ['5', '10'] }],
    ['negative offset', { offset: '-1' }],
    ['decimal offset', { offset: '2.5' }],
    ['letters in offset', { offset: 'abc' }],
    ['offset above the maximum', { offset: String(MAX_OFFSET + 1) }],
    ['huge offset', { offset: '99999999999999999999' }],
    ['repeated offset (array)', { offset: ['1', '2'] }],
  ])('rejects %s', (_label, query) => {
    expect(parsePagination(query).ok).toBe(false);
  });
});

describe('GET /api/tracks pagination', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValue({ rows: [track] });
  });

  it('applies the default limit and offset when omitted, and keeps the response shape', async () => {
    const response = await request(app).get('/api/tracks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ tracks: [track], count: 1 });
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [DEFAULT_LIMIT, 0]);
  });

  it('passes validated limit and offset to the query as parameters', async () => {
    const response = await request(app).get('/api/tracks?limit=10&offset=20');

    expect(response.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(1);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(params).toEqual([10, 20]);
    expect(sql).toMatch(/LIMIT\s+\$1\s+OFFSET\s+\$2/);
    expect(sql).toMatch(/ORDER BY\s+id\s+ASC/i);
    // Values are never written into the SQL text itself.
    expect(sql).not.toMatch(/LIMIT\s+10/);
  });

  it('accepts limit alone and offset alone', async () => {
    await request(app).get('/api/tracks?limit=5');
    await request(app).get('/api/tracks?offset=3');

    expect(mockQuery.mock.calls[0][1]).toEqual([5, 0]);
    expect(mockQuery.mock.calls[1][1]).toEqual([DEFAULT_LIMIT, 3]);
  });

  it('count reflects the number of tracks in the returned page', async () => {
    mockQuery.mockResolvedValue({ rows: [track, { ...track, id: '2' }] });

    const response = await request(app).get('/api/tracks?limit=2');

    expect(response.body.count).toBe(2);
    expect(response.body.tracks).toHaveLength(2);
  });

  it.each([
    ['limit=0', 'limit must be a whole number between 1 and 100'],
    ['limit=101', 'limit must be a whole number between 1 and 100'],
    ['limit=-5', 'limit must be a whole number between 1 and 100'],
    ['limit=abc', 'limit must be a whole number between 1 and 100'],
    ['limit=1.5', 'limit must be a whole number between 1 and 100'],
    ['limit=1&limit=2', 'limit must be a whole number between 1 and 100'],
    ['offset=-1', 'offset must be a whole number between 0 and 1000000'],
    ['offset=abc', 'offset must be a whole number between 0 and 1000000'],
    ['offset=1000001', 'offset must be a whole number between 0 and 1000000'],
  ])('returns 400 JSON for %s without querying the database', async (queryString, message) => {
    const response = await request(app).get(`/api/tracks?${queryString}`);

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toEqual({ error: message });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('still ignores unrelated query parameters', async () => {
    const response = await request(app).get('/api/tracks?foo=bar');

    expect(response.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [DEFAULT_LIMIT, 0]);
  });

  it('still returns 500 JSON without internal details when the query fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error('password=hunter2 host=db.internal'));

    const response = await request(app).get('/api/tracks?limit=5&offset=0');
    consoleSpy.mockRestore();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});
