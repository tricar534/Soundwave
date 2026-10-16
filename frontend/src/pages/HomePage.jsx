import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import MediaCard from "../components/MediaCard";
import MediaSection from "../components/MediaSection";
import { getTracks } from "../services/api";

const sampleRecentlyPlayed = [
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

const sampleRecommended = [
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

const sampleMadeForYou = [
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

// SW-115: the backend's GET /tracks endpoint returns one flat, uncategorized list
// (see docs/risks/sw-98-frontend-backend-contract-gap.md) - there is no server-side
// concept of "Recently Played" / "Recommended" / "Made for You" yet. Until that
// categorization exists, we split the fetched list into three groups purely for
// display purposes.
function splitIntoThree(list) {
  const size = Math.ceil(list.length / 3);
  return [
    list.slice(0, size),
    list.slice(size, size * 2),
    list.slice(size * 2),
  ];
}

// SW-115: the backend Track model has no artist or cover-image fields yet, so real
// tracks are mapped onto MediaCard with placeholder subtitle/image values until
// that data exists on the API.
function mapTrackToCard(track) {
  return {
    id: track.id,
    title: track.title,
    subtitle: "Soundwave",
    image: "/images/lofi.jpeg",
    type: "Song",
  };
}

function HomePage({ onSelectTrack, onOpenSearch }) {
  const [recentlyPlayed, setRecentlyPlayed] = useState(sampleRecentlyPlayed);
  const [recommended, setRecommended] = useState(sampleRecommended);
  const [madeForYou, setMadeForYou] = useState(sampleMadeForYou);
  const [homeQuery, setHomeQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    getTracks()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const tracks = data?.tracks ?? [];

        if (tracks.length === 0) {
          // Keep sample content as fallback while /api/tracks returns no records
          return;
        }

        const mapped = tracks.map(mapTrackToCard);
        const [first, second, third] = splitIntoThree(mapped);

        setRecentlyPlayed(first.length > 0 ? first : sampleRecentlyPlayed);
        setRecommended(second.length > 0 ? second : sampleRecommended);
        setMadeForYou(third.length > 0 ? third : sampleMadeForYou);
      })
      .catch(() => {
        // Keep sample content as fallback if the request fails
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page">
      <PageHeader
        title="Home"
        description="Welcome back to Soundwave."
      >
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onOpenSearch(homeQuery.trim());
        }}
      >
        <input
          className="search-input"
          type="search"
          placeholder="Search songs, artists, or albums"
          aria-label="Search music"
          value={homeQuery}
          onChange={(event) => setHomeQuery(event.target.value)}
        />
      </form>
      </PageHeader>

      <MediaSection title="Recently Played">
        {recentlyPlayed.map((item) => (
          <MediaCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            image={item.image}
            type={item.type}
            onSelect={() => {
              console.log(`Selected ${item.title}`);
              if (item.type === "Song" && onSelectTrack) {
                onSelectTrack(item);
              }
            }}
          />
        ))}
      </MediaSection>

      <MediaSection title="Recommended">
        {recommended.map((item) => (
          <MediaCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            image={item.image}
            type={item.type}
            onSelect={() => {
              console.log(`Selected ${item.title}`);
              if (item.type === "Song" && onSelectTrack) {
                onSelectTrack(item);
              }
            }}
          />
        ))}
      </MediaSection>

      <MediaSection title="Made for You">
        {madeForYou.map((item) => (
          <MediaCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            image={item.image}
            type={item.type}
            onSelect={() => {
              console.log(`Selected ${item.title}`);
              if (item.type === "Song" && onSelectTrack) {
                onSelectTrack(item);
              }
            }}
          />
        ))}
      </MediaSection>
    </div>
  );
}

export default HomePage;
