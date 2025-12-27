-- Migration: Add role column to user table
-- This migration adds a role field to the user table for proper admin authorization

ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;

-- Set the first user as admin (optional - for bootstrapping)
-- UPDATE "user" SET "role" = 'admin' WHERE "id" = (SELECT "id" FROM "user" ORDER BY "created_at" LIMIT 1);

-- Create index on role for faster admin checks
CREATE INDEX IF NOT EXISTS "user_role_idx" ON "user" ("role");
