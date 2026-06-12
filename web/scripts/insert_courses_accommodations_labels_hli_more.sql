-- ============================================================
-- HLI Sydney/Cairns/Gold Coast/Melbourne + English Path Brisbane + Lexis Noosa
-- コース・宿泊施設・ラベル一括投入
-- ============================================================

-- ============================================================
-- school_courses
-- ============================================================

INSERT INTO school_courses (
  school_id, course_id, name, name_short, lessons_per_week, lesson_minutes,
  time_slot, schedule, level_min, level_max, class_size_max, class_size_avg,
  duration_min_weeks, duration_max_weeks, price_per_week_aud, price_per_week_jpy,
  start_dates, purpose, target_age, accommodation_included, meals_included,
  exam_fee_aud, airport_transfer_included, recommended, notes
) VALUES

-- HLI Sydney（13コース）
('hli_sydney', 'hli_sydney_ge_morning', 'General English Morning (25時間/週)', 'GE Morning', 25, 60, 'morning', '8:00〜14:00', 'A1', 'C2', 15, 10, 1, 48, 520, 52000, '毎週月曜日', ARRAY['general'], 'adult', false, false, NULL, false, true, 'マンツーマン2時間含む、シドニー中心部の少人数制学校'),
('hli_sydney', 'hli_sydney_ge_afternoon', 'General English Afternoon (15時間/週)', 'GE Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'A1', 'C2', 15, 10, 1, 48, 360, 36000, '毎週月曜日', ARRAY['general', 'work_and_study'], 'adult', false, false, NULL, false, false, 'リーズナブルな午後クラス、観光と両立可能'),
('hli_sydney', 'hli_sydney_ielts_morning', 'IELTS Morning (25時間/週)', 'IELTS Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 4, 12, 520, 52000, '毎週月曜日', ARRAY['career', 'university'], 'adult', false, false, 385, false, true, 'IELTSスコアアップ特化、マンツーマン2時間含む'),
('hli_sydney', 'hli_sydney_ielts_afternoon', 'IELTS Afternoon (15時間/週)', 'IELTS Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 4, 12, 360, 36000, '毎週月曜日', ARRAY['career', 'university'], 'adult', false, false, 385, false, false, 'IELTS対策午後クラス'),
('hli_sydney', 'hli_sydney_cambridge_morning', 'Cambridge FCE/CAE Morning (25時間/週)', 'Cambridge Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 10, 12, 520, 52000, '特定日', ARRAY['career', 'university'], 'adult', false, false, 360, false, true, 'ケンブリッジ試験対策、マンツーマン2時間含む'),
('hli_sydney', 'hli_sydney_cambridge_afternoon', 'Cambridge FCE/CAE Afternoon (15時間/週)', 'Cambridge Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 10, 12, 360, 36000, '特定日', ARRAY['career', 'university'], 'adult', false, false, 360, false, false, 'ケンブリッジ試験対策午後クラス'),
('hli_sydney', 'hli_sydney_business_morning', 'Business English Morning (25時間/週)', 'Business Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 4, 12, 520, 52000, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, 'ビジネス英語、マンツーマン2時間含む'),
('hli_sydney', 'hli_sydney_business_afternoon', 'Business English Afternoon (15時間/週)', 'Business Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 4, 12, 360, 36000, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, 'ビジネス英語午後クラス'),
('hli_sydney', 'hli_sydney_one_to_one', 'One-to-One Lessons', 'マンツーマン', 10, 60, 'flexible', 'フレキシブル', 'A0', 'C2', 1, 1, 1, 48, 125, 12500, 'フレキシブル', ARRAY['general'], 'adult', false, false, NULL, false, false, '完全マンツーマン、1時間あたり125豪ドル'),
('hli_sydney', 'hli_sydney_cultural_icons', 'Cultural Excursions - Sydney Icons (10時間/週)', 'Cultural Icons', 10, 60, 'flexible', 'フレキシブル', 'A2', 'C2', 12, 8, 1, 4, 360, 36000, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, false, NULL, false, true, 'オペラハウス、ハーバーブリッジ、ボンダイビーチなど観光しながら学ぶ'),
('hli_sydney', 'hli_sydney_cultural_aboriginal', 'Cultural Excursions - Aboriginal Culture (10時間/週)', 'Aboriginal Culture', 10, 60, 'flexible', 'フレキシブル', 'A2', 'C2', 12, 8, 1, 4, 360, 36000, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, false, NULL, false, false, '先住民文化体験、ロックアート、ブッシュタッカー'),
('hli_sydney', 'hli_sydney_cultural_food', 'Cultural Excursions - Food & Wine (10時間/週)', 'Food & Wine', 10, 60, 'flexible', 'フレキシブル', 'A2', 'C2', 12, 8, 1, 4, 360, 36000, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, false, NULL, false, false, 'シドニーグルメツアー、ワイナリー訪問、フィッシュマーケット'),
('hli_sydney', 'hli_sydney_cultural_art', 'Cultural Excursions - Art & Theatre (10時間/週)', 'Art & Theatre', 10, 60, 'flexible', 'フレキシブル', 'A2', 'C2', 12, 8, 1, 4, 360, 36000, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, false, NULL, false, false, 'アートギャラリー、劇場、ストリートアート探訪'),

-- HLI Cairns（12コース）
('hli_cairns', 'hli_cairns_ge_morning', 'General English Morning (25時間/週)', 'GE Morning', 25, 60, 'morning', '8:00〜14:00', 'A1', 'C2', 15, 10, 1, 48, 470, 47000, '毎週月曜日', ARRAY['general'], 'adult', false, false, NULL, false, true, 'マンツーマン2時間含む、ケアンズビーチ沿い'),
('hli_cairns', 'hli_cairns_ge_afternoon', 'General English Afternoon (15時間/週)', 'GE Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'A1', 'C2', 15, 10, 1, 48, 330, 33000, '毎週月曜日', ARRAY['general', 'work_and_study'], 'adult', false, false, NULL, false, false, '午後クラス、海とリゾート生活を満喫'),
('hli_cairns', 'hli_cairns_ielts_morning', 'IELTS Morning (25時間/週)', 'IELTS Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 4, 12, 470, 47000, '毎週月曜日', ARRAY['career', 'university'], 'adult', false, false, 385, false, true, 'IELTS対策、マンツーマン2時間含む'),
('hli_cairns', 'hli_cairns_ielts_afternoon', 'IELTS Afternoon (15時間/週)', 'IELTS Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 4, 12, 330, 33000, '毎週月曜日', ARRAY['career', 'university'], 'adult', false, false, 385, false, false, 'IELTS対策午後クラス'),
('hli_cairns', 'hli_cairns_cambridge_morning', 'Cambridge FCE/CAE Morning (25時間/週)', 'Cambridge Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 10, 12, 470, 47000, '特定日', ARRAY['career', 'university'], 'adult', false, false, 360, false, true, 'ケンブリッジ試験対策、マンツーマン2時間含む'),
('hli_cairns', 'hli_cairns_cambridge_afternoon', 'Cambridge FCE/CAE Afternoon (15時間/週)', 'Cambridge Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 10, 12, 330, 33000, '特定日', ARRAY['career', 'university'], 'adult', false, false, 360, false, false, 'ケンブリッジ試験対策午後クラス'),
('hli_cairns', 'hli_cairns_business_morning', 'Business English Morning (25時間/週)', 'Business Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 4, 12, 470, 47000, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, 'ビジネス英語、マンツーマン2時間含む'),
('hli_cairns', 'hli_cairns_business_afternoon', 'Business English Afternoon (15時間/週)', 'Business Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 4, 12, 330, 33000, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, 'ビジネス英語午後クラス'),
('hli_cairns', 'hli_cairns_one_to_one', 'One-to-One Lessons', 'マンツーマン', 10, 60, 'flexible', 'フレキシブル', 'A0', 'C2', 1, 1, 1, 48, 125, 12500, 'フレキシブル', ARRAY['general'], 'adult', false, false, NULL, false, false, '完全マンツーマン、1時間あたり125豪ドル'),
('hli_cairns', 'hli_cairns_nature_reef', 'Nature Excursions - Great Barrier Reef (10時間/週)', 'Great Barrier Reef', 10, 60, 'flexible', 'フレキシブル', 'A2', 'C2', 12, 8, 1, 4, 410, 41000, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, false, NULL, false, true, 'グレートバリアリーフ、シュノーケリング、海洋生物学習'),
('hli_cairns', 'hli_cairns_nature_rainforest', 'Nature Excursions - Rainforest (10時間/週)', 'Rainforest', 10, 60, 'flexible', 'フレキシブル', 'A2', 'C2', 12, 8, 1, 4, 410, 41000, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, false, NULL, false, false, '熱帯雨林トレッキング、野生動物観察、先住民文化'),
('hli_cairns', 'hli_cairns_nature_adventure', 'Nature Excursions - Adventure (10時間/週)', 'Adventure', 10, 60, 'flexible', 'フレキシブル', 'A2', 'C2', 12, 8, 1, 4, 410, 41000, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, false, NULL, false, false, 'バンジージャンプ、ラフティング、スカイダイビング、英語でアドベンチャー'),

-- HLI Gold Coast（10コース）
('hli_gold_coast', 'hli_gc_ge_morning', 'General English Morning (25時間/週)', 'GE Morning', 25, 60, 'morning', '8:00〜14:00', 'A1', 'C2', 15, 10, 1, 48, 470, 47000, '毎週月曜日', ARRAY['general'], 'adult', false, false, NULL, false, true, 'マンツーマン2時間含む、サーファーズパラダイス近く'),
('hli_gold_coast', 'hli_gc_ge_afternoon', 'General English Afternoon (15時間/週)', 'GE Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'A1', 'C2', 15, 10, 1, 48, 330, 33000, '毎週月曜日', ARRAY['general', 'work_and_study'], 'adult', false, false, NULL, false, false, '午後クラス、サーフィンと両立可能'),
('hli_gold_coast', 'hli_gc_ielts_morning', 'IELTS Morning (25時間/週)', 'IELTS Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 4, 12, 470, 47000, '毎週月曜日', ARRAY['career', 'university'], 'adult', false, false, 385, false, true, 'IELTS対策、マンツーマン2時間含む'),
('hli_gold_coast', 'hli_gc_ielts_afternoon', 'IELTS Afternoon (15時間/週)', 'IELTS Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 4, 12, 330, 33000, '毎週月曜日', ARRAY['career', 'university'], 'adult', false, false, 385, false, false, 'IELTS対策午後クラス'),
('hli_gold_coast', 'hli_gc_cambridge_morning', 'Cambridge FCE/CAE Morning (25時間/週)', 'Cambridge Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 10, 12, 470, 47000, '特定日', ARRAY['career', 'university'], 'adult', false, false, 360, false, true, 'ケンブリッジ試験対策、マンツーマン2時間含む'),
('hli_gold_coast', 'hli_gc_cambridge_afternoon', 'Cambridge FCE/CAE Afternoon (15時間/週)', 'Cambridge Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 10, 12, 330, 33000, '特定日', ARRAY['career', 'university'], 'adult', false, false, 360, false, false, 'ケンブリッジ試験対策午後クラス'),
('hli_gold_coast', 'hli_gc_business_morning', 'Business English Morning (25時間/週)', 'Business Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 4, 12, 470, 47000, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, 'ビジネス英語、マンツーマン2時間含む'),
('hli_gold_coast', 'hli_gc_business_afternoon', 'Business English Afternoon (15時間/週)', 'Business Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 4, 12, 330, 33000, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, 'ビジネス英語午後クラス'),
('hli_gold_coast', 'hli_gc_one_to_one', 'One-to-One Lessons', 'マンツーマン', 10, 60, 'flexible', 'フレキシブル', 'A0', 'C2', 1, 1, 1, 48, 125, 12500, 'フレキシブル', ARRAY['general'], 'adult', false, false, NULL, false, false, '完全マンツーマン、1時間あたり125豪ドル'),
('hli_gold_coast', 'hli_gc_surfing', 'Surfing & English Combo (15時間英語 + 6時間サーフィン)', 'Surfing & English', 15, 60, 'morning', '8:00〜14:00', 'A2', 'C2', 15, 10, 2, 8, 560, 56000, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, false, NULL, false, true, 'プロサーファー指導、ゴールドコースト名物コース'),

-- HLI Melbourne（10コース）
('hli_melbourne', 'hli_melb_ge_morning', 'General English Morning (25時間/週)', 'GE Morning', 25, 60, 'morning', '8:00〜14:00', 'A1', 'C2', 15, 10, 1, 48, 500, 50000, '毎週月曜日', ARRAY['general'], 'adult', false, false, NULL, false, true, 'マンツーマン2時間含む、メルボルン中心部'),
('hli_melbourne', 'hli_melb_ge_afternoon', 'General English Afternoon (15時間/週)', 'GE Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'A1', 'C2', 15, 10, 1, 48, 350, 35000, '毎週月曜日', ARRAY['general', 'work_and_study'], 'adult', false, false, NULL, false, false, '午後クラス、カフェ文化とアートを満喫'),
('hli_melbourne', 'hli_melb_ielts_morning', 'IELTS Morning (25時間/週)', 'IELTS Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 4, 12, 500, 50000, '毎週月曜日', ARRAY['career', 'university'], 'adult', false, false, 385, false, true, 'IELTS対策、マンツーマン2時間含む'),
('hli_melbourne', 'hli_melb_ielts_afternoon', 'IELTS Afternoon (15時間/週)', 'IELTS Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 4, 12, 350, 35000, '毎週月曜日', ARRAY['career', 'university'], 'adult', false, false, 385, false, false, 'IELTS対策午後クラス'),
('hli_melbourne', 'hli_melb_cambridge_morning', 'Cambridge FCE/CAE Morning (25時間/週)', 'Cambridge Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 10, 12, 500, 50000, '特定日', ARRAY['career', 'university'], 'adult', false, false, 360, false, true, 'ケンブリッジ試験対策、マンツーマン2時間含む'),
('hli_melbourne', 'hli_melb_cambridge_afternoon', 'Cambridge FCE/CAE Afternoon (15時間/週)', 'Cambridge Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 10, 12, 350, 35000, '特定日', ARRAY['career', 'university'], 'adult', false, false, 360, false, false, 'ケンブリッジ試験対策午後クラス'),
('hli_melbourne', 'hli_melb_business_morning', 'Business English Morning (25時間/週)', 'Business Morning', 25, 60, 'morning', '8:00〜14:00', 'B1', 'C2', 15, 10, 4, 12, 500, 50000, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, 'ビジネス英語、マンツーマン2時間含む'),
('hli_melbourne', 'hli_melb_business_afternoon', 'Business English Afternoon (15時間/週)', 'Business Afternoon', 15, 60, 'afternoon', '14:00〜17:00', 'B1', 'C2', 15, 10, 4, 12, 350, 35000, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, 'ビジネス英語午後クラス'),
('hli_melbourne', 'hli_melb_one_to_one', 'One-to-One Lessons', 'マンツーマン', 10, 60, 'flexible', 'フレキシブル', 'A0', 'C2', 1, 1, 1, 48, 125, 12500, 'フレキシブル', ARRAY['general'], 'adult', false, false, NULL, false, false, '完全マンツーマン、1時間あたり125豪ドル'),
('hli_melbourne', 'hli_melb_coffee', 'Coffee Culture & English (15時間英語 + カフェ体験)', 'Coffee Culture', 15, 60, 'morning', '8:00〜14:00', 'A2', 'C2', 15, 10, 2, 4, 480, 48000, '毎週月曜日', ARRAY['general', 'experience'], 'adult', false, false, NULL, false, true, 'メルボルンのカフェ文化、バリスタ体験、コーヒー英語'),

-- English Path Brisbane（5コース）
('english_path_brisbane', 'ep_brisbane_ge', 'General English (20時間/週)', 'General English', 20, 45, 'morning', '8:30〜12:15', 'A1', 'C2', 16, 12, 1, 52, 420, 42000, '毎週月曜日', ARRAY['general'], 'all_ages', false, false, NULL, false, true, 'EPマスタークラス付き、45分授業、2024年新設校'),
('english_path_brisbane', 'ep_brisbane_ielts', 'IELTS Preparation (20時間/週)', 'IELTS Prep', 20, 45, 'morning', '8:30〜12:15', 'B1', 'C2', 16, 12, 4, 12, 420, 42000, '毎週月曜日', ARRAY['career', 'university'], 'all_ages', false, false, 335, false, true, 'IELTS対策、EPマスタークラス付き'),
('english_path_brisbane', 'ep_brisbane_cambridge', 'Cambridge FCE/CAE (20時間/週)', 'Cambridge', 20, 45, 'morning', '8:30〜12:15', 'B1', 'C2', 16, 12, 10, 12, 420, 42000, '特定日', ARRAY['career', 'university'], 'all_ages', false, false, 335, false, true, 'ケンブリッジ試験対策、EPマスタークラス付き'),
('english_path_brisbane', 'ep_brisbane_internship', 'English Plus Internship (20時間英語 + インターン)', 'Internship', 20, 45, 'morning', '8:30〜12:15 + インターン', 'B1', 'C2', 16, 12, 12, 24, 420, 42000, '毎月第一月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, '英語学習後、ブリスベン企業でインターン（最大12週間）'),
('english_path_brisbane', 'ep_brisbane_junior', 'Junior Summer Programme (20時間/週)', 'Junior Summer', 20, 45, 'morning', '8:30〜12:15 + アクティビティ', 'A1', 'B2', 16, 12, 2, 8, 620, 62000, '夏季のみ', ARRAY['general'], 'junior', true, true, NULL, true, false, '夏季限定、宿泊・食事・空港送迎・アクティビティ込み、ホームステイ必須'),

-- Lexis Noosa（9コース）
('lexis_noosa', 'lexis_noosa_ge', 'General English (25時間/週)', 'General English', 25, 60, 'morning', '8:30〜14:30', 'A1', 'C2', 15, 12, 1, 52, 470, 47000, '毎週月曜日', ARRAY['general'], 'all_ages', false, false, NULL, false, true, 'ケンブリッジ試験センター、ビーチ徒歩1分'),
('lexis_noosa', 'lexis_noosa_ielts', 'IELTS Preparation (25時間/週)', 'IELTS Prep', 25, 60, 'morning', '8:30〜14:30', 'B1', 'C2', 15, 12, 4, 12, 470, 47000, '毎週月曜日', ARRAY['career', 'university'], 'all_ages', false, false, 395, false, true, 'IELTS対策、ケンブリッジ試験センター認定校'),
('lexis_noosa', 'lexis_noosa_cambridge', 'Cambridge FCE/CAE/CPE (25時間/週)', 'Cambridge', 25, 60, 'morning', '8:30〜14:30', 'B1', 'C2', 15, 12, 10, 12, 470, 47000, '特定日', ARRAY['career', 'university'], 'all_ages', false, false, 400, false, true, 'ケンブリッジ試験センター、平均合格率85%'),
('lexis_noosa', 'lexis_noosa_cambridge_pet', 'Cambridge PET (15時間/週)', 'Cambridge PET', 15, 60, 'afternoon', '13:00〜16:00', 'A2', 'B1', 15, 12, 10, 12, 330, 33000, '特定日', ARRAY['career', 'university'], 'all_ages', false, false, 300, false, false, 'PET対策、ケンブリッジ試験センター'),
('lexis_noosa', 'lexis_noosa_surfing', 'English + Surfing (15時間英語 + 5時間サーフィン)', 'English + Surfing', 15, 60, 'morning', '8:30〜12:30 + サーフィン', 'A2', 'C2', 15, 12, 1, 12, 570, 57000, '毎週月曜日', ARRAY['general', 'experience'], 'all_ages', false, false, NULL, false, true, 'ヌーサビーチで毎日サーフィンレッスン、初心者OK'),
('lexis_noosa', 'lexis_noosa_barista', 'English + Barista (15時間英語 + バリスタ)', 'English + Barista', 15, 60, 'morning', '8:30〜12:30 + バリスタ', 'B1', 'C2', 15, 12, 4, 8, 620, 62000, '毎月第一月曜日', ARRAY['general', 'career'], 'adult', false, false, NULL, false, false, 'バリスタ資格取得、オーストラリアカフェ文化体験'),
('lexis_noosa', 'lexis_noosa_masterclass', 'Cambridge Masterclass (30時間/週)', 'Cambridge Masterclass', 30, 60, 'full_day', '8:30〜15:30', 'C1', 'C2', 12, 8, 12, 12, 640, 64000, '特定日', ARRAY['career', 'university'], 'all_ages', false, false, 400, false, false, 'ケンブリッジ最上級対策、少人数集中クラス'),
('lexis_noosa', 'lexis_noosa_teen', 'Teen Activity Program (25時間/週)', 'Teen Activity', 25, 60, 'morning', '8:30〜14:30 + アクティビティ', 'A1', 'B2', 15, 12, 2, 8, 670, 67000, '夏季のみ', ARRAY['general'], 'junior', true, true, NULL, true, false, '夏季限定、宿泊・食事・アクティビティ込み、保護者同伴不要'),
('lexis_noosa', 'lexis_noosa_customer_service', 'Customer Service English (20時間/週)', 'Customer Service', 20, 60, 'morning', '8:30〜13:30', 'B1', 'C2', 15, 12, 4, 12, 520, 52000, '毎週月曜日', ARRAY['business', 'career'], 'adult', false, false, NULL, false, false, 'ホスピタリティ業界向け、RSA/RCG資格取得可能');


-- ============================================================
-- school_accommodation
-- ============================================================

INSERT INTO school_accommodation (
  school_id, accommodation_id, type, room_type, meal_plan,
  price_per_week_aud, price_per_week_jpy, min_stay_weeks,
  distance_minutes, distance_type, checkin_day, checkout_day,
  min_age, max_age, arrangement_fee_aud, highseason_extra_aud, notes
) VALUES

-- English Path Brisbane（7宿泊施設）
('english_path_brisbane', 'ep_brisbane_homestay_std_single', 'homestay', 'single', '平日2食・週末3食', 380, 38000, 1, 40, '公共交通機関', '日曜日', '土曜日', 16, NULL, 260, 50, 'ブリスベン郊外ファミリー、共用バスルーム'),
('english_path_brisbane', 'ep_brisbane_homestay_std_twin', 'homestay', 'twin', '平日2食・週末3食', 330, 33000, 1, 40, '公共交通機関', '日曜日', '土曜日', 16, NULL, 260, 50, '2人部屋、共用バスルーム'),
('english_path_brisbane', 'ep_brisbane_homestay_exec_single', 'homestay', 'single', '平日2食・週末3食', 470, 47000, 1, 30, '公共交通機関', '日曜日', '土曜日', 16, NULL, 260, 50, 'エグゼクティブファミリー、専用バスルーム付き'),
('english_path_brisbane', 'ep_brisbane_house_std_single', 'student_house', 'single', '自炊', 330, 33000, 4, 25, '徒歩', '日曜日', '土曜日', 18, 30, 260, NULL, 'City中心部、キッチン共用、共用バスルーム'),
('english_path_brisbane', 'ep_brisbane_house_std_twin', 'student_house', 'twin', '自炊', 270, 27000, 4, 25, '徒歩', '日曜日', '土曜日', 18, 30, 260, NULL, 'City中心部、2人部屋、キッチン共用'),
('english_path_brisbane', 'ep_brisbane_residence_ensuite', 'student_residence', 'single', '自炊', 520, 52000, 4, 15, '徒歩', '日曜日', '土曜日', 18, NULL, 260, NULL, '2024年新築、専用バスルーム、ジム・ラウンジ付き'),
('english_path_brisbane', 'ep_brisbane_homestay_junior', 'homestay', 'single', '3食付', 470, 47000, 2, 30, '公共交通機関', '日曜日', '土曜日', 12, 17, 260, 100, 'ジュニアプログラム専用、24時間サポート、空港送迎込み'),

-- Lexis Noosa（2宿泊施設）
('lexis_noosa', 'lexis_noosa_homestay_single', 'homestay', 'single', '平日2食・週末3食', 360, 36000, 1, 25, '公共交通機関', '日曜日', '土曜日', 16, NULL, 265, 60, 'ヌーサファミリー、共用バスルーム'),
('lexis_noosa', 'lexis_noosa_house_twin', 'student_house', 'twin', '自炊', 280, 28000, 4, 10, '徒歩', '日曜日', '土曜日', 18, 30, 265, NULL, 'ビーチ徒歩5分、キッチン共用、国際色豊か');


-- ============================================================
-- school_labels
-- ============================================================

INSERT INTO school_labels (school_id, label) VALUES

-- HLI Sydney
('hli_sydney', 'マンツーマン'),
('hli_sydney', '少人数制'),
('hli_sydney', 'シティ中心部'),
('hli_sydney', '文化体験コース'),
('hli_sydney', 'アート・劇場'),
('hli_sydney', 'グルメツアー'),
('hli_sydney', '先住民文化'),
('hli_sydney', 'IELTS対策'),
('hli_sydney', 'ケンブリッジ対策'),
('hli_sydney', 'ビジネス英語'),

-- HLI Cairns
('hli_cairns', 'マンツーマン'),
('hli_cairns', '少人数制'),
('hli_cairns', 'ビーチ沿い'),
('hli_cairns', 'グレートバリアリーフ'),
('hli_cairns', '熱帯雨林体験'),
('hli_cairns', 'アドベンチャー'),
('hli_cairns', 'IELTS対策'),
('hli_cairns', 'ケンブリッジ対策'),
('hli_cairns', 'ビジネス英語'),
('hli_cairns', 'リゾート'),

-- HLI Gold Coast
('hli_gold_coast', 'マンツーマン'),
('hli_gold_coast', '少人数制'),
('hli_gold_coast', 'サーファーズパラダイス'),
('hli_gold_coast', 'サーフィンコース'),
('hli_gold_coast', 'IELTS対策'),
('hli_gold_coast', 'ケンブリッジ対策'),
('hli_gold_coast', 'ビジネス英語'),
('hli_gold_coast', 'ビーチ'),
('hli_gold_coast', '評価5.0'),

-- HLI Melbourne
('hli_melbourne', 'マンツーマン'),
('hli_melbourne', '少人数制'),
('hli_melbourne', 'シティ中心部'),
('hli_melbourne', 'カフェ文化'),
('hli_melbourne', 'アート'),
('hli_melbourne', 'IELTS対策'),
('hli_melbourne', 'ケンブリッジ対策'),
('hli_melbourne', 'ビジネス英語'),
('hli_melbourne', '文化的都市'),

-- English Path Brisbane
('english_path_brisbane', 'EPマスタークラス'),
('english_path_brisbane', '2024年新設'),
('english_path_brisbane', '45分授業'),
('english_path_brisbane', 'インターンシップ'),
('english_path_brisbane', 'ジュニアプログラム'),
('english_path_brisbane', 'IELTS対策'),
('english_path_brisbane', 'ケンブリッジ対策'),
('english_path_brisbane', 'グローバルブランド'),
('english_path_brisbane', 'ビザ返金保護'),
('english_path_brisbane', 'クリエイティブスタジオ'),
('english_path_brisbane', '電子ホワイトボード'),

-- Lexis Noosa
('lexis_noosa', 'ケンブリッジ試験センター'),
('lexis_noosa', 'ビーチ徒歩1分'),
('lexis_noosa', 'サーフィンコース'),
('lexis_noosa', 'バリスタコース'),
('lexis_noosa', 'ティーンプログラム'),
('lexis_noosa', 'IELTS対策'),
('lexis_noosa', 'ケンブリッジ対策'),
('lexis_noosa', 'ホスピタリティ'),
('lexis_noosa', 'リゾート'),
('lexis_noosa', '国際色豊か');


-- ============================================================
-- 確認クエリ
-- ============================================================

SELECT
  '✅ コース投入完了' AS status,
  COUNT(*) AS total_courses
FROM school_courses
WHERE school_id IN (
  'hli_sydney', 'hli_cairns', 'hli_gold_coast', 'hli_melbourne',
  'english_path_brisbane', 'lexis_noosa'
)

UNION ALL

SELECT
  '✅ 宿泊施設投入完了',
  COUNT(*)
FROM school_accommodation
WHERE school_id IN ('english_path_brisbane', 'lexis_noosa')

UNION ALL

SELECT
  '✅ ラベル投入完了',
  COUNT(*)
FROM school_labels
WHERE school_id IN (
  'hli_sydney', 'hli_cairns', 'hli_gold_coast', 'hli_melbourne',
  'english_path_brisbane', 'lexis_noosa'
);
