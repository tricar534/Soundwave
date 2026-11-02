import type { NextFunction, Request, Response } from 'express';
import { pool } from '../db';
import { hashToken } from '../utils/session';

// SW-123: authenticates a request by its Bearer token.
// The presented token is hashed and looked up; the raw token is never stored or logged.
export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; sessionId: string };
}

const BEARER_PATTERN = /^Bearer ([0-9a-f]{64})$/;

// One body for every rejection reason (missing, malformed, unknown, expired, revoked),
// so a caller cannot tell why a token failed.
const UNAUTHENTICATED = { error: 'Authentication required' };

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const match = BEARER_PATTERN.exec(req.headers.authorization ?? '');

  if (!match) {
    res.status(401).json(UNAUTHENTICATED);
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT s.id::text AS "sessionId", s.user_id::text AS "userId"
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.is_active = true
      LIMIT 1
      `,
      [hashToken(match[1])]
    );

    const session = result.rows[0];

    if (!session) {
      res.status(401).json(UNAUTHENTICATED);
      return;
    }

    req.auth = { userId: session.userId, sessionId: session.sessionId };
    next();
  } catch (error) {
    console.error('Failed to authenticate request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
