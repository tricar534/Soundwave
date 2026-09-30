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

  it('GET /api/tracks returns the track route response', async () => {
    const response = await request(app).get('/api/tracks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      tracks: [],
      count: 0
    });
  });
});