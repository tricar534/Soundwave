import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// SW-102: Unknown-route coverage for the Express app, tested with Supertest.
// No database mocking is needed here - these requests never reach a route
// handler, so they never touch PostgreSQL.

describe('unknown routes', () => {
  it('returns 404 for a path that does not match any route', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
  });

  it('returns 404 for a nested unknown path', async () => {
    const response = await request(app).get('/api/tracks/17/extra/nested');

    expect(response.status).toBe(404);
  });

  it('returns 404 for the root path', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(404);
  });

  it('returns 404 for an unsupported HTTP method on a route that only accepts GET', async () => {
    // /health is only registered with app.get(), so POST has no matching
    // route - a related equivalence class to "unknown route" (right path,
    // wrong method).
    const response = await request(app).post('/health');

    expect(response.status).toBe(404);
  });
});
