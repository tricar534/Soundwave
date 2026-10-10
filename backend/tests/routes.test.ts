import { beforeEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// Mock PostgreSQL so API route tests run independently.
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../src/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

describe('Backend routes', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  // Health endpoint
  it('GET /health returns backend health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'soundwave-backend'
    });
  });

  // Track-list response contract.
  it('GET /api/tracks returns the track list response', async () => {
    mockQuery.mockResolvedValue({
      rows: [],
    });

    const response = await request(app).get('/api/tracks');

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("tracks");
    expect(Array.isArray(response.body.tracks)).toBe(true);

    expect(response.body).toHaveProperty("count");
    expect(typeof response.body.count).toBe("number");

    expect(response.body.count).toBe(response.body.tracks.length);
  });


 // Verify multiple track records returned by a mocked database query.
  it('returns multiple tracks from PostgreSQL query results', async () => {
    const tracks = [
      {
        id: '17',
        albumId: '5',
        title: 'Midnight Drive',
        trackNumber: 1,
        durationMs: 214000,
        isAvailable: true,
      },
      {
        id: '18',
        albumId: '5',
        title: 'Signal Lost',
        trackNumber: 2,
        durationMs: 198000,
        isAvailable: true,
      },
    ];

    mockQuery.mockResolvedValue({
      rows: tracks,
    });

    const response = await request(app).get('/api/tracks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tracks,
      count: 2,
    });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });
