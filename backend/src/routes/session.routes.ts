import { Router } from 'express';
import { pool } from '../db';
import { AuthenticatedRequest, requireAuth } from '../middleware/requireAuth';

const router = Router();

// Logout: revoke the session that authenticated this request.
// Once revoked_at is set, requireAuth rejects the token with 401.
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await pool.query('UPDATE sessions SET revoked_at = now() WHERE id = $1::bigint', [
      req.auth?.sessionId,
    ]);
    res.status(204).end();
  } catch (error) {
    console.error('Failed to log out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route: returns the authenticated user's id and username.
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query('SELECT id::text AS id, username FROM users WHERE id = $1::bigint', [
      req.auth?.userId,
    ]);
    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Failed to load current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
