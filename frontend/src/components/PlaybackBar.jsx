import { useState } from "react";

function PlaybackBar() {
  const [isPlaying, setIsPlaying] = useState(false);

  const currentTrack = {
    title: "No track selected",
    artist: "Soundwave",
  };

  return (
    <footer className="playback-bar">
      <div className="track-info">
        <div className="track-placeholder" />

        <div>
          <strong>{currentTrack.title}</strong>
          <p>{currentTrack.artist}</p>
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