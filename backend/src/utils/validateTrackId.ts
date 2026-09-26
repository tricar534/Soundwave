export function validateTrackId(id: string | undefined): string {
  if (!id || id.trim().length === 0) {
    throw new Error('Track ID is required');
  }

  return id.trim();
}