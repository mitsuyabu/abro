-- ── 予約記録 ─────────────────────────────────────────────────────────────
CREATE TABLE public.bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id     UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  provider    TEXT NOT NULL,
  type        TEXT NOT NULL
              CHECK (type IN ('flight','accommodation','school','insurance','activity','transfer','other')),
  title       TEXT NOT NULL,
  amount_jpy  INT CHECK (amount_jpy >= 0),
  currency    TEXT NOT NULL DEFAULT 'JPY',
  booked_at   DATE,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'confirmed'
              CHECK (status IN ('pending','confirmed','cancelled')),
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_user    ON public.bookings(user_id, created_at DESC);
CREATE INDEX idx_bookings_plan    ON public.bookings(plan_id);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select" ON public.bookings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bookings_insert" ON public.bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookings_update" ON public.bookings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "bookings_delete" ON public.bookings FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── アフィリエイトクリック追跡 ───────────────────────────────────────────
CREATE TABLE public.affiliate_clicks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  plan_id     UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  provider    TEXT NOT NULL,
  clicked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_clicks_user     ON public.affiliate_clicks(user_id);
CREATE INDEX idx_affiliate_clicks_provider ON public.affiliate_clicks(provider, clicked_at DESC);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate_clicks_insert" ON public.affiliate_clicks
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "affiliate_clicks_select" ON public.affiliate_clicks
  FOR SELECT USING (user_id = auth.uid());
