-- Production hardening: data invariants and operational indexes.
-- This migration is idempotent so it can be replayed safely by deployment tooling.

CREATE INDEX IF NOT EXISTS "user_subscription_status_idx" ON "user" ("subscription_status");
CREATE INDEX IF NOT EXISTS "user_created_at_idx" ON "user" ("created_at");
CREATE INDEX IF NOT EXISTS "session_expires_at_idx" ON "session" ("expires_at");
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_account_idx" ON "account" ("provider_id", "account_id");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");
CREATE INDEX IF NOT EXISTS "verification_expires_at_idx" ON "verification" ("expires_at");
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_idx" ON "analytics_events" ("user_id");
CREATE INDEX IF NOT EXISTS "analytics_events_event_type_created_at_idx" ON "analytics_events" ("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "feedback_submissions_user_id_idx" ON "feedback_submissions" ("user_id");
CREATE INDEX IF NOT EXISTS "usage_records_updated_at_idx" ON "usage_records" ("updated_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_role_check') THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_role_check"
      CHECK ("role" IN ('user', 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_plan_check') THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_plan_check"
      CHECK ("plan" IN ('free', 'pro', 'enterprise'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscription_status_check') THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_subscription_status_check"
      CHECK ("subscription_status" IN ('inactive', 'active', 'trialing', 'past_due', 'canceled', 'unpaid'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_name_non_empty_check') THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_name_non_empty_check"
      CHECK (length(trim("name")) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_email_non_empty_check') THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_email_non_empty_check"
      CHECK (length(trim("email")) > 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_event_type_non_empty_check') THEN
    ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_event_type_non_empty_check"
      CHECK (length(trim("event_type")) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_email_non_empty_check') THEN
    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_email_non_empty_check"
      CHECK (length(trim("email")) > 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_subject_non_empty_check') THEN
    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_subject_non_empty_check"
      CHECK (length(trim("subject")) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_message_non_empty_check') THEN
    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_message_non_empty_check"
      CHECK (length(trim("message")) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_rating_check') THEN
    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_rating_check"
      CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_status_check') THEN
    ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_status_check"
      CHECK ("status" IN ('new', 'reviewed', 'resolved'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_identifier_non_empty_check') THEN
    ALTER TABLE "usage_records" ADD CONSTRAINT "usage_identifier_non_empty_check"
      CHECK (length(trim("identifier")) > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_date_format_check') THEN
    ALTER TABLE "usage_records" ADD CONSTRAINT "usage_date_format_check"
      CHECK ("usage_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usage_files_processed_non_negative_check') THEN
    ALTER TABLE "usage_records" ADD CONSTRAINT "usage_files_processed_non_negative_check"
      CHECK ("files_processed" >= 0);
  END IF;
END $$;
