-- Migration: Performance indexes for admin/analytics queries and plan lookups
-- introduced by the account dashboard and usage-history endpoints.

CREATE INDEX IF NOT EXISTS "analytics_events_event_type_idx" ON "analytics_events" ("event_type");
CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events" ("created_at");
CREATE INDEX IF NOT EXISTS "feedback_submissions_status_idx" ON "feedback_submissions" ("status");
CREATE INDEX IF NOT EXISTS "feedback_submissions_created_at_idx" ON "feedback_submissions" ("created_at");
CREATE INDEX IF NOT EXISTS "user_plan_idx" ON "user" ("plan");
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");
