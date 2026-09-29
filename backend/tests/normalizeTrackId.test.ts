import { describe, it, expect } from 'vitest';
import { normalizeTrackId } from '../src/utils/normalizeTrackId';

describe('normalizeTrackId', () => {
  it('trims whitespace from a track ID', () => {
    expect(normalizeTrackId('  track-123  ')).toBe('track-123');
  });

  it('leaves an already clean track ID unchanged', () => {
    expect(normalizeTrackId('track-456')).toBe('track-456');
  });
});