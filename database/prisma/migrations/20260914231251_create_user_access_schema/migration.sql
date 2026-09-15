-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_name" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_username" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sessions_token_hash" ON "sessions"("token_hash");

-- AddCheckConstraints

ALTER TABLE "roles"
ADD CONSTRAINT "chk_roles_name"
CHECK (BTRIM("name") <> '');

ALTER TABLE "users"
ADD CONSTRAINT "chk_users_username"
CHECK (BTRIM("username") <> '');

ALTER TABLE "users"
ADD CONSTRAINT "chk_users_email"
CHECK (BTRIM("email") <> '');

ALTER TABLE "users"
ADD CONSTRAINT "chk_users_password_hash"
CHECK (BTRIM("password_hash") <> '');

ALTER TABLE "sessions"
ADD CONSTRAINT "chk_sessions_token_hash"
CHECK (BTRIM("token_hash") <> '');

ALTER TABLE "sessions"
ADD CONSTRAINT "chk_sessions_expiration"
CHECK ("expires_at" > "created_at");

ALTER TABLE "sessions"
ADD CONSTRAINT "chk_sessions_revocation"
CHECK ("revoked_at" IS NULL OR "revoked_at" >= "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
