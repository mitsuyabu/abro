-- ============================================================
-- ILSC Language School Adelaide データ挿入
-- ============================================================

-- 1. テーブル作成（存在しない場合）
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS language_schools (
  school_id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ja TEXT,
  country TEXT,
  city_id TEXT,
  area TEXT,
  established INTEGER,
  accredited BOOLEAN DEFAULT false,
  accreditation_bodies TEXT[],
  total_students INTEGER,
  classroom_count INTEGER,
  average_age INTEGER,
  minimum_age INTEGER,
  japanese_ratio NUMERIC,
  nationality_diversity TEXT,
  gender_male_pct INTEGER,
  gender_female_pct INTEGER,
  support_japanese BOOLEAN DEFAULT false,
  support_job BOOLEAN DEFAULT false,
  support_accommodation BOOLEAN DEFAULT false,
  support_airport BOOLEAN DEFAULT false,
  airport_fee_aud INTEGER,
  wifi BOOLEAN DEFAULT false,
  kitchen BOOLEAN DEFAULT false,
  cafeteria BOOLEAN DEFAULT false,
  computer_room BOOLEAN DEFAULT false,
  library BOOLEAN DEFAULT false,
  enrollment_fee_aud INTEGER,
  material_fee_note TEXT,
  source_url TEXT,
  school_summary TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_courses (
  course_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES language_schools(school_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_short TEXT,
  lessons_per_week NUMERIC,
  lesson_minutes INTEGER,
  time_slot TEXT,
  schedule TEXT,
  level_min TEXT,
  level_max TEXT,
  class_size_max INTEGER,
  class_size_avg INTEGER,
  duration_min_weeks INTEGER,
  duration_max_weeks INTEGER,
  price_per_week_aud INTEGER,
  price_per_week_jpy INTEGER,
  start_dates TEXT,
  purpose TEXT[],
  recommended BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS school_accommodation (
  accommodation_id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES language_schools(school_id) ON DELETE CASCADE,
  type TEXT,
  room_type TEXT,
  meal_plan TEXT,
  price_per_week_aud INTEGER,
  price_per_week_jpy INTEGER,
  min_stay_weeks INTEGER,
  distance_minutes INTEGER,
  distance_type TEXT,
  checkin_day TEXT,
  checkout_day TEXT,
  min_age INTEGER,
  arrangement_fee_aud INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS school_labels (
  school_id TEXT NOT NULL REFERENCES language_schools(school_id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  PRIMARY KEY (school_id, label)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_school_courses_school_id ON school_courses(school_id);
CREATE INDEX IF NOT EXISTS idx_school_accommodation_school_id ON school_accommodation(school_id);
CREATE INDEX IF NOT EXISTS idx_school_labels_school_id ON school_labels(school_id);
CREATE INDEX IF NOT EXISTS idx_school_labels_label ON school_labels(label);
CREATE INDEX IF NOT EXISTS idx_language_schools_city ON language_schools(city_id);
CREATE INDEX IF NOT EXISTS idx_language_schools_country ON language_schools(country);

-- ============================================================
-- 2. データ挿入
-- ============================================================

-- 2-1. 学校基本情報
INSERT INTO language_schools (
  school_id,
  name_en,
  name_ja,
  country,
  city_id,
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
  updated_at
) VALUES (
  'ilsc_adelaide',
  'ILSC Language School Adelaide',
  'ILSCランゲージスクール アデレード',
  'australia',
  'adelaide',
  '市内中心部',
  2019,
  true,
  ARRAY['ELICOS', 'English Australia', 'NEAS', 'ALTO'],
  240,
  12,
  29,
  16,
  0.05,
  '多国籍',
  45,
  55,
  false,
  true,
  true,
  true,
  200,
  true,
  true,
  true,
  true,
  true,
  250,
  '1〜4週間：60AUD / 5週間以上：週15AUD（上限450AUD）',
  'https://www.languagecourse.net/discount-ryugaku/gakko-ilsc-language-school-adelaide.php3',
  'アデレード市内中心部に位置するILSC認定校。多国籍環境（日本人比率5%）で、午前・午後のコースがあり働きながら学習可能。仕事探しサポートあり。全レベル対応で初心者から上級者まで受け入れ可能。',
  NOW()
)
ON CONFLICT (school_id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ja = EXCLUDED.name_ja,
  country = EXCLUDED.country,
  city_id = EXCLUDED.city_id,
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
  updated_at = NOW();

-- 2-2. コース情報（7コース）

-- コース1: Full-Time Morning
INSERT INTO school_courses VALUES (
  'ilsc_adelaide_ftam',
  'ilsc_adelaide',
  'Full-Time Morning',
  'FT AM',
  24,
  50,
  'morning',
  '8:30〜13:00',
  'A1',
  'C2',
  18,
  14,
  1,
  99,
  115,
  10925,
  '毎週月曜日',
  ARRAY['general'],
  true
) ON CONFLICT (course_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_short = EXCLUDED.name_short,
  lessons_per_week = EXCLUDED.lessons_per_week,
  lesson_minutes = EXCLUDED.lesson_minutes,
  time_slot = EXCLUDED.time_slot,
  schedule = EXCLUDED.schedule,
  level_min = EXCLUDED.level_min,
  level_max = EXCLUDED.level_max,
  class_size_max = EXCLUDED.class_size_max,
  class_size_avg = EXCLUDED.class_size_avg,
  duration_min_weeks = EXCLUDED.duration_min_weeks,
  duration_max_weeks = EXCLUDED.duration_max_weeks,
  price_per_week_aud = EXCLUDED.price_per_week_aud,
  price_per_week_jpy = EXCLUDED.price_per_week_jpy,
  start_dates = EXCLUDED.start_dates,
  purpose = EXCLUDED.purpose,
  recommended = EXCLUDED.recommended;

-- コース2: Part-Time Morning
INSERT INTO school_courses VALUES (
  'ilsc_adelaide_ptam',
  'ilsc_adelaide',
  'Part-Time Morning',
  'PT AM',
  14.5,
  50,
  'morning',
  '8:30〜13:00',
  'A1',
  'C2',
  18,
  14,
  1,
  99,
  247,
  23465,
  '毎週月曜日',
  ARRAY['general', 'work_and_study'],
  false
) ON CONFLICT (course_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_short = EXCLUDED.name_short,
  lessons_per_week = EXCLUDED.lessons_per_week,
  lesson_minutes = EXCLUDED.lesson_minutes,
  time_slot = EXCLUDED.time_slot,
  schedule = EXCLUDED.schedule,
  level_min = EXCLUDED.level_min,
  level_max = EXCLUDED.level_max,
  class_size_max = EXCLUDED.class_size_max,
  class_size_avg = EXCLUDED.class_size_avg,
  duration_min_weeks = EXCLUDED.duration_min_weeks,
  duration_max_weeks = EXCLUDED.duration_max_weeks,
  price_per_week_aud = EXCLUDED.price_per_week_aud,
  price_per_week_jpy = EXCLUDED.price_per_week_jpy,
  start_dates = EXCLUDED.start_dates,
  purpose = EXCLUDED.purpose,
  recommended = EXCLUDED.recommended;

-- コース3: Full-Time Evening
INSERT INTO school_courses VALUES (
  'ilsc_adelaide_ftpm',
  'ilsc_adelaide',
  'Full-Time Evening',
  'FT PM',
  24,
  50,
  'evening',
  '17:30〜21:30',
  'A1',
  'C2',
  18,
  14,
  1,
  99,
  268,
  25460,
  '毎週月曜日',
  ARRAY['general', 'work_and_study'],
  false
) ON CONFLICT (course_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_short = EXCLUDED.name_short,
  lessons_per_week = EXCLUDED.lessons_per_week,
  lesson_minutes = EXCLUDED.lesson_minutes,
  time_slot = EXCLUDED.time_slot,
  schedule = EXCLUDED.schedule,
  level_min = EXCLUDED.level_min,
  level_max = EXCLUDED.level_max,
  class_size_max = EXCLUDED.class_size_max,
  class_size_avg = EXCLUDED.class_size_avg,
  duration_min_weeks = EXCLUDED.duration_min_weeks,
  duration_max_weeks = EXCLUDED.duration_max_weeks,
  price_per_week_aud = EXCLUDED.price_per_week_aud,
  price_per_week_jpy = EXCLUDED.price_per_week_jpy,
  start_dates = EXCLUDED.start_dates,
  purpose = EXCLUDED.purpose,
  recommended = EXCLUDED.recommended;

-- コース4: Part-Time Evening
INSERT INTO school_courses VALUES (
  'ilsc_adelaide_ptpm',
  'ilsc_adelaide',
  'Part-Time Evening',
  'PT PM',
  14.5,
  50,
  'evening',
  '17:30〜21:30',
  'A1',
  'C2',
  18,
  14,
  1,
  99,
  229,
  21755,
  '毎週月曜日',
  ARRAY['general', 'work_and_study'],
  false
) ON CONFLICT (course_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_short = EXCLUDED.name_short,
  lessons_per_week = EXCLUDED.lessons_per_week,
  lesson_minutes = EXCLUDED.lesson_minutes,
  time_slot = EXCLUDED.time_slot,
  schedule = EXCLUDED.schedule,
  level_min = EXCLUDED.level_min,
  level_max = EXCLUDED.level_max,
  class_size_max = EXCLUDED.class_size_max,
  class_size_avg = EXCLUDED.class_size_avg,
  duration_min_weeks = EXCLUDED.duration_min_weeks,
  duration_max_weeks = EXCLUDED.duration_max_weeks,
  price_per_week_aud = EXCLUDED.price_per_week_aud,
  price_per_week_jpy = EXCLUDED.price_per_week_jpy,
  start_dates = EXCLUDED.start_dates,
  purpose = EXCLUDED.purpose,
  recommended = EXCLUDED.recommended;

-- コース5: English for Academic Purposes FT AM
INSERT INTO school_courses VALUES (
  'ilsc_adelaide_eap_am',
  'ilsc_adelaide',
  'English for Academic Purposes FT AM',
  'EAP AM',
  24,
  50,
  'morning',
  '8:30〜13:00',
  'B1',
  'C2',
  18,
  14,
  1,
  99,
  437,
  41515,
  '毎週月曜日',
  ARRAY['academic', 'university_prep'],
  false
) ON CONFLICT (course_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_short = EXCLUDED.name_short,
  lessons_per_week = EXCLUDED.lessons_per_week,
  lesson_minutes = EXCLUDED.lesson_minutes,
  time_slot = EXCLUDED.time_slot,
  schedule = EXCLUDED.schedule,
  level_min = EXCLUDED.level_min,
  level_max = EXCLUDED.level_max,
  class_size_max = EXCLUDED.class_size_max,
  class_size_avg = EXCLUDED.class_size_avg,
  duration_min_weeks = EXCLUDED.duration_min_weeks,
  duration_max_weeks = EXCLUDED.duration_max_weeks,
  price_per_week_aud = EXCLUDED.price_per_week_aud,
  price_per_week_jpy = EXCLUDED.price_per_week_jpy,
  start_dates = EXCLUDED.start_dates,
  purpose = EXCLUDED.purpose,
  recommended = EXCLUDED.recommended;

-- コース6: English for Academic Purposes FT PM
INSERT INTO school_courses VALUES (
  'ilsc_adelaide_eap_pm',
  'ilsc_adelaide',
  'English for Academic Purposes FT PM',
  'EAP PM',
  24,
  50,
  'evening',
  '17:30〜21:30',
  'B1',
  'C2',
  18,
  14,
  1,
  99,
  361,
  34295,
  '毎週月曜日',
  ARRAY['academic', 'university_prep'],
  false
) ON CONFLICT (course_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_short = EXCLUDED.name_short,
  lessons_per_week = EXCLUDED.lessons_per_week,
  lesson_minutes = EXCLUDED.lesson_minutes,
  time_slot = EXCLUDED.time_slot,
  schedule = EXCLUDED.schedule,
  level_min = EXCLUDED.level_min,
  level_max = EXCLUDED.level_max,
  class_size_max = EXCLUDED.class_size_max,
  class_size_avg = EXCLUDED.class_size_avg,
  duration_min_weeks = EXCLUDED.duration_min_weeks,
  duration_max_weeks = EXCLUDED.duration_max_weeks,
  price_per_week_aud = EXCLUDED.price_per_week_aud,
  price_per_week_jpy = EXCLUDED.price_per_week_jpy,
  start_dates = EXCLUDED.start_dates,
  purpose = EXCLUDED.purpose,
  recommended = EXCLUDED.recommended;

-- コース7: IELTS Mastery FT AM
INSERT INTO school_courses VALUES (
  'ilsc_adelaide_ielts',
  'ilsc_adelaide',
  'IELTS Mastery FT AM',
  'IELTS',
  24,
  50,
  'morning',
  '8:30〜13:00',
  'B1',
  'C2',
  18,
  14,
  4,
  99,
  437,
  41515,
  '月1回（毎月第4月曜日）',
  ARRAY['ielts', 'exam_prep'],
  false
) ON CONFLICT (course_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_short = EXCLUDED.name_short,
  lessons_per_week = EXCLUDED.lessons_per_week,
  lesson_minutes = EXCLUDED.lesson_minutes,
  time_slot = EXCLUDED.time_slot,
  schedule = EXCLUDED.schedule,
  level_min = EXCLUDED.level_min,
  level_max = EXCLUDED.level_max,
  class_size_max = EXCLUDED.class_size_max,
  class_size_avg = EXCLUDED.class_size_avg,
  duration_min_weeks = EXCLUDED.duration_min_weeks,
  duration_max_weeks = EXCLUDED.duration_max_weeks,
  price_per_week_aud = EXCLUDED.price_per_week_aud,
  price_per_week_jpy = EXCLUDED.price_per_week_jpy,
  start_dates = EXCLUDED.start_dates,
  purpose = EXCLUDED.purpose,
  recommended = EXCLUDED.recommended;

-- 2-3. 宿泊施設情報
INSERT INTO school_accommodation VALUES (
  'ilsc_adelaide_homestay',
  'ilsc_adelaide',
  'homestay',
  'single',
  '朝食＋夕食',
  385,
  36575,
  2,
  45,
  '公共交通機関',
  '日曜日',
  '土曜日',
  18,
  370,
  '学校から30〜60分圏内。审査済みのホストファミリー。'
) ON CONFLICT (accommodation_id) DO UPDATE SET
  type = EXCLUDED.type,
  room_type = EXCLUDED.room_type,
  meal_plan = EXCLUDED.meal_plan,
  price_per_week_aud = EXCLUDED.price_per_week_aud,
  price_per_week_jpy = EXCLUDED.price_per_week_jpy,
  min_stay_weeks = EXCLUDED.min_stay_weeks,
  distance_minutes = EXCLUDED.distance_minutes,
  distance_type = EXCLUDED.distance_type,
  checkin_day = EXCLUDED.checkin_day,
  checkout_day = EXCLUDED.checkout_day,
  min_age = EXCLUDED.min_age,
  arrangement_fee_aud = EXCLUDED.arrangement_fee_aud,
  notes = EXCLUDED.notes;

-- 2-4. ラベル（タグ）
-- 既存のラベルを削除してから新しいラベルを挿入
DELETE FROM school_labels WHERE school_id = 'ilsc_adelaide';

INSERT INTO school_labels (school_id, label) VALUES
  ('ilsc_adelaide', 'budget'),
  ('ilsc_adelaide', 'all_levels'),
  ('ilsc_adelaide', 'multicultural'),
  ('ilsc_adelaide', 'central'),
  ('ilsc_adelaide', 'job_support'),
  ('ilsc_adelaide', 'accommodation_support'),
  ('ilsc_adelaide', 'morning_available'),
  ('ilsc_adelaide', 'evening_available'),
  ('ilsc_adelaide', 'work_and_study'),
  ('ilsc_adelaide', 'ielts_available'),
  ('ilsc_adelaide', 'academic_available');

-- ============================================================
-- 3. データ確認
-- ============================================================

SELECT 'language_schools' AS table_name, COUNT(*) AS record_count FROM language_schools WHERE school_id = 'ilsc_adelaide'
UNION ALL
SELECT 'school_courses', COUNT(*) FROM school_courses WHERE school_id = 'ilsc_adelaide'
UNION ALL
SELECT 'school_accommodation', COUNT(*) FROM school_accommodation WHERE school_id = 'ilsc_adelaide'
UNION ALL
SELECT 'school_labels', COUNT(*) FROM school_labels WHERE school_id = 'ilsc_adelaide';
