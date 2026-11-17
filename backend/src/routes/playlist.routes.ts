
import { Router } from 'express';
import { pool } from '../db';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/requireAuth';

const router = Router();

// SW-251: Create a playlist for the authenticated user.
// Require a valid login session before allowing playlist creation.
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  // Get the requested playlist name from the request body.
  const name = req.body?.name;

  // Reject empty, invalid, or excessively long playlist names.
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 255) {
    res.status(400).json({
      error: 'Playlist name must be between 1 and 255 characters',
    });
    return;
  }

  // Use the authenticated session to identify the playlist owner.
  const userId = req.auth?.userId;

  if (!userId) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return;
  }

  try {
    // Save the playlist in PostgreSQL under the current user's account.
    // Return the new playlist details, including its generated ID.
    const result = await pool.query(
      `
      INSERT INTO playlists (user_id, name)
      VALUES ($1, $2)
      RETURNING
        id::text AS "id",
        user_id::text AS "userId",
        name,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [userId, name.trim()]
    );

    // Confirm successful creation and return the saved playlist.
    res.status(201).json({
      playlist: result.rows[0],
    });
  } catch (error) {
    // Handle database failures without exposing internal error details.
    console.error('Failed to create playlist:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

 // SW-251: Retrieve all playlists belonging to the authenticated user.
 router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
   // Identify the user from their authenticated session.
   const userId = req.auth?.userId;

   if (!userId) {
     res.status(401).json({
       error: 'Authentication required',
     });
     return;
   }

   try {
     // Retrieve only playlists owned by the current user.
     // Display the newest playlists first.
     const result = await pool.query(
       `
       SELECT
         id::text AS "id",
         user_id::text AS "userId",
         name,
         created_at AS "createdAt",
         updated_at AS "updatedAt"
       FROM playlists
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       `,
       [userId]
     );

     // Return the user's playlists and total count.
     res.status(200).json({
       playlists: result.rows,
       count: result.rows.length,
     });
   } catch (error) {
     // Handle database failures without exposing internal details.
     console.error('Failed to retrieve playlists:', error);

     res.status(500).json({
       error: 'Internal server error',
     });
   }
 });

// SW-251: Retrieve a specific playlist and its saved songs.
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const playlistId = req.params.id;
  const userId = req.auth?.userId;

  // Only accept positive PostgreSQL BigInt identifiers.
  if (
    typeof playlistId !== 'string' ||
    !/^[1-9]\d*$/.test(playlistId) ||
    BigInt(playlistId) > 9223372036854775807n
  ) {
    res.status(400).json({ error: 'Invalid playlist ID' });
    return;
  }

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    // Retrieve only playlists belonging to the authenticated user.
    const result = await pool.query(
      `
      SELECT
        id::text AS "id",
        user_id::text AS "userId",
        name,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM playlists
      WHERE id = $1 AND user_id = $2
      `,
      [playlistId, userId]
    );

    // Return the same response for missing or unauthorized playlists.
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    // Retrieve songs associated with this playlist.
    const tracks = await pool.query(
      `
      SELECT
        t.id::text AS "id",
        t.title,
        t.duration_ms AS "durationMs",
        pt.added_at AS "addedAt"
      FROM playlist_tracks pt
      JOIN tracks t ON t.id = pt.track_id
      WHERE pt.playlist_id = $1
      ORDER BY pt.added_at ASC, t.id ASC
      `,
      [playlistId]
    );

    // Return playlist information and its songs.
    res.status(200).json({
      playlist: {
        ...result.rows[0],
        tracks: tracks.rows,
      },
    });
  } catch (error) {
    console.error('Failed to retrieve playlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
