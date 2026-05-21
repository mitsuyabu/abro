-- 渡航プロファイルテーブル
CREATE TABLE public.travel_profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- 目的
  purpose    TEXT CHECK (purpose IN ('study', 'workingholiday', 'both')),

  -- 予算（円）
  budget_jpy INTEGER,

  -- 渡航時期・期間
  travel_timing TEXT,
  duration      TEXT,

  -- 英語力
  english_level TEXT CHECK (english_level IN ('beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced')),

  -- 希望地域
  preferred_countries TEXT[] DEFAULT '{}',
  preferred_cities    TEXT[] DEFAULT '{}',

  -- 渡航スタイル
  wants_school             BOOLEAN,
  wants_work               BOOLEAN,
  accommodation_preference TEXT CHECK (accommodation_preference IN ('homestay', 'share_house', 'dormitory', 'apartment', 'flexible')),

  -- ニーズ・性格
  support_level        INTEGER CHECK (support_level BETWEEN 1 AND 5),
  concerns             TEXT,
  personality_lifestyle TEXT,
  career_connection    TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.travel_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "travel_profiles_select" ON public.travel_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "travel_profiles_insert" ON public.travel_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "travel_profiles_update" ON public.travel_profiles FOR UPDATE USING (auth.uid() = user_id);

-- updated_at トリガー
CREATE TRIGGER travel_profiles_updated_at
  BEFORE UPDATE ON public.travel_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
