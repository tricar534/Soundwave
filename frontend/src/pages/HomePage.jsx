import MediaCard from "../components/MediaCard";

const recentlyPlayed = [
  {
    id: 1,
    title: "Midnight Drive",
    subtitle: "Example Artist",
    image: "/images/album-placeholder.jpg",
    type: "Song",
  },
  {
    id: 2,
    title: "Chill Waves",
    subtitle: "Soundwave Mix",
    image: "/images/album-placeholder.jpg",
    type: "Playlist",
  },
  {
    id: 3,
    title: "Focus Mode",
    subtitle: "Study Playlist",
    image: "/images/album-placeholder.jpg",
    type: "Playlist",
  },
];

function HomePage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Home</h2>
          <p>Welcome back to Soundwave.</p>
        </div>

        <input
          className="search-input"
          type="search"
          placeholder="Search songs, artists, or albums"
          aria-label="Search music"
        />
      </header>

      <section>
        <h2>Recently Played</h2>

        <div className="media-grid">
          {recentlyPlayed.map((item) => (
            <MediaCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              image={item.image}
              type={item.type}
              onSelect={() =>
                console.log(`Selected ${item.title}`)
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;