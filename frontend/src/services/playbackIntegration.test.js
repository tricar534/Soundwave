import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAuthenticatedTrack,
  loginForAudio,
  normalizeTrackId,
} from './audioPlayback';
import { createPlaybackController } from './playbackControls';
import {
  getPlaybackState,
  readPlaybackTimeline,
  seekPlayback,
} from './playbackTimeline';
import { progressBarStyle } from './playbackPresentation';

const baseUrl = 'http://127.0.0.1:4000';

function createAudio() {
  const audio = {
    paused: true,
    ended: false,
    currentTime: 0,
    duration: 120,
    buffered: { length: 1, start: () => 0, end: () => 120 },
  };
  audio.play = vi.fn(async () => { audio.paused = false; });
  audio.pause = vi.fn(() => { audio.paused = true; });
  return audio;
}

afterEach(() => vi.unstubAllGlobals());

describe('Task 6 - integration regression across Tasks 3, 4, and 5', () => {
  it('logs in, fetches authenticated MP3, and plays without putting credentials in the URL', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/api/auth/login')) {
        return { ok: true, json: async () => ({ token: 'synthetic-test-token' }) };
      }
      return {
        ok: true,
        headers: { get: () => 'audio/mpeg' },
        blob: async () => new Blob(['fake-audio'], { type: 'audio/mpeg' }),
      };
    }));

    const token = await loginForAudio({ username: 'example', password: 'fake-password', baseUrl });
    const audioBlob = await fetchAuthenticatedTrack({ trackId: '60', token, baseUrl });
    expect(audioBlob.type).toBe('audio/mpeg');
    expect(calls).toHaveLength(2);
    expect(calls[1].url).toBe(`${baseUrl}/api/tracks/60/audio`);
    expect(calls[1].options.headers.Authorization).toBe('Bearer synthetic-test-token');
    expect(calls[1].url).not.toContain('synthetic-test-token');
    expect(calls[1].options.credentials).toBe('omit');

    const audio = createAudio();
    const controller = createPlaybackController(() => audio);
    expect(await controller.toggle()).toBe('playing');
    expect(getPlaybackState({ hasSource: true, playing: !audio.paused })).toBe('Playing');
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('plays, pauses, seeks, resumes, and restarts without losing track position', async () => {
    const audio = createAudio();
    const controller = createPlaybackController(() => audio);
    expect(await controller.toggle()).toBe('playing');
    audio.currentTime = 25;
    expect(controller.pause()).toBe('paused');
    expect(readPlaybackTimeline(audio).position).toBe(25);
    expect(seekPlayback(audio, 50)).toEqual({ ok: true, position: 50 });
    expect(getPlaybackState({ hasSource: true, position: 50 })).toBe('Paused');
    expect(await controller.toggle()).toBe('playing');
    expect(readPlaybackTimeline(audio).position).toBe(50);
    expect(controller.restart()).toBe('stopped');
    expect(readPlaybackTimeline(audio).position).toBe(0);
    expect(audio.paused).toBe(true);
  });

  it('synchronizes native duration, progress, and buffering with the compact timeline', () => {
    const audio = createAudio();
    audio.currentTime = 30;
    audio.buffered.end = () => 90;
    const timeline = readPlaybackTimeline(audio);
    expect(timeline).toMatchObject({ position: 30, duration: 120, playedPercent: 25, bufferedPercent: 75 });
    expect(progressBarStyle({ position: timeline.position, duration: timeline.duration,
      bufferedPercent: timeline.bufferedPercent })).toEqual({
      '--sw-played': '25%', '--sw-buffered': '75%',
    });
  });

  it('stops the previous audio when a new track is selected', async () => {
    const audio = createAudio();
    const controller = createPlaybackController(() => audio);
    await controller.toggle();
    audio.currentTime = 72;
    expect(controller.stop()).toBe('stopped');
    expect(audio.paused).toBe(true);
    expect(audio.currentTime).toBe(0);
    expect(getPlaybackState({ hasSource: false })).toBe('No audio');
  });

  it('can replay a completed track from zero', async () => {
    const audio = createAudio();
    audio.currentTime = audio.duration;
    audio.ended = true;
    const controller = createPlaybackController(() => audio);
    expect(getPlaybackState({ hasSource: true, ended: true })).toBe('Finished');
    expect(await controller.toggle()).toBe('playing');
    expect(audio.currentTime).toBe(0);
  });

  it('reports a missing track and never labels the response as playable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    await expect(fetchAuthenticatedTrack({ trackId: 60, token: 'fake', baseUrl }))
      .rejects.toThrow('No MP3');
  });

  it('rejects an invalid catalog ID before any fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(normalizeTrackId('local-file.mp3')).toBeNull();
    await expect(fetchAuthenticatedTrack({ trackId: 'local-file.mp3', token: 'fake', baseUrl }))
      .rejects.toThrow('valid database ID');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects missing authorization before any network call', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchAuthenticatedTrack({ trackId: 60, token: '', baseUrl }))
      .rejects.toThrow('Sign in');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports an expired login session as an actionable error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401 })));
    await expect(fetchAuthenticatedTrack({ trackId: 60, token: 'expired', baseUrl }))
      .rejects.toThrow('Session expired');
  });

  it('handles missing or non-finite media metadata without NaN progress', () => {
    const audio = createAudio();
    audio.duration = Infinity;
    audio.currentTime = NaN;
    audio.buffered.length = 0;
    expect(readPlaybackTimeline(audio)).toMatchObject({ duration: 0, position: 0, playedPercent: 0 });
    const style = progressBarStyle({ position: NaN, duration: Infinity, bufferedPercent: NaN });
    expect(style).toEqual({ '--sw-played': '0%', '--sw-buffered': '0%' });
    expect(seekPlayback(audio, 15)).toEqual({ ok: false, reason: 'not-seekable' });
  });
});
