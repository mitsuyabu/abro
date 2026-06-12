-- ============================================================
-- HLI・English Path・Lexis用テーブル拡張
-- ============================================================

ALTER TABLE schools
  -- HLI Sydney 固有
  ADD COLUMN IF NOT EXISTS cultural_excursions BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cultural_excursions_note TEXT,
  ADD COLUMN IF NOT EXISTS refund_policy_note TEXT,

  -- HLI Cairns 固有
  ADD COLUMN IF NOT EXISTS nature_excursions BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nature_excursions_note TEXT,
  ADD COLUMN IF NOT EXISTS climate_note TEXT,

  -- English Path 固有
  ADD COLUMN IF NOT EXISTS lesson_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS ep_masterclass BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ep_masterclass_note TEXT,
  ADD COLUMN IF NOT EXISTS ep_alumni_scholarship BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creative_studio BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS electronic_whiteboard BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS junior_must_homestay BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS junior_must_airport BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_days INTEGER,
  ADD COLUMN IF NOT EXISTS visa_refusal_protection BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS visa_refusal_cap_eur INTEGER,
  ADD COLUMN IF NOT EXISTS insurance_fee_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS special_diet_fee_aud INTEGER,
  ADD COLUMN IF NOT EXISTS global_brand TEXT,
  ADD COLUMN IF NOT EXISTS sister_facility TEXT,
  ADD COLUMN IF NOT EXISTS minimum_age_student_visa INTEGER,
  ADD COLUMN IF NOT EXISTS university_guidance_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS history_note TEXT,
  ADD COLUMN IF NOT EXISTS tourism_info BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_smoking_indoor BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_parking_nearby BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS low_review_count_flag BOOLEAN DEFAULT false,

  -- Lexis 固有
  ADD COLUMN IF NOT EXISTS cambridge_exam_center BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cambridge_exams TEXT[],
  ADD COLUMN IF NOT EXISTS group_campuses TEXT[],
  ADD COLUMN IF NOT EXISTS total_students_regular INTEGER,
  ADD COLUMN IF NOT EXISTS total_students_summer INTEGER,
  ADD COLUMN IF NOT EXISTS movie_room BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_games BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS movie_rental BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_coffee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_water BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_parking BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activities_capacity_warning BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_warning TEXT,
  ADD COLUMN IF NOT EXISTS group_combination BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS unaccompanied_minor_fee INTEGER,
  ADD COLUMN IF NOT EXISTS airport_fee_aud_oolgoolga INTEGER;

-- school_courses テーブル拡張
ALTER TABLE school_courses
  ADD COLUMN IF NOT EXISTS name_short TEXT,
  ADD COLUMN IF NOT EXISTS airport_transfer_included BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cambridge_avg_score INTEGER;

-- school_accommodation テーブル拡張
ALTER TABLE school_accommodation
  ADD COLUMN IF NOT EXISTS bathroom TEXT,
  ADD COLUMN IF NOT EXISTS extension_fee_aud INTEGER,
  ADD COLUMN IF NOT EXISTS deposit_aud INTEGER;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_schools_cambridge_exam_center ON schools(cambridge_exam_center);
CREATE INDEX IF NOT EXISTS idx_schools_lesson_minutes ON schools(lesson_minutes);

-- 確認
SELECT 'schools' AS table_name, COUNT(*) AS new_columns
FROM information_schema.columns
WHERE table_name = 'schools'
  AND column_name IN (
    'cultural_excursions', 'nature_excursions', 'ep_masterclass',
    'cambridge_exam_center', 'low_review_count_flag'
  )
UNION ALL
SELECT 'school_courses', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'school_courses'
  AND column_name IN ('name_short', 'airport_transfer_included', 'cambridge_avg_score')
UNION ALL
SELECT 'school_accommodation', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'school_accommodation'
  AND column_name IN ('bathroom', 'extension_fee_aud', 'deposit_aud');
