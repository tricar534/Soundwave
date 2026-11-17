import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { IncomingMessage } from 'node:http';
import type { NextFunction, Request, Response } from 'express';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import audioRoutes from './audio.routes';
import { findTrackAudio } from '../services/audio.service';

// The route tests isolate the real streaming handler from PostgreSQL. The live
// curl tests in the README additionally verify the actual auth + DB + filesystem flow.
vi.mock('../services/audio.service', async (importOriginal) => {
  const original = await importOriginal<typeof import('../services/audio.service')>();
  return { ...original, findTrackAudio: vi.fn() };
});

vi.mock('../middleware/requireAuth', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    if (req.get('Authorization') !== 'Bearer test-auth') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    next();
  },
}));

function collectBytes(
  response: IncomingMessage,
  callback: (error: Error | null, body?: Buffer) => void
): void {
  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  response.once('error', (error: Error) => callback(error));
  response.once('end', () => callback(null, Buffer.concat(chunks)));
}

const app = express();
app.use('/api/tracks', audioRoutes);
const url = '/api/tracks/60/audio';
const fixture = Buffer.from('0123456789ABCDEFGHIJKLMNOPQRSTUV');
let folder = '';
let filePath = '';

function authorizedGet(range?: string) {
  const req = request(app).get(url).set('Authorization', 'Bearer test-auth').buffer(true).parse(collectBytes);
  return range === undefined ? req : req.set('Range', range);
}

beforeAll(async () => {
  folder = await mkdtemp(path.join(tmpdir(), 'soundwave-range-test-'));
  filePath = path.join(folder, 'fixture.mp3');
  await writeFile(filePath, fixture);
});

afterAll(async () => {
  if (folder) await rm(folder, { recursive: true, force: true });
});

beforeEach(() => {
  vi.mocked(findTrackAudio).mockReset();
  vi.mocked(findTrackAudio).mockResolvedValue({
    path: filePath,
    size: fixture.length,
    contentType: 'audio/mpeg',
  });
});

describe('Task 2 - authenticated audio streaming with HTTP Range', () => {
  it('keeps full-file requests working as HTTP 200', async () => {
    const res = await authorizedGet().expect(200);
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.headers['content-type']).toMatch(/audio\/mpeg/);
    expect(Number(res.headers['content-length'])).toBe(fixture.length);
    expect(res.headers['content-range']).toBeUndefined();
    expect(res.body).toEqual(fixture);
  });

  it('returns 206 and the precise requested bytes for a bounded range', async () => {
    const res = await authorizedGet('bytes=2-5').expect(206);
    expect(res.headers['content-range']).toBe(`bytes 2-5/${fixture.length}`);
    expect(Number(res.headers['content-length'])).toBe(4);
    expect(res.body).toEqual(fixture.subarray(2, 6));
  });

  it('supports an open-ended range', async () => {
    const res = await authorizedGet('bytes=10-').expect(206);
    expect(res.headers['content-range']).toBe(`bytes 10-${fixture.length - 1}/${fixture.length}`);
    expect(res.body).toEqual(fixture.subarray(10));
  });

  it('supports a suffix range', async () => {
    const res = await authorizedGet('bytes=-5').expect(206);
    expect(res.headers['content-range']).toBe(`bytes ${fixture.length - 5}-${fixture.length - 1}/${fixture.length}`);
    expect(res.body).toEqual(fixture.subarray(-5));
  });

  it('returns 416 plus the total size for an invalid range', async () => {
    const res = await authorizedGet('bytes=9999-').expect(416);
    expect(res.headers['content-range']).toBe(`bytes */${fixture.length}`);
    expect(res.headers['accept-ranges']).toBe('bytes');
  });

  it('rejects multiple ranges rather than returning an incorrect single response', async () => {
    const res = await authorizedGet('bytes=0-1,4-5').expect(416);
    expect(res.headers['content-range']).toBe(`bytes */${fixture.length}`);
  });

  it('still blocks unauthenticated streaming', async () => {
    await request(app).get(url).set('Range', 'bytes=0-3').expect(401);
    expect(findTrackAudio).not.toHaveBeenCalled();
  });

  it('returns 404 for missing track media', async () => {
    vi.mocked(findTrackAudio).mockResolvedValue(null);
    await authorizedGet('bytes=0-3').expect(404);
  });
});
