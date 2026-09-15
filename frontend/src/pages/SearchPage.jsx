import { useState } from "react";
import MediaCard from "../components/MediaCard";

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
];

function SearchPage() {
  const [query, setQuery] = useState("");

  const results = mockSongs.filter((song) =>
    song.title
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Search</h2>
          <p>Find songs, artists, and albums.</p>
        </div>
      </header>

      <input
        className="search-input"
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
    </div>
  );
}

export default SearchPage;