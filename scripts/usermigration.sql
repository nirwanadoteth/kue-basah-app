-- This script prepares the database for migration to better-auth.
-- It renames the old users table and creates the new tables required by better-auth.

-- Step 1: Rename the existing users table to preserve data for migration.
ALTER TABLE "users" RENAME TO "legacy_users";

-- Step 2: Create the new 'user' table based on the better-auth schema.
CREATE TABLE "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "username" TEXT UNIQUE,
  "display_username" TEXT
);

-- Step 3: Create the new 'session' table.
CREATE TABLE "session" (
  "id" TEXT PRIMARY KEY,
  "expires_at" TIMESTAMP NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ip_address" TEXT,
  "user_agent" TEXT,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE cascade
);

-- Step 4: Create the new 'account' table.
CREATE TABLE "account" (
  "id" TEXT PRIMARY KEY,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMP,
  "refresh_token_expires_at" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 5: Create the new 'verification' table.
CREATE TABLE "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 6: Modify the transactions table to prepare for user ID migration.
-- We need to drop the foreign key constraint and change the user_id column type.
-- A new foreign key constraint should be added after the user migration is complete.
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_fkey";
ALTER TABLE "transactions" ALTER COLUMN "user_id" TYPE TEXT;

-- Notify user
SELECT 'Database schema prepared for better-auth migration.' AS status;
