import { describe, expect, it, vi } from 'vitest';
import { createPlaybackController, playbackErrorMessage } from './playbackControls';

function audioFixture({ paused = true, ended = false, currentTime = 24 } = {}) {
  const audio = { paused, ended, currentTime };
  audio.play = vi.fn(async () => {
    audio.paused = false;
  });
  audio.pause = vi.fn(() => {
    audio.paused = true;
  });
  return audio;
}

describe('Task 4 — Play, Pause, and Resume', () => {
  it('plays a paused audio element', async () => {
    const audio = audioFixture();
    const controls = createPlaybackController(() => audio);
    expect(await controls.toggle()).toBe('playing');
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.paused).toBe(false);
  });

  it('pauses playback without resetting the song position', async () => {
    const audio = audioFixture({ paused: false, currentTime: 52.5 });
    const controls = createPlaybackController(() => audio);
    expect(await controls.toggle()).toBe('paused');
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.play).not.toHaveBeenCalled();
    expect(audio.currentTime).toBe(52.5);
  });

  it('resumes from the saved position instead of replaying from zero', async () => {
    const audio = audioFixture({ currentTime: 52.5 });
    const controls = createPlaybackController(() => audio);
    expect(await controls.toggle()).toBe('playing');
    expect(await controls.toggle()).toBe('paused');
    expect(await controls.toggle()).toBe('playing');
    expect(audio.currentTime).toBe(52.5);
    expect(audio.play).toHaveBeenCalledTimes(2);
  });

  it('replays a finished song from its beginning', async () => {
    const audio = audioFixture({ ended: true, currentTime: 209 });
    const controls = createPlaybackController(() => audio);
    expect(await controls.toggle()).toBe('playing');
    expect(audio.currentTime).toBe(0);
  });

  it('restarts a track, pauses it, and resets its position', () => {
    const audio = audioFixture({ paused: false, currentTime: 103 });
    const controls = createPlaybackController(() => audio);
    expect(controls.restart()).toBe('stopped');
    expect(audio.paused).toBe(true);
    expect(audio.currentTime).toBe(0);
  });

  it('does not start duplicate play requests while one is pending', async () => {
    const audio = audioFixture();
    let resolvePlay;
    audio.play = vi.fn(() => new Promise((resolve) => { resolvePlay = resolve; }));
    const controls = createPlaybackController(() => audio);
    const first = controls.toggle();
    expect(controls.isPlayPending).toBe(true);
    expect(await controls.toggle()).toBe('pending');
    expect(audio.play).toHaveBeenCalledTimes(1);
    resolvePlay();
    expect(await first).toBe('playing');
    expect(controls.isPlayPending).toBe(false);
  });

  it('ignores a stale play result after the user switches tracks', async () => {
    const audio = audioFixture();
    let resolvePlay;
    audio.play = vi.fn(() => new Promise((resolve) => { resolvePlay = resolve; }));
    const controls = createPlaybackController(() => audio);
    const first = controls.toggle();
    controls.stop();
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
    resolvePlay();
    expect(await first).toBe('cancelled');
    expect(controls.isPlayPending).toBe(false);
  });

  it('lets an explicit pause cancel a pending play request', async () => {
    const audio = audioFixture();
    let rejectPlay;
    audio.play = vi.fn(() => new Promise((_resolve, reject) => { rejectPlay = reject; }));
    const reportError = vi.fn();
    const controls = createPlaybackController(() => audio, { onError: reportError });
    const pending = controls.toggle();
    expect(controls.pause()).toBe('paused');
    rejectPlay(Object.assign(new Error('interrupted'), { name: 'AbortError' }));
    expect(await pending).toBe('cancelled');
    expect(reportError).not.toHaveBeenCalled();
  });

  it('reports a genuine browser playback rejection without pretending it played', async () => {
    const audio = audioFixture();
    const reportError = vi.fn();
    audio.play = vi.fn(async () => {
      throw Object.assign(new Error('not allowed'), { name: 'NotAllowedError' });
    });
    const controls = createPlaybackController(() => audio, { onError: reportError });
    expect(await controls.toggle()).toBe('error');
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(audio.paused).toBe(true);
    expect(controls.isPlayPending).toBe(false);
  });

  it('treats browser AbortError during play as an expected interruption', async () => {
    const audio = audioFixture();
    const reportError = vi.fn();
    audio.play = vi.fn(async () => {
      throw Object.assign(new Error('load interrupted'), { name: 'AbortError' });
    });
    const controls = createPlaybackController(() => audio, { onError: reportError });
    expect(await controls.toggle()).toBe('cancelled');
    expect(reportError).not.toHaveBeenCalled();
  });

  it('safely handles an audio element that is not mounted yet', async () => {
    const controls = createPlaybackController(() => null);
    expect(await controls.toggle()).toBe('unavailable');
    expect(controls.pause()).toBe('unavailable');
    expect(controls.restart()).toBe('unavailable');
  });

  it('uses actionable error text for blocked or unsupported audio', () => {
    expect(playbackErrorMessage({ name: 'NotAllowedError' })).toContain('blocked');
    expect(playbackErrorMessage({ name: 'NotSupportedError' })).toContain('not supported');
    expect(playbackErrorMessage(new Error('device error'))).toBe('device error');
  });
});
