-- ============================================================
-- 学校データ一括投入用のテーブル拡張
-- ============================================================

-- schools / language_schools テーブル拡張
ALTER TABLE schools
  -- 年齢情報
  ADD COLUMN IF NOT EXISTS average_age_summer INTEGER,
  ADD COLUMN IF NOT EXISTS average_age_regular INTEGER,
  ADD COLUMN IF NOT EXISTS minimum_age_junior INTEGER,

  -- 入学金（ビザ別）
  ADD COLUMN IF NOT EXISTS enrollment_fee_aud_whv INTEGER,
  ADD COLUMN IF NOT EXISTS enrollment_fee_aud_student INTEGER,
  ADD COLUMN IF NOT EXISTS junior_support_fee_aud INTEGER,

  -- サポート体制拡張
  ADD COLUMN IF NOT EXISTS support_apartment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_university BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_bank BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_medical BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_24hr_helpline BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_local_organizer BOOLEAN DEFAULT false,

  -- 施設拡張
  ADD COLUMN IF NOT EXISTS garden BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lounge BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS balcony_terrace BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS disability_access BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS workstation_count INTEGER,
  ADD COLUMN IF NOT EXISTS newspaper BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS language_software BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vending_machine BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS table_tennis BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_smoking_all BOOLEAN DEFAULT false,

  -- アプリ・サービス
  ADD COLUMN IF NOT EXISTS myilsc_app BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS language_workshops BOOLEAN DEFAULT false,

  -- 料金
  ADD COLUMN IF NOT EXISTS private_lesson_fee_aud INTEGER,
  ADD COLUMN IF NOT EXISTS airport_fee_aud_gc INTEGER,
  ADD COLUMN IF NOT EXISTS airport_fee_aud_bne INTEGER,

  -- 評価詳細
  ADD COLUMN IF NOT EXISTS rating_teaching NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_value NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_location NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_facilities NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_social NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_organization NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_homestay NUMERIC,
  ADD COLUMN IF NOT EXISTS rating_shared_flat NUMERIC,

  -- ビーチアクセス
  ADD COLUMN IF NOT EXISTS beach_distance_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS beach_distance_type TEXT,

  -- アクティビティ
  ADD COLUMN IF NOT EXISTS activities_free TEXT,
  ADD COLUMN IF NOT EXISTS activities_paid TEXT,
  ADD COLUMN IF NOT EXISTS activities_included BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activities_note TEXT,

  -- 初心者対応
  ADD COLUMN IF NOT EXISTS beginner_start_dates TEXT,

  -- グローバル展開
  ADD COLUMN IF NOT EXISTS global_locations TEXT[],
  ADD COLUMN IF NOT EXISTS established_note TEXT,

  -- 証明書・ジュニア
  ADD COLUMN IF NOT EXISTS certificate_included BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS junior_available BOOLEAN DEFAULT false,

  -- 学校タイプ
  ADD COLUMN IF NOT EXISTS school_type TEXT DEFAULT 'group',

  -- 宿泊・食事込み（HLI等）
  ADD COLUMN IF NOT EXISTS accommodation_included BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS meals_included BOOLEAN DEFAULT false,

  -- ハイシーズン
  ADD COLUMN IF NOT EXISTS highseason_surcharge_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS highseason_start DATE,
  ADD COLUMN IF NOT EXISTS highseason_end DATE;

-- school_courses テーブル拡張
ALTER TABLE school_courses
  -- スケジュール詳細
  ADD COLUMN IF NOT EXISTS schedule TEXT,
  ADD COLUMN IF NOT EXISTS class_size_max INTEGER,
  ADD COLUMN IF NOT EXISTS class_size_avg INTEGER,
  ADD COLUMN IF NOT EXISTS duration_min_weeks INTEGER,
  ADD COLUMN IF NOT EXISTS duration_max_weeks INTEGER,

  -- 料金（円表示）
  ADD COLUMN IF NOT EXISTS price_per_week_jpy INTEGER,

  -- 開始日
  ADD COLUMN IF NOT EXISTS start_dates TEXT,

  -- 対象年齢
  ADD COLUMN IF NOT EXISTS target_age TEXT,
  ADD COLUMN IF NOT EXISTS minimum_age INTEGER,
  ADD COLUMN IF NOT EXISTS maximum_age INTEGER,

  -- 宿泊・食事込み
  ADD COLUMN IF NOT EXISTS accommodation_included BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS meals_included BOOLEAN DEFAULT false,

  -- 試験料
  ADD COLUMN IF NOT EXISTS exam_fee_aud INTEGER,

  -- ノート
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- school_accommodation テーブル拡張
ALTER TABLE school_accommodation
  -- 料金（円表示）
  ADD COLUMN IF NOT EXISTS price_per_week_jpy INTEGER,

  -- 年齢制限拡張
  ADD COLUMN IF NOT EXISTS max_age INTEGER,

  -- コースに含まれるか
  ADD COLUMN IF NOT EXISTS included_in_course BOOLEAN DEFAULT false,

  -- 評価
  ADD COLUMN IF NOT EXISTS rating NUMERIC,

  -- ノート
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_schools_school_type ON schools(school_type);
CREATE INDEX IF NOT EXISTS idx_schools_junior_available ON schools(junior_available);
CREATE INDEX IF NOT EXISTS idx_courses_target_age ON school_courses(target_age);

-- 確認
SELECT 'schools' AS table_name, COUNT(*) AS new_columns
FROM information_schema.columns
WHERE table_name = 'schools'
  AND column_name IN (
    'average_age_summer', 'average_age_regular', 'school_type',
    'support_apartment', 'support_university', 'rating_teaching'
  )
UNION ALL
SELECT 'school_courses', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'school_courses'
  AND column_name IN ('schedule', 'class_size_max', 'price_per_week_jpy')
UNION ALL
SELECT 'school_accommodation', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'school_accommodation'
  AND column_name IN ('price_per_week_jpy', 'rating', 'included_in_course');
