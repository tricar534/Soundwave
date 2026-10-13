
import { Router } from 'express';
import { searchTracks } from '../services/track.service';

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
    // Search tracks through the reusable service.
    const tracks = await searchTracks(query.trim());

    // Return matching tracks.
    res.status(200).json({
      tracks,
      count: tracks.length,
    });
  } catch (error) {
    console.error('Failed to search tracks:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
