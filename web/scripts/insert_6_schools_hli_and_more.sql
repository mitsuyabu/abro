-- ============================================================
-- 6校の語学学校データ一括投入（HLI系4校 + English Path + Lexis）
-- ============================================================

-- 1. HLI Sydney
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area,
  accredited, accreditation_bodies, minimum_age, minimum_age_junior,
  japanese_ratio, nationality_diversity, support_24hr_helpline, support_local_organizer,
  support_accommodation, accommodation_included, meals_included, wifi,
  highseason_surcharge_pct, highseason_start, highseason_end,
  cultural_excursions, cultural_excursions_note, refund_policy_note,
  rating, review_count, source_url, school_summary,
  price_min_aud, price_max_aud, updated_at
) VALUES (
  'hli_sydney', 'Study & Live in your Teacher''s Home Sydney (HLI)', '教師の家に住んで学ぶ留学 シドニー（HLI）',
  'シドニー', 'オーストラリア', '語学学校', 'one_on_one', 'シドニー市内・郊外（教師の自宅）',
  true, ARRAY['ASIC'], 18, 5,
  NULL, 'マンツーマンのため国籍混在なし', true, true,
  true, true, true, true,
  5, '2026-06-07', '2026-08-30',
  true, 'シドニー観光名所を英語で訪問する文化体験コースあり（週3回・同伴あり）', '家族メンバー欠席時・追加参加時の返金なし',
  5.0, 1, 'https://www.languagecourse.net/discount-ryugaku/gakko-study--live-in-your-teachers-home-sydney.php3',
  'HLIが運営するシドニーのマンツーマン完全没入型留学プログラム。教師の自宅に宿泊・3食込みで英語に完全浸透。シドニー固有の「Cultural Excursions」コースでは週3回、ホストファミリーと一緒にシドニーの観光名所・博物館等を英語で体験できる。5つの大学を持つシドニーはビーチやウォータースポーツも楽しめる都市。HLI3都市の中で唯一の評価5.0（1件）。',
  1815, 2622, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name, updated_at = NOW();

-- 2. HLI Cairns
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area,
  accredited, accreditation_bodies, minimum_age, minimum_age_junior,
  japanese_ratio, nationality_diversity, support_24hr_helpline, support_local_organizer,
  support_accommodation, accommodation_included, meals_included, wifi,
  highseason_surcharge_pct, highseason_start, highseason_end,
  nature_excursions, nature_excursions_note, climate_note,
  rating, review_count, source_url, school_summary,
  price_min_aud, price_max_aud, updated_at
) VALUES (
  'hli_cairns', 'Study & Live in your Teacher''s Home Cairns (HLI)', '教師の家に住んで学ぶ留学 ケアンズ（HLI）',
  'ケアンズ', 'オーストラリア', '語学学校', 'one_on_one', 'ケアンズ市内・郊外（教師の自宅）',
  true, ARRAY['ASIC'], 18, 5,
  NULL, 'マンツーマンのため国籍混在なし', true, true,
  true, true, true, true,
  5, '2026-06-07', '2026-08-30',
  true, 'グレートバリアリーフ・クランダ熱帯雨林・レインフォレステーション体験コースあり（1週間限定）',
  '熱帯性気候。暑い夏と穏やかな冬。世界遺産の熱帯雨林とグレートバリアリーフに最も近いHLI拠点',
  NULL, 0, 'https://www.languagecourse.net/discount-ryugaku/gakko-study--live-in-your-teachers-home-cairns.php3',
  'HLIが運営するケアンズのマンツーマン完全没入型留学プログラム。熱帯性気候のケアンズで教師の自宅に宿泊しながら英語漬けの生活を送れる。グレートバリアリーフ（グリーン島）・クランダ熱帯雨林・レインフォレステーションへの体験コースはケアンズ校だけの特別オプション（1週間限定）。世界遺産の自然環境を学びながら英語を体験したい人に最適。口コミはまだなし。',
  1815, 2470, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name, updated_at = NOW();

-- 3. HLI Gold Coast
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area,
  accredited, accreditation_bodies, minimum_age, minimum_age_junior,
  japanese_ratio, nationality_diversity, support_24hr_helpline, support_local_organizer,
  support_accommodation, accommodation_included, meals_included, wifi,
  highseason_surcharge_pct, highseason_start, highseason_end,
  rating, review_count, source_url, school_summary,
  price_min_aud, price_max_aud, updated_at
) VALUES (
  'hli_gold_coast', 'Study & Live in your Teacher''s Home Gold Coast (HLI)', '教師の家に住んで学ぶ留学 ゴールドコースト（HLI）',
  'ゴールドコースト', 'オーストラリア', '語学学校', 'one_on_one', 'ゴールドコースト市内・郊外（教師の自宅）',
  true, ARRAY['ASIC'], 18, 5,
  NULL, 'マンツーマンのため国籍混在なし', true, true,
  true, true, true, true,
  5, '2026-06-07', '2026-08-30',
  5.0, 1, 'https://www.languagecourse.net/discount-ryugaku/gakko-study--live-in-your-teachers-home-gold-coast.php3',
  'HLIが運営するゴールドコーストのマンツーマン完全没入型留学プログラム。年間300日晴天・サーファーズパラダイスに近いリゾート環境で英語に完全浸透。教師の自宅に宿泊・3食込みで完全英語漬けの生活。受講者から『期待していたことはすべて叶いました』と満点評価。サーフィン・テーマパーク等アクティビティが豊富なゴールドコーストを楽しみながら英語を学びたい人に最適。',
  1815, 2470, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name, updated_at = NOW();

-- 4. HLI Melbourne
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area,
  accredited, accreditation_bodies, minimum_age, minimum_age_junior,
  japanese_ratio, nationality_diversity, support_24hr_helpline, support_local_organizer,
  support_accommodation, accommodation_included, meals_included, wifi,
  highseason_surcharge_pct, highseason_start, highseason_end,
  rating, review_count, source_url, school_summary,
  price_min_aud, price_max_aud, updated_at
) VALUES (
  'hli_melbourne', 'Study & Live in your Teacher''s Home Melbourne (HLI)', '教師の家に住んで学ぶ留学 メルボルン（HLI）',
  'メルボルン', 'オーストラリア', '語学学校', 'one_on_one', 'メルボルン市内・郊外（教師の自宅）',
  true, ARRAY['ASIC'], 18, 5,
  NULL, 'マンツーマンのため国籍混在なし', true, true,
  true, true, true, true,
  5, '2026-06-07', '2026-08-30',
  5.0, 1, 'https://www.languagecourse.net/discount-ryugaku/gakko-study--live-in-your-teachers-home-melbourne.php3',
  'HLIが運営するメルボルンのマンツーマン完全没入型留学プログラム。オーストラリア最も文化的・芸術的な都市で教師の自宅に宿泊・3食込み。美術館・カフェ文化・グルメ・スポーツなど多彩な体験が英語漬けの生活と融合する。24時間ヘルプラインと現地オーガナイザーが滞在をサポート。評価5.0（1件）。',
  1815, 2470, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name, updated_at = NOW();

-- 5. English Path Brisbane
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area, established, history_note,
  accredited, accreditation_bodies, sister_facility, global_brand,
  total_students, classroom_count, workstation_count, average_age_summer, average_age_regular,
  minimum_age, minimum_age_student_visa, japanese_ratio, nationality_diversity,
  gender_male_pct, gender_female_pct, lesson_minutes,
  support_japanese, support_job, support_accommodation, support_airport, support_university,
  university_guidance_paid, airport_fee_aud, wifi, kitchen, computer_room, library, lounge,
  language_software, tourism_info, creative_studio, electronic_whiteboard, no_smoking_indoor,
  free_parking_nearby, certificate_included, activities_included,
  ep_masterclass, ep_masterclass_note, ep_alumni_scholarship, language_workshops,
  cancellation_days, visa_refusal_protection, visa_refusal_cap_eur,
  enrollment_fee_aud, material_fee_note, private_lesson_fee_aud, insurance_fee_per_week,
  junior_must_homestay, junior_must_airport, special_diet_fee_aud, low_review_count_flag,
  rating, review_count, source_url, school_summary, price_min_aud, price_max_aud, updated_at
) VALUES (
  'english_path_brisbane', 'English Path Brisbane', 'イングリッシュパス ブリスベン',
  'ブリスベン', 'オーストラリア', '語学学校', 'group', '市内中心部（クイーンストリートモール・中央駅徒歩5分）',
  2024, '2024年設立・ブリスベン最新の語学学校',
  true, ARRAY['ALTO', 'English UK', 'British Council'],
  'APAC（オーストラリアン・パフォーミング・アーツ・コンサバトリー）', 'English Path（UK・ドバイ等展開）',
  30, 4, 6, 20, 22,
  16, 18, NULL, 'データなし（新設校）',
  50, 50, 45,
  false, false, true, true, true,
  true, 180, true, true, true, true, true,
  true, true, true, true, true,
  true, true, true,
  true, '全受講生向け無料週次ワークショップ・レクチャー（EPマスタークラス）', true, true,
  14, true, 180,
  250, '1〜4週：75AUD / 5〜11週：150AUD / 12〜23週：250AUD / 24週以上：325AUD', 135, 30,
  true, true, 60, true,
  NULL, 0, 'https://www.languagecourse.net/discount-ryugaku/gakko-english-path-brisbane.php3',
  '2024年設立・ブリスベン最新の語学学校。クイーンストリートモール内・中央駅徒歩5分の最高立地。舞台芸術大学APACとキャンパスを共有するクリエイティブな環境。全受講生向けEPマスタークラス（無料週次ワークショップ）・EP卒業生オンライン奨学金付き。45分レッスン制・宿泊オプションが7種類と最多。EP House Share（週300AUD）はブリスベン最安水準の宿泊先。キャンセル14日前まで無料。新設校のため口コミなし。',
  361, 642, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name, updated_at = NOW();

-- 6. Lexis English Noosa
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area, established,
  accredited, accreditation_bodies, cambridge_exam_center, cambridge_exams, group_campuses,
  total_students_regular, total_students_summer, classroom_count, workstation_count,
  average_age_summer, average_age_regular, minimum_age, minimum_age_junior,
  japanese_ratio, nationality_diversity, gender_male_pct, gender_female_pct,
  beach_distance_minutes, beach_distance_type,
  support_japanese, support_job, support_accommodation, support_airport,
  airport_fee_aud_bne, airport_fee_aud_oolgoolga,
  wifi, kitchen, computer_room, library, lounge, movie_room, table_tennis, video_games,
  movie_rental, newspaper, language_software, free_coffee, free_water, no_smoking_all,
  free_parking, disability_access, certificate_included, activities_included, activities_note,
  activities_capacity_warning, junior_available, group_combination,
  enrollment_fee_aud, material_fee_note, private_lesson_fee_aud, special_diet_fee_aud,
  unaccompanied_minor_fee, rating, review_count, rating_teaching, rating_value, rating_location,
  rating_facilities, rating_social, rating_organization, rating_homestay, rating_shared_flat,
  review_warning, source_url, school_summary, price_min_aud, price_max_aud, updated_at
) VALUES (
  'lexis_noosa', 'Lexis English Noosa', 'レクシスイングリッシュ ヌーサ',
  'ヌーサ', 'オーストラリア', '語学学校', 'group', 'ヌーサヘッズ中心部（ヌーサヘッドビーチ徒歩20分）', 1989,
  true, ARRAY['ALTO', 'English Australia', 'ELICOS', 'CRICOS', 'ASQA'],
  true, ARRAY['FCE', 'CAE', 'CPE'],
  ARRAY['Brisbane', 'Sunshine Coast', 'Byron Bay', 'Perth', 'Sydney', 'Seoul', 'Kobe'],
  210, 295, 18, 10,
  24, 24, 18, 13,
  0.16, 'スイス29%・日本16%・スペイン10%・ブラジル9%（スイス人が圧倒的多数）', 50, 50,
  20, '徒歩',
  false, true, true, true,
  325, 400,
  true, true, true, true, true, true, true, true,
  true, true, true, true, true, true,
  true, true, true, true, '毎日午後の無料アクティビティ（フルタイム成人生のみ）。ただし人数制限あり（口コミ注意）',
  true, true, true,
  265, '1〜8週：195AUD / 9〜17週：285AUD / 18〜24週：335AUD / 25週以上：385AUD', 170, 60,
  100, 3.5, 2, 4.5, 3.5, 5.0,
  3.5, 3.0, 4.0, 4.0, 4.0,
  'アクティビティ参加に人数制限あり。参加できない場合もある（口コミ要確認）',
  'https://www.languagecourse.net/discount-ryugaku/gakko-lexis-english-noosa.php3',
  '1989年設立。ヌーサヘッズ中心のビーチリゾート型語学学校。場所評価5.0・教育の質4.5と高評価。スイス人29%・日本人16%の独特な国籍構成。毎日午後の無料アクティビティ・サーフィンコース・ケンブリッジ試験公認センター（FCE・CAE・CPE）完備。バリスタコースあり。⚠️総合評価3.5とやや低め・アクティビティ人数制限への不満あり。ブリスベンから車約2時間のリゾート環境。',
  305, 2574, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name, updated_at = NOW();

-- 確認
SELECT school_id, name, city, rating, review_count, price_min_aud, school_type
FROM schools
WHERE school_id IN (
  'hli_sydney', 'hli_cairns', 'hli_gold_coast', 'hli_melbourne',
  'english_path_brisbane', 'lexis_noosa'
)
ORDER BY school_id;
