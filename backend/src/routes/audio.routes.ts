import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { isValidPostgresTrackId } from '../utils/validateTrackId';
import { parseAudioRange } from '../utils/parseAudioRange';
import {
  AudioConfigurationError,
  findTrackAudio,
  openAudioStream,
} from '../services/audio.service';

const router = Router();

// Task 2: GET /api/tracks/:id/audio
// Keep SW-258's authenticated MP3 retrieval and add one HTTP byte range per request.
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

    const selection = parseAudioRange(req.get('Range'), audio.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (selection.kind === 'unsatisfiable') {
      res.setHeader('Content-Range', `bytes */${audio.size}`);
      res.status(416).json({ error: 'Requested range not satisfiable' });
      return;
    }

    const isPartial = selection.kind === 'partial';
    const length = isPartial ? selection.end - selection.start + 1 : audio.size;
    const stream = openAudioStream(audio, isPartial ? selection : undefined);

    // Clean up the source stream if the client disconnects during playback.
    res.once('close', () => stream.destroy());

    stream.once('open', () => {
      // Do not emit a successful response until the file descriptor is open.
      res.status(isPartial ? 206 : 200);
      res.setHeader('Content-Type', audio.contentType);
      res.setHeader('Content-Length', String(length));
      if (isPartial) {
        res.setHeader('Content-Range', `bytes ${selection.start}-${selection.end}/${audio.size}`);
      }
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
