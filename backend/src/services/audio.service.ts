import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../db';
import type { AudioByteRange } from '../utils/parseAudioRange';

// SW-258: Restrict playback to catalog media stored within a configured directory.
// File paths stored in media_files.file_path must be relative to MEDIA_ROOT.
export type AudioFile = {
  path: string;
  size: number;
  contentType: 'audio/mpeg';
};

export class AudioConfigurationError extends Error {}

export async function findTrackAudio(trackId: string): Promise<AudioFile | null> {
  const mediaRoot = process.env.MEDIA_ROOT;
  if (!mediaRoot) {
    throw new AudioConfigurationError('MEDIA_ROOT is not configured');
  }

  const result = await pool.query<{ filePath: string; mediaType: string }>(
    `SELECT mf.file_path AS "filePath", mf.media_type AS "mediaType"
       FROM tracks t
       JOIN media_files mf ON mf.track_id = t.id
      WHERE t.id = $1::bigint
        AND t.is_available = true
        AND mf.media_type = 'audio/mpeg'
      ORDER BY mf.id ASC
      LIMIT 1`,
    [trackId]
  );

  const media = result.rows[0];
  if (!media) return null;

  // Do not permit absolute paths, directory traversal, or null bytes from DB records.
  const relativeFile = media.filePath;
  if (!relativeFile || path.isAbsolute(relativeFile) || relativeFile.includes('\0')) return null;
  const segments = relativeFile.split(/[\\/]/);
  if (segments.some((segment) => segment === '..' || segment === '')) return null;

  const root = await realpath(path.resolve(mediaRoot));
  const candidate = path.resolve(root, ...segments);
  if (candidate === root || !candidate.startsWith(root + path.sep)) return null;

  // Resolve symlinks, too: a symlink inside MEDIA_ROOT must not expose outside files.
  let resolved: string;
  try {
    resolved = await realpath(candidate);
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
  if (!resolved.startsWith(root + path.sep)) return null;

  try {
    const info = await stat(resolved);
    if (!info.isFile()) return null;
    return { path: resolved, size: info.size, contentType: 'audio/mpeg' };
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT';
}

export function openAudioStream(file: AudioFile, range?: AudioByteRange) {
  // start/end are inclusive. Node's createReadStream emits exactly this section.
  return createReadStream(file.path, range ? { start: range.start, end: range.end } : undefined);
}
