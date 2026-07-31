-- Migration: Add subscription/billing fields to user table and usage tracking table
-- Enables Stripe-backed plans (free/pro/enterprise) and per-day usage limits.

ALTER TABLE "user" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;
ALTER TABLE "user" ADD COLUMN "subscription_status" text DEFAULT 'inactive' NOT NULL;
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" text;
ALTER TABLE "user" ADD COLUMN "stripe_subscription_id" text;
ALTER TABLE "user" ADD COLUMN "current_period_end" timestamp;

CREATE INDEX IF NOT EXISTS "user_stripe_customer_idx" ON "user" ("stripe_customer_id");

CREATE TABLE IF NOT EXISTS "usage_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "usage_date" text NOT NULL,
  "files_processed" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "usage_records_identifier_date_idx" ON "usage_records" ("identifier", "usage_date");
