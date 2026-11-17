/**
 * Soundwave Sprint 5, Task 5 — audio timeline and track-state helpers.
 *
 * Uses the browser's actual HTMLAudioElement timeline rather than a JavaScript
 * interval, so pausing, seeking, ending and browser buffering stay in sync.
 * This module does not depend on a backend, personal MP3 path or database.
 */

function nonNegativeFinite(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Display elapsed/duration as m:ss, or h:mm:ss for long audio. */
export function formatPlaybackTime(seconds) {
  const whole = Math.floor(nonNegativeFinite(seconds));
  const sec = String(whole % 60).padStart(2, '0');
  const min = Math.floor(whole / 60);
  if (min < 60) return `${min}:${sec}`;
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}:${sec}`;
}

/**
 * Read playback and buffered progress from a media element.
 * The buffered value represents the range containing the playhead, not a
 * falsely claimed 100% when the browser has buffered a disjoint later range.
 */
export function readPlaybackTimeline(audio) {
  if (!audio) return { position: 0, duration: 0, playedPercent: 0, bufferedPercent: 0 };

  const duration = nonNegativeFinite(audio.duration);
  const current = nonNegativeFinite(audio.currentTime);
  const position = duration > 0 ? Math.min(current, duration) : current;
  const playedPercent = duration > 0 ? (position / duration) * 100 : 0;
  let bufferedEnd = 0;

  if (duration > 0 && audio.buffered) {
    try {
      const ranges = audio.buffered;
      for (let index = 0; index < ranges.length; index += 1) {
        const start = ranges.start(index);
        const end = ranges.end(index);
        if (Number.isFinite(start) && Number.isFinite(end) && start <= position && end >= position) {
          bufferedEnd = Math.max(bufferedEnd, end);
        }
      }
    } catch {
      // Some media sources temporarily have unavailable TimeRanges.
    }
  }

  const bufferedPercent = duration > 0 ? (Math.min(bufferedEnd, duration) / duration) * 100 : 0;
  return { position, duration, playedPercent, bufferedPercent };
}

/**
 * Seek safely, honoring the file's known duration. No seek is attempted before
 * finite metadata is available. Seeking preserves the paused/playing state.
 */
export function seekPlayback(audio, requestedSeconds) {
  if (!audio) return { ok: false, reason: 'no-audio' };
  const duration = nonNegativeFinite(audio.duration);
  if (duration === 0 || !Number.isFinite(requestedSeconds)) {
    return { ok: false, reason: 'not-seekable' };
  }

  const position = Math.max(0, Math.min(requestedSeconds, duration));
  try {
    audio.currentTime = position;
    return { ok: true, position };
  } catch {
    return { ok: false, reason: 'seek-failed' };
  }
}

/** Human-readable state derived from native events; never from an artificial timer. */
export function getPlaybackState({
  hasSource = false,
  isLoading = false,
  hasError = false,
  ended = false,
  seeking = false,
  buffering = false,
  playing = false,
  position = 0,
} = {}) {
  if (hasError) return 'Error';
  if (isLoading) return 'Loading';
  if (!hasSource) return 'No audio';
  if (ended) return 'Finished';
  if (seeking) return 'Seeking';
  if (buffering && playing) return 'Buffering';
  if (playing) return 'Playing';
  if (nonNegativeFinite(position) > 0) return 'Paused';
  return 'Ready';
}
