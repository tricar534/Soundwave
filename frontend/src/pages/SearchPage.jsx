import { useEffect, useState } from "react";
import MediaCard from "../components/MediaCard";
import PageHeader from "../components/PageHeader";
import { getTracks } from "../services/api";

const mockSongs = [
  {
    id: 1,
    title: "Midnight Drive",
    subtitle: "Example Artist",
    image: "/images/lofi.jpeg",
    type: "Song",
  },
  {
    id: 2,
    title: "Chill Waves",
    subtitle: "Soundwave Mix",
    image: "/images/beach.jpeg",
    type: "Playlist",
  },
  {
    id: 3,
    title: "Focus Mode",
    subtitle: "Study Playlist",
    image: "/images/sunset.jpeg",
    type: "Playlist",
  },
  {
    id: 4,
    title: "Late Night Mix",
    subtitle: "Soundwave",
    image: "/images/highway.jpeg",
    type: "Playlist",
  },
  {
  id: 5,
  title: "City Lights",
  subtitle: "Neon Echo",
  image: "/images/city-light.jpeg",
  type: "Song",
},
{
  id: 6,
  title: "Discover Weekly",
  subtitle: "Soundwave",
  image: "/images/hand.jpeg",
  type: "Playlist",
},
{
  id: 7,
  title: "Study Session",
  subtitle: "Soundwave Focus",
  image: "/images/study-session.jpg",
  type: "Playlist",
},
{
  id: 8,
  title: "Weekend Vibes",
  subtitle: "Soundwave Mix",
  image: "/images/weekend-vibes.jpg",
  type: "Playlist",
},
{
  id: 9,
  title: "After Hours",
  subtitle: "Night Collective",
  image: "/images/after-hours.jpg",
  type: "Album",
},
];

function SearchPage() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState(mockSongs);
  const [catalogStatus, setCatalogStatus] = useState("loading");

   useEffect(() => {
    async function loadTracks() {
      try {
        const data = await getTracks();

        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          // Do not map these into MediaCard yet until
          // the backend track object structure is confirmed.
          console.log("Backend tracks:", data.tracks);
          setCatalogStatus("connected");
        } else {
          // Backend is working, but no real catalog data exists yet.
          setSongs(mockSongs);
          setCatalogStatus("empty");
        }
      } catch (error) {
        console.error("Unable to load backend tracks:", error);

        // Preserve working frontend content when API fails.
        setSongs(mockSongs);
        setCatalogStatus("unavailable");
      }
    }

    loadTracks();
  }, []);

  const results = songs.filter((song) =>
    `${song.title} ${song.subtitle} ${song.type}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

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
        onChange={(event) =>
          setQuery(event.target.value)
        }
      />

      {catalogStatus === "loading" && (
        <p>Loading catalog...</p>
      )}
      
      {catalogStatus === "empty" && (
        <p>Backend catalog is empty. Showing sample content.</p>
      )}

      {catalogStatus === "unavailable" && (
        <p>Backend unavailable. Showing sample content.</p>
      )}


      <div className="media-grid">
        {results.map((song) => (
          <MediaCard
            key={song.id}
            title={song.title}
            subtitle={song.subtitle}
            image={song.image}
            type={song.type}
          />
        ))}
      </div>
      {results.length === 0 && (
        <p>No songs, artists, or playlists found.</p>
      )}
    </div>
  );
}

export default SearchPage;