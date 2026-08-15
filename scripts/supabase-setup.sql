-- ============================================
-- FileX Supabase Database Setup
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Check if tables already exist
DO $$
BEGIN
  RAISE NOTICE 'Checking existing tables...';
END $$;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_activity', 'user_stats', 'keep_alive_pings');

-- ============================================
-- TABLE 1: user_activity
-- ============================================

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

COMMENT ON TABLE user_activity IS 'Tracks all user file processing activities';

-- ============================================
-- TABLE 2: user_stats
-- ============================================

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_counts CHECK (
    total_files_uploaded >= 0 AND
    total_files_downloaded >= 0 AND
    total_files_processed >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_stats_updated_at ON user_stats(updated_at DESC);

COMMENT ON TABLE user_stats IS 'Aggregated user statistics for fast dashboard queries';

-- ============================================
-- TABLE 3: keep_alive_pings
-- ============================================

CREATE TABLE IF NOT EXISTS keep_alive_pings (
  id BIGSERIAL PRIMARY KEY,
  ping_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pings_created_at ON keep_alive_pings(created_at DESC);

COMMENT ON TABLE keep_alive_pings IS 'Tracks keep-alive pings to prevent database dormancy';

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Increment user stats
CREATE OR REPLACE FUNCTION increment_user_stats(
  p_user_id UUID,
  p_activity_type VARCHAR,
  p_metadata_count INTEGER DEFAULT 0,
  p_storage_saved BIGINT DEFAULT 0
)
RETURNS void AS $$
BEGIN
  -- Insert if not exists
  INSERT INTO user_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update stats
  UPDATE user_stats
  SET
    total_files_uploaded = CASE
      WHEN p_activity_type = 'file_upload' THEN total_files_uploaded + 1
      ELSE total_files_uploaded
    END,
    total_files_downloaded = CASE
      WHEN p_activity_type = 'file_download' THEN total_files_downloaded + 1
      ELSE total_files_downloaded
    END,
    total_files_processed = CASE
      WHEN p_activity_type = 'file_process' THEN total_files_processed + 1
      ELSE total_files_processed
    END,
    total_metadata_removed = total_metadata_removed + p_metadata_count,
    total_storage_saved_bytes = total_storage_saved_bytes + p_storage_saved,
    last_file_uploaded_at = CASE
      WHEN p_activity_type = 'file_upload' THEN NOW()
      ELSE last_file_uploaded_at
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Set first upload timestamp if null
  UPDATE user_stats
  SET first_file_uploaded_at = NOW()
  WHERE user_id = p_user_id AND first_file_uploaded_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Cleanup old pings (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_pings()
RETURNS void AS $$
BEGIN
  DELETE FROM keep_alive_pings
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE keep_alive_pings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Service role can manage pings" ON keep_alive_pings;

-- Create policies
CREATE POLICY "Users can view own activity"
ON user_activity FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats"
ON user_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage pings"
ON keep_alive_pings FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  activity_count INTEGER;
  stats_count INTEGER;
  pings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO activity_count FROM information_schema.tables
    WHERE table_name = 'user_activity' AND table_schema = 'public';
  SELECT COUNT(*) INTO stats_count FROM information_schema.tables
    WHERE table_name = 'user_stats' AND table_schema = 'public';
  SELECT COUNT(*) INTO pings_count FROM information_schema.tables
    WHERE table_name = 'keep_alive_pings' AND table_schema = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'user_activity table: %', CASE WHEN activity_count > 0 THEN '✅ Created' ELSE '❌ Failed' END;
  RAISE NOTICE 'user_stats table: %', CASE WHEN stats_count > 0 THEN '✅ Created' ELSE '❌ Failed' END;
  RAISE NOTICE 'keep_alive_pings table: %', CASE WHEN pings_count > 0 THEN '✅ Created' ELSE '❌ Failed' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy your app to Vercel';
  RAISE NOTICE '2. Test: curl https://knimex.com/filex/api/db-health';
  RAISE NOTICE '3. Verify all checks pass';
  RAISE NOTICE '===========================================';
END $$;
