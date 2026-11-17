import { describe, expect, it } from 'vitest';
import { progressBarStyle } from './playbackPresentation';

describe('Task 6 - compact accessible playback timeline', () => {
  it('starts empty when no track is loaded', () => {
    expect(progressBarStyle()).toEqual({ '--sw-played': '0%', '--sw-buffered': '0%' });
  });
  it('shows elapsed time and buffered media in a single gradient', () => {
    expect(progressBarStyle({ position: 30, duration: 120, bufferedPercent: 75 })).toEqual({
      '--sw-played': '25%', '--sw-buffered': '75%',
    });
  });
  it('represents a fully downloaded catalog MP3 correctly', () => {
    expect(progressBarStyle({ position: 30, duration: 120, bufferedPercent: 100 })).toEqual({
      '--sw-played': '25%', '--sw-buffered': '100%',
    });
  });
  it('never draws a buffered stop behind the playhead', () => {
    expect(progressBarStyle({ position: 80, duration: 100, bufferedPercent: 30 })).toEqual({
      '--sw-played': '80%', '--sw-buffered': '80%',
    });
  });
  it('clamps positions and buffer values beyond the song duration', () => {
    expect(progressBarStyle({ position: 250, duration: 100, bufferedPercent: 999 })).toEqual({
      '--sw-played': '100%', '--sw-buffered': '100%',
    });
  });
  it('clamps negative positions and buffer values to zero', () => {
    expect(progressBarStyle({ position: -30, duration: 100, bufferedPercent: -50 })).toEqual({
      '--sw-played': '0%', '--sw-buffered': '0%',
    });
  });
  it('does not yield NaN or Infinity CSS when metadata is unavailable', () => {
    expect(progressBarStyle({ position: Infinity, duration: NaN, bufferedPercent: NaN })).toEqual({
      '--sw-played': '0%', '--sw-buffered': '0%',
    });
  });
  it('retains buffered status until the next media update when the duration is unknown', () => {
    expect(progressBarStyle({ position: 20, duration: 0, bufferedPercent: 60 })).toEqual({
      '--sw-played': '0%', '--sw-buffered': '60%',
    });
  });
  it('supports fractional playback positions without rounding to a whole second', () => {
    expect(progressBarStyle({ position: 0.25, duration: 1, bufferedPercent: 50 })).toEqual({
      '--sw-played': '25%', '--sw-buffered': '50%',
    });
  });
});
