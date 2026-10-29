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

// SW-101: Boundary-value analysis and equivalence partitioning for
// validateTrackId and isValidPostgresTrackId. Builds on the existing tests
// above without modifying them.

describe('validateTrackId - boundary and equivalence (SW-101)', () => {
  it('accepts the minimum valid boundary: a single non-whitespace character', () => {
    expect(validateTrackId('a')).toBe('a');
  });

  it('accepts a very large (long) valid track ID unchanged beyond trimming', () => {
    const longId = 'x'.repeat(1000);
    expect(validateTrackId(`  ${longId}  `)).toBe(longId);
  });

  it('accepts numeric-looking strings as opaque IDs (this function does not validate numeric format)', () => {
    // '0' and '-1' are valid inputs here because validateTrackId only checks
    // for presence/non-blankness, not numeric validity - that's
    // isValidPostgresTrackId's job, tested separately below.
    expect(validateTrackId('0')).toBe('0');
    expect(validateTrackId('-1')).toBe('-1');
  });

  it('throws on a malformed/non-string runtime value cast past the type system', () => {
    expect(() => validateTrackId(null as unknown as string | undefined)).toThrow(
      'Track ID is required'
    );
  });
});

describe('isValidPostgresTrackId - boundary and equivalence (SW-101)', () => {
  // --- Boundary values ---
  it('accepts the minimum valid boundary (1)', () => {
    expect(isValidPostgresTrackId('1')).toBe(true);
  });

  it('rejects the zero boundary', () => {
    expect(isValidPostgresTrackId('0')).toBe(false);
  });

  it('rejects the boundary just below the minimum (negative)', () => {
    expect(isValidPostgresTrackId('-1')).toBe(false);
  });

  it('accepts the maximum valid BIGINT boundary (9223372036854775807)', () => {
    expect(isValidPostgresTrackId('9223372036854775807')).toBe(true);
  });

  it('rejects one past the maximum BIGINT boundary (9223372036854775808)', () => {
    expect(isValidPostgresTrackId('9223372036854775808')).toBe(false);
  });

  // --- Very large values ---
  it('rejects a 19-digit value that is syntactically valid but numerically exceeds BIGINT max', () => {
    // All-nines at 19 digits passes the regex's digit-count check but fails
    // the BigInt range comparison - a distinct failure path from the
    // "too many digits" case below.
    expect(isValidPostgresTrackId('9999999999999999999')).toBe(false);
  });

  it('rejects a value with more digits than BIGINT allows (20+ digits)', () => {
    expect(isValidPostgresTrackId('123456789012345678901')).toBe(false);
  });

  // --- Non-numeric / malformed equivalence class ---
  it('rejects non-numeric strings', () => {
    expect(isValidPostgresTrackId('abc')).toBe(false);
  });

  it('rejects decimal values', () => {
    expect(isValidPostgresTrackId('12.5')).toBe(false);
  });

  it('rejects scientific notation', () => {
    expect(isValidPostgresTrackId('1e10')).toBe(false);
  });

  it('rejects non-ASCII numeral characters', () => {
    expect(isValidPostgresTrackId('١٢٣')).toBe(false); // Arabic-indic digits
  });

  it('rejects a leading-zero value', () => {
    expect(isValidPostgresTrackId('01')).toBe(false);
  });

  it('rejects whitespace-padded numeric strings', () => {
    expect(isValidPostgresTrackId(' 17 ')).toBe(false);
  });

  // --- Type equivalence class (non-string runtime values) ---
  it('rejects undefined', () => {
    expect(isValidPostgresTrackId(undefined)).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidPostgresTrackId(null)).toBe(false);
  });

  it('rejects a number type even if numerically valid', () => {
    expect(isValidPostgresTrackId(17)).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidPostgresTrackId('')).toBe(false);
  });
});
