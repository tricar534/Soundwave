import { Router } from 'express';
import { testDatabaseConnection } from '../db';

const router = Router();

// Application readiness: confirm PostgreSQL responds to a real query.
router.get('/', async (_req, res) => {
  try {
    await testDatabaseConnection();

    return res.status(200).json({
      status: 'ready',
      database: 'connected',
    });
  } catch {
    // Never expose connection strings, credentials, or driver errors to clients.
    return res.status(503).json({
      status: 'not_ready',
      database: 'unavailable',
    });
  }
});

export default router;
