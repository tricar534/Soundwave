import { Router } from 'express';
import { isValidPostgresTrackId } from '../utils/validateTrackId';
import { 
  getCatalogTracks, 
  getTrackById,
} from '../services/track.service';

const router = Router();

// Retrieve all catalog tracks.
router.get('/', async (req, res) => {
  try {
    // Retrieve tracks from PostgreSQL
    const tracks = await getCatalogTracks();

    // Return the catalog tracks and total retrieved.
    res.status(200).json({
      tracks,
      count: tracks.length,
    });
  } catch (error) {
    console.error('Failed to retrieve tracks:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});


// Retrieve an individual track by ID.
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID is a positive PostgreSQL BigInt.
  
  if (!isValidPostgresTrackId(id)) {
  res.status(400).json({
    error: 'Invalid track ID',
  });
  return;
}

  try {
    // Retrieve the track through the service.
    const track = await getTrackById(id);

    // Track does not exist.
    if (!track) {
      res.status(404).json({
        error: 'Track not found',
      });
      return;
    }

    // Track found successfully.
    res.status(200).json({
      track,
    });
  } catch (error) {
    console.error('Failed to retrieve track:', error);

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});


export default router;