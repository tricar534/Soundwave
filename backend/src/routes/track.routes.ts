import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Existing catalog route
router.get('/', (req, res) => {
  const tracks: unknown[] = [];

  res.json({
    tracks,
    count: tracks.length,
  });
  
});

// Retrieve an individual track by ID.
router.get('/:id', async ( req, res ) => {
  const { id } = req.params;

  // Validate ID is a positive PostgreSQL BigInt.
  // 9223372036854775807 is the maximum value PostgreSQL can store in a signed 64-bit BIGINT 
  // n = bigint literal
  if( typeof id !== 'string' || !/^[1-9]\d{0,18}$/.test(id) || 
    BigInt(id) > 9223372036854775807n ) {
      res.status(400).json({
        error: 'Invalid track ID'
      });
      return;
    }

  try{
    const result  = await pool.query(
      ` SELECT
          id::text AS id,
          album_id::text AS "albumId",
          title,
          track_number AS "trackNumber",
          duration_ms AS "durationMs",
          is_available AS "isAvailable"
        FROM tracks
        WHERE id = $1::bigint
        LIMIT 1 `,
        [id]
    );
    
    // Track does not exist.
    if (result.rows.length === 0) {
      res.status(404).json({
        error: 'Track not found',
      });
      return;
    }
    
    // Track found successfully.
    res.status(200).json({
      track: result.rows[0],
      });
    } 
    catch (error) {
    console.error('Failed to retrieve track:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;