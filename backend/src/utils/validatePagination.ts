// Pagination rules for the catalog endpoint.
// Defaults keep requests without limit/offset working as before: the first page of the catalog.
// Invalid values are rejected with a 400, the same way invalid track IDs and search queries are.
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;
export const DEFAULT_OFFSET = 0;
export const MAX_OFFSET = 1_000_000;

export type PaginationResult =
  | { ok: true; limit: number; offset: number }
  | { ok: false; error: string };

// Only plain digits are accepted, so values like "-1", "1.5", "1e2", " 5" and "0x10" are rejected.
function parseWholeNumber(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{1,9}$/.test(value)) {
    return null;
  }

  return Number(value);
}

export function parsePagination(query: Record<string, unknown>): PaginationResult {
  let limit = DEFAULT_LIMIT;
  let offset = DEFAULT_OFFSET;

  if (query.limit !== undefined) {
    const parsed = parseWholeNumber(query.limit);

    if (parsed === null || parsed < 1 || parsed > MAX_LIMIT) {
      return { ok: false, error: `limit must be a whole number between 1 and ${MAX_LIMIT}` };
    }

    limit = parsed;
  }

  if (query.offset !== undefined) {
    const parsed = parseWholeNumber(query.offset);

    if (parsed === null || parsed > MAX_OFFSET) {
      return { ok: false, error: `offset must be a whole number between 0 and ${MAX_OFFSET}` };
    }

    offset = parsed;
  }

  return { ok: true, limit, offset };
}
