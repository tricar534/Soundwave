/**
 * Soundwave Sprint 5 / Task 4: browser audio playback actions.
 *
 * This controller deliberately reads the real HTMLAudioElement.paused/ended
 * properties rather than trusting React state. The component updates its UI
 * from audio events (play, pause, ended).
 *
 * A generation counter invalidates pending play() promises whenever a user
 * changes tracks, pauses, or restarts. This avoids showing stale playback
 * errors after the user has already switched to a different song.
 */
export function createPlaybackController(getAudio, { onError } = {}) {
  let generation = 0;
  let playPending = false;

  function pause() {
    generation += 1;
    playPending = false;
    const audio = getAudio();
    if (!audio) return 'unavailable';
    audio.pause();
    return 'paused';
  }

  function stop() {
    const result = pause();
    const audio = getAudio();
    if (audio) {
      try {
        audio.currentTime = 0;
      } catch {
        // Some browsers prohibit seeking before media metadata has loaded.
      }
    }
    return result === 'unavailable' ? result : 'stopped';
  }

  async function toggle() {
    const audio = getAudio();
    if (!audio) return 'unavailable';

    // Pausing is always allowed, even if a play request is still pending.
    if (!audio.paused) return pause();
    if (playPending) return 'pending';

    // Native media elements should replay after ended instead of remaining at
    // the end of the song. Normal pause/resume does NOT reset currentTime.
    if (audio.ended) {
      try {
        audio.currentTime = 0;
      } catch {
        // Let play() report an actionable error if the element cannot replay.
      }
    }

    const request = ++generation;
    playPending = true;
    try {
      await audio.play();
      return request === generation ? 'playing' : 'cancelled';
    } catch (error) {
      // Switching tracks commonly interrupts play() with AbortError. This
      // is expected; don't display a stale error after a user's new action.
      if (request !== generation || error?.name === 'AbortError') return 'cancelled';
      if (typeof onError === 'function') onError(error);
      return 'error';
    } finally {
      if (request === generation) playPending = false;
    }
  }

  return {
    toggle,
    pause,
    stop,
    restart: stop,
    get isPlayPending() {
      return playPending;
    },
  };
}

export function playbackErrorMessage(error) {
  if (error?.name === 'NotAllowedError') {
    return 'The browser blocked playback. Click Play again to allow sound.';
  }
  if (error?.name === 'NotSupportedError') {
    return 'This audio format is not supported by your browser.';
  }
  return error?.message || 'Unable to play this audio track.';
}
