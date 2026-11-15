import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  displayTrack,
  fetchAuthenticatedTrack,
  normalizeTrackId,
  pickSelectedTrack,
} from './audioPlayback';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Task 3 track compatibility', () => {
  it('accepts database BIGINT IDs without rounding them', () => {
    expect(normalizeTrackId('60')).toBe('60');
    expect(normalizeTrackId('9223372036854775807')).toBe('9223372036854775807');
    expect(normalizeTrackId('9223372036854775808')).toBeNull();
    expect(normalizeTrackId('sample-mock')).toBeNull();
    expect(normalizeTrackId('0')).toBeNull();
  });
  it('accepts the existing app selection prop formats', () => {
    expect(pickSelectedTrack({ selectedTrack: { id: 60 } })).toEqual({ id: 60 });
    expect(pickSelectedTrack({ currentTrack: { title: 'Light It Up' } })).toEqual({ title: 'Light It Up' });
    expect(displayTrack({ id: '60', title: 'Light It Up', artist: { name: 'Young Thug' } }))
      .toMatchObject({ id: '60', title: 'Light It Up', artist: 'Young Thug' });
  });
});

describe('Task 3 authenticated API playback', () => {
  it('never puts the session token in the URL', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'audio/mpeg' },
      blob: async () => new Blob(['fake MP3 bytes'], { type: 'audio/mpeg' }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchAuthenticatedTrack({ trackId: 60, token: 'test-secret', baseUrl: 'http://localhost:4000' });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/tracks/60/audio');
    expect(options.headers.Authorization).toBe('Bearer test-secret');
    expect(url).not.toContain('test-secret');
    expect(options.cache).toBe('no-store');
  });
  it('rejects missing authorization rather than sending an unauthenticated request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchAuthenticatedTrack({ trackId: 60, token: '', baseUrl: 'http://localhost:4000' }))
      .rejects.toThrow('Sign in');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('reports unavailable media clearly', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    await expect(fetchAuthenticatedTrack({ trackId: 60, token: 'test', baseUrl: 'http://localhost:4000' }))
      .rejects.toThrow('No MP3');
  });
  it('rejects non-audio error bodies even with HTTP 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' } })));
    await expect(fetchAuthenticatedTrack({ trackId: 60, token: 'test', baseUrl: 'http://localhost:4000' }))
      .rejects.toThrow('non-audio');
  });
});
