import { describe, it, expect } from 'vitest';
import { validateTrackId } from '../src/utils/validateTrackId';

describe('validateTrackId', () => {
  it('returns a valid track ID', () => {
    expect(validateTrackId('track-123')).toBe('track-123');
  });

  it('trims whitespace from a valid track ID', () => {
    expect(validateTrackId('  track-456  ')).toBe('track-456');
  });

  it('throws when the track ID is undefined', () => {
    expect(() => validateTrackId(undefined)).toThrow('Track ID is required');
  });

  it('throws when the track ID is empty', () => {
    expect(() => validateTrackId('')).toThrow('Track ID is required');
  });

  it('throws when the track ID contains only whitespace', () => {
    expect(() => validateTrackId('   ')).toThrow('Track ID is required');
  });
});