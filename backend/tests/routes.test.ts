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
  // Reset database mock before test.
  beforeEach(() => {
    mockQuery.mockReset();
  });

  // Test 1: Health endpoint
  it('GET /health returns backend health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'soundwave-backend'
    });
  });

  // Test 2: Track-list response and empty catalog.
  it('GET /api/tracks returns the track list response', async () => {
    // Simulate database with no tracks.
    mockQuery.mockResolvedValue({
      rows: [],
    });

    const response = await request(app).get('/api/tracks');

    // Confirm successful http response
    expect(response.status).toBe(200);

    // Confirm tracks is an array
    expect(response.body).toHaveProperty("tracks");
    expect(Array.isArray(response.body.tracks)).toBe(true);

    // Confirm count is a number matching the array length.
    expect(response.body).toHaveProperty("count");
    expect(typeof response.body.count).toBe("number");
    expect(response.body.count).toBe(response.body.tracks.length);

    // Confirm an empty catalog returns the expected JSON.
    expect( response.body).toEqual({
      tracks: [],
      count: 0,
    });
  });


 // Test 3: Verify multiple track records returned by a mocked database query.
  it('returns multiple tracks from PostgreSQL query results', async () => {
    // Simulate two existing tracks in PostgreSQL.
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
    

    // Make database mock return both tracks.
    mockQuery.mockResolvedValue({
      rows: tracks,
    });

    const response = await request(app).get('/api/tracks');

    // Confirm successful http response
    expect(response.status).toBe(200);

    // Confirm the returned tracks and count.
    expect(response.body).toEqual({
      tracks,
      count: 2,
    });

    // Confirm database was queried exactly once.
    expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });
