import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const tracks: unknown[] = [];

  res.json({
    tracks,
    count: tracks.length,
  });
});

export default router;