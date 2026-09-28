import PageHeader from "../components/PageHeader";
import MediaCard from "../components/MediaCard";


const recentlyPlayed = [
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
];

const recommended = [
  {
    id: 4,
    title: "Late Night Mix",
    subtitle: "Soundwave",
    image: "/images/highway.jpeg",
    type: "Playlist",
  },
  {
    id: 5,
    title: "Morning Focus",
    subtitle: "Soundwave",
    image: "/images/morning.jpeg",
    type: "Playlist",
  },
  {
    id: 6,
    title: "Discover Weekly",
    subtitle: "Soundwave",
    image: "/images/hand.jpeg",
    type: "Playlist",
  },
];

const madeForYou = [
  {
    id: 7,
    title: "Daily Mix",
    subtitle: "Personalized Mix",
    image: "/images/daily-mix.jpg",
    type: "Playlist",
  },
  {
    id: 8,
    title: "Acoustic Sessions",
    subtitle: "Soundwave Picks",
    image: "/images/acoustic-sessions.jpg",
    type: "Playlist",
  },
  {
    id: 9,
    title: "Weekend Energy",
    subtitle: "Soundwave Mix",
    image: "/images/weekend-energy.jpg",
    type: "Playlist",
  },
];

function HomePage() {
  return (
    <div className="page">
      <PageHeader
        title="Home"
        description="Welcome back to Soundwave."
      >
        <input
          className="search-input"
          type="search"
          placeholder="Search songs, artists, or albums"
          aria-label="Search music"
        />
      </PageHeader>

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

      <section>
        <h2>Recommended</h2>

        <div className="media-grid">
          {recommended.map((item) => (
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

      <section>
        <h2>Made for You</h2>

        <div className="media-grid">
          {madeForYou.map((item) => (
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