import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { isValidPostgresTrackId } from '../utils/validateTrackId';
import {
  AudioConfigurationError,
  findTrackAudio,
  openAudioStream,
} from '../services/audio.service';

const router = Router();

// SW-258: GET /api/tracks/:id/audio
// Authenticated full-file MP3 response. HTTP Range requests are covered by Task 2.
router.get('/:id/audio', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!isValidPostgresTrackId(id)) {
    res.status(400).json({ error: 'Invalid track ID' });
    return;
  }

  try {
    const audio = await findTrackAudio(id);
    if (!audio) {
      res.status(404).json({ error: 'Audio not found' });
      return;
    }

    const stream = openAudioStream(audio);
    // Avoid sending success headers until the file descriptor is actually open.
    stream.once('open', () => {
      res.setHeader('Content-Type', audio.contentType);
      res.setHeader('Content-Length', String(audio.size));
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // No Accept-Ranges header until Task 2 adds range support.
      stream.pipe(res);
    });
    stream.on('error', (error) => {
      console.error('Audio stream failed:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Audio streaming failed' });
      } else {
        res.destroy(error);
      }
    });
  } catch (error) {
    if (error instanceof AudioConfigurationError) {
      console.error('Audio endpoint is not configured');
      res.status(503).json({ error: 'Audio service unavailable' });
      return;
    }
    console.error('Failed to retrieve track audio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
