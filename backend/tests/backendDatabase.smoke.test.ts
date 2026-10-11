/**
 * Requires a dedicated, migrated and seeded TEST database and the /ready
 * endpoint from the Sprint 3 readiness implementation.
 *
 * Explicit opt-in prevents ordinary backend unit tests from depending on
 * PostgreSQL before the team wires this suite into the CI pipeline.
 *
 * From backend/:
 *   RUN_DB_INTEGRATION=1 npx vitest run tests/integration/backendDatabase.smoke.test.ts
 */
import { afterAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/db';

const runIntegration = process.env.RUN_DB_INTEGRATION === '1';

// These tests intentionally use the real Express app and the real PG pool.
// No database connection or HTTP responses are mocked in the happy path.
describe.skipIf(!runIntegration)('SW-132 Backend-Database API smoke test', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('GET /ready confirms the backend can query the live PostgreSQL database', async () => {
    const response = await request(app).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ready',
      database: 'connected',
    });
  });

  it('can read a known track from the real migrated and seeded database', async () => {
    // This validates known seed data without modifying Role C's schema/seed.
    // NOTE: Until Role B connects /api/tracks to PostgreSQL, this assertion
    // verifies the database directly, NOT catalog data returned by that API.
    const result = await pool.query<{
      id: string;
      title: string;
      duration_ms: number;
      artist_name: string;
    }>(
      `SELECT t.id::text AS id,
              t.title,
              t.duration_ms,
              a.name AS artist_name
         FROM tracks AS t
         JOIN track_artists AS ta ON ta.track_id = t.id
         JOIN artists AS a ON a.id = ta.artist_id
        WHERE t.title = $1
        ORDER BY ta.artist_order
        LIMIT 1`,
      ['Midnight Drive'],
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({
      id: expect.any(String),
      title: 'Midnight Drive',
      duration_ms: 214000,
      artist_name: 'The Night Waves',
    });
  });


  // BLOCKED by backend implementation in the uploaded Soundwave snapshot:
  // GET /api/tracks currently returns { tracks: [], count: 0 } and does not
  // query PostgreSQL. Role B must implement a database-backed catalog API
  // before these acceptance criteria can be turned into passing assertions.
  it.todo('GET /api/tracks returns the known seeded track through the real API');
  it.todo('missing or invalid catalog resource returns a controlled API response');
});
