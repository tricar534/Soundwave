-- CreateTable
CREATE TABLE "artists" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "bio" TEXT,
    "image_path" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "release_date" DATE,
    "artwork_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" BIGSERIAL NOT NULL,
    "album_id" BIGINT,
    "title" VARCHAR(255) NOT NULL,
    "track_number" SMALLINT,
    "duration_ms" INTEGER NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork" (
    "id" BIGSERIAL NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "media_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" BIGSERIAL NOT NULL,
    "track_id" BIGINT NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "media_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "codec" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_artists" (
    "track_id" BIGINT NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "artist_order" SMALLINT NOT NULL DEFAULT 1,
    "role" VARCHAR(50),

    CONSTRAINT "track_artists_pkey" PRIMARY KEY ("track_id","artist_id")
);

-- CreateTable
CREATE TABLE "album_artists" (
    "album_id" BIGINT NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "artist_order" SMALLINT NOT NULL DEFAULT 1,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "album_artists_pkey" PRIMARY KEY ("album_id","artist_id")
);

-- CreateTable
CREATE TABLE "track_genres" (
    "track_id" BIGINT NOT NULL,
    "genre_id" BIGINT NOT NULL,

    CONSTRAINT "track_genres_pkey" PRIMARY KEY ("track_id","genre_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_genres_name" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_artwork_file_path" ON "artwork"("file_path");

-- CreateIndex
CREATE UNIQUE INDEX "uq_media_files_file_path" ON "media_files"("file_path");

-- AddCheckConstraints

-- Artists must have a non-empty name
ALTER TABLE "artists"
ADD CONSTRAINT "chk_artists_name"
CHECK (BTRIM("name") <> '');

-- Albums must have a non-empty title
ALTER TABLE "albums"
ADD CONSTRAINT "chk_albums_title"
CHECK (BTRIM("title") <> '');

-- Tracks must have a non-empty title
ALTER TABLE "tracks"
ADD CONSTRAINT "chk_tracks_title"
CHECK (BTRIM("title") <> '');

-- Track duration must be greater than zero
ALTER TABLE "tracks"
ADD CONSTRAINT "chk_tracks_duration_ms"
CHECK ("duration_ms" > 0);

-- Track number, when supplied, must be greater than zero
ALTER TABLE "tracks"
ADD CONSTRAINT "chk_tracks_track_number"
CHECK ("track_number" IS NULL OR "track_number" > 0);

-- Genre names cannot be empty
ALTER TABLE "genres"
ADD CONSTRAINT "chk_genres_name"
CHECK (BTRIM("name") <> '');

-- Artwork paths cannot be empty
ALTER TABLE "artwork"
ADD CONSTRAINT "chk_artwork_file_path"
CHECK (BTRIM("file_path") <> '');

-- Artwork file size, when known, cannot be negative
ALTER TABLE "artwork"
ADD CONSTRAINT "chk_artwork_file_size"
CHECK ("file_size" IS NULL OR "file_size" >= 0);

-- Media file paths cannot be empty
ALTER TABLE "media_files"
ADD CONSTRAINT "chk_media_files_file_path"
CHECK (BTRIM("file_path") <> '');

-- Media files must have a positive file size
ALTER TABLE "media_files"
ADD CONSTRAINT "chk_media_files_file_size"
CHECK ("file_size" > 0);

-- Artist ordering on a track begins at 1
ALTER TABLE "track_artists"
ADD CONSTRAINT "chk_track_artists_artist_order"
CHECK ("artist_order" > 0);

-- Artist ordering on an album begins at 1
ALTER TABLE "album_artists"
ADD CONSTRAINT "chk_album_artists_artist_order"
CHECK ("artist_order" > 0);

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_genres" ADD CONSTRAINT "track_genres_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_genres" ADD CONSTRAINT "track_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
