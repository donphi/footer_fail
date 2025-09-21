-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sites table (main data)
CREATE TABLE sites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  company TEXT,
  industry TEXT,
  country TEXT,
  detected_years INTEGER[] DEFAULT '{}',
  current_year INTEGER NOT NULL,
  status TEXT CHECK (status IN ('ok', 'stale', 'inconclusive', 'future')) DEFAULT 'inconclusive',
  first_incorrect_at TIMESTAMPTZ,
  last_incorrect_at TIMESTAMPTZ,
  last_correct_at TIMESTAMPTZ,
  corrected_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  proof_internet_archive TEXT,
  proof_archive_today TEXT,
  screenshot_url TEXT,
  screenshot_hash TEXT,
  brand_weight DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table (AI commentary)
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  site_slug TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_verified_at ON sites(verified_at DESC);
CREATE INDEX idx_sites_slug ON sites(slug);
CREATE INDEX idx_posts_timestamp ON posts(timestamp DESC);

-- Row Level Security
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public sites are viewable by everyone" ON sites
  FOR SELECT USING (true);

CREATE POLICY "Public posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add columns for all screenshot types
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS year_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS year_screenshot_hash TEXT,
ADD COLUMN IF NOT EXISTS footer_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS footer_screenshot_hash TEXT,
ADD COLUMN IF NOT EXISTS footer_element_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS footer_element_screenshot_hash TEXT,
ADD COLUMN IF NOT EXISTS commented_at TIMESTAMPTZ;