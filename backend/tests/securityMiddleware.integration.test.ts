
import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';

// Use a mocked database to keep these integration tests independent
// of a running PostgreSQL instance.
vi.mock('../src/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('Role E: Security Middleware Integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves security headers and safe logs on a successful request', async () => {
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const response = await request(app)
      .get('/health?token=FAKE_HEALTH_SECRET_123')
      .set('Authorization', 'Bearer FAKE_AUTH_SECRET_123')
      .set('X-Request-ID', 'role-e-health-200');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');

    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-request-id']).toBe('role-e-health-200');

    expect(logSpy).toHaveBeenCalledOnce();

    const logData = JSON.parse(String(logSpy.mock.calls[0][1]));

    expect(logData.requestId).toBe('role-e-health-200');
    expect(logData.method).toBe('GET');
    expect(logData.path).toBe('/health');
    expect(logData.status).toBe(200);

    const output = logSpy.mock.calls.flat().join(' ');

    expect(output).not.toContain('FAKE_HEALTH_SECRET_123');
    expect(output).not.toContain('FAKE_AUTH_SECRET_123');
  });

  it('preserves security protections on invalid track requests', async () => {
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const response = await request(app)
      .get('/api/tracks/FAKE_INVALID_TRACK_ID_123?token=FAKE_400_SECRET');

    expect(response.status).toBe(400);

    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeDefined();

    expect(logSpy).toHaveBeenCalledOnce();

    const logData = JSON.parse(String(logSpy.mock.calls[0][1]));
    const output = logSpy.mock.calls.flat().join(' ');

    expect(logData.method).toBe('GET');
    expect(logData.status).toBe(400);
    expect(logData.requestId).toBe(response.headers['x-request-id']);

    expect(output).not.toContain('FAKE_INVALID_TRACK_ID_123');
    expect(output).not.toContain('FAKE_400_SECRET');
  });

  it('protects unmatched URLs while preserving 404 security headers', async () => {
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const response = await request(app)
      .get('/unknown/FAKE_PATH_SECRET_123?token=FAKE_QUERY_SECRET_456')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(404);

    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['access-control-allow-origin']).toBeDefined();

    expect(logSpy).toHaveBeenCalledOnce();

    const logData = JSON.parse(String(logSpy.mock.calls[0][1]));
    const output = logSpy.mock.calls.flat().join(' ');

    expect(logData.path).toBe('[unmatched]');
    expect(logData.status).toBe(404);
    expect(logData.requestId).toBe(response.headers['x-request-id']);

    expect(output).not.toContain('FAKE_PATH_SECRET_123');
    expect(output).not.toContain('FAKE_QUERY_SECRET_456');
  });
});
