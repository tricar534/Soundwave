
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
});
