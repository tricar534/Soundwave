
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

export default router;
