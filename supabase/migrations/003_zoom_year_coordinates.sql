-- Add columns to store the exact year coordinates on the zoomed image
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS zoom_year_x INTEGER,
ADD COLUMN IF NOT EXISTS zoom_year_y INTEGER,
ADD COLUMN IF NOT EXISTS zoom_year_width INTEGER,
ADD COLUMN IF NOT EXISTS zoom_year_height INTEGER;

-- Add comment explaining the purpose of these columns
COMMENT ON COLUMN sites.zoom_year_x IS 'X coordinate of the year text on the zoomed image';
COMMENT ON COLUMN sites.zoom_year_y IS 'Y coordinate of the year text on the zoomed image';
COMMENT ON COLUMN sites.zoom_year_width IS 'Width of the year text bounding box on the zoomed image';
COMMENT ON COLUMN sites.zoom_year_height IS 'Height of the year text bounding box on the zoomed image';