
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// Simulate PostgreSQL without requiring a running database.
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../src/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

describe('GET /api/tracks/:id', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  // 1. Successful track retrieval
  it('returns the correct track and status 200', async () => {
    const track = {
      id: '17',
      albumId: '5',
      title: 'Midnight Drive',
      trackNumber: 1,
      durationMs: 214000,
      isAvailable: true,
    };

    mockQuery.mockResolvedValue({
      rows: [track],
    });

    const response = await request(app).get('/api/tracks/17');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ track });
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  // 2. Invalid ID and security cases
  it.each([
    'abc',
    '0',
    '-1',
    '17abc',
    '01',
    '9223372036854775808',
    '999999999999999999999999',
    '1%20OR%201%3D1',
  ])('rejects invalid ID %s without querying the database', async (id) => {
    const response = await request(app).get(`/api/tracks/${id}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid track ID',
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  // 3. Valid but nonexistent track
  it('returns 404 when a track does not exist', async () => {
    mockQuery.mockResolvedValue({
      rows: [],
    });

    const response = await request(app).get('/api/tracks/999999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Track not found',
    });
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  // 4. PostgreSQL BigInt boundaries
  it.each([
    '1',
    '9223372036854775807',
  ])('accepts valid BigInt boundary %s', async (id) => {
    mockQuery.mockResolvedValue({
      rows: [],
    });

    const response = await request(app).get(`/api/tracks/${id}`);

    expect(response.status).toBe(404);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  // 5. SQL query must be parameterized
  it('uses a parameterized SQL query', async () => {
    mockQuery.mockResolvedValue({
      rows: [],
    });

    await request(app).get('/api/tracks/17');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/WHERE\s+id\s*=\s*\$1::bigint/),
      ['17']
    );
  });

  // 6. Database failure handling
  it('returns 500 without exposing internal database errors', async () => {
    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      mockQuery.mockRejectedValue(
        new Error('Sensitive database connection details')
      );

      const response = await request(app).get('/api/tracks/17');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error',
      });

      expect(JSON.stringify(response.body))
        .not.toContain('Sensitive database connection details');
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
