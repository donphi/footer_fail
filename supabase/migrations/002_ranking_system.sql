-- Add ranking fields to sites table
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS knowledge_rank INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_top_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_order INTEGER,
ADD COLUMN IF NOT EXISTS last_featured_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS years_outdated INTEGER GENERATED ALWAYS AS (
  CASE
    WHEN array_length(detected_years, 1) > 0
    THEN current_year - detected_years[array_upper(detected_years, 1)]
    ELSE 0
  END
) STORED;

-- Index for ranking queries
CREATE INDEX IF NOT EXISTS idx_sites_knowledge_rank ON sites(knowledge_rank DESC);
CREATE INDEX IF NOT EXISTS idx_sites_top_featured ON sites(is_top_featured, featured_order);
CREATE INDEX IF NOT EXISTS idx_sites_years_outdated ON sites(years_outdated DESC);

-- Function to rotate top featured sites daily
CREATE OR REPLACE FUNCTION rotate_top_featured()
RETURNS void AS $$
BEGIN
  -- Reset current top featured
  UPDATE sites SET
    is_top_featured = FALSE,
    featured_order = NULL
  WHERE is_top_featured = TRUE;

  -- Select new top 2 based on knowledge rank and staleness
  WITH ranked_sites AS (
    SELECT id,
           ROW_NUMBER() OVER (
             ORDER BY
               knowledge_rank DESC,
               years_outdated DESC,
               view_count DESC
           ) as rank
    FROM sites
    WHERE status = 'stale'
      AND (last_featured_at IS NULL OR last_featured_at < NOW() - INTERVAL '7 days')
    LIMIT 2
  )
  UPDATE sites
  SET
    is_top_featured = TRUE,
    featured_order = ranked_sites.rank,
    last_featured_at = NOW()
  FROM ranked_sites
  WHERE sites.id = ranked_sites.id;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job table for tracking
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_name TEXT UNIQUE NOT NULL,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the daily rotation job
INSERT INTO scheduled_jobs (job_name, next_run)
VALUES ('rotate_top_featured', NOW() + INTERVAL '1 day')
ON CONFLICT (job_name) DO NOTHING;