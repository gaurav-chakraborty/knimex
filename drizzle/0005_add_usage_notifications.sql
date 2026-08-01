-- Migration: Track whether we've already emailed a user about hitting their
-- daily usage cap, so /lib/email.ts sends at most one notice per day.

ALTER TABLE "usage_records" ADD COLUMN "limit_notified_at" timestamp;
