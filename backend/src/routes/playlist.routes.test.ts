
import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import playlistRoutes from './playlist.routes';

// Mock PostgreSQL so these tests do not change real database data.
const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('../db', () => ({
  pool: { query: queryMock },
}));

// Simulate two authenticated users for testing route authorization.
vi.mock('../middleware/requireAuth', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.get('Authorization');

    if (authorization !== 'Bearer user-1' &&
        authorization !== 'Bearer user-2') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    Object.assign(req, {
      auth: {
        userId: authorization === 'Bearer user-1' ? '101' : '202',
      },
    });

    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/playlists', playlistRoutes);

const playlist = {
  id: '5',
  userId: '101',
  name: 'Sprint 5 Demo',
  createdAt: '2026-11-16T00:00:00.000Z',
  updatedAt: '2026-11-16T00:00:00.000Z',
};

beforeEach(() => {
  queryMock.mockReset();
});

describe('SW-255 — Playlist API automated tests', () => {
  it('creates an authenticated playlist (201)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [playlist] });

    const response = await request(app)
      .post('/api/playlists')
      .set('Authorization', 'Bearer user-1')
      .send({ name: '  Sprint 5 Demo  ' });

    expect(response.status).toBe(201);
    expect(response.body.playlist).toEqual(playlist);
    expect(queryMock.mock.calls[0][1]).toEqual([
      '101',
      'Sprint 5 Demo',
    ]);
  });

  it('rejects unauthenticated creation (401)', async () => {
    const response = await request(app)
      .post('/api/playlists')
      .send({ name: 'Test' });

    expect(response.status).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rejects blank playlist names (400)', async () => {
    const response = await request(app)
      .post('/api/playlists')
      .set('Authorization', 'Bearer user-1')
      .send({ name: '   ' });

    expect(response.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rejects playlist names longer than 255 characters (400)', async () => {
    const response = await request(app)
      .post('/api/playlists')
      .set('Authorization', 'Bearer user-1')
      .send({ name: 'a'.repeat(256) });

    expect(response.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('retrieves the authenticated user playlists (200)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [playlist] });

    const response = await request(app)
      .get('/api/playlists')
      .set('Authorization', 'Bearer user-1');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.playlists).toEqual([playlist]);
    expect(queryMock.mock.calls[0][1]).toEqual(['101']);
  });

  it('retrieves an individual playlist with its tracks (200)', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [playlist] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get('/api/playlists/5')
      .set('Authorization', 'Bearer user-1');

    expect(response.status).toBe(200);
    expect(response.body.playlist.id).toBe('5');
    expect(response.body.playlist.tracks).toEqual([]);
    expect(queryMock.mock.calls[0][1]).toEqual(['5', '101']);
    expect(queryMock.mock.calls[1][1]).toEqual(['5']);
  });

  it('rejects invalid playlist IDs (400)', async () => {
    const response = await request(app)
      .get('/api/playlists/abc')
      .set('Authorization', 'Bearer user-1');

    expect(response.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rejects IDs exceeding PostgreSQL BIGINT (400)', async () => {
    const response = await request(app)
      .get('/api/playlists/9223372036854775808')
      .set('Authorization', 'Bearer user-1');

    expect(response.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('returns 404 for nonexistent playlists', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get('/api/playlists/999999')
      .set('Authorization', 'Bearer user-1');

    expect(response.status).toBe(404);
  });

  it('restricts access to another users playlist (404)', async () => {
    // Simulate PostgreSQL returning no matching owner-owned record.
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get('/api/playlists/5')
      .set('Authorization', 'Bearer user-2');

    expect(response.status).toBe(404);
    expect(queryMock.mock.calls[0][1]).toEqual(['5', '202']);
    expect(queryMock.mock.calls[0][0]).toMatch(/user_id\s*=\s*\$2/);
  });

  it('rejects unauthenticated playlist retrieval (401)', async () => {
    const listResponse = await request(app).get('/api/playlists');
    const detailResponse = await request(app).get('/api/playlists/5');

    expect(listResponse.status).toBe(401);
    expect(detailResponse.status).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
