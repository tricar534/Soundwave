import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from './app';

// SOC 2 CC5.2 / CC6.1: HTTP security response headers.
// Verifies Helmet-configured headers are present on backend responses,
// and that the pre-existing /health behavior is unchanged.

describe('security headers', () => {
  it('sets X-Content-Type-Options to nosniff', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options to DENY', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('sets a Strict-Transport-Security header', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['strict-transport-security']).toBeDefined();
  });

  it('sets a Content-Security-Policy header without unrestricted wildcard sources', async () => {
    const response = await request(app).get('/health');
    const csp = response.headers['content-security-policy'];

    expect(csp).toBeDefined();
    expect(csp).not.toContain('*');
  });

  it('preserves the existing /health response', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'soundwave-backend',
    });
  });
});
