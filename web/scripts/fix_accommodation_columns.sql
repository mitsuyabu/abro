-- ============================================================
-- school_accommodation テーブルに不足カラムを追加
-- ============================================================

ALTER TABLE school_accommodation
  ADD COLUMN IF NOT EXISTS arrangement_fee_aud INTEGER,
  ADD COLUMN IF NOT EXISTS highseason_extra_aud INTEGER;

-- 確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'school_accommodation'
  AND column_name IN ('arrangement_fee_aud', 'highseason_extra_aud')
ORDER BY column_name;
