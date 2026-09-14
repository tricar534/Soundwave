**Soundwaves Sprint 1 Data Dictionary**

Database schema reference aligned to DB-02 technology decisions and the
Sprint 1 ERD

| Scope: Sprint 1 implements User & Access Management and the Music Catalog. Playlist, favorites, playback analytics, user preferences, and application settings are documented as future/deferred entities and are not Sprint 1 implementation commitments. |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

# 1. Technical Baseline

| **Decision**                     | **Selected implementation**                                               |
|----------------------------------|---------------------------------------------------------------------------|
| **Database engine**              | PostgreSQL                                                                |
| **Database version**             | Stable PostgreSQL version, fixed across the team                          |
| **Database access**              | Mostly ORM; SQL allowed when needed                                       |
| **Migrations**                   | ORM-native migration framework                                            |
| **Seed data**                    | Deterministic application-level seed script                               |
| **Local development**            | Docker Compose                                                            |
| **Table / column naming**        | plural snake_case / snake_case                                            |
| **Primary / foreign-key naming** | id / \<entity\>\_id                                                       |
| **Identifier type**              | BIGINT                                                                    |
| **Timestamps**                   | PostgreSQL native timestamp type; stored in UTC; ISO 8601 at API boundary |
| **Encoding / Boolean**           | UTF-8 / native BOOLEAN                                                    |
| **Deletion behavior**            | Mixed by entity and relationship                                          |

**Timestamp implementation note:** This dictionary uses PostgreSQL
TIMESTAMPTZ as the concrete native timestamp type because the team
selected UTC storage. If the team later standardizes on TIMESTAMP
without time zone, update this dictionary and the migrations together.

# 2. Sprint 1 Entity Dictionary

## roles

**Purpose:** Defines authorization roles used by Soundwaves. Initial
expected values are USER and ADMIN.

| **Column**      | **Type**     | **Null?** | **Key / Constraint** | **Description**                  | **Example**          |
|-----------------|--------------|-----------|----------------------|----------------------------------|----------------------|
| **id**          | BIGINT       | No        | PK; identity         | Unique role identifier.          | 1                    |
| **name**        | VARCHAR(50)  | No        | UNIQUE; NOT NULL     | Unique authorization role name.  | ADMIN                |
| **description** | VARCHAR(255) | Yes       | \-                   | Human-readable role description. | Administrator access |

**Business rules:** A role may be assigned to many users. Role names
must be unique. Deleting a role referenced by users should be
restricted.

**Planned indexes / constraints:** uq_roles_name; primary key on
roles.id.

## users

**Purpose:** Stores persistent Soundwaves account data. Plaintext
passwords are never stored.

| **Column**        | **Type**     | **Null?** | **Key / Constraint**      | **Description**                                 | **Example**          |
|-------------------|--------------|-----------|---------------------------|-------------------------------------------------|----------------------|
| **id**            | BIGINT       | No        | PK; identity              | Unique user identifier.                         | 1001                 |
| **role_id**       | BIGINT       | No        | FK -\> roles.id; NOT NULL | Authorization role assigned to the user.        | 2                    |
| **username**      | VARCHAR(50)  | No        | UNIQUE; NOT NULL          | Login/display username.                         | jdoe                 |
| **email**         | VARCHAR(255) | No        | UNIQUE; NOT NULL          | Email associated with the account.              | jdoe@example.com     |
| **password_hash** | VARCHAR(255) | No        | NOT NULL; sensitive       | Secure password hash only; never plaintext.     | \$argon2id\$...      |
| **is_active**     | BOOLEAN      | No        | DEFAULT TRUE              | Whether the account is allowed to authenticate. | TRUE                 |
| **created_at**    | TIMESTAMPTZ  | No        | DEFAULT CURRENT_TIMESTAMP | Account creation time stored in UTC.            | 2026-09-12T20:00:00Z |
| **updated_at**    | TIMESTAMPTZ  | No        | NOT NULL                  | Most recent account update time stored in UTC.  | 2026-09-12T20:00:00Z |

**Business rules:** username must be unique. email must be unique under
the current account design. password_hash is sensitive and must not be
returned by normal catalog/user responses. Every user references a valid
role.

**Planned indexes / constraints:** uq_users_username; uq_users_email;
idx_users_role_id.

## sessions

**Purpose:** Stores persisted authentication session or refresh-token
records if the authentication implementation persists sessions.

| **Column**     | **Type**     | **Null?** | **Key / Constraint**        | **Description**                                               | **Example**          |
|----------------|--------------|-----------|-----------------------------|---------------------------------------------------------------|----------------------|
| **id**         | BIGINT       | No        | PK; identity                | Unique session identifier.                                    | 5001                 |
| **user_id**    | BIGINT       | No        | FK -\> users.id; NOT NULL   | User who owns the session.                                    | 1001                 |
| **token_hash** | VARCHAR(255) | No        | UNIQUE; NOT NULL; sensitive | Hash of the persisted session/refresh token.                  | sha256:...           |
| **expires_at** | TIMESTAMPTZ  | No        | NOT NULL                    | Expiration time stored in UTC.                                | 2026-09-19T20:00:00Z |
| **revoked_at** | TIMESTAMPTZ  | Yes       | \-                          | Time the session was manually invalidated; NULL while active. | NULL                 |
| **created_at** | TIMESTAMPTZ  | No        | DEFAULT CURRENT_TIMESTAMP   | Session creation time stored in UTC.                          | 2026-09-12T20:00:00Z |

**Business rules:** One user may have multiple sessions. Expired or
revoked sessions cannot be used for authentication. Delete dependent
session records when a user is permanently removed.

**Planned indexes / constraints:** uq_sessions_token_hash;
idx_sessions_user_id; idx_sessions_expires_at.

## artists

**Purpose:** Stores artists represented in the music catalog.

| **Column**     | **Type**     | **Null?** | **Key / Constraint**      | **Description**                                  | **Example**              |
|----------------|--------------|-----------|---------------------------|--------------------------------------------------|--------------------------|
| **id**         | BIGINT       | No        | PK; identity              | Unique artist identifier.                        | 2001                     |
| **name**       | VARCHAR(255) | No        | NOT NULL                  | Artist or group name.                            | Daft Punk                |
| **bio**        | TEXT         | Yes       | \-                        | Optional artist biography/description.           | Electronic music duo...  |
| **image_path** | VARCHAR(500) | Yes       | \-                        | Relative storage path for optional artist image. | artists/2001/profile.jpg |
| **created_at** | TIMESTAMPTZ  | No        | DEFAULT CURRENT_TIMESTAMP | Record creation time stored in UTC.              | 2026-09-12T20:00:00Z     |
| **updated_at** | TIMESTAMPTZ  | No        | NOT NULL                  | Most recent modification time stored in UTC.     | 2026-09-12T20:00:00Z     |

**Business rules:** Artist names cannot be empty. Artist names are not
globally unique because different artists may share a name. Track and
album relationships are represented by junction tables.

**Planned indexes / constraints:** idx_artists_name. Advanced
search-specific indexing is deferred to the indexing/search task.

## artwork

**Purpose:** Stores metadata and relative storage references for album
artwork. Actual image bytes remain in configured file storage.

| **Column**     | **Type**     | **Null?** | **Key / Constraint**      | **Description**                                 | **Example**            |
|----------------|--------------|-----------|---------------------------|-------------------------------------------------|------------------------|
| **id**         | BIGINT       | No        | PK; identity              | Unique artwork identifier.                      | 3001                   |
| **file_path**  | VARCHAR(500) | No        | NOT NULL                  | Relative storage location for the artwork file. | artwork/3001/cover.jpg |
| **file_name**  | VARCHAR(255) | No        | NOT NULL                  | Stored or original artwork filename.            | cover.jpg              |
| **media_type** | VARCHAR(100) | No        | NOT NULL                  | Artwork MIME type.                              | image/jpeg             |
| **file_size**  | BIGINT       | Yes       | CHECK \>= 0               | Artwork size in bytes when known.               | 524288                 |
| **created_at** | TIMESTAMPTZ  | No        | DEFAULT CURRENT_TIMESTAMP | Artwork record creation time stored in UTC.     | 2026-09-12T20:00:00Z   |

**Business rules:** file_path cannot be empty. file_size cannot be
negative. Removing artwork should set albums.artwork_id to NULL rather
than delete the album.

**Planned indexes / constraints:** Optional uq_artwork_file_path if the
storage layer guarantees path uniqueness.

## albums

**Purpose:** Stores album-level music metadata.

| **Column**       | **Type**     | **Null?** | **Key / Constraint**      | **Description**                                    | **Example**          |
|------------------|--------------|-----------|---------------------------|----------------------------------------------------|----------------------|
| **id**           | BIGINT       | No        | PK; identity              | Unique album identifier.                           | 4001                 |
| **title**        | VARCHAR(255) | No        | NOT NULL                  | Album title.                                       | Discovery            |
| **release_date** | DATE         | Yes       | \-                        | Album release date when known.                     | 2001-03-12           |
| **artwork_id**   | BIGINT       | Yes       | FK -\> artwork.id         | Optional artwork associated with the album.        | 3001                 |
| **created_at**   | TIMESTAMPTZ  | No        | DEFAULT CURRENT_TIMESTAMP | Album record creation time stored in UTC.          | 2026-09-12T20:00:00Z |
| **updated_at**   | TIMESTAMPTZ  | No        | NOT NULL                  | Most recent album modification time stored in UTC. | 2026-09-12T20:00:00Z |

**Business rules:** title cannot be empty. Artwork is optional.
Album-to-artist relationships are stored in album_artists.

**Planned indexes / constraints:** idx_albums_title;
idx_albums_artwork_id.

## album_artists

**Purpose:** Junction table implementing the many-to-many relationship
between albums and artists.

| **Column**       | **Type** | **Null?** | **Key / Constraint**  | **Description**                                  | **Example** |
|------------------|----------|-----------|-----------------------|--------------------------------------------------|-------------|
| **album_id**     | BIGINT   | No        | PK, FK -\> albums.id  | Album in the relationship.                       | 4001        |
| **artist_id**    | BIGINT   | No        | PK, FK -\> artists.id | Artist associated with the album.                | 2001        |
| **artist_order** | SMALLINT | No        | CHECK \>= 1           | Display order for album artists.                 | 1           |
| **is_primary**   | BOOLEAN  | No        | DEFAULT FALSE         | Whether this artist is the primary album artist. | TRUE        |

**Business rules:** The composite key (album_id, artist_id) prevents
duplicate artist assignments. artist_order must be positive. An album
should normally have at least one artist; this is enforced by
application/service logic.

**Planned indexes / constraints:** Composite PK on album_id + artist_id;
idx_album_artists_artist_id.

## tracks

**Purpose:** Stores core metadata for individual songs/tracks.

| **Column**       | **Type**     | **Null?** | **Key / Constraint**      | **Description**                                                    | **Example**          |
|------------------|--------------|-----------|---------------------------|--------------------------------------------------------------------|----------------------|
| **id**           | BIGINT       | No        | PK; identity              | Unique track identifier.                                           | 6001                 |
| **album_id**     | BIGINT       | Yes       | FK -\> albums.id          | Album containing the track; NULL allows standalone tracks/singles. | 4001                 |
| **title**        | VARCHAR(255) | No        | NOT NULL                  | Track title.                                                       | Digital Love         |
| **track_number** | SMALLINT     | Yes       | CHECK \> 0                | Track position on the album when known.                            | 3                    |
| **duration_ms**  | INTEGER      | No        | CHECK \> 0                | Track duration in milliseconds.                                    | 301000               |
| **is_available** | BOOLEAN      | No        | DEFAULT TRUE              | Whether the track can currently be selected for playback.          | TRUE                 |
| **created_at**   | TIMESTAMPTZ  | No        | DEFAULT CURRENT_TIMESTAMP | Track record creation time stored in UTC.                          | 2026-09-12T20:00:00Z |
| **updated_at**   | TIMESTAMPTZ  | No        | NOT NULL                  | Most recent track modification time stored in UTC.                 | 2026-09-12T20:00:00Z |

**Business rules:** title cannot be empty. duration_ms must be positive.
track_number, when present, must be positive. Artist relationships
belong in track_artists rather than a single artist_id column.

**Planned indexes / constraints:** idx_tracks_title;
idx_tracks_album_id. Search-specific text indexes are deferred to the
dedicated indexing task.

## track_artists

**Purpose:** Junction table representing one or more artists associated
with a track.

| **Column**       | **Type**    | **Null?** | **Key / Constraint**  | **Description**                                         | **Example** |
|------------------|-------------|-----------|-----------------------|---------------------------------------------------------|-------------|
| **track_id**     | BIGINT      | No        | PK, FK -\> tracks.id  | Track in the relationship.                              | 6001        |
| **artist_id**    | BIGINT      | No        | PK, FK -\> artists.id | Contributing artist.                                    | 2001        |
| **artist_order** | SMALLINT    | No        | CHECK \>= 1           | Display order for the artists.                          | 1           |
| **role**         | VARCHAR(50) | Yes       | \-                    | Optional contribution role such as primary or featured. | featured    |

**Business rules:** The composite key (track_id, artist_id) prevents
duplicate artist assignments. artist_order must be positive. A track
should have at least one artist; this is enforced by application/service
logic.

**Planned indexes / constraints:** Composite PK on track_id + artist_id;
idx_track_artists_artist_id.

## media_files

**Purpose:** Stores physical audio-file metadata associated with tracks.
A track may have multiple files to support original and future
alternate/transcoded representations.

| **Column**     | **Type**     | **Null?** | **Key / Constraint**       | **Description**                                    | **Example**                      |
|----------------|--------------|-----------|----------------------------|----------------------------------------------------|----------------------------------|
| **id**         | BIGINT       | No        | PK; identity               | Unique media-file identifier.                      | 7001                             |
| **track_id**   | BIGINT       | No        | FK -\> tracks.id; NOT NULL | Track represented by the audio file.               | 6001                             |
| **file_path**  | VARCHAR(500) | No        | NOT NULL                   | Relative path/storage reference to the audio file. | music/daft-punk/discovery/03.mp3 |
| **file_name**  | VARCHAR(255) | No        | NOT NULL                   | Stored or original filename.                       | 03-digital-love.mp3              |
| **media_type** | VARCHAR(100) | No        | NOT NULL                   | Audio MIME type.                                   | audio/mpeg                       |
| **file_size**  | BIGINT       | No        | CHECK \> 0                 | Audio file size in bytes.                          | 8400000                          |
| **codec**      | VARCHAR(50)  | Yes       | \-                         | Audio codec when known.                            | MP3                              |
| **created_at** | TIMESTAMPTZ  | No        | DEFAULT CURRENT_TIMESTAMP  | Media-file record creation time stored in UTC.     | 2026-09-12T20:00:00Z             |

**Business rules:** Every media file references an existing track.
file_path cannot be empty. file_size must be positive. Deleting a track
should remove dependent media-file metadata; physical file deletion
remains a storage/service responsibility.

**Planned indexes / constraints:** idx_media_files_track_id; optional
uq_media_files_file_path if storage paths are guaranteed unique.

## genres

**Purpose:** Stores normalized music genre names used for catalog
classification and search/filtering.

| **Column**      | **Type**     | **Null?** | **Key / Constraint**      | **Description**                                    | **Example**          |
|-----------------|--------------|-----------|---------------------------|----------------------------------------------------|----------------------|
| **id**          | BIGINT       | No        | PK; identity              | Unique genre identifier.                           | 8001                 |
| **name**        | VARCHAR(100) | No        | UNIQUE; NOT NULL          | Unique genre name.                                 | Electronic           |
| **description** | TEXT         | Yes       | \-                        | Optional genre description.                        | Electronic music...  |
| **created_at**  | TIMESTAMPTZ  | No        | DEFAULT CURRENT_TIMESTAMP | Genre record creation time stored in UTC.          | 2026-09-12T20:00:00Z |
| **updated_at**  | TIMESTAMPTZ  | No        | NOT NULL                  | Most recent genre modification time stored in UTC. | 2026-09-12T20:00:00Z |

**Business rules:** Genre names must be unique and non-empty. A track
may belong to multiple genres.

**Planned indexes / constraints:** uq_genres_name.

## track_genres

**Purpose:** Junction table implementing the many-to-many relationship
between tracks and genres.

| **Column**   | **Type** | **Null?** | **Key / Constraint** | **Description**              | **Example** |
|--------------|----------|-----------|----------------------|------------------------------|-------------|
| **track_id** | BIGINT   | No        | PK, FK -\> tracks.id | Track being categorized.     | 6001        |
| **genre_id** | BIGINT   | No        | PK, FK -\> genres.id | Genre assigned to the track. | 8001        |

**Business rules:** The composite key (track_id, genre_id) prevents
duplicate genre assignments.

**Planned indexes / constraints:** Composite PK on track_id + genre_id;
idx_track_genres_genre_id.

# 3. Relationship and Deletion Policy Summary

| **Parent**  | **Child / Junction** | **Cardinality**   | **Proposed deletion action**            | **Rationale**                                         |
|-------------|----------------------|-------------------|-----------------------------------------|-------------------------------------------------------|
| **roles**   | users                | 1 : many          | RESTRICT role deletion while referenced | Protects active account authorization.                |
| **users**   | sessions             | 1 : many          | CASCADE dependent session records       | Sessions have no meaning without the user.            |
| **artwork** | albums               | 1 : many/optional | ON DELETE SET NULL                      | Album can remain without artwork.                     |
| **albums**  | album_artists        | 1 : many          | CASCADE relationship rows               | Junction rows are dependent associations.             |
| **artists** | album_artists        | 1 : many          | CASCADE relationship rows               | Junction rows are dependent associations.             |
| **albums**  | tracks               | 1 : many/optional | ON DELETE SET NULL (proposed)           | Tracks may remain as standalone/unclassified records. |
| **tracks**  | track_artists        | 1 : many          | CASCADE relationship rows               | Junction rows are dependent associations.             |
| **artists** | track_artists        | 1 : many          | CASCADE relationship rows               | Junction rows are dependent associations.             |
| **tracks**  | media_files          | 1 : many          | CASCADE metadata rows                   | Media metadata belongs to the track.                  |
| **tracks**  | track_genres         | 1 : many          | CASCADE relationship rows               | Junction rows are dependent associations.             |
| **genres**  | track_genres         | 1 : many          | CASCADE relationship rows               | Junction rows are dependent associations.             |

| The team selected a mixed deletion strategy. The actions above translate that decision into concrete FK behavior for Sprint 1 and should be reviewed before migrations are finalized. Catalog-level “soft delete” semantics can be added later if the team introduces deleted_at/status fields. |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

# 4. Future / Deferred Entities (Not Implemented in Sprint 1)

| **Table**                | **Purpose**                                                   | **Preliminary fields**                                                                                                           |
|--------------------------|---------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| **playlists**            | User-owned playlist metadata.                                 | id BIGINT PK; user_id BIGINT FK; name VARCHAR(255); description TEXT; is_public BOOLEAN; created_at/updated_at TIMESTAMPTZ       |
| **playlist_tracks**      | Playlist-to-track membership and ordering.                    | playlist_id BIGINT PK/FK; track_id BIGINT PK/FK; position INTEGER; added_at TIMESTAMPTZ                                          |
| **favorites**            | User-to-track favorite relationship.                          | user_id BIGINT PK/FK; track_id BIGINT PK/FK; created_at TIMESTAMPTZ                                                              |
| **playback_events**      | Playback analytics such as play, pause, skip, and completion. | id BIGINT PK; user_id BIGINT FK; track_id BIGINT FK; event_type VARCHAR(50); played_at TIMESTAMPTZ; playback_position_ms INTEGER |
| **user_preferences**     | Per-user configurable application/audio preferences.          | id BIGINT PK; user_id BIGINT FK; key VARCHAR(100); value TEXT; updated_at TIMESTAMPTZ                                            |
| **application_settings** | Server-wide configurable settings.                            | id BIGINT PK; key VARCHAR(100); value TEXT; updated_at TIMESTAMPTZ                                                               |

| These entities appear in the ERD to demonstrate planned expansion, but their field definitions are preliminary and should not be treated as Sprint 1 implementation requirements. |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

# 5. Naming, Type, and Security Rules

| **Rule**               | **Standard**                                                                                          |
|------------------------|-------------------------------------------------------------------------------------------------------|
| **Tables**             | Plural snake_case (for example, users, media_files, track_artists).                                   |
| **Columns**            | snake_case.                                                                                           |
| **Primary keys**       | Named id and typed BIGINT; generated as PostgreSQL identity values in migrations.                     |
| **Foreign keys**       | Named \<entity\>\_id and typed BIGINT to match referenced IDs.                                        |
| **Indexes**            | idx\_\<table\>\_\<column\>.                                                                           |
| **Unique constraints** | uq\_\<table\>\_\<column\>.                                                                            |
| **Text encoding**      | UTF-8.                                                                                                |
| **Booleans**           | PostgreSQL native BOOLEAN.                                                                            |
| **Timestamps**         | TIMESTAMPTZ stored in UTC; serialize as ISO 8601 through APIs.                                        |
| **Passwords**          | Store password hashes only; never plaintext.                                                          |
| **Tokens**             | If sessions are persisted, store token hashes rather than reusable plaintext tokens.                  |
| **File references**    | Store relative paths/storage references; do not expose physical filesystem paths directly to clients. |
| **Database access**    | Backend server is the only application component that directly accesses PostgreSQL.                   |

# 6. Sprint 1 Completion Check

| **Check**                 | **Definition of done**                                                                                     |
|---------------------------|------------------------------------------------------------------------------------------------------------|
| **ERD consistency**       | Every Sprint 1 field in the ERD has a matching dictionary entry and vice versa.                            |
| **Migration consistency** | Migration column types, nullability, PKs, FKs, checks, and unique constraints match this dictionary.       |
| **Seed consistency**      | Seed data satisfies all constraints and uses deterministic IDs/content where appropriate.                  |
| **Naming consistency**    | Tables, columns, index names, and unique-constraint names follow DB-02 conventions.                        |
| **Security consistency**  | No plaintext password/token values are stored; sensitive fields are excluded from normal client responses. |
| **Reproducibility**       | A clean Docker Compose environment can apply migrations and load deterministic seed data.                  |
