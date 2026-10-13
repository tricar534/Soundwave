export function validateTrackId(id: string | undefined): string {
  if (!id || id.trim().length === 0) {
    throw new Error('Track ID is required');
  }

  return id.trim();
}

// Validate a track ID for PostgreSQL BIGINT lookup.
// 9223372036854775807 is the maximum signed 64-bit BIGINT.
export function isValidPostgresTrackId(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    /^[1-9]\d{0,18}$/.test(id) &&
    BigInt(id) <= 9223372036854775807n
  );
}