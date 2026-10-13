import { describe, it, expect } from 'vitest';
import { 
  validateTrackId, 
  isValidPostgresTrackId,
} from '../src/utils/validateTrackId';
  
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

describe('isValidPostgresTrackId', () => {
  // Valid positive PostgreSQL BIGINT IDs.
  it('accepts valid track IDs', () => {
    expect(isValidPostgresTrackId('1')).toBe(true);
    expect(isValidPostgresTrackId('17')).toBe(true);
    expect(isValidPostgresTrackId('9223372036854775807')).toBe(true);
  });

  // Invalid IDs should be rejected.
  it('rejects malformed track IDs', () => {
    expect(isValidPostgresTrackId('abc')).toBe(false);
    expect(isValidPostgresTrackId('0')).toBe(false);
    expect(isValidPostgresTrackId('-1')).toBe(false);
    expect(isValidPostgresTrackId('01')).toBe(false);
    expect(isValidPostgresTrackId(' 17 ')).toBe(false);
    expect(isValidPostgresTrackId(undefined)).toBe(false);
  });

  // PostgreSQL BIGINT range validation.
  it('rejects IDs exceeding the PostgreSQL BIGINT limit', () => {
    expect(isValidPostgresTrackId('9223372036854775808')).toBe(false);
  });
});
