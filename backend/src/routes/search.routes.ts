
import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Search tracks by title.
router.get('/', async (req, res) => {
  const query = req.query.q;

  // Validate search input.
  if (
    typeof query !== 'string' ||
    query.trim().length === 0 ||
    query.trim().length > 100
  ) {
    res.status(400).json({
      error: 'Search query must be between 1 and 100 characters',
    });
    return;
  }

  try {
    // Search PostgreSQL for matching track titles.
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
      [`%${query.trim()}%`]
    );

    // Return matching tracks.
    res.status(200).json({
      tracks: result.rows,
      count: result.rows.length,
    });

  } catch (error) {
    console.error('Failed to search tracks:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
