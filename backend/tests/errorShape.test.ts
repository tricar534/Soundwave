import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// SW-103: the error responses the backend returns today must all use one shape,
// { "error": "<message>" }, and must not expose internal details.
// The database is mocked so these tests run without PostgreSQL.
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../src/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

// Anything that would reveal how the server works inside.
const INTERNAL_DETAILS = /stack|node_modules|\.ts:\d|\.js:\d|SELECT\s|FROM\s+tracks|ECONN|password|hunter2|db\.internal/i;

type Scenario = {
  name: string;
  status: number;
  send: () => Promise<request.Response>;
};

const scenarios: Scenario[] = [
  {
    name: '400 validation error: malformed track ID',
    status: 400,
    send: () => request(app).get('/api/tracks/abc'),
  },
  {
    name: '400 validation error: missing search query',
    status: 400,
    send: () => request(app).get('/api/search'),
  },
  {
    name: '404 not found: valid track ID that is not in the catalog',
    status: 404,
    send: () => {
      mockQuery.mockResolvedValue({ rows: [] });
      return request(app).get('/api/tracks/999999');
    },
  },
  {
    name: '500 server error: catalog query fails',
    status: 500,
    send: () => {
      mockQuery.mockRejectedValue(new Error('password=hunter2 host=db.internal SELECT * FROM tracks'));
      return request(app).get('/api/tracks');
    },
  },
  {
    name: '500 server error: search query fails',
    status: 500,
    send: () => {
      mockQuery.mockRejectedValue(new Error('password=hunter2 host=db.internal SELECT * FROM tracks'));
      return request(app).get('/api/search?q=love');
    },
  },
];

describe('Standardized error response shape (current route-level behavior)', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe.each(scenarios)('$name', ({ status, send }) => {
    it('returns the expected status as JSON', async () => {
      const response = await send();

      expect(response.status).toBe(status);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('has exactly one field, "error", holding a non-empty string', async () => {
      const response = await send();

      expect(Object.keys(response.body)).toEqual(['error']);
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(0);
    });

    it('does not expose internal details', async () => {
      const response = await send();

      expect(JSON.stringify(response.body)).not.toMatch(INTERNAL_DETAILS);
    });
  });

  it('uses the same required fields across every representative error', async () => {
    const shapes: string[] = [];

    for (const scenario of scenarios) {
      mockQuery.mockReset();
      const response = await scenario.send();
      shapes.push(Object.keys(response.body).sort().join(','));
    }

    expect(new Set(shapes).size).toBe(1);
  });

  // Not standardized yet (SW-105 defects D1 and D2). Enable these once the
  // app-wide error handler is merged, which is the dependency of SW-103.
  it.todo('unknown routes return the same { error } JSON shape with status 404 (SW-105 D2)');
  it.todo('an invalid JSON request body returns the same { error } JSON shape with status 400 (SW-105 D1)');
});
