-- ============================================================================
-- SUPABASE DATABASE SETUP FOR FILEX
-- ============================================================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- This creates the tables needed for activity tracking and keep-alive system
-- ============================================================================

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_activity', 'user_stats', 'keep_alive_pings')
ORDER BY table_name;

-- ============================================================================
-- TABLE 1: user_activity
-- Tracks all user actions (file uploads, downloads, processing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  file_type VARCHAR(20),
  file_size_bytes BIGINT,
  metadata_removed INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  session_id VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  country_code VARCHAR(3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_activity_type CHECK (
    activity_type IN ('file_upload', 'file_download', 'file_process', 'account_created', 'profile_updated')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON user_activity(created_at DESC);

-- ============================================================================
-- TABLE 2: user_stats
-- Aggregated statistics per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_files_uploaded INTEGER DEFAULT 0,
  total_files_downloaded INTEGER DEFAULT 0,
  total_files_processed INTEGER DEFAULT 0,
  total_metadata_removed INTEGER DEFAULT 0,
  total_storage_saved_bytes BIGINT DEFAULT 0,
  monthly_files_processed INTEGER DEFAULT 0,
  monthly_reset_date DATE DEFAULT CURRENT_DATE,
  first_file_uploaded_at TIMESTAMP WITH TIME ZONE,
  last_file_uploaded_at TIMESTAMP WITH TIME ZONE,
  active_days_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE 3: keep_alive_pings
-- Logs from the /api/cron/keep-alive endpoint
-- ============================================================================

CREATE TABLE IF NOT EXISTS keep_alive_pings (
  id BIGSERIAL PRIMARY KEY,
  ping_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying recent pings
CREATE INDEX IF NOT EXISTS idx_pings_created_at ON keep_alive_pings(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE keep_alive_pings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own activity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_activity'
    AND policyname = 'Users can view own activity'
  ) THEN
    CREATE POLICY "Users can view own activity"
    ON user_activity
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can view their own stats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_stats'
    AND policyname = 'Users can view own stats'
  ) THEN
    CREATE POLICY "Users can view own stats"
    ON user_stats
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Service role can manage keep-alive pings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'keep_alive_pings'
    AND policyname = 'Service role can manage pings'
  ) THEN
    CREATE POLICY "Service role can manage pings"
    ON keep_alive_pings
    FOR ALL
    USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('user_activity', 'user_stats', 'keep_alive_pings')
ORDER BY table_name;

-- Verify RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_activity', 'user_stats', 'keep_alive_pings')
ORDER BY tablename;

-- Verify policies exist
SELECT
  tablename,
  policyname,
  permissive,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_activity', 'user_stats', 'keep_alive_pings')
ORDER BY tablename, policyname;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- You can now test the keep-alive endpoint
-- ============================================================================
