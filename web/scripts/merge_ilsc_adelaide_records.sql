-- ============================================================
-- ILSC Adelaide の2つのレコードを統合
-- ============================================================

-- まず、Google Places データから情報を一時変数に保存してコピー
DO $$
DECLARE
  v_rating NUMERIC;
  v_review_count INTEGER;
  v_google_reviews JSONB;
  v_google_photos TEXT[];
  v_latitude NUMERIC;
  v_longitude NUMERIC;
BEGIN
  -- Google Places データを取得
  SELECT rating, review_count, google_reviews, google_photos, latitude, longitude
  INTO v_rating, v_review_count, v_google_reviews, v_google_photos, v_latitude, v_longitude
  FROM schools
  WHERE google_place_id = 'ChIJO3B1PKzPsGoR-U-tEwKGcFQ'
    AND school_id IS NULL;

  -- Google Places レコードを削除（UNIQUE制約回避）
  DELETE FROM schools
  WHERE google_place_id = 'ChIJO3B1PKzPsGoR-U-tEwKGcFQ'
    AND school_id IS NULL;

  -- 手動データに Google Places の情報を追加
  UPDATE schools
  SET
    rating = v_rating,
    review_count = v_review_count,
    google_place_id = 'ChIJO3B1PKzPsGoR-U-tEwKGcFQ',
    google_reviews = v_google_reviews,
    google_photos = v_google_photos,
    latitude = v_latitude,
    longitude = v_longitude,
    updated_at = NOW()
  WHERE school_id = 'ilsc_adelaide';
END $$;

-- 確認
SELECT
  school_id,
  name,
  city,
  rating,
  review_count,
  google_place_id,
  (SELECT COUNT(*) FROM school_courses WHERE school_id = 'ilsc_adelaide') as course_count
FROM schools
WHERE school_id = 'ilsc_adelaide';
