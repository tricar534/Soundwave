import { describe, expect, it } from 'vitest';
import { formatPlaybackTime, getPlaybackState, readPlaybackTimeline, seekPlayback } from './playbackTimeline';

function fakeAudio({ duration = 209.293, currentTime = 10, ranges = [[0, 150]] } = {}) {
  const audio = {
    duration,
    currentTime,
    paused: true,
    buffered: {
      length: ranges.length,
      start: (index) => ranges[index][0],
      end: (index) => ranges[index][1],
    },
  };
  return audio;
}

describe('Task 5 — progress and time formatting', () => {
  it('formats the beginning of a track', () => {
    expect(formatPlaybackTime(0)).toBe('0:00');
  });
  it('formats fractional seconds without rounding up', () => {
    expect(formatPlaybackTime(19.95)).toBe('0:19');
  });
  it('formats a normal three-minute song', () => {
    expect(formatPlaybackTime(209.293)).toBe('3:29');
  });
  it('formats long audio using hours', () => {
    expect(formatPlaybackTime(3661.8)).toBe('1:01:01');
  });
  it('handles invalid and missing timestamps', () => {
    expect(formatPlaybackTime(NaN)).toBe('0:00');
    expect(formatPlaybackTime(Infinity)).toBe('0:00');
    expect(formatPlaybackTime(-12)).toBe('0:00');
  });
  it('reads the actual current time, duration and percentages', () => {
    const timeline = readPlaybackTimeline(fakeAudio());
    expect(timeline.position).toBe(10);
    expect(timeline.duration).toBe(209.293);
    expect(timeline.playedPercent).toBeCloseTo(10 / 209.293 * 100);
    expect(timeline.bufferedPercent).toBeCloseTo(150 / 209.293 * 100);
  });
  it('clamps invalid duration, progress and buffer to safe values', () => {
    expect(readPlaybackTimeline(fakeAudio({ duration: Infinity, currentTime: -2 })).duration).toBe(0);
    expect(readPlaybackTimeline(fakeAudio({ duration: 10, currentTime: 45 })).position).toBe(10);
    expect(readPlaybackTimeline(fakeAudio({ duration: 10, ranges: [[0, 45]], currentTime: 2 })).bufferedPercent).toBe(100);
  });
  it('reports no buffered progress when the playhead is outside buffered ranges', () => {
    expect(readPlaybackTimeline(fakeAudio({ ranges: [[100, 120]], currentTime: 5 })).bufferedPercent).toBe(0);
  });
  it('handles unavailable or malformed buffered ranges without crashing', () => {
    const audio = fakeAudio();
    audio.buffered.end = () => { throw new Error('range unavailable'); };
    expect(readPlaybackTimeline(audio).bufferedPercent).toBe(0);
    expect(readPlaybackTimeline(null)).toEqual({ position: 0, duration: 0, playedPercent: 0, bufferedPercent: 0 });
  });
});

describe('Task 5 — seeking', () => {
  it('seeks to a valid position while leaving the pause state unchanged', () => {
    const audio = fakeAudio();
    expect(seekPlayback(audio, 90)).toEqual({ ok: true, position: 90 });
    expect(audio.currentTime).toBe(90);
    expect(audio.paused).toBe(true);
  });
  it('clamps attempts to seek past the end', () => {
    const audio = fakeAudio({ duration: 100 });
    expect(seekPlayback(audio, 250)).toEqual({ ok: true, position: 100 });
  });
  it('clamps negative seek positions to the beginning', () => {
    const audio = fakeAudio();
    expect(seekPlayback(audio, -100)).toEqual({ ok: true, position: 0 });
  });
  it('rejects seeking when metadata is missing', () => {
    expect(seekPlayback(fakeAudio({ duration: NaN }), 25)).toEqual({ ok: false, reason: 'not-seekable' });
  });
  it('rejects non-finite seek requests and absent media elements', () => {
    expect(seekPlayback(null, 5)).toEqual({ ok: false, reason: 'no-audio' });
    expect(seekPlayback(fakeAudio(), Infinity)).toEqual({ ok: false, reason: 'not-seekable' });
  });
  it('handles browser errors while setting currentTime', () => {
    const audio = fakeAudio();
    Object.defineProperty(audio, 'currentTime', { set() { throw new Error('unsupported seek'); } });
    expect(seekPlayback(audio, 30)).toEqual({ ok: false, reason: 'seek-failed' });
  });
});

describe('Task 5 — track status', () => {
  it('shows no audio before a track is chosen', () => {
    expect(getPlaybackState()).toBe('No audio');
  });
  it('shows loading before a catalog source is ready', () => {
    expect(getPlaybackState({ isLoading: true })).toBe('Loading');
  });
  it('shows ready when a source has not started', () => {
    expect(getPlaybackState({ hasSource: true })).toBe('Ready');
  });
  it('shows playing while the audio element plays', () => {
    expect(getPlaybackState({ hasSource: true, playing: true })).toBe('Playing');
  });
  it('shows paused when playback is stopped at a nonzero position', () => {
    expect(getPlaybackState({ hasSource: true, position: 19 })).toBe('Paused');
  });
  it('shows buffering only while actively playing', () => {
    expect(getPlaybackState({ hasSource: true, playing: true, buffering: true })).toBe('Buffering');
    expect(getPlaybackState({ hasSource: true, buffering: true })).toBe('Ready');
  });
  it('shows seeking while the user moves to another time', () => {
    expect(getPlaybackState({ hasSource: true, playing: true, seeking: true })).toBe('Seeking');
  });
  it('shows finished instead of paused once a track reaches its end', () => {
    expect(getPlaybackState({ hasSource: true, ended: true, position: 209 })).toBe('Finished');
  });
  it('shows errors before other states', () => {
    expect(getPlaybackState({ hasSource: true, playing: true, hasError: true })).toBe('Error');
  });
});
