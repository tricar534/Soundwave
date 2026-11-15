import { useEffect, useState } from "react";
import MediaCard from "../components/MediaCard";
import PageHeader from "../components/PageHeader";
import { getTracks, searchTracks } from "../services/api";
import { getTrackArtwork } from "../utils/trackArtwork";

// Map a backend track record into the shape MediaCard expects.
function mapTrack(track) {
  return {
    id: track.id,
    title: track.title,
    subtitle: "Soundwave",
    image: getTrackArtwork(track.title),
    type: "Song",
  };
}

function SearchPage({
  onSelectTrack,
  initialQuery = "",
  onQueryChange,
}) {

  // Initialize Search with the last query saved in App.
  const [query, setQuery] = useState(initialQuery);

  // Full catalog, shown when there is no active search query.
  const [catalog, setCatalog] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState("loading");

  // Backend-driven search results, shown while a query is active.
  // SW-MS: replaces the old client-side filter of the loaded catalog.
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | loading | success | error

  // Update the Search input and preserve its value in App.
  function handleQueryChange(event) {
    const nextQuery = event.target.value;

    // Immediately update Search results as the user types.
    setQuery(nextQuery);

    // Save the query in App so navigating away doesn't erase it.
    // Optional chaining keeps SearchPage usable in standalone tests.
    onQueryChange?.(nextQuery);
  }

  // Load the full catalog once, for the default browse view (no query).
  useEffect(() => {
    async function loadTracks() {
      try {
        const data = await getTracks();

        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          setCatalog(data.tracks.map(mapTrack));
          setCatalogStatus("connected");
        } else {
          // Backend is working, but no real catalog data exists yet.
          setCatalog([]);
          setCatalogStatus("empty");
        }
      } catch (error) {
        console.error("Unable to load backend tracks:", error);

        // SW-MS: no more hardcoded sample-data fallback that masks a
        // real backend failure. Show an honest unavailable state instead.
        setCatalog([]);
        setCatalogStatus("unavailable");
      }
    }

    loadTracks();
  }, []);

  // Run a real backend search (GET /api/search) whenever the query changes.
  // SW-MS: replaces filtering the already-loaded catalog in the browser.
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      setSearchStatus("idle");
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setSearchStatus("loading");

    // Small debounce so we don't hit the API on every keystroke.
    const timeoutId = setTimeout(async () => {
      try {
        const data = await searchTracks(trimmed);

        if (cancelled) return;

        setSearchResults(
          Array.isArray(data.tracks) ? data.tracks.map(mapTrack) : []
        );
        setSearchStatus("success");
      } catch (error) {
        if (cancelled) return;

        console.error("Unable to search tracks:", error);

        // SW-MS: a failed search shows a real error, not fake results.
        setSearchResults([]);
        setSearchStatus("error");
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  const isSearching = query.trim().length > 0;
  const results = isSearching ? searchResults : catalog;

  return (
    <div className="page">
      <PageHeader
        title="Search"
        description="Find songs, artists, and albums."
      />

      <input
        className="search-input search-page-input"
        type="search"
        placeholder="Search Soundwave"
        value={query}
        onChange={handleQueryChange}
      />

      {!isSearching && catalogStatus === "loading" && (
        <p>Loading catalog...</p>
      )}

      {!isSearching && catalogStatus === "empty" && (
        <p>No tracks in the catalog yet.</p>
      )}

      {!isSearching && catalogStatus === "unavailable" && (
        <p>Backend unavailable. Please try again later.</p>
      )}

      {isSearching && searchStatus === "loading" && (
        <p>Searching...</p>
      )}

      {isSearching && searchStatus === "error" && (
        <p>Search failed. Please try again.</p>
      )}

      <div className="media-grid">
        {results.map((song) => (
          <MediaCard
            key={song.id}
            title={song.title}
            subtitle={song.subtitle}
            image={song.image}
            type={song.type}
            onSelect={() => {
              if (song.type === "Song" && onSelectTrack) {
                onSelectTrack(song);
              }
            }}
          />
        ))}
      </div>

      {isSearching && searchStatus === "success" && results.length === 0 && (
        <p>No songs, artists, or playlists found.</p>
      )}
    </div>
  );
}

export default SearchPage;
