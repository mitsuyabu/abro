-- ── 掲示板 ──────────────────────────────────────────────────────────────
CREATE TABLE public.listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category        TEXT NOT NULL
                  CHECK (category IN ('job', 'roommate', 'item', 'travel_companion', 'other')),
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description     TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 1000),
  city            TEXT,
  country         TEXT,
  price_amount    INT CHECK (price_amount >= 0),
  price_currency  TEXT NOT NULL DEFAULT 'JPY',
  price_frequency TEXT CHECK (price_frequency IN ('hour', 'day', 'week', 'month', 'once')),
  images          TEXT[] NOT NULL DEFAULT '{}',
  expires_at      TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_category ON public.listings(category, status, created_at DESC);
CREATE INDEX idx_listings_user     ON public.listings(user_id);
CREATE INDEX idx_listings_country  ON public.listings(country, city);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_select" ON public.listings FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "listings_insert" ON public.listings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "listings_update" ON public.listings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "listings_delete" ON public.listings FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 問い合わせ ───────────────────────────────────────────────────────────
CREATE TABLE public.listing_inquiries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  inquirer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, inquirer_id)
);

CREATE INDEX idx_listing_inquiries_listing  ON public.listing_inquiries(listing_id);
CREATE INDEX idx_listing_inquiries_inquirer ON public.listing_inquiries(inquirer_id);

ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_inquiries_select" ON public.listing_inquiries
  FOR SELECT USING (
    inquirer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
  );
CREATE POLICY "listing_inquiries_insert" ON public.listing_inquiries
  FOR INSERT WITH CHECK (inquirer_id = auth.uid());
CREATE POLICY "listing_inquiries_update" ON public.listing_inquiries
  FOR UPDATE USING (
    inquirer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
  );
