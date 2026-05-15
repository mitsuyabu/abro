-- ── クリエイタープロフィール ───────────────────────────────────────────────
CREATE TABLE public.creator_profiles (
  user_id           UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name      TEXT NOT NULL,
  bio               TEXT,
  payout_method     JSONB,
  total_earned_jpy  INT NOT NULL DEFAULT 0,
  pending_payout_jpy INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_profiles_select" ON public.creator_profiles FOR SELECT USING (true);
CREATE POLICY "creator_profiles_insert" ON public.creator_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "creator_profiles_update" ON public.creator_profiles FOR UPDATE USING (user_id = auth.uid());

CREATE TRIGGER trg_creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── クリエイター報酬履歴 ──────────────────────────────────────────────────
CREATE TABLE public.creator_earnings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_type  TEXT NOT NULL
               CHECK (source_type IN ('affiliate','agent_kickback','plan_sale')),
  source_id    UUID,
  amount_jpy   INT NOT NULL DEFAULT 0 CHECK (amount_jpy >= 0),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','paid','cancelled')),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at      TIMESTAMPTZ
);

CREATE INDEX idx_creator_earnings_creator ON public.creator_earnings(creator_id, created_at DESC);

ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_earnings_select" ON public.creator_earnings FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "creator_earnings_insert" ON public.creator_earnings FOR INSERT WITH CHECK (true);
