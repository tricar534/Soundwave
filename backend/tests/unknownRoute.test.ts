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

  it('returns 200 for the root path (SW-215 API directory page)', async () => {
    // '/' is a real registered route (the backend API directory page added
    // in SW-215), not an unknown route - this is an equivalence check that
    // a *known* root path is unaffected by the unknown-route handling below.
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
  });

  it('returns 404 for an unsupported HTTP method on a route that only accepts GET', async () => {
    // /health is only registered with app.get(), so POST has no matching
    // route - a related equivalence class to "unknown route" (right path,
    // wrong method).
    const response = await request(app).post('/health');

    expect(response.status).toBe(404);
  });
});
