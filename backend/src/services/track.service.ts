
import { pool } from '../db';

// Retrieve all tracks from the PostgreSQL catalog.
export async function getCatalogTracks() {
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
    `
  );

  return result.rows;
}
