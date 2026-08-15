CREATE TABLE IF NOT EXISTS "enquiries" (
  "id" serial PRIMARY KEY,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "type" text NOT NULL DEFAULT 'general',
  "message" text NOT NULL,
  "status" text NOT NULL DEFAULT 'new',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "enquiries_name_non_empty_check" CHECK (length(trim("name")) > 0),
  CONSTRAINT "enquiries_email_non_empty_check" CHECK (length(trim("email")) > 3),
  CONSTRAINT "enquiries_message_non_empty_check" CHECK (length(trim("message")) > 0),
  CONSTRAINT "enquiries_status_check" CHECK ("status" IN ('new', 'in_progress', 'resolved'))
);

CREATE INDEX IF NOT EXISTS "enquiries_user_id_idx" ON "enquiries" ("user_id");
CREATE INDEX IF NOT EXISTS "enquiries_status_idx" ON "enquiries" ("status");
CREATE INDEX IF NOT EXISTS "enquiries_created_at_idx" ON "enquiries" ("created_at");

CREATE TABLE IF NOT EXISTS "job_applications" (
  "id" serial PRIMARY KEY,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "role" text NOT NULL,
  "portfolio_url" text,
  "resume_url" text,
  "cover_letter" text NOT NULL,
  "status" text NOT NULL DEFAULT 'new',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "job_applications_name_non_empty_check" CHECK (length(trim("name")) > 0),
  CONSTRAINT "job_applications_email_non_empty_check" CHECK (length(trim("email")) > 3),
  CONSTRAINT "job_applications_role_non_empty_check" CHECK (length(trim("role")) > 0),
  CONSTRAINT "job_applications_cover_letter_non_empty_check" CHECK (length(trim("cover_letter")) > 0),
  CONSTRAINT "job_applications_status_check" CHECK ("status" IN ('new', 'reviewing', 'interview', 'rejected', 'accepted', 'withdrawn'))
);

CREATE INDEX IF NOT EXISTS "job_applications_user_id_idx" ON "job_applications" ("user_id");
CREATE INDEX IF NOT EXISTS "job_applications_status_idx" ON "job_applications" ("status");
CREATE INDEX IF NOT EXISTS "job_applications_role_idx" ON "job_applications" ("role");
CREATE INDEX IF NOT EXISTS "job_applications_created_at_idx" ON "job_applications" ("created_at");
