import { useState } from "react";
import MediaCard from "../components/MediaCard";
import PageHeader from "../components/PageHeader";

const mockSongs = [
  {
    id: 1,
    title: "Nightfall",
    subtitle: "Example Artist",
    image: "/images/album-placeholder.jpg",
    type: "Song",
  },
  {
    id: 2,
    title: "Night Drive",
    subtitle: "Another Artist",
    image: "/images/album-placeholder.jpg",
    type: "Song",
  },
  {
    id: 3,
    title: "Late Night Mix",
    subtitle: "Soundwave",
    image: "/images/late-night-mix.jpg",
    type: "Playlist",
  },
  {
    id: 4,
    title: "Morning Focus",
    subtitle: "Soundwave",
    image: "/images/morning-focus.jpg",
    type: "Playlist",
  },
  {
  id: 5,
  title: "City Lights",
  subtitle: "Neon Echo",
  image: "/images/city-lights.jpg",
  type: "Song",
},
{
  id: 6,
  title: "Ocean Breeze",
  subtitle: "Coastal Sounds",
  image: "/images/ocean-breeze.jpg",
  type: "Song",
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

  const results = mockSongs.filter((song) =>
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