// SW-222: Temporary artwork mapping for demo tracks.
// Shared by Home and Search until the API provides artwork.

const artworkByTitle = {
  "Midnight Drive": "/images/city-light.jpeg",
  "Signal Lost": "/images/highway.jpeg",
  "Neon Sky": "/images/sunset.jpeg",
  "Quiet Orbit": "/images/lofi.jpeg",
  "City Lights": "/images/morning.jpeg",
  "After Hours": "/images/highway.jpeg",
  "Fading Memories": "/images/beach.jpeg",
  "Electric Dreams": "/images/hand.jpeg",
  "Digital Sunset": "/images/sunset.jpeg",
  "Neon Nights": "/images/city-light.jpeg",
  "Ocean Drive": "/images/beach.jpeg",
  "Starlight": "/images/morning.jpeg",
  "Lost Frequencies": "/images/lofi.jpeg",
  "Distant Echoes": "/images/hand.jpeg",
  "Solar Drift": "/images/highway.jpeg",
};

export function getTrackArtwork(title) {
  return artworkByTitle[title] ?? "/images/lofi.jpeg";
}