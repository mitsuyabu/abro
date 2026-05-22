-- 都市別生活費テーブル
CREATE TABLE IF NOT EXISTS public.city_cost_of_living (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city                    TEXT NOT NULL,
  city_en                 TEXT NOT NULL,
  country                 TEXT NOT NULL DEFAULT 'オーストラリア',

  -- 外食（AUD）
  meal_cheap_aud          NUMERIC,   -- 安いレストラン1食
  meal_midrange_2p_aud    NUMERIC,   -- 中級レストラン2人3コース
  meal_fastfood_aud       NUMERIC,   -- ファーストフード
  coffee_aud              NUMERIC,   -- カプチーノ
  beer_local_aud          NUMERIC,   -- 地ビール0.5L

  -- スーパー食料品（AUD）
  milk_1l_aud             NUMERIC,
  bread_500g_aud          NUMERIC,
  rice_1kg_aud            NUMERIC,
  eggs_12_aud             NUMERIC,
  chicken_1kg_aud         NUMERIC,
  beef_1kg_aud            NUMERIC,
  tomato_1kg_aud          NUMERIC,
  apple_1kg_aud           NUMERIC,

  -- 家賃・月額（AUD）
  rent_1br_city_aud       NUMERIC,   -- 1BR市街地
  rent_1br_suburbs_aud    NUMERIC,   -- 1BR郊外
  rent_3br_city_aud       NUMERIC,   -- 3BR市街地
  rent_3br_suburbs_aud    NUMERIC,   -- 3BR郊外

  -- 交通（AUD）
  transport_one_way_aud   NUMERIC,   -- 片道
  transport_monthly_aud   NUMERIC,   -- 月間パス
  gas_per_liter_aud       NUMERIC,   -- ガソリン1L
  taxi_start_aud          NUMERIC,   -- タクシー初乗り

  -- 光熱費・通信・月額（AUD）
  utilities_85sqm_aud     NUMERIC,   -- 電気・ガス・水道（85㎡）
  mobile_plan_aud         NUMERIC,   -- スマホプラン
  internet_aud            NUMERIC,   -- ブロードバンド

  -- 娯楽・スポーツ（AUD）
  gym_monthly_aud         NUMERIC,
  movie_ticket_aud        NUMERIC,
  tennis_1hr_aud          NUMERIC,

  -- 衣類（AUD）
  jeans_aud               NUMERIC,
  running_shoes_aud       NUMERIC,
  business_shoes_aud      NUMERIC,

  -- 給与（AUD/月）
  avg_monthly_salary_aud  NUMERIC,   -- 税引後平均月収

  -- メタ
  source                  TEXT NOT NULL DEFAULT 'Numbeo',
  fetched_at              DATE NOT NULL,
  notes                   TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS city_cost_of_living_city_fetched
  ON public.city_cost_of_living (city, fetched_at);

-- RLS（参照は全ユーザー可、更新は管理者のみ）
ALTER TABLE public.city_cost_of_living ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'city_cost_of_living' AND policyname = 'Anyone can read cost of living'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Anyone can read cost of living"
      ON public.city_cost_of_living FOR SELECT
      USING (true);
    $p$;
  END IF;
END $$;

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS city_cost_of_living_updated_at ON public.city_cost_of_living;
CREATE TRIGGER city_cost_of_living_updated_at
  BEFORE UPDATE ON public.city_cost_of_living
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- シードデータ（Numbeo 2026-05取得、1AUD≈95円）
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSERT INTO public.city_cost_of_living (
  city, city_en,
  meal_cheap_aud, meal_midrange_2p_aud, meal_fastfood_aud, coffee_aud, beer_local_aud,
  milk_1l_aud, bread_500g_aud, rice_1kg_aud, eggs_12_aud, chicken_1kg_aud, beef_1kg_aud, tomato_1kg_aud, apple_1kg_aud,
  rent_1br_city_aud, rent_1br_suburbs_aud, rent_3br_city_aud, rent_3br_suburbs_aud,
  transport_one_way_aud, transport_monthly_aud, gas_per_liter_aud, taxi_start_aud,
  utilities_85sqm_aud, mobile_plan_aud, internet_aud,
  gym_monthly_aud, movie_ticket_aud, tennis_1hr_aud,
  jeans_aud, running_shoes_aud, business_shoes_aud,
  avg_monthly_salary_aud,
  fetched_at, notes
) VALUES
(
  'シドニー', 'Sydney',
  26.00, 120.91, 15.50, 5.52, 10.00,
  2.66, NULL, NULL, 8.05, 13.74, 21.67, 7.34, 5.14,
  3466.00, 2386.56, 6814.74, 4120.95,
  5.60, 217.39, 1.94, 5.00,
  302.65, 33.11, 77.23,
  100.26, 25.00, 34.48,
  111.09, 155.38, 185.00,
  6016.80,
  '2026-05-01', '東京比約43.8%高い生活費水準'
),
(
  'メルボルン', 'Melbourne',
  25.00, 120.00, 16.50, 5.61, NULL,
  2.52, 4.36, 3.57, 8.46, 13.62, 21.63, 6.98, 5.70,
  2449.24, 1848.56, 4788.38, 3385.46,
  5.50, 198.00, 1.94, 5.10,
  326.67, 41.20, 77.16,
  73.98, 22.00, 28.33,
  NULL, NULL, NULL,
  6214.13,
  '2026-05-01', '単身月間生活費（家賃除く）目安A$1,729'
),
(
  'ブリスベン', 'Brisbane',
  25.00, 110.00, 17.00, 6.10, 12.00,
  2.37, 3.69, NULL, 7.11, 12.41, 19.83, 8.06, NULL,
  2724.30, 1986.75, 4771.25, NULL,
  NULL, NULL, 1.96, 4.00,
  238.74, 38.55, 85.25,
  80.40, 20.00, NULL,
  NULL, NULL, NULL,
  6099.81,
  '2026-05-01', '交通費データに異常値の疑いあり（片道・月間パスは参考外）'
),
(
  'ゴールドコースト', 'Gold-Coast',
  28.75, 150.00, 15.00, 5.44, 11.00,
  2.27, 4.01, 3.40, 7.02, 13.45, 21.04, NULL, NULL,
  3312.50, 1986.67, 4008.75, 3546.67,
  3.98, 80.00, 1.79, NULL,
  311.81, 48.59, 79.56,
  58.75, 20.00, NULL,
  109.29, 148.29, NULL,
  5922.07,
  '2026-05-01', NULL
),
(
  'ケアンズ', 'Cairns',
  22.00, 120.00, 18.00, 6.25, 10.00,
  2.71, 3.88, 3.59, 7.50, 18.05, 21.67, 8.32, 5.88,
  1991.67, 1752.00, 3253.33, 2800.00,
  5.00, NULL, 1.78, 3.70,
  233.33, 50.00, 77.80,
  58.67, 20.00, 40.00,
  129.67, 176.67, 187.50,
  6315.22,
  '2026-05-01', '月間交通パスデータは参考外（車社会のためデータ少）'
),
(
  'パース', 'Perth',
  28.00, 132.50, 15.12, 5.98, 11.00,
  2.40, 4.18, 2.71, 7.61, 12.53, 21.33, 7.73, 6.44,
  2664.38, 2170.77, 4140.00, 3087.99,
  3.50, 140.00, 1.82, NULL,
  252.06, 43.80, 86.67,
  68.77, 25.00, NULL,
  106.06, 159.95, 173.50,
  6071.91,
  '2026-05-01', NULL
)
ON CONFLICT (city, fetched_at) DO NOTHING;
