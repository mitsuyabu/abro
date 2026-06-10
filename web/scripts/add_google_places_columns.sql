-- ============================================================
-- Google Places API 連携用のカラムを schools テーブルに追加
-- ============================================================

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS rating NUMERIC,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS google_reviews JSONB,
  ADD COLUMN IF NOT EXISTS google_photos TEXT[],
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_schools_google_place_id ON schools(google_place_id);
CREATE INDEX IF NOT EXISTS idx_schools_rating ON schools(rating);

-- 確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'schools'
  AND column_name IN ('google_place_id', 'rating', 'review_count', 'google_reviews', 'google_photos', 'latitude', 'longitude')
ORDER BY column_name;
