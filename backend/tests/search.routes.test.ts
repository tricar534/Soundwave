
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// Mock PostgreSQL so Search tests do not require Docker.
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../src/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

describe('GET /api/search', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  // Test 1: Search returns matching track records.
  it('returns matching tracks for a valid search', async () => {
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

    const response = await request(app)
      .get('/api/search?q=midnight');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tracks: [track],
      count: 1,
    });
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  // Test 2: Reject requests without a search query.
  it('returns 400 when the search query is missing', async () => {
    const response = await request(app).get('/api/search');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Search query must be between 1 and 100 characters',
    });

    expect(mockQuery).not.toHaveBeenCalled();
  });

  // Test 3: Reject an empty search query.
  it('returns 400 for an empty search query', async () => {
    const response = await request(app).get('/api/search?q=');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Search query must be between 1 and 100 characters',
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  // Test 4: Reject whitespace-only search queries.
  it('returns 400 for a whitespace-only search query', async () => {
    const response = await request(app).get('/api/search?q=%20%20%20');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Search query must be between 1 and 100 characters',
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  // Test 5: Reject queries exceeding the maximum length.
  it('returns 400 for a search query over 100 characters', async () => {
    const longQuery = 'a'.repeat(101);

    const response = await request(app)
      .get('/api/search')
      .query({ q: longQuery });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Search query must be between 1 and 100 characters',
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  // Test 6: Handle PostgreSQL query failures safely.
  it('returns 500 when the database search fails', async () => {
    mockQuery.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app).get('/api/search?q=midnight');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Internal server error',
    });
    expect(response.text).not.toContain('Database connection failed');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

});
