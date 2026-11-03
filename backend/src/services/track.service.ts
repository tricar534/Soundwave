
import { pool } from '../db';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../utils/validatePagination';

// Retrieve all tracks from the PostgreSQL catalog.
export async function getCatalogTracks(limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET) {
  const result = await pool.query(
    `
    SELECT
      id::text AS id,
      album_id::text AS "albumId",
      title,
      track_number AS "trackNumber",
      duration_ms AS "durationMs",
      is_available AS "isAvailable"
    FROM tracks
    ORDER BY id ASC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return result.rows;
}

// Retrieve an individual track from PostgreSQL by ID.
export async function getTrackById(id: string) {
  const result = await pool.query(
    `
    SELECT
      id::text AS id,
      album_id::text AS "albumId",
      title,
      track_number AS "trackNumber",
      duration_ms AS "durationMs",
      is_available AS "isAvailable"
    FROM tracks
    WHERE id = $1::bigint
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

 // Search PostgreSQL tracks by title.
export async function searchTracks(query: string) {
  const result = await pool.query(
    `
    SELECT
      id::text AS id,
      album_id::text AS "albumId",
      title,
      track_number AS "trackNumber",
      duration_ms AS "durationMs",
      is_available AS "isAvailable"
    FROM tracks
    WHERE title ILIKE $1
    ORDER BY title ASC, id ASC
    LIMIT 50
    `,
    [`%${query}%`]
  );

  return result.rows;
}
