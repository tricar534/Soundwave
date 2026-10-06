import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Backend routes', () => {
  it('GET /health returns backend health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'soundwave-backend'
    });
  });

  it('GET /api/tracks returns the track list response', async () => {
    const response = await request(app).get('/api/tracks');

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("tracks");
    expect(Array.isArray(response.body.tracks)).toBe(true);

    expect(response.body).toHaveProperty("count");
    expect(typeof response.body.count).toBe("number");

    expect(response.body.count).toBe(response.body.tracks.length);
  });
});
