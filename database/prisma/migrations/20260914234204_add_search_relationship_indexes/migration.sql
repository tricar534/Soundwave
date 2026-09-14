-- CreateIndex
CREATE INDEX "idx_album_artists_artist_id" ON "album_artists"("artist_id");

-- CreateIndex
CREATE INDEX "idx_media_files_track_id" ON "media_files"("track_id");

-- CreateIndex
CREATE INDEX "idx_sessions_user_id" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_sessions_expires_at" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_track_artists_artist_id" ON "track_artists"("artist_id");

-- CreateIndex
CREATE INDEX "idx_track_genres_genre_id" ON "track_genres"("genre_id");

-- CreateIndex
CREATE INDEX "idx_tracks_album_id" ON "tracks"("album_id");

-- CreateIndex
CREATE INDEX "idx_users_role_id" ON "users"("role_id");

-- Enable PostgreSQL trigram support for partial text searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Search indexes for music catalog fields
CREATE INDEX "idx_artists_name"
ON "artists"
USING GIN ("name" gin_trgm_ops);

CREATE INDEX "idx_albums_title"
ON "albums"
USING GIN ("title" gin_trgm_ops);

CREATE INDEX "idx_tracks_title"
ON "tracks"
USING GIN ("title" gin_trgm_ops);

CREATE INDEX "idx_genres_name"
ON "genres"
USING GIN ("name" gin_trgm_ops);
