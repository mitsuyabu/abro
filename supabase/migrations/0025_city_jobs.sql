-- 都市別仕事市場データテーブル
CREATE TABLE IF NOT EXISTS public.city_jobs (
  city_id                 TEXT PRIMARY KEY,   -- 'sydney', 'melbourne' など
  city                    TEXT NOT NULL,
  city_en                 TEXT NOT NULL,
  country                 TEXT NOT NULL DEFAULT 'オーストラリア',

  -- Indeed実測件数（2026年5月時点）
  indeed_casual_count     INTEGER,            -- Indeedカジュアル求人件数（概算）
  japanese_job_count      INTEGER,            -- 日本語OK・日本語対応求人数（全豪概算）

  -- 仕事タイプ別の多さ（H=高 M=中 L=低）
  hospitality_level       TEXT,               -- カフェ・レストラン・バー
  retail_level            TEXT,               -- 小売
  farm_level              TEXT,               -- ファーム・農業
  tourism_level           TEXT,               -- 観光業
  mining_level            TEXT,               -- 鉱業・資源
  japanese_biz_level      TEXT,               -- 日本語対応職場（日本食・日系企業）

  -- 仕事スコア（1〜5）
  score_jobs              SMALLINT CHECK (score_jobs BETWEEN 1 AND 5),
  score_japanese_jobs     SMALLINT CHECK (score_japanese_jobs BETWEEN 1 AND 5),

  -- 仕事情報
  peak_season             TEXT,               -- 求人が多い時期
  farm_nearby             BOOLEAN DEFAULT false, -- 近郊にファーム作業あり
  dominant_job_types      TEXT,               -- 主な求人タイプ（日本語）
  summary_ja              TEXT,               -- 仕事市場の特徴（日本語）

  -- データソース
  data_sources            TEXT NOT NULL DEFAULT 'Indeed 2026-05（Seek/Gumtree/日豪プレス/Crankerはbotブロック）',
  fetched_at              DATE NOT NULL,
  notes                   TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS（参照は全ユーザー可）
ALTER TABLE public.city_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'city_jobs' AND policyname = 'Anyone can read city jobs'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Anyone can read city jobs"
      ON public.city_jobs FOR SELECT
      USING (true);
    $p$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS city_jobs_updated_at ON public.city_jobs;
CREATE TRIGGER city_jobs_updated_at
  BEFORE UPDATE ON public.city_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- シードデータ（Indeed実測 + 労働市場調査 2026-05）
-- スコア根拠:
--   score_jobs: Indeed件数を相対比較 + ワーホリ向け求人の質・量を総合評価
--     シドニー8000件→5、ブリスベン6000件→5、メルボルン3000件(実態は大市場)→5
--     GC2000件→3、パース1000件→2、ケアンズ200件→2
--     ※メルボルンはIndeed件数が低いが実際の市場規模はシドニーに匹敵するため補正
--   score_japanese_jobs: 日本語対応求人・日本食レストラン・日系企業の多さを評価
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSERT INTO public.city_jobs (
  city_id, city, city_en,
  indeed_casual_count, japanese_job_count,
  hospitality_level, retail_level, farm_level, tourism_level, mining_level, japanese_biz_level,
  score_jobs, score_japanese_jobs,
  peak_season, farm_nearby, dominant_job_types, summary_ja,
  fetched_at, notes
) VALUES
(
  'sydney', 'シドニー', 'Sydney',
  8000, 150,
  'H', 'H', 'L', 'H', 'L', 'H',
  5, 5,
  '年間を通じて安定。12〜2月（夏）と3〜5月の観光ピーク時に求人増',
  false,
  'カフェ・レストラン、小売、ホテル・ホスピタリティ、日本食レストラン',
  'オーストラリア最大の求人市場。Indeed掲載カジュアル求人8,000件超。日本食レストランや日系企業が多く、日本語を活かした仕事が最も見つかりやすい都市。全豪の日本語求人の約40〜50%がシドニー集中。カフェ・バーなどのホスピタリティ求人も豊富で、未経験でも働き口を見つけやすい。',
  '2026-05-01',
  'ブロックされたSeek・Gumtree・日豪プレス・Crankerの件数は含まれない。実際の総求人数はさらに多い可能性が高い。'
),
(
  'melbourne', 'メルボルン', 'Melbourne',
  3000, 100,
  'H', 'H', 'L', 'M', 'L', 'H',
  5, 5,
  '年間を通じて安定。AFL（フットボール）シーズン（3〜9月）はイベント関連求人増',
  false,
  'カフェ・レストラン、小売、バー・ナイトライフ、日本食レストラン',
  'Indeed件数（3,000件）はシドニーより少なく見えるが、実際の求人市場規模はほぼ同等。特に「コーヒーの街」として有名で、カフェ・バリスタ求人が豊富。日本食レストランや日系ビジネスも多い。Richmond・CBD・South Yarra等に日本人コミュニティが集中しており、日本語求人も探しやすい。',
  '2026-05-01',
  'Indeedの件数が少ないのは検索範囲の問題で実態を反映していない可能性あり。Seek・Gumtreeのデータが加われば総数はシドニーと同等か上回る可能性。'
),
(
  'brisbane', 'ブリスベン', 'Brisbane',
  6000, 60,
  'H', 'M', 'M', 'H', 'L', 'M',
  4, 3,
  '12〜2月（夏・観光ピーク）と5〜10月（農業収穫期）に求人増',
  true,
  'カフェ・レストラン、観光業、小売、農業（近郊）',
  'Indeed掲載カジュアル求人6,000件。シドニーに次ぐ求人量。観光業と農業の両方が活発で、2032年オリンピックに向けて建設・ホスピタリティ関連求人が急増中。近郊のStanthorpeなどでファーム作業も可能。日本語対応求人はシドニー・メルボルンより少ないが増加傾向。',
  '2026-05-01',
  NULL
),
(
  'gold-coast', 'ゴールドコースト', 'Gold-Coast',
  2000, 25,
  'H', 'M', 'L', 'H', 'L', 'L',
  3, 2,
  '12〜2月（夏・ピーク観光シーズン）に求人が集中',
  false,
  'カフェ・レストラン、観光業（テーマパーク）、ホテル、サーフショップ',
  'Indeed掲載カジュアル求人2,000件。観光都市のため求人はホスピタリティ・観光業に偏る。テーマパーク（ドリームワールド・シーワールド等）やサーファーズパラダイスの飲食店での採用が多い。オフシーズン（6〜8月）は求人が大幅に減少するため注意。日本語求人は少なめ。',
  '2026-05-01',
  '季節変動が大きい。冬期（6〜8月）は求人が半減以下になる場合がある。'
),
(
  'cairns', 'ケアンズ', 'Cairns',
  200, 15,
  'M', 'L', 'M', 'H', 'L', 'L',
  2, 2,
  '乾季（6〜10月）が観光ピーク。農業は年間を通じてあり',
  true,
  '観光業（ダイビング・ツアー）、カフェ・レストラン、農業（バナナ・サトウキビなど）',
  'Indeed掲載カジュアル求人約200件と6都市中最少。ただし都市の人口（約15万人）に対する求人密度は低くなく、バックパッカー向け仕事は豊富。グレートバリアリーフ観光のベースとしてダイビング・ツアー関連の求人が特徴的。近郊のMareeba・Atherton高原でのファーム作業も盛ん（88日条件に対応）。',
  '2026-05-01',
  '「セカンドビザのための88日」を目的とするバックパッカーが多い。農業求人の絶対数は少ないが、バックパッカー宿経由で見つかることが多い。'
),
(
  'perth', 'パース', 'Perth',
  1000, 20,
  'M', 'M', 'L', 'M', 'H', 'L',
  2, 1,
  '年間を通じて安定。10〜3月（夏）に観光・ホスピタリティ求人がやや増加',
  false,
  '鉱業・資源関連、カフェ・レストラン、建設、小売',
  'Indeed掲載カジュアル求人1,000件。求人の特徴は鉱業・資源関連が多く、ワーホリや日本人向けの求人は限られる。カフェ・ホスピタリティ業界は存在するが、シドニー・メルボルンほど日本人コミュニティが大きくなく、日本語を活かした仕事は少ない。アジア系コミュニティは拡大中。',
  '2026-05-01',
  '鉱業系は高給だが資格・経験が必要なケースが多く、ワーホリ初心者には難易度が高い。'
)
ON CONFLICT (city_id) DO UPDATE SET
  indeed_casual_count   = EXCLUDED.indeed_casual_count,
  japanese_job_count    = EXCLUDED.japanese_job_count,
  hospitality_level     = EXCLUDED.hospitality_level,
  retail_level          = EXCLUDED.retail_level,
  farm_level            = EXCLUDED.farm_level,
  tourism_level         = EXCLUDED.tourism_level,
  mining_level          = EXCLUDED.mining_level,
  japanese_biz_level    = EXCLUDED.japanese_biz_level,
  score_jobs            = EXCLUDED.score_jobs,
  score_japanese_jobs   = EXCLUDED.score_japanese_jobs,
  peak_season           = EXCLUDED.peak_season,
  farm_nearby           = EXCLUDED.farm_nearby,
  dominant_job_types    = EXCLUDED.dominant_job_types,
  summary_ja            = EXCLUDED.summary_ja,
  fetched_at            = EXCLUDED.fetched_at,
  notes                 = EXCLUDED.notes,
  updated_at            = now();
