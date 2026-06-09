-- ============================================================
-- schools テーブル拡張 + language_schools データ統合
-- ============================================================

-- Step 1: schools テーブルにカラム追加
-- ------------------------------------------------------------

ALTER TABLE schools
  -- 学校識別子（language_schools との紐付け用）
  ADD COLUMN IF NOT EXISTS school_id TEXT UNIQUE,

  -- 基本情報
  ADD COLUMN IF NOT EXISTS name_ja TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS established INTEGER,
  ADD COLUMN IF NOT EXISTS accredited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS accreditation_bodies TEXT[],

  -- 学校規模
  ADD COLUMN IF NOT EXISTS total_students INTEGER,
  ADD COLUMN IF NOT EXISTS classroom_count INTEGER,
  ADD COLUMN IF NOT EXISTS average_age INTEGER,
  ADD COLUMN IF NOT EXISTS minimum_age INTEGER,

  -- 国籍・多様性
  ADD COLUMN IF NOT EXISTS japanese_ratio NUMERIC,
  ADD COLUMN IF NOT EXISTS nationality_diversity TEXT,
  ADD COLUMN IF NOT EXISTS gender_male_pct INTEGER,
  ADD COLUMN IF NOT EXISTS gender_female_pct INTEGER,

  -- サポート体制
  ADD COLUMN IF NOT EXISTS support_japanese BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_job BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_accommodation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_airport BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS airport_fee_aud INTEGER,

  -- 施設
  ADD COLUMN IF NOT EXISTS wifi BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS kitchen BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cafeteria BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS computer_room BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS library BOOLEAN DEFAULT false,

  -- 料金
  ADD COLUMN IF NOT EXISTS price_min_aud INTEGER,
  ADD COLUMN IF NOT EXISTS price_max_aud INTEGER,
  ADD COLUMN IF NOT EXISTS enrollment_fee_aud INTEGER,
  ADD COLUMN IF NOT EXISTS material_fee_note TEXT,

  -- その他
  ADD COLUMN IF NOT EXISTS school_summary TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_schools_school_id ON schools(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_country ON schools(country);
CREATE INDEX IF NOT EXISTS idx_schools_price_min ON schools(price_min_aud);
CREATE INDEX IF NOT EXISTS idx_schools_support_job ON schools(support_job);

-- Step 2: school_courses 等のテーブルを schools.school_id に紐付け
-- ------------------------------------------------------------

-- school_courses の外部キー制約を更新
-- （元々 language_schools.school_id を参照していたものを schools.school_id に変更）
ALTER TABLE school_courses DROP CONSTRAINT IF EXISTS school_courses_school_id_fkey;
ALTER TABLE school_courses
  ADD CONSTRAINT school_courses_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;

-- school_accommodation の外部キー制約を更新
ALTER TABLE school_accommodation DROP CONSTRAINT IF EXISTS school_accommodation_school_id_fkey;
ALTER TABLE school_accommodation
  ADD CONSTRAINT school_accommodation_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;

-- school_labels の外部キー制約を更新
ALTER TABLE school_labels DROP CONSTRAINT IF EXISTS school_labels_school_id_fkey;
ALTER TABLE school_labels
  ADD CONSTRAINT school_labels_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE;

-- Step 3: ILSC Adelaide データを schools に移行
-- ------------------------------------------------------------

-- language_schools から schools にデータをコピー
INSERT INTO schools (
  school_id,
  name,
  name_ja,
  city,
  country,
  type,
  area,
  established,
  accredited,
  accreditation_bodies,
  total_students,
  classroom_count,
  average_age,
  minimum_age,
  japanese_ratio,
  nationality_diversity,
  gender_male_pct,
  gender_female_pct,
  support_japanese,
  support_job,
  support_accommodation,
  support_airport,
  airport_fee_aud,
  wifi,
  kitchen,
  cafeteria,
  computer_room,
  library,
  enrollment_fee_aud,
  material_fee_note,
  source_url,
  school_summary,
  updated_at,
  -- 価格範囲をコースから計算
  price_min_aud,
  price_max_aud
)
SELECT
  ls.school_id,
  ls.name_en AS name,
  ls.name_ja,
  ls.city_id AS city,
  ls.country,
  '語学学校' AS type,
  ls.area,
  ls.established,
  ls.accredited,
  ls.accreditation_bodies,
  ls.total_students,
  ls.classroom_count,
  ls.average_age,
  ls.minimum_age,
  ls.japanese_ratio,
  ls.nationality_diversity,
  ls.gender_male_pct,
  ls.gender_female_pct,
  ls.support_japanese,
  ls.support_job,
  ls.support_accommodation,
  ls.support_airport,
  ls.airport_fee_aud,
  ls.wifi,
  ls.kitchen,
  ls.cafeteria,
  ls.computer_room,
  ls.library,
  ls.enrollment_fee_aud,
  ls.material_fee_note,
  ls.source_url,
  ls.school_summary,
  ls.updated_at,
  -- 最安コース料金
  (SELECT MIN(price_per_week_aud) FROM school_courses WHERE school_id = ls.school_id),
  -- 最高コース料金
  (SELECT MAX(price_per_week_aud) FROM school_courses WHERE school_id = ls.school_id)
FROM language_schools ls
WHERE ls.school_id = 'ilsc_adelaide'
ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ja = EXCLUDED.name_ja,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  area = EXCLUDED.area,
  established = EXCLUDED.established,
  accredited = EXCLUDED.accredited,
  accreditation_bodies = EXCLUDED.accreditation_bodies,
  total_students = EXCLUDED.total_students,
  classroom_count = EXCLUDED.classroom_count,
  average_age = EXCLUDED.average_age,
  minimum_age = EXCLUDED.minimum_age,
  japanese_ratio = EXCLUDED.japanese_ratio,
  nationality_diversity = EXCLUDED.nationality_diversity,
  gender_male_pct = EXCLUDED.gender_male_pct,
  gender_female_pct = EXCLUDED.gender_female_pct,
  support_japanese = EXCLUDED.support_japanese,
  support_job = EXCLUDED.support_job,
  support_accommodation = EXCLUDED.support_accommodation,
  support_airport = EXCLUDED.support_airport,
  airport_fee_aud = EXCLUDED.airport_fee_aud,
  wifi = EXCLUDED.wifi,
  kitchen = EXCLUDED.kitchen,
  cafeteria = EXCLUDED.cafeteria,
  computer_room = EXCLUDED.computer_room,
  library = EXCLUDED.library,
  enrollment_fee_aud = EXCLUDED.enrollment_fee_aud,
  material_fee_note = EXCLUDED.material_fee_note,
  source_url = EXCLUDED.source_url,
  school_summary = EXCLUDED.school_summary,
  price_min_aud = EXCLUDED.price_min_aud,
  price_max_aud = EXCLUDED.price_max_aud,
  updated_at = NOW();

-- Step 4: 確認クエリ
-- ------------------------------------------------------------

-- 統合後のデータ確認
SELECT
  school_id,
  name,
  name_ja,
  city,
  price_min_aud,
  price_max_aud,
  support_job,
  japanese_ratio,
  (SELECT COUNT(*) FROM school_courses WHERE school_id = schools.school_id) AS course_count,
  (SELECT COUNT(*) FROM school_labels WHERE school_id = schools.school_id) AS label_count
FROM schools
WHERE school_id = 'ilsc_adelaide';

-- 関連テーブルの確認
SELECT 'school_courses' AS table_name, COUNT(*) AS count FROM school_courses WHERE school_id = 'ilsc_adelaide'
UNION ALL
SELECT 'school_accommodation', COUNT(*) FROM school_accommodation WHERE school_id = 'ilsc_adelaide'
UNION ALL
SELECT 'school_labels', COUNT(*) FROM school_labels WHERE school_id = 'ilsc_adelaide';
