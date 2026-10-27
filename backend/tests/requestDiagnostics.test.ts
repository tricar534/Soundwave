
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requestDiagnostics } from '../src/middleware/requestDiagnostics';

describe('SW-224: Sensitive Request Logging Protection', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    function createTestApp() {
        const app = express();

        app.use(express.json());
        app.use(requestDiagnostics);

        app.post('/logging-test', (_req, res) => {
            res.status(201).json({ success: true });
        });

        return app;
    }

    it('does not expose sensitive request information', async () => {
        const logSpy = vi
            .spyOn(console, 'info')
            .mockImplementation(() => { });

        const app = createTestApp();

        const response = await request(app)
            .post('/logging-test?token=FAKE_QUERY_SECRET_123')
            .set('Authorization', 'Bearer FAKE_AUTH_TOKEN_123')
            .set('Cookie', 'session=FAKE_COOKIE_SECRET_123')
            .send({
                password: 'FAKE_PASSWORD_123'
            });

        expect(response.status).toBe(201);

        const output = logSpy.mock.calls
            .flat()
            .join(' ');

        expect(output).not.toContain('FAKE_QUERY_SECRET_123');
        expect(output).not.toContain('FAKE_AUTH_TOKEN_123');
        expect(output).not.toContain('FAKE_COOKIE_SECRET_123');
        expect(output).not.toContain('FAKE_PASSWORD_123');
    });

    it('preserves safe diagnostic information', async () => {
        const logSpy = vi
            .spyOn(console, 'info')
            .mockImplementation(() => { });

        const app = createTestApp();

        const response = await request(app)
            .post('/logging-test')
            .set('X-Request-ID', 'sw224-test-request')
            .send({ example: true });

        expect(response.status).toBe(201);
        expect(response.headers['x-request-id'])
            .toBe('sw224-test-request');

        expect(logSpy).toHaveBeenCalledOnce();

        const [prefix, payload] = logSpy.mock.calls[0];

        expect(prefix).toBe('[Soundwave Request]');

        const logData = JSON.parse(String(payload));

        expect(logData.requestId).toBe('sw224-test-request');
        expect(logData.method).toBe('POST');
        expect(logData.path).toBe('/logging-test');
        expect(logData.status).toBe(201);
        expect(logData.durationMs).toBeGreaterThanOrEqual(0);
    });
});
