import { useState } from "react";

const noTrackSelected = {
  title: "No track selected",
  artist: "Soundwave",
};

function PlaybackBar({ currentTrack }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const trackToDisplay = currentTrack
    ? {
        title: currentTrack.title,
        artist: currentTrack.subtitle,
      }
    : noTrackSelected;

  return (
    <footer className="playback-bar">
      
      <div className="track-info">
        
        {/* Keep artwork inside the fixed-size placeholder container. */}
        <div className="track-placeholder">
         
         {/* Display the selected song's artwork when available. */}
         {currentTrack?.image && (
            <img
              className="track-artwork"
              src={currentTrack.image}
              alt={`${currentTrack.title} artwork`}
            />
          )}
        </div>
        
        {/* Display the selected track's title and artist. */}
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
