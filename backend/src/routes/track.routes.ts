import { Router } from 'express';
import { isValidPostgresTrackId } from '../utils/validateTrackId';
import { parsePagination } from '../utils/validatePagination';
import { 
  getCatalogTracks, 
  getTrackById,
} from '../services/track.service';

const router = Router();

// Retrieve catalog tracks. Optional limit and offset query parameters select a page.
router.get('/', async (req, res) => {
  // Validate pagination before querying the database.
  const pagination = parsePagination(req.query);

  if (!pagination.ok) {
    res.status(400).json({
      error: pagination.error,
    });
    return;
  }

  try {
    // Retrieve tracks from PostgreSQL
    const tracks = await getCatalogTracks(pagination.limit, pagination.offset);

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