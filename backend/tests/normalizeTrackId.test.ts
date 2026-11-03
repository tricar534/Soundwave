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
// SW-101: Boundary-value analysis and equivalence partitioning for
// normalizeTrackId.

describe('normalizeTrackId - boundary and equivalence (SW-101)', () => {
  it('accepts the minimum valid boundary: a single-character ID', () => {
    expect(normalizeTrackId('a')).toBe('a');
  });

  it('returns an empty string unchanged when given only whitespace', () => {
    // normalizeTrackId performs no presence validation - that's
    // validateTrackId's responsibility. Equivalence class: blank input.
    expect(normalizeTrackId('   ')).toBe('');
  });

  it('returns an empty string unchanged when given an empty string', () => {
    expect(normalizeTrackId('')).toBe('');
  });

  it('normalizes a very large (long) track ID', () => {
    const longId = 'y'.repeat(1000);
    expect(normalizeTrackId(`  ${longId}  `)).toBe(longId);
  });

  it('leaves numeric-looking equivalence-class values unchanged beyond trimming', () => {
    expect(normalizeTrackId(' 0 ')).toBe('0');
    expect(normalizeTrackId(' -1 ')).toBe('-1');
  });

  it('only trims leading/trailing whitespace, not internal whitespace (malformed-ID equivalence class)', () => {
    expect(normalizeTrackId('  track 123  ')).toBe('track 123');
  });
});
