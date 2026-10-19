import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Soundwaves database seed...");

  // Development-only deterministic reset.
  // Deletes dependent rows first to satisfy foreign keys.
  await prisma.$transaction([
    prisma.session.deleteMany(),
    prisma.mediaFile.deleteMany(),
    prisma.trackGenre.deleteMany(),
    prisma.trackArtist.deleteMany(),
    prisma.albumArtist.deleteMany(),
    prisma.track.deleteMany(),
    prisma.album.deleteMany(),
    prisma.artwork.deleteMany(),
    prisma.genre.deleteMany(),
    prisma.artist.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
  ]);

  // --------------------
  // Roles
  // --------------------

  const userRole = await prisma.role.create({
    data: {
      name: "USER",
      description: "Standard Soundwaves user",
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN",
      description: "Soundwaves administrator",
    },
  });

  // --------------------
  // Users
  // --------------------

  await prisma.user.createMany({
    data: [
      {
        roleId: userRole.id,
        username: "demo_listener",
        email: "listener@soundwaves.local",
        passwordHash: "DEMO_HASH_NOT_FOR_AUTHENTICATION",
        isActive: true,
      },
      {
        roleId: adminRole.id,
        username: "demo_admin",
        email: "admin@soundwaves.local",
        passwordHash: "DEMO_HASH_NOT_FOR_AUTHENTICATION",
        isActive: true,
      },
    ],
  });

  // --------------------
  // Artists
  // --------------------

  const nightWaves = await prisma.artist.create({
    data: {
      name: "The Night Waves",
      bio: "Demo artist used for Soundwaves development.",
      imagePath: "/media/demo/artists/the-night-waves.jpg",
    },
  });

  const lunarEcho = await prisma.artist.create({
    data: {
      name: "Lunar Echo",
      bio: "Demo electronic artist.",
      imagePath: "/media/demo/artists/lunar-echo.jpg",
    },
  });

  const staticHorizon = await prisma.artist.create({
    data: {
      name: "Static Horizon",
      bio: "Demo alternative artist.",
      imagePath: "/media/demo/artists/static-horizon.jpg",
    },
  });

  // --------------------
  // Genres
  // --------------------

  const rock = await prisma.genre.create({
    data: {
      name: "Rock",
      description: "Rock music",
    },
  });

  const electronic = await prisma.genre.create({
    data: {
      name: "Electronic",
      description: "Electronic music",
    },
  });

  const ambient = await prisma.genre.create({
    data: {
      name: "Ambient",
      description: "Ambient music",
    },
  });

  // --------------------
  // Artwork
  // --------------------

  const midnightArtwork = await prisma.artwork.create({
    data: {
      filePath: "/media/demo/artwork/midnight-signals.jpg",
      fileName: "midnight-signals.jpg",
      mediaType: "image/jpeg",
      fileSize: 250000n,
    },
  });

  const neonArtwork = await prisma.artwork.create({
    data: {
      filePath: "/media/demo/artwork/neon-coast.jpg",
      fileName: "neon-coast.jpg",
      mediaType: "image/jpeg",
      fileSize: 275000n,
    },
  });

  // --------------------
  // Albums
  // --------------------

  const midnightSignals = await prisma.album.create({
    data: {
      title: "Midnight Signals",
      releaseDate: new Date("2025-06-20T00:00:00.000Z"),
      artworkId: midnightArtwork.id,
    },
  });

  const neonCoast = await prisma.album.create({
    data: {
      title: "Neon Coast",
      releaseDate: new Date("2026-02-14T00:00:00.000Z"),
      artworkId: neonArtwork.id,
    },
  });

  // --------------------
  // Album artists
  // --------------------

  await prisma.albumArtist.createMany({
    data: [
      {
        albumId: midnightSignals.id,
        artistId: nightWaves.id,
        artistOrder: 1,
        isPrimary: true,
      },
      {
        albumId: neonCoast.id,
        artistId: lunarEcho.id,
        artistOrder: 1,
        isPrimary: true,
      },
    ],
  });

  // --------------------
  // Tracks
  // --------------------

  const midnightDrive = await prisma.track.create({
    data: {
      albumId: midnightSignals.id,
      title: "Midnight Drive",
      trackNumber: 1,
      durationMs: 214000,
      isAvailable: true,
    },
  });

  const signalLost = await prisma.track.create({
    data: {
      albumId: midnightSignals.id,
      title: "Signal Lost",
      trackNumber: 2,
      durationMs: 198000,
      isAvailable: true,
    },
  });

  const neonSky = await prisma.track.create({
    data: {
      albumId: neonCoast.id,
      title: "Neon Sky",
      trackNumber: 1,
      durationMs: 226000,
      isAvailable: true,
    },
  });

  const quietOrbit = await prisma.track.create({
    data: {
      title: "Quiet Orbit",
      durationMs: 305000,
      isAvailable: true,
    },
  });

  // --------------------
  // Additional demo tracks
  // --------------------

  const additionalTracks = [
    // Midnight Signals — The Night Waves
    {
      title: "City Lights",
      albumId: midnightSignals.id,
      trackNumber: 3,
      durationMs: 205000,
      artistId: nightWaves.id,
      genreId: rock.id,
    },
    {
      title: "After Hours",
      albumId: midnightSignals.id,
      trackNumber: 4,
      durationMs: 221000,
      artistId: nightWaves.id,
      genreId: rock.id,
    },
    {
      title: "Fading Memories",
      albumId: midnightSignals.id,
      trackNumber: 5,
      durationMs: 197000,
      artistId: nightWaves.id,
      genreId: rock.id,
    },
    {
      title: "Electric Dreams",
      albumId: midnightSignals.id,
      trackNumber: 6,
      durationMs: 234000,
      artistId: nightWaves.id,
      genreId: rock.id,
    },

    // Neon Coast — Lunar Echo
    {
      title: "Digital Sunset",
      albumId: neonCoast.id,
      trackNumber: 2,
      durationMs: 218000,
      artistId: lunarEcho.id,
      genreId: electronic.id,
    },
    {
      title: "Neon Nights",
      albumId: neonCoast.id,
      trackNumber: 3,
      durationMs: 242000,
      artistId: lunarEcho.id,
      genreId: electronic.id,
    },
    {
      title: "Ocean Drive",
      albumId: neonCoast.id,
      trackNumber: 4,
      durationMs: 210000,
      artistId: lunarEcho.id,
      genreId: electronic.id,
    },
    {
      title: "Starlight",
      albumId: neonCoast.id,
      trackNumber: 5,
      durationMs: 226000,
      artistId: lunarEcho.id,
      genreId: electronic.id,
    },

    // Singles — Static Horizon
    {
      title: "Lost Frequencies",
      albumId: null,
      trackNumber: null,
      durationMs: 260000,
      artistId: staticHorizon.id,
      genreId: ambient.id,
    },
    {
      title: "Distant Echoes",
      albumId: null,
      trackNumber: null,
      durationMs: 195000,
      artistId: staticHorizon.id,
      genreId: ambient.id,
    },
    {
      title: "Solar Drift",
      albumId: null,
      trackNumber: null,
      durationMs: 248000,
      artistId: staticHorizon.id,
      genreId: ambient.id,
    },
  ];

  const createdAdditionalTracks = [];

  for (const track of additionalTracks) {
    const created = await prisma.track.create({
      data: {
        title: track.title,
        albumId: track.albumId,
        trackNumber: track.trackNumber,
        durationMs: track.durationMs,
        isAvailable: true,
      },
    });

    createdAdditionalTracks.push({
      trackId: created.id,
      artistId: track.artistId,
      genreId: track.genreId,
    });
  }

  // --------------------
  // Track artists
  // --------------------

  await prisma.trackArtist.createMany({
    data: [
      {
        trackId: midnightDrive.id,
        artistId: nightWaves.id,
        artistOrder: 1,
        role: "primary",
      },
      {
        trackId: signalLost.id,
        artistId: nightWaves.id,
        artistOrder: 1,
        role: "primary",
      },
      {
        trackId: neonSky.id,
        artistId: lunarEcho.id,
        artistOrder: 1,
        role: "primary",
      },
      {
        trackId: quietOrbit.id,
        artistId: staticHorizon.id,
        artistOrder: 1,
        role: "primary",
      },
    ],
  });

  // Additional track artists
  await prisma.trackArtist.createMany({
    data: createdAdditionalTracks.map((track) => ({
      trackId: track.trackId,
      artistId: track.artistId,
      artistOrder: 1,
      role: "primary",
    })),
  });

  // --------------------
  // Track genres
  // --------------------

  await prisma.trackGenre.createMany({
    data: [
      {
        trackId: midnightDrive.id,
        genreId: rock.id,
      },
      {
        trackId: signalLost.id,
        genreId: rock.id,
      },
      {
        trackId: neonSky.id,
        genreId: electronic.id,
      },
      {
        trackId: quietOrbit.id,
        genreId: ambient.id,
      },
    ],
  });

  // Additional track genres
  await prisma.trackGenre.createMany({
    data: createdAdditionalTracks.map((track) => ({
      trackId: track.trackId,
      genreId: track.genreId,
    })),
  });

  // --------------------
  // Media files
  // --------------------

  await prisma.mediaFile.createMany({
    data: [
      {
        trackId: midnightDrive.id,
        filePath: "/media/demo/midnight-signals/midnight-drive.flac",
        fileName: "midnight-drive.flac",
        mediaType: "audio/flac",
        fileSize: 25000000n,
        codec: "FLAC",
      },
      {
        trackId: signalLost.id,
        filePath: "/media/demo/midnight-signals/signal-lost.flac",
        fileName: "signal-lost.flac",
        mediaType: "audio/flac",
        fileSize: 23000000n,
        codec: "FLAC",
      },
      {
        trackId: neonSky.id,
        filePath: "/media/demo/neon-coast/neon-sky.flac",
        fileName: "neon-sky.flac",
        mediaType: "audio/flac",
        fileSize: 27000000n,
        codec: "FLAC",
      },
      {
        trackId: quietOrbit.id,
        filePath: "/media/demo/singles/quiet-orbit.flac",
        fileName: "quiet-orbit.flac",
        mediaType: "audio/flac",
        fileSize: 31000000n,
        codec: "FLAC",
      },
    ],
  });

  console.log("Soundwaves seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
