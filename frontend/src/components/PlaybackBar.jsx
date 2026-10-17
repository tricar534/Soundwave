import { useEffect, useState } from "react";

const noTrackSelected = {
  title: "No track selected",
  artist: "Soundwave",
};

function PlaybackBar({ currentTrack }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // SW-117: switching to a different track (or clearing the selection)
  // resets playback to paused, rather than carrying over play state
  // from whatever was previously selected.
  useEffect(() => {
    setIsPlaying(false);
  }, [currentTrack?.id]);

  const trackToDisplay = currentTrack
    ? {
        title: currentTrack.title,
        artist: currentTrack.subtitle,
      }
    : noTrackSelected;

  return (
    <footer className="playback-bar">
      <div className="track-info">
        <div className="track-placeholder" />

        <div>
          <strong>{trackToDisplay.title}</strong>
          <p>{trackToDisplay.artist}</p>
        </div>
      </div>

      <div className="playback-controls">
        <button
          type="button"
          aria-label="Previous track"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? "Pause" : "Play"}
          disabled={!currentTrack}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <button
          type="button"
          aria-label="Next track"
        >
          Next
        </button>
      </div>

      <div className="volume-control">
        <label htmlFor="volume">
          Volume
        </label>

        <input
          id="volume"
          type="range"
          min="0"
          max="100"
          defaultValue="70"
        />
      </div>
    </footer>
  );
}

export default PlaybackBar;
