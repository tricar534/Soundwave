import { beforeEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// SW-229: automated tests for the SOC 2 HTTP security headers control (AC-01 to AC-04, AC-06).
// The database is mocked so these tests run without PostgreSQL, same as routes.test.ts.
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../src/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

// Read one directive's source list out of a Content-Security-Policy header value.
function directive(csp: string, name: string): string[] {
  const found = csp
    .split(';')
    .map((part) => part.trim().split(/\s+/))
    .find((parts) => parts[0] === name);
  return found ? found.slice(1) : [];
}

// Each response type below must carry all of the headers, including error responses.
const responses: Array<[string, () => request.Test]> = [
  ['GET /health (200 JSON)', () => request(app).get('/health')],
  ['GET / (200 HTML)', () => request(app).get('/')],
  ['GET /api/tracks/abc (400 validation error)', () => request(app).get('/api/tracks/abc')],
  ['GET /api/does-not-exist (404)', () => request(app).get('/api/does-not-exist')],
];

describe('HTTP security headers (SOC 2)', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe.each(responses)('%s', (_name, send) => {
    // AC-01
    it('sets X-Content-Type-Options: nosniff', async () => {
      const res = await send();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    // AC-02
    it('sets X-Frame-Options: DENY', async () => {
      const res = await send();
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    // AC-03
    it('sets Strict-Transport-Security with a max-age of at least one year', async () => {
      const res = await send();
      const hsts = res.headers['strict-transport-security'];
      expect(hsts).toBeDefined();
      const maxAge = Number(/max-age=(\d+)/.exec(hsts)?.[1]);
      expect(maxAge).toBeGreaterThanOrEqual(31536000);
    });

    // AC-04
    it('sets a Content-Security-Policy', async () => {
      const res = await send();
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Content-Security-Policy strictness (AC-04)', () => {
    it('has no wildcard source in any directive', async () => {
      const res = await request(app).get('/health');
      const sources = res.headers['content-security-policy']
        .split(';')
        .flatMap((part: string) => part.trim().split(/\s+/).slice(1));
      expect(sources).not.toContain('*');
    });

    it('locks script-src to same origin and does not allow unsafe-inline scripts', async () => {
      const res = await request(app).get('/health');
      const scriptSrc = directive(res.headers['content-security-policy'], 'script-src');
      expect(scriptSrc).toEqual(["'self'"]);
      expect(scriptSrc).not.toContain("'unsafe-inline'");
      expect(scriptSrc).not.toContain("'unsafe-eval'");
    });

    it('blocks plugins/objects and defaults to same origin', async () => {
      const res = await request(app).get('/health');
      const csp = res.headers['content-security-policy'];
      expect(directive(csp, 'object-src')).toEqual(["'none'"]);
      expect(directive(csp, 'default-src')).toEqual(["'self'"]);
    });

    // Documents a known, deliberate relaxation: the '/' page uses an inline <style> block.
    // If this test starts failing because 'unsafe-inline' was removed, update the assessment doc too.
    it('allows inline styles only (documented relaxation, tracked in SW-232)', async () => {
      const res = await request(app).get('/health');
      const styleSrc = directive(res.headers['content-security-policy'], 'style-src');
      expect(styleSrc).toContain("'unsafe-inline'");
    });
  });

  describe('Regression: middleware ordering (AC-05 / AC-06)', () => {
    it('GET /api/tracks still returns the catalog with security headers present', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(app).get('/api/tracks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ tracks: [], count: 0 });
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('keeps security headers on a 500 error response', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockQuery.mockRejectedValue(new Error('Simulated database failure'));
      const res = await request(app).get('/api/tracks');
      spy.mockRestore();
      expect(res.status).toBe(500);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toBeDefined();
    });

    it('CORS preflight still works with Helmet registered first', async () => {
      const res = await request(app)
        .options('/api/tracks')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBeDefined();
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('CORS header is present on a normal cross-origin request', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(app).get('/api/tracks').set('Origin', 'http://localhost:5173');
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
