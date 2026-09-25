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
    </div>
  );
}

export default SearchPage;