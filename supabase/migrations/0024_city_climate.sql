-- 都市別気候データテーブル
CREATE TABLE IF NOT EXISTS public.city_climate (
  city_id          TEXT PRIMARY KEY,   -- 'sydney', 'melbourne' など
  city             TEXT NOT NULL,      -- '東京' など日本語名
  city_en          TEXT NOT NULL,
  country          TEXT NOT NULL DEFAULT 'オーストラリア',

  temp_avg_c       NUMERIC,            -- 年間平均気温（°C）
  temp_summer_c    NUMERIC,            -- 夏の平均最高気温（°C）
  temp_winter_c    NUMERIC,            -- 冬の平均最低気温（°C）
  rainfall_mm      INTEGER,            -- 年間降水量（mm）
  sunshine_hours   INTEGER,            -- 年間日照時間（時間）
  climate_type     TEXT,               -- '温暖湿潤' '熱帯モンスーン' など
  climate_type_en  TEXT,               -- 'humid subtropical' など
  koppen           TEXT,               -- ケッペン気候区分
  summary          TEXT,               -- 気候の特徴（日本語）

  -- 気候スコア（1〜5）
  score_heat       SMALLINT CHECK (score_heat BETWEEN 1 AND 5),        -- 暑さ
  score_cold       SMALLINT CHECK (score_cold BETWEEN 1 AND 5),        -- 寒さ
  score_rain       SMALLINT CHECK (score_rain BETWEEN 1 AND 5),        -- 雨の多さ
  score_sunshine   SMALLINT CHECK (score_sunshine BETWEEN 1 AND 5),   -- 日照の多さ
  score_comfort    SMALLINT CHECK (score_comfort BETWEEN 1 AND 5),     -- 過ごしやすさ

  source           TEXT NOT NULL DEFAULT 'Wikipedia',
  fetched_at       DATE NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS（参照は全ユーザー可）
ALTER TABLE public.city_climate ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'city_climate' AND policyname = 'Anyone can read city climate'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Anyone can read city climate"
      ON public.city_climate FOR SELECT
      USING (true);
    $p$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS city_climate_updated_at ON public.city_climate;
CREATE TRIGGER city_climate_updated_at
  BEFORE UPDATE ON public.city_climate
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- シードデータ（Wikipedia 2026-05取得）
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- スコア設計根拠
-- 暑さ: 夏の平均最高気温（パース40℃超→5、32℃超→4、27℃台→3）
-- 寒さ: 冬の平均最低気温（7℃台→4、8〜9℃→3、11℃台→2、17℃→1）
-- 雨: 年間降水量（2000mm→5、1200mm→4、1000mm→3、700mm→2、500mm→1）
-- 日照: 年間日照時間（3200h→5、2900h→4、2700h→4、2600h→3、2400h→3）
-- 過ごしやすさ: 年間の気温安定性・湿度・極端な気象の少なさを総合評価
INSERT INTO public.city_climate (
  city_id, city, city_en,
  temp_avg_c, temp_summer_c, temp_winter_c,
  rainfall_mm, sunshine_hours,
  climate_type, climate_type_en, koppen,
  score_heat, score_cold, score_rain, score_sunshine, score_comfort,
  summary, fetched_at
) VALUES
(
  'sydney', 'シドニー', 'Sydney',
  18.8, 27.0, 8.9,
  1150, 2639,
  '温暖湿潤気候', 'Humid subtropical', 'Cfa',
  3, 3, 3, 3, 4,
  '温暖で過ごしやすい気候。夏（12〜2月）は27〜30℃で暖かく、冬（6〜8月）は最低気温9℃前後と穏やか。年間降水量は1,150mmと比較的多く、夏から秋にかけて集中する。日照時間は年間2,639時間と豊富。',
  '2026-05-01'
),
(
  'melbourne', 'メルボルン', 'Melbourne',
  16.1, 27.0, 7.5,
  516, 2381,
  '温帯海洋性気候', 'Temperate oceanic', 'Cfb',
  3, 4, 1, 3, 3,
  '「1日に四季あり」と言われるほど天気が変わりやすい。夏（12〜2月）は27℃前後だが急激な気温変動が起きやすい。冬（6〜8月）は最低気温7〜8℃と寒め。年間降水量516mmと比較的少なく、年間を通じてまんべんなく降る。',
  '2026-05-01'
),
(
  'brisbane', 'ブリスベン', 'Brisbane',
  21.6, 30.4, 11.8,
  1048, 2989,
  '温暖湿潤気候', 'Humid subtropical', 'Cfa',
  4, 2, 3, 4, 5,
  '温かく日差しが強い。夏（12〜2月）は30℃超で湿度が高い。冬（6〜8月）は最低気温11〜12℃と過ごしやすく、乾燥している。年間降水量は1,048mmで、夏に集中する。オーストラリア州都の中で2番目に気温が高い。',
  '2026-05-01'
),
(
  'gold-coast', 'ゴールドコースト', 'Gold Coast',
  21.4, 32.0, 11.0,
  1253, NULL,
  '温暖湿潤気候', 'Humid subtropical', 'Cfa',
  4, 2, 4, 4, 5,
  '夏は暑く湿潤（最高気温32〜33℃）、冬は穏やかで降水量が少ない（最低気温11℃前後）。年間降水量は1,253mmで夏に集中。ビーチリゾートとして知られるほど天候に恵まれた都市。年間日照時間のデータは未取得。',
  '2026-05-01'
),
(
  'cairns', 'ケアンズ', 'Cairns',
  25.3, 31.7, 17.2,
  1982, 2766,
  '熱帯モンスーン気候', 'Tropical monsoon', 'Am',
  4, 1, 5, 4, 3,
  '雨季（11〜5月）と乾季（6〜10月）に明確に分かれる熱帯性気候。年中温暖で冬でも最低気温は17℃と暖かい。夏の最高気温は32℃前後。年間降水量は約2,000mmと多く、1月〜3月に集中する。乾季は快晴が続き過ごしやすい。',
  '2026-05-01'
),
(
  'perth', 'パース', 'Perth',
  18.9, 31.4, 8.1,
  731, 3222,
  '地中海性気候', 'Hot-summer Mediterranean', 'Csa',
  5, 3, 2, 5, 4,
  'オーストラリア州都の中で最も日照時間が長い（年間3,222時間、1日平均8.8時間）。夏（12〜2月）は30〜40℃超になることもある乾燥した暑さ。冬（6〜8月）は温和で雨が多く最低気温8℃前後。雨は冬に集中し、夏はほとんど降らない。',
  '2026-05-01'
)
ON CONFLICT (city_id) DO UPDATE SET
  temp_avg_c      = EXCLUDED.temp_avg_c,
  temp_summer_c   = EXCLUDED.temp_summer_c,
  temp_winter_c   = EXCLUDED.temp_winter_c,
  rainfall_mm     = EXCLUDED.rainfall_mm,
  sunshine_hours  = EXCLUDED.sunshine_hours,
  climate_type    = EXCLUDED.climate_type,
  climate_type_en = EXCLUDED.climate_type_en,
  koppen          = EXCLUDED.koppen,
  score_heat      = EXCLUDED.score_heat,
  score_cold      = EXCLUDED.score_cold,
  score_rain      = EXCLUDED.score_rain,
  score_sunshine  = EXCLUDED.score_sunshine,
  score_comfort   = EXCLUDED.score_comfort,
  summary         = EXCLUDED.summary,
  fetched_at      = EXCLUDED.fetched_at,
  updated_at      = now();
