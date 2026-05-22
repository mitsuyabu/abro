-- 都市別治安データテーブル
CREATE TABLE IF NOT EXISTS public.city_safety (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city                    TEXT NOT NULL,
  city_en                 TEXT NOT NULL,
  country                 TEXT NOT NULL DEFAULT 'オーストラリア',

  -- 総合インデックス（0〜100、高いほど良い/悪い）
  safety_index            NUMERIC,   -- 高いほど安全
  crime_index             NUMERIC,   -- 高いほど危険

  -- 犯罪カテゴリ別スコア（高いほど問題あり）
  crime_level             NUMERIC,   -- 全体的な犯罪レベル
  crime_increasing_5yr    NUMERIC,   -- 5年間の犯罪増加感
  worry_home_burglary     NUMERIC,   -- 自宅への侵入・盗難への不安
  worry_mugging           NUMERIC,   -- ひったくり・強盗への不安
  worry_car_theft         NUMERIC,   -- 車盗難への不安
  worry_car_items         NUMERIC,   -- 車内の物の盗難への不安
  worry_assault           NUMERIC,   -- 暴行への不安
  worry_insult            NUMERIC,   -- 侮辱・嫌がらせへの不安
  worry_discrimination    NUMERIC,   -- 差別的暴力への不安
  problem_drugs           NUMERIC,   -- 薬物使用・売買の問題
  problem_property_crime  NUMERIC,   -- 器物損壊・窃盗の問題
  problem_violent_crime   NUMERIC,   -- 暴力犯罪（暴行・強盗）の問題
  problem_corruption      NUMERIC,   -- 汚職・贈収賄の問題

  -- 安全感スコア（高いほど安全）
  safety_daytime          NUMERIC,   -- 昼間の一人歩きの安全感
  safety_nighttime        NUMERIC,   -- 夜間の一人歩きの安全感

  -- メタ
  contributors_count      INTEGER,
  summary_ja              TEXT,      -- 日本語サマリー
  source                  TEXT NOT NULL DEFAULT 'Numbeo',
  fetched_at              DATE NOT NULL,
  notes                   TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS city_safety_city_fetched
  ON public.city_safety (city, fetched_at);

-- RLS（参照は全ユーザー可）
ALTER TABLE public.city_safety ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'city_safety' AND policyname = 'Anyone can read city safety'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Anyone can read city safety"
      ON public.city_safety FOR SELECT
      USING (true);
    $p$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS city_safety_updated_at ON public.city_safety;
CREATE TRIGGER city_safety_updated_at
  BEFORE UPDATE ON public.city_safety
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- シードデータ（Numbeo 2026-04〜05取得）
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSERT INTO public.city_safety (
  city, city_en,
  safety_index, crime_index,
  crime_level, crime_increasing_5yr,
  worry_home_burglary, worry_mugging, worry_car_theft, worry_car_items,
  worry_assault, worry_insult, worry_discrimination,
  problem_drugs, problem_property_crime, problem_violent_crime, problem_corruption,
  safety_daytime, safety_nighttime,
  contributors_count, summary_ja, fetched_at, notes
) VALUES
(
  'シドニー', 'Sydney',
  66.07, 33.93,
  33.89, 52.94,
  29.33, 27.47, 22.87, 30.53,
  31.98, 36.02, 25.75,
  45.75, 42.55, 32.23, 31.65,
  79.53, 54.44,
  1009,
  '6都市中最も治安が良い。昼間の一人歩きは非常に安全（79.5）、夜間もまずまず（54.4）。暴力犯罪・窃盗ともに低水準。薬物問題はやや気になるが全体的に安心して生活できる水準。犯罪増加傾向はやや感じられる（52.9）。',
  '2026-05-01',
  '回答者1,009人（6都市中最多）。データの信頼性が高い。'
),
(
  'メルボルン', 'Melbourne',
  55.72, 44.28,
  46.11, 68.46,
  40.46, 37.81, 34.36, 40.68,
  41.81, 45.39, NULL,
  55.82, 53.99, 43.84, NULL,
  72.21, 42.81,
  1188,
  '中程度の治安。昼間は概ね安全（72.2）だが、夜間は注意が必要（42.8）。近年の犯罪増加傾向が顕著（68.5）。薬物・物品犯罪はやや多め。暴力犯罪は中程度。シドニーに比べると治安はやや劣る。',
  '2026-05-01',
  '回答者1,188人（最多）。データ信頼性高。'
),
(
  'ブリスベン', 'Brisbane',
  61.79, 38.21,
  38.07, 63.54,
  36.88, 30.79, 30.35, 36.13,
  34.40, 38.11, 25.81,
  51.13, 46.95, 36.53, 32.40,
  78.35, 49.29,
  646,
  '比較的安全な都市で、シドニーに次いで治安が良い。昼間の安全感は高い（78.4）が、夜間はやや注意が必要（49.3）。薬物問題はやや多め。近年の犯罪増加感あり（63.5）。全体的に生活しやすい治安水準。',
  '2026-05-01',
  NULL
),
(
  'ゴールドコースト', 'Gold-Coast',
  52.60, 47.40,
  51.36, 67.34,
  44.29, 39.02, 40.00, 44.82,
  43.56, 47.79, 28.72,
  66.32, 56.77, 47.54, 37.76,
  71.13, 41.06,
  209,
  '中程度の治安。昼間は比較的安全（71.1）だが、夜間は要注意（41.1）。6都市中、薬物問題が最も高い（66.3）。観光都市ゆえに犯罪者も集まりやすい面がある。夜間の繁華街では特に注意が必要。近年の犯罪増加傾向も高め（67.3）。',
  '2026-05-01',
  '回答者209人。データ数が少ないため参考値として扱う。'
),
(
  'ケアンズ', 'Cairns',
  37.70, 62.30,
  67.35, 79.62,
  62.65, 55.44, 63.80, 61.37,
  59.26, 64.88, 45.49,
  66.71, 71.06, 56.46, 51.94,
  54.31, 27.34,
  219,
  '6都市中、最も治安が悪い。犯罪指数62.3と高く、昼間でも安全感は低め（54.3）、夜間の一人歩きは非常に危険（27.3）。車盗難・車上荒らし・物品盗難が特に多い。薬物問題も深刻（66.7）。近年の犯罪増加感が非常に強い（79.6）。十分な注意が必要。',
  '2026-05-01',
  '回答者219人。データ数が少ないため参考値として扱う。生活費が安い分、治安リスクとのトレードオフを検討すること。'
),
(
  'パース', 'Perth',
  57.80, 42.20,
  44.40, 64.60,
  40.85, 33.12, 30.55, 43.37,
  40.44, 43.06, NULL,
  56.16, 53.05, 38.88, NULL,
  74.69, 41.70,
  NULL,
  '中程度の治安で、メルボルンと近い水準。昼間は比較的安全（74.7）、夜間はやや注意が必要（41.7）。暴力犯罪は比較的低め（38.9）。薬物・物品犯罪は中程度。近年の犯罪増加感がやや高い（64.6）。',
  '2026-05-01',
  NULL
)
ON CONFLICT (city, fetched_at) DO NOTHING;
