-- ============================================================
-- コース・宿泊施設・ラベル一括投入
-- ============================================================

-- ==================== OHC Brisbane ====================

-- コース
INSERT INTO school_courses (school_id, course_id, name, name_short, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, start_dates, purpose, recommended)
VALUES
('ohc_brisbane', 'ohc_brisbane_ge_plus', 'General English Plus', 'GE Plus', 20, 60, 'morning', '9:00〜13:30', 'A2', 'C2', 16, 13, 1, 99, 404, 38380, '毎週月曜日', ARRAY['general'], true),
('ohc_brisbane', 'ohc_brisbane_ge_core', 'General English Core', 'GE Core', 15, 60, 'morning', '9:00〜13:30', 'A2', 'C2', 16, 13, 1, 99, 319, 30305, '毎週月曜日', ARRAY['general', 'work_and_study'], false);

-- 宿泊施設
INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, price_per_week_aud, price_per_week_jpy, min_stay_weeks, distance_minutes, distance_type, checkin_day, checkout_day, min_age, arrangement_fee_aud, highseason_extra_aud, notes)
VALUES
('ohc_brisbane', 'ohc_brisbane_homestay_single', 'homestay', 'single', '平日2食・週末3食', 450, 42750, 4, 25, '公共交通機関', '日曜日', '土曜日', 18, 420, 50, '審査済みホストファミリー。学校から25分圏内。'),
('ohc_brisbane', 'ohc_brisbane_homestay_double', 'homestay', 'double', '平日2食・週末3食', 425, 40375, 4, 25, '公共交通機関', '日曜日', '土曜日', 18, 420, 50, 'ダブルルームタイプ。シングルより週25AUD安い。')
ON CONFLICT DO NOTHING;

INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, price_per_week_aud, price_per_week_jpy, min_stay_weeks, distance_minutes, distance_type, checkin_day, checkout_day, min_age, max_age, arrangement_fee_aud, highseason_extra_aud, notes)
VALUES
('ohc_brisbane', 'ohc_brisbane_homestay_junior', 'homestay', 'single', '3食付', 570, 54150, 4, 25, '公共交通機関', '日曜日', '土曜日', 16, 17, 420, 50, '18歳未満専用。3食付。後見手配費280AUD・週次後見費65AUD/週が別途必要。')
ON CONFLICT DO NOTHING;

-- ラベル
INSERT INTO school_labels (school_id, label)
SELECT 'ohc_brisbane', unnest(ARRAY[
  'standard', 'beginner_plus', 'japanese_friendly', 'central', 'job_support',
  'accommodation_support', 'apartment_support', 'university_consultation',
  'morning_only', 'high_rated', 'small_school', 'work_and_study'
])
ON CONFLICT DO NOTHING;

-- ==================== OHC Cairns ====================

-- コース
INSERT INTO school_courses (school_id, course_id, name, name_short, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, start_dates, purpose, recommended)
VALUES
('ohc_cairns', 'ohc_cairns_ge_plus', 'General English Plus', 'GE Plus', 20, 60, 'morning', '9:00〜13:30', 'A2', 'C2', 16, 12, 1, 99, 404, 38380, '毎週月曜日', ARRAY['general'], true),
('ohc_cairns', 'ohc_cairns_ge_core', 'General English Core', 'GE Core', 15, 60, 'morning', '9:00〜12:30', 'A2', 'C2', 16, 12, 1, 99, 319, 30305, '毎週月曜日', ARRAY['general', 'work_and_study'], false);

-- 宿泊施設
INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, price_per_week_aud, price_per_week_jpy, min_stay_weeks, distance_minutes, distance_type, checkin_day, checkout_day, min_age, arrangement_fee_aud, highseason_extra_aud, notes)
VALUES
('ohc_cairns', 'ohc_cairns_homestay_single', 'homestay', 'single', '平日2食・週末3食', 385, 36575, 4, 15, '車', '日曜日', '土曜日', 19, 420, 50, '最低年齢19歳。車で15分圏内。タオル・シーツ含む。'),
('ohc_cairns', 'ohc_cairns_homestay_double', 'homestay', 'double', '平日2食・週末3食', 355, 33725, 4, 15, '車', '日曜日', '土曜日', 18, 420, 50, '2人同時旅行の方のみ対象。1部屋あたりの料金。')
ON CONFLICT DO NOTHING;

INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, price_per_week_aud, price_per_week_jpy, min_stay_weeks, distance_minutes, distance_type, checkin_day, checkout_day, min_age, max_age, arrangement_fee_aud, highseason_extra_aud, notes)
VALUES
('ohc_cairns', 'ohc_cairns_homestay_junior', 'homestay', 'single', '3食付', 420, 39900, 4, 15, '車', '日曜日', '土曜日', 16, 17, 420, 50, '18歳未満専用。3食付。後見手配費280AUD・週次後見費65AUD/週が別途必要。')
ON CONFLICT DO NOTHING;

-- ラベル
INSERT INTO school_labels (school_id, label)
SELECT 'ohc_cairns', unnest(ARRAY[
  'standard', 'beginner_plus', 'japanese_heavy', 'central', 'bank_support',
  'medical_support', 'accommodation_support', 'apartment_support',
  'university_consultation', 'morning_only', 'high_rated', 'medium_school',
  'tropical', 'reef_access', 'young_atmosphere', 'certificate_included'
])
ON CONFLICT DO NOTHING;

-- ==================== HLI Perth ====================

-- コース
INSERT INTO school_courses (school_id, course_id, name, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, accommodation_included, meals_included, start_dates, purpose, target_age, recommended, notes)
VALUES
('hli_perth', 'hli_perth_std15', 'Standard 15', 15, 60, 'flexible', '午前8:00〜14:00 または 午後14:00〜20:00（選択制）', 'A0', 'C2', 1, 1, 1, 99, 1815, 172425, true, true, '毎週月曜日', ARRAY['general'], 'adult', true, '宿泊・3食込み料金'),
('hli_perth', 'hli_perth_std20', 'Standard 20', 20, 60, 'flexible', '午前8:00〜14:00 または 午後14:00〜20:00（選択制）', 'A0', 'C2', 1, 1, 1, 99, 2033, 193135, true, true, '毎週月曜日', ARRAY['general'], 'adult', false, '宿泊・3食込み料金'),
('hli_perth', 'hli_perth_std15_act', 'Standard 10 + 5hrs Activities', 15, 60, 'flexible', '午前8:00〜14:00 または 午後14:00〜20:00（選択制）', 'A1', 'C2', 1, 1, 1, 99, 1910, 181450, true, true, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, '宿泊・3食込み料金。週5時間のアクティビティ付き'),
('hli_perth', 'hli_perth_biz15', 'Business Language 15', 15, 60, 'flexible', '午前8:00〜14:00 または 午後14:00〜20:00（選択制）', 'A0', 'C2', 1, 1, 1, 99, 2014, 191330, true, true, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, '宿泊・3食込み料金。ビジネス英語特化'),
('hli_perth', 'hli_perth_exam15', 'Exam Preparation 15', 15, 60, 'flexible', '午前8:00〜14:00 または 午後14:00〜20:00（選択制）', 'A0', 'C2', 1, 1, 1, 99, 1995, 189525, true, true, '毎週月曜日', ARRAY['exam_prep', 'ielts'], 'adult', false, '宿泊・3食込み料金。試験対策特化')
ON CONFLICT DO NOTHING;

INSERT INTO school_courses (school_id, course_id, name, lessons_per_week, lesson_minutes, time_slot, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, accommodation_included, meals_included, start_dates, purpose, target_age, minimum_age, recommended, notes)
VALUES
('hli_perth', 'hli_perth_senior15', 'Senior Special（Standard 10 + 5hrs Activities）', 15, 60, 'flexible', 'A1', 'C2', 1, 1, 1, 99, 1815, 172425, true, true, '毎週月曜日', ARRAY['general', 'experience'], 'senior', 60, false, '宿泊・3食込み料金。60歳以上専用')
ON CONFLICT DO NOTHING;

INSERT INTO school_courses (school_id, course_id, name, lessons_per_week, lesson_minutes, time_slot, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, accommodation_included, meals_included, start_dates, purpose, target_age, minimum_age, maximum_age, recommended, notes)
VALUES
('hli_perth', 'hli_perth_kids15', 'Kids & Teens（Standard 10 + 5hrs Activities）', 15, 60, 'flexible', 'A1', 'C2', 1, 1, 1, 99, 1910, 181450, true, true, '毎週月曜日', ARRAY['general', 'experience'], 'kids_teens', 5, 17, false, '宿泊・3食込み料金。5〜17歳対象')
ON CONFLICT DO NOTHING;

-- 宿泊施設
INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, included_in_course, price_per_week_aud, notes)
VALUES
('hli_perth', 'hli_perth_teacher_home', 'teacher_home', 'single', '3食付（朝・昼・夕）', true, 0, 'コース料金に含まれる。教師の自宅のプライベートベッドルーム。自習スペース・Wi-Fi完備。')
ON CONFLICT DO NOTHING;

-- ラベル
INSERT INTO school_labels (school_id, label)
SELECT 'hli_perth', unnest(ARRAY[
  'one_on_one', 'premium', 'all_levels', 'immersive', 'accommodation_included',
  'meals_included', '24hr_support', 'flexible_schedule', 'non_traditional',
  'business_available', 'exam_prep_available', 'senior_available',
  'kids_teens_available', 'complete_beginner_ok'
])
ON CONFLICT DO NOTHING;

-- ==================== LSI Brisbane ====================

-- コース（3つのみ、途中で切れているため）
INSERT INTO school_courses (school_id, course_id, name, name_short, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, start_dates, purpose, recommended, notes)
VALUES
('lsi_brisbane', 'lsi_brisbane_general20', 'General 20', 'General 20', 20, 50, 'morning', '8:30〜12:20', 'A1', 'C2', 18, 15, 1, 99, 437, 41515, '毎週月曜日（初心者は年4回：1/5・3/30・6/22・9/21）', ARRAY['general'], true, '最人気コース。友達作りや基礎固めに最適'),
('lsi_brisbane', 'lsi_brisbane_intensive24', 'Intensive 24', 'Intensive 24', 24, 50, 'morning', '8:30〜13:00', 'A1', 'C2', 18, 15, 1, 99, 509, 48355, '毎週月曜日（初心者は年4回）', ARRAY['general'], false, 'General 20より本格的に英語を伸ばしたい方向け')
ON CONFLICT DO NOTHING;

-- ラベル
INSERT INTO school_labels (school_id, label)
SELECT 'lsi_brisbane', unnest(ARRAY[
  'standard', 'beginner_friendly', 'multicultural', 'central',
  'job_support', 'accommodation_support', 'university_consultation',
  'activities_included', 'high_rated', 'global_network', 'long_history'
])
ON CONFLICT DO NOTHING;

-- ==================== OHC Gold Coast ====================

-- コース
INSERT INTO school_courses (school_id, course_id, name, name_short, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, start_dates, purpose, recommended, notes)
VALUES
('ohc_gold_coast', 'ohc_gc_ge_plus', 'General English Plus', 'GE Plus', 20, 60, 'morning', '9:00〜13:30', 'A2', 'C2', 16, 12, 1, 99, 404, 38380, '毎週月曜日', ARRAY['general'], true, '人気コース。サーファーズパラダイスでの英語学習に最適'),
('ohc_gold_coast', 'ohc_gc_ge_core', 'General English Core', 'GE Core', 15, 60, 'morning', '9:00〜12:30', 'A2', 'C2', 16, 12, 1, 99, 319, 30305, '毎週月曜日', ARRAY['general', 'work_and_study'], false, '午前中だけで終わるので午後はビーチやアクティビティに時間を使える')
ON CONFLICT DO NOTHING;

-- 宿泊施設
INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, price_per_week_aud, price_per_week_jpy, min_stay_weeks, distance_minutes, distance_type, checkin_day, checkout_day, min_age, arrangement_fee_aud, highseason_extra_aud, notes)
VALUES
('ohc_gold_coast', 'ohc_gc_homestay_single', 'homestay', 'single', '平日2食・週末3食', 450, 42750, 4, 25, '公共交通機関', '日曜日', '土曜日', 18, 420, 50, 'タオル・シーツ・洗濯設備含む。'),
('ohc_gold_coast', 'ohc_gc_homestay_double', 'homestay', 'double', '平日2食・週末3食', 425, 40375, 4, 25, '公共交通機関', '日曜日', '土曜日', 18, 420, 50, '2人同時旅行の方のみ対象。')
ON CONFLICT DO NOTHING;

INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, price_per_week_aud, price_per_week_jpy, min_stay_weeks, distance_minutes, distance_type, checkin_day, checkout_day, min_age, max_age, arrangement_fee_aud, highseason_extra_aud, notes)
VALUES
('ohc_gold_coast', 'ohc_gc_homestay_junior', 'homestay', 'single', '3食付', 570, 54150, 4, 25, '公共交通機関', '日曜日', '土曜日', 16, 17, 420, 50, '18歳未満専用。3食付。後見手配費280AUD・週次後見費65AUD/週が別途必要。')
ON CONFLICT DO NOTHING;

-- ラベル
INSERT INTO school_labels (school_id, label)
SELECT 'ohc_gold_coast', unnest(ARRAY[
  'standard', 'beginner_plus', 'japanese_friendly', 'beach_central',
  'job_support', 'accommodation_support', 'apartment_support',
  'university_consultation', 'morning_only', 'good_value', 'medium_school',
  'beach_access', 'surfing', 'resort', 'young_atmosphere', 'disability_access'
])
ON CONFLICT DO NOTHING;

-- ==================== ILSC Sydney ====================

-- コース（10コース）
INSERT INTO school_courses (school_id, course_id, name, name_short, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, start_dates, purpose, recommended, notes)
VALUES
('ilsc_sydney', 'ilsc_sydney_ftam', 'Full-Time Morning FT AM', 'FT AM', 24, 50, 'morning', '8:30〜13:00', 'A1', 'C2', 18, 13, 1, 99, 437, 41515, '毎週月曜日（初心者は月1回）', ARRAY['general'], true, '最人気コース。シドニーでの語学学習に最適な午前スケジュール'),
('ilsc_sydney', 'ilsc_sydney_ptam', 'Part-Time Morning PT AM', 'PT AM', 14.5, 50, 'morning', '8:30〜13:00（週2〜3日）', 'A1', 'C2', 18, 13, 1, 99, 380, 36100, '毎週月曜日（初心者は月1回）', ARRAY['general', 'work_and_study'], false, '午後に時間が空くので観光や仕事との両立が可能'),
('ilsc_sydney', 'ilsc_sydney_ftaft', 'Full-Time Afternoon FT AFT', 'FT AFT', 24, 50, 'afternoon', '13:15〜17:15', 'A1', 'C2', 18, 13, 1, 99, 361, 34295, '毎週月曜日（初心者は月1回）', ARRAY['general', 'work_and_study'], false, '午前中に仕事ができる。FT AMより週76AUD安い'),
('ilsc_sydney', 'ilsc_sydney_ftpm', 'Full-Time Evening FT PM', 'FT PM', 24, 50, 'evening', '17:30〜21:30', 'A1', 'C2', 18, 13, 1, 99, 361, 34295, '毎週月曜日（初心者は月1回）', ARRAY['general', 'work_and_study'], false, '日中フルタイムで働きながら通える夜間コース。ホームステイ申込不可')
ON CONFLICT DO NOTHING;

INSERT INTO school_courses (school_id, course_id, name, name_short, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, start_dates, purpose, minimum_age, recommended, notes)
VALUES
('ilsc_sydney', 'ilsc_sydney_ptpm', 'Part-Time Evening PT PM', 'PT PM', 14.5, 50, 'evening', '17:30〜21:30', 'A1', 'C2', 18, 13, 1, 99, 352, 33440, '毎週月曜日', ARRAY['general', 'work_and_study'], 18, false, '最安コース（週352AUD）。18歳以上限定。日中フルタイムで働きながら通える')
ON CONFLICT DO NOTHING;

INSERT INTO school_courses (school_id, course_id, name, name_short, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, start_dates, purpose, recommended, notes)
VALUES
('ilsc_sydney', 'ilsc_sydney_ielts_am', 'IELTS Mastery Program FT AM', 'IELTS AM', 24, 50, 'morning', '8:30〜13:00', 'B1', 'C2', 18, 13, 4, 99, 437, 41515, '月1回', ARRAY['ielts', 'exam_prep'], false, '中級下以上（B1〜）対象。最短4週間から'),
('ilsc_sydney', 'ilsc_sydney_pathway_am', 'University Pathway Program FT AM', 'Pathway AM', 24, 50, 'morning', '8:30〜13:00', 'A1', 'C2', 18, 13, 4, 99, 437, 41515, '月1回', ARRAY['university_prep', 'academic'], false, '大学・専門学校への進学を目指す方向け。入学サポートあり'),
('ilsc_sydney', 'ilsc_sydney_eap_am', 'English for Academic Purposes FT AM', 'EAP AM', 24, 50, 'morning', '8:30〜13:00', 'B2', 'C2', 18, 13, 1, 99, 437, 41515, '月1回', ARRAY['academic', 'university_prep'], false, '中級上以上（B2〜）対象。アカデミック英語特化')
ON CONFLICT DO NOTHING;

INSERT INTO school_courses (school_id, course_id, name, name_short, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, start_dates, purpose, exam_fee_aud, recommended, notes)
VALUES
('ilsc_sydney', 'ilsc_sydney_cambridge_b2_am', 'Cambridge B2 First Open Classes FT AM', 'Cambridge B2 AM', 24, 50, 'morning', '8:30〜13:00', 'B2', 'C2', 18, 13, 1, 99, 437, 41515, '月1回', ARRAY['cambridge', 'exam_prep'], 400, false, '中級上以上（B2〜）対象。受験料400AUD別途'),
('ilsc_sydney', 'ilsc_sydney_cambridge_c1_am', 'Cambridge C1 Advanced Open Classes FT AM', 'Cambridge C1 AM', 24, 50, 'morning', '8:30〜13:00', 'C1', 'C2', 18, 13, 1, 99, 437, 41515, '月1回', ARRAY['cambridge', 'exam_prep', 'career'], 400, false, '上級者（C1〜）対象。キャリア・進学に有利な最上位資格')
ON CONFLICT DO NOTHING;

-- 宿泊施設
INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, checkin_day, checkout_day, rating, notes)
VALUES
('ilsc_sydney', 'ilsc_sydney_homestay', 'homestay', 'single', '要確認', '日曜日', '土曜日', 5.0, '夜間コース（FT PM・PT PM）受講生は申込不可。評価5.0。詳細料金は公式サイトで要確認。'),
('ilsc_sydney', 'ilsc_sydney_shared_flat', 'shared_flat', 'single', 'なし', NULL, NULL, 5.0, 'シェアフラット対応あり。評価5.0。詳細料金は公式サイトで要確認。')
ON CONFLICT DO NOTHING;

-- ラベル
INSERT INTO school_labels (school_id, label)
SELECT 'ilsc_sydney', unnest(ARRAY[
  'standard', 'all_levels', 'beginner_friendly', 'multicultural', 'prime_central',
  'job_support', 'accommodation_support', 'university_consultation',
  'morning_available', 'afternoon_available', 'evening_available',
  'work_and_study', 'high_rated', 'large_school', 'ielts_available',
  'cambridge_available', 'university_pathway', 'academic_available',
  'myilsc_app', 'no_smoking', 'career_oriented', 'shared_flat_available'
])
ON CONFLICT DO NOTHING;

-- ==================== OHC Melbourne ====================

-- コース
INSERT INTO school_courses (school_id, course_id, name, name_short, lessons_per_week, lesson_minutes, time_slot, schedule, level_min, level_max, class_size_max, class_size_avg, duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy, start_dates, purpose, recommended, notes)
VALUES
('ohc_melbourne', 'ohc_mel_ge_plus', 'General English Plus', 'GE Plus', 20, 60, 'morning', '9:00〜13:30', 'A2', 'C2', 16, 12, 1, 99, 404, 38380, '毎週月曜日', ARRAY['general'], true, '人気コース。メルボルンの文化・アートを楽しみながら英語を学べる'),
('ohc_melbourne', 'ohc_mel_ge_core', 'General English Core', 'GE Core', 15, 60, 'morning', '9:00〜12:30', 'A2', 'C2', 16, 12, 1, 99, 319, 30305, '毎週月曜日', ARRAY['general', 'work_and_study'], false, '午前中で終わるので午後はメルボルンの街を満喫できる')
ON CONFLICT DO NOTHING;

-- 宿泊施設
INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, price_per_week_aud, price_per_week_jpy, min_stay_weeks, distance_minutes, distance_type, checkin_day, checkout_day, min_age, max_age, arrangement_fee_aud, highseason_extra_aud, notes)
VALUES
('ohc_melbourne', 'ohc_mel_homestay_single', 'homestay', 'single', '平日2食・週末3食', 450, 42750, 4, 30, '公共交通機関', '日曜日', '土曜日', 18, 65, 420, 50, 'シーツ・週1回清掃・洗濯設備含む。学校から30分圏内。'),
('ohc_melbourne', 'ohc_mel_homestay_double', 'homestay', 'double', '平日2食・週末3食', 420, 39900, 4, 30, '公共交通機関', '日曜日', '土曜日', 18, 65, 420, 50, 'シングルより週30AUD安い。シーツ・週1回清掃・洗濯設備含む。')
ON CONFLICT DO NOTHING;

INSERT INTO school_accommodation (school_id, accommodation_id, type, room_type, meal_plan, price_per_week_aud, price_per_week_jpy, min_stay_weeks, distance_minutes, distance_type, checkin_day, checkout_day, min_age, max_age, arrangement_fee_aud, highseason_extra_aud, notes)
VALUES
('ohc_melbourne', 'ohc_mel_homestay_junior', 'homestay', 'single', '3食付', 495, 47025, 4, 30, '公共交通機関', '日曜日', '土曜日', 12, 17, 420, 50, '12〜17歳専用。3食付。生活サポート登録料280AUD・週次サポート料65AUD/週が別途必要。')
ON CONFLICT DO NOTHING;

-- ラベル
INSERT INTO school_labels (school_id, label)
SELECT 'ohc_melbourne', unnest(ARRAY[
  'standard', 'beginner_plus', 'truly_multicultural', 'central',
  'accommodation_support', 'apartment_support', 'university_consultation',
  'activities_included', 'morning_only', 'good_location', 'small_medium_school',
  'cafeteria', 'junior_available', 'certificate_included',
  'no_single_nationality_dominance', 'cultural_city'
])
ON CONFLICT DO NOTHING;

-- 確認
SELECT
  s.school_id,
  s.name,
  (SELECT COUNT(*) FROM school_courses WHERE school_id = s.school_id) AS courses,
  (SELECT COUNT(*) FROM school_accommodation WHERE school_id = s.school_id) AS accommodations,
  (SELECT COUNT(*) FROM school_labels WHERE school_id = s.school_id) AS labels
FROM schools s
WHERE s.school_id IN (
  'ohc_brisbane', 'ohc_cairns', 'hli_perth', 'lsi_brisbane',
  'ohc_gold_coast', 'ilsc_sydney', 'ohc_melbourne'
)
ORDER BY s.school_id;
