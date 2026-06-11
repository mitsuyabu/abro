-- ============================================================
-- 6校の語学学校データ一括投入
-- ============================================================

-- まず schools テーブルに直接 INSERT（language_schools テーブルは使用しない）

-- 1. OHC English Brisbane
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area,
  accredited, accreditation_bodies, classroom_count, average_age_summer, average_age_regular,
  minimum_age, japanese_ratio, nationality_diversity, gender_male_pct, gender_female_pct,
  support_japanese, support_job, support_accommodation, support_airport, support_apartment, support_university,
  airport_fee_aud, wifi, kitchen, cafeteria, computer_room, library,
  enrollment_fee_aud_whv, enrollment_fee_aud_student, material_fee_note, private_lesson_fee_aud,
  rating, review_count, rating_teaching, rating_value, rating_location, rating_facilities,
  rating_social, rating_organization, rating_homestay, source_url, school_summary,
  price_min_aud, price_max_aud, updated_at
) VALUES (
  'ohc_brisbane', 'OHC English Brisbane', 'OHCイングリッシュ ブリスベン', 'ブリスベン', 'オーストラリア',
  '語学学校', 'group', '市内中心部',
  true, ARRAY['ELICOS', 'TEQSA'], 5, 20, 25,
  16, 0.24, '日本人多め（24%）', 50, 50,
  false, true, true, true, true, true,
  270, true, true, true, true, true,
  100, 250, '1〜10週：130AUD / 11〜20週：220AUD / 21〜30週：260AUD / 31週以上：300AUD', 100,
  5.0, 4, 4.8, 4.8, 5.0, 3.8,
  3.0, 4.8, 5.0, 'https://www.languagecourse.net/discount-ryugaku/gakko-ohc-english-brisbane.php3',
  'ブリスベン市内中心部の小規模校（教室5室）。日本人比率24%と高く日本人に馴染みやすい環境。教育の質とコスパの評価が高く（4.8）、ジョブクラブや大学進学相談など充実したサポートが特徴。完全初心者（A1）は入学不可のため注意が必要。',
  319, 404, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ja = EXCLUDED.name_ja,
  updated_at = NOW();

-- 2. OHC English Cairns
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area, established,
  accredited, accreditation_bodies, classroom_count, average_age_summer, average_age_regular,
  minimum_age, japanese_ratio, nationality_diversity, gender_male_pct, gender_female_pct,
  support_japanese, support_job, support_bank, support_medical, support_accommodation, support_airport,
  support_apartment, support_university, wifi, kitchen, computer_room, library, garden,
  enrollment_fee_aud_whv, enrollment_fee_aud_student, material_fee_note, private_lesson_fee_aud,
  certificate_included, rating, review_count, rating_teaching, rating_value, rating_location,
  rating_facilities, rating_social, rating_organization, rating_homestay,
  source_url, school_summary, price_min_aud, price_max_aud, updated_at
) VALUES (
  'ohc_cairns', 'OHC English Cairns', 'OHCイングリッシュ ケアンズ', 'ケアンズ', 'オーストラリア',
  '語学学校', 'group', '市内中心部', 1963,
  true, ARRAY['ELICOS', 'English Australia', 'TEQSA', 'Study in Australia'], 10, 23, 23,
  16, 0.29, '日本人最多（29%）・アジア系多め', 50, 50,
  false, false, true, true, true, false,
  true, true, true, true, true, true, true,
  100, 250, '1〜10週：130AUD / 11〜20週：220AUD / 21〜30週：260AUD / 31週以上：300AUD', 100,
  true, 4.7, 3, 4.0, 4.5, 4.5,
  3.5, 3.5, 5.0, 4.0,
  'https://www.languagecourse.net/discount-ryugaku/gakko-ohc-english-cairns.php3',
  'ケアンズ市内中心部・ラグーン徒歩圏内に位置する1963年創立の歴史ある学校。日本人比率29%と高く18〜24歳の若い学生が中心（71%）。銀行口座開設・医療サポートなど生活面のサポートが充実。ダイビングやビーチなどリゾートアクティビティが豊富。完全初心者は入学不可の場合あり。',
  319, 404, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ja = EXCLUDED.name_ja,
  updated_at = NOW();

-- 3. Study & Live in your Teacher's Home Perth (HLI)
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area,
  accredited, accreditation_bodies, minimum_age, japanese_ratio, nationality_diversity,
  support_24hr_helpline, support_local_organizer, support_accommodation,
  accommodation_included, meals_included, wifi,
  highseason_surcharge_pct, highseason_start, highseason_end,
  rating, review_count, source_url, school_summary, price_min_aud, price_max_aud, updated_at
) VALUES (
  'hli_perth', 'Study & Live in your Teacher''s Home Perth (HLI)', '教師の家に住んで学ぶ留学 パース（HLI）',
  'パース', 'オーストラリア', '語学学校', 'one_on_one', 'パース市内・郊外（教師の自宅）',
  true, ARRAY['ASIC'], 18, NULL, 'マンツーマンのため国籍混在なし',
  true, true, true,
  true, true, true,
  5, '2026-06-07', '2026-08-30',
  4.3, 3, 'https://www.languagecourse.net/discount-ryugaku/gakko-study--live-in-your-teachers-home-perth.php3',
  'HLIが運営するパースのマンツーマン完全没入型留学プログラム。資格を持った教師の自宅に滞在しながら1対1で授業を受ける特殊な形態。宿泊・3食・授業がすべてコース料金に含まれる。完全初心者から対応可能。シニア向け・子供向けコースも充実。英語環境に完全に身を置きたい人に最適。',
  1815, 2033, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ja = EXCLUDED.name_ja,
  updated_at = NOW();

-- 4. LSI Brisbane
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area, established_note,
  accredited, accreditation_bodies, global_locations, minimum_age,
  nationality_diversity, support_japanese, support_job, support_accommodation,
  support_university, wifi, computer_room, certificate_included, activities_included,
  activities_note, beginner_start_dates,
  rating, review_count, rating_teaching, rating_value, rating_location, rating_facilities,
  rating_social, rating_organization, rating_homestay,
  source_url, school_summary, price_min_aud, price_max_aud, updated_at
) VALUES (
  'lsi_brisbane', 'LSI - Language Studies International Brisbane', 'LSIランゲージスタディーズインターナショナル ブリスベン',
  'ブリスベン', 'オーストラリア', '語学学校', 'group', '市内中心部（川沿い）', '55年以上の歴史',
  true, ARRAY['ELICOS', 'EAQUALS', 'British Council'],
  ARRAY['Australia', 'UK', 'Canada', 'USA', 'France', 'Switzerland', 'New Zealand'], 16,
  '多国籍（口コミで国籍ミックスが高評価）', false, true, true,
  true, true, true, true, true,
  '週1回以上の無料レジャープログラム（グレートバリアリーフ・サンシャインコースト等への旅行も）',
  '年4回（1/5・3/30・6/22・9/21）',
  4.2, 28, 4.3, 3.9, 4.7, 3.6,
  3.4, 4.3, 4.3,
  'https://www.languagecourse.net/discount-ryugaku/gakko-lsi---language-studies-international-brisbane.php3',
  '55年以上の歴史を持つ世界7カ国展開のLSIブリスベン校。川沿いの市内中心部に位置し立地評価4.7と最高水準。多国籍環境で口コミ28件（最多）・教育の質4.3と信頼性が高い。完全初心者向け専用開始日（年4回）あり。仕事と掛け持てる午後コースも特徴的。',
  437, 509, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ja = EXCLUDED.name_ja,
  updated_at = NOW();

-- 5. OHC English Gold Coast
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area, established,
  accredited, accreditation_bodies, classroom_count, average_age_summer, average_age_regular,
  minimum_age, japanese_ratio, nationality_diversity, gender_male_pct, gender_female_pct,
  support_japanese, support_job, support_accommodation, support_airport, support_apartment, support_university,
  airport_fee_aud_gc, airport_fee_aud_bne, wifi, kitchen, computer_room, library, lounge,
  balcony_terrace, disability_access, enrollment_fee_aud_whv, enrollment_fee_aud_student,
  material_fee_note, private_lesson_fee_aud,
  beach_distance_minutes, beach_distance_type, activities_free, activities_paid,
  rating, review_count, rating_teaching, rating_value, rating_location, rating_facilities,
  rating_social, rating_organization, source_url, school_summary,
  price_min_aud, price_max_aud, updated_at
) VALUES (
  'ohc_gold_coast', 'OHC English Gold Coast', 'OHCイングリッシュ ゴールドコースト',
  'ゴールドコースト', 'オーストラリア', '語学学校', 'group', 'サーファーズパラダイス中心部', 1996,
  true, ARRAY['ELICOS', 'TEQSA'], 12, 24, 24,
  16, 0.24, 'ブラジル27%・日本24%・チリ10%・ドイツ8%（ラテン系多め）', 50, 50,
  false, true, true, true, true, true,
  270, 320, true, true, true, true, true,
  true, true, 100, 250,
  '1〜10週：130AUD / 11〜20週：220AUD / 21〜30週：260AUD / 31週以上：300AUD', 100,
  5, '徒歩', '就職活動支援・履歴書ワークショップ・バーベキュー・スポーツ・カードゲーム',
  'サーフィン・ボウリング・テニス・アイススケート',
  4.3, 3, 4.0, 5.0, 5.0, 3.7,
  3.3, 5.0, 'https://www.languagecourse.net/discount-ryugaku/gakko-ohc-english-gold-coast.php3',
  'サーファーズパラダイス中心部・ビーチ徒歩5分のリゾート型語学学校。年間300日の日照時間を誇るゴールドコーストで語学学習とリゾートライフを両立できる。コスパ評価5.0・場所・組織評価も5.0と高評価。ブラジル・日本・ラテン系の明るい雰囲気。楽しく学びたい人に最適。',
  319, 404, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ja = EXCLUDED.name_ja,
  updated_at = NOW();

-- 6. ILSC Language School Sydney
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area, established,
  accredited, accreditation_bodies, total_students, classroom_count,
  average_age_summer, average_age_regular, minimum_age,
  japanese_ratio, nationality_diversity, gender_male_pct, gender_female_pct,
  support_japanese, support_job, support_accommodation, support_university,
  wifi, kitchen, computer_room, library, lounge, vending_machine, table_tennis, no_smoking_all,
  myilsc_app, language_workshops, enrollment_fee_aud, material_fee_note, junior_support_fee_aud,
  beginner_start_dates, rating, review_count, rating_teaching, rating_value, rating_location,
  rating_facilities, rating_social, rating_organization, rating_homestay, rating_shared_flat,
  source_url, school_summary, price_min_aud, price_max_aud, updated_at
) VALUES (
  'ilsc_sydney', 'ILSC Language School Sydney', 'ILSCランゲージスクール シドニー',
  'シドニー', 'オーストラリア', '語学学校', 'group', '市内中心部（タウンホール駅徒歩数秒・QVB前）', 2010,
  true, ARRAY['ELICOS', 'English Australia', 'NEAS', 'ALTO', 'Study in Australia'], 300, 32,
  26, 26, 16,
  0.12, '真の多国籍（ブラジル24%・日本12%・トルコ9%・韓国9%・タイ8%）', 47, 53,
  false, true, true, true,
  true, true, true, true, true, true, true, true,
  true, true, 250, '1〜4週：60AUD / 5週以上：週15AUD（上限450AUD）', 175,
  '月1回（毎月第4月曜日）', 4.5, 8, 4.3, 4.0, 4.7,
  4.1, 4.1, 4.4, 5.0, 5.0,
  'https://www.languagecourse.net/discount-ryugaku/gakko-ilsc-language-school-sydney.php3',
  'シドニーのベスト評価校（4.5）。タウンホール駅徒歩数秒・QVB前という最高立地。300名・32教室の大規模校で10レベル対応。午前・午後・夜間の3時間帯があり仕事と学習の両立が可能。ジョブクラブ・myILSCアプリ・無料言語ワークショップなど充実サポート。ホームステイ・シェアフラットともに評価5.0。大学進学パスウェイあり。',
  352, 437, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ja = EXCLUDED.name_ja,
  updated_at = NOW();

-- 7. OHC English Melbourne
INSERT INTO schools (
  school_id, name, name_ja, city, country, type, school_type, area,
  accredited, accreditation_bodies, total_students, classroom_count, workstation_count,
  average_age_summer, average_age_regular, minimum_age, minimum_age_junior,
  japanese_ratio, nationality_diversity, gender_male_pct, gender_female_pct,
  support_japanese, support_job, support_accommodation, support_airport, support_apartment, support_university,
  airport_fee_aud, wifi, kitchen, cafeteria, computer_room, library, lounge, newspaper, language_software,
  certificate_included, activities_included, activities_note, junior_available,
  enrollment_fee_aud_whv, enrollment_fee_aud_student, material_fee_note, private_lesson_fee_aud,
  rating, review_count, rating_teaching, rating_value, rating_location, rating_facilities,
  rating_social, rating_organization, source_url, school_summary,
  price_min_aud, price_max_aud, updated_at
) VALUES (
  'ohc_melbourne', 'OHC English Melbourne', 'OHCイングリッシュ メルボルン',
  'メルボルン', 'オーストラリア', '語学学校', 'group', 'CBD イーストエンド（パーラメント駅徒歩290m）',
  true, ARRAY['ELICOS', 'English Australia', 'TEQSA'], 100, 12, 35,
  26, 26, 16, 12,
  0.06, '1国籍が15%を超えない（最均等・多国籍）韓国14%・トルコ10%・ブラジル9%', 50, 50,
  false, false, true, true, true, true,
  270, true, true, true, true, true, true, true, true,
  true, true, '週1回以上の無料レジャープログラム（ボウリング・メルボルン動物園・会話クラブ等）', true,
  100, 250, '1〜10週：130AUD / 11〜20週：220AUD / 21〜30週：260AUD / 31週以上：300AUD', 100,
  4.2, 5, 4.0, 3.4, 4.8, 3.6,
  4.0, 3.8, 'https://www.languagecourse.net/discount-ryugaku/gakko-ohc-english-melbourne.php3',
  'メルボルンCBDイーストエンド・パーラメント駅から徒歩290mの好立地（場所評価4.8）。1国籍が15%を超えない真の多国籍環境が最大の特徴。チャイナタウン・カールトンガーデン・メルボルン博物館に徒歩圏内。カフェテリアあり・コンピュータ35台。ジュニアコース（12歳〜）あり。メルボルンはオーストラリアで最も文化的・芸術的な都市として人気。',
  319, 404, NOW()
) ON CONFLICT (school_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ja = EXCLUDED.name_ja,
  updated_at = NOW();

-- 確認
SELECT school_id, name, city, rating, review_count, price_min_aud
FROM schools
WHERE school_id IN (
  'ohc_brisbane', 'ohc_cairns', 'hli_perth', 'lsi_brisbane',
  'ohc_gold_coast', 'ilsc_sydney', 'ohc_melbourne'
)
ORDER BY school_id;
