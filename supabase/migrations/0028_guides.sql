-- ── ガイド ────────────────────────────────────────────────────────────────
CREATE TABLE public.guides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN ('学校', '店舗', '場所', '体験')),
  layout        TEXT NOT NULL DEFAULT 'list' CHECK (layout IN ('fullscreen', 'list')),
  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  location      TEXT NOT NULL DEFAULT '',
  cover_image   TEXT,
  overview      TEXT,
  sections      JSONB NOT NULL DEFAULT '[]',
  items         JSONB NOT NULL DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'public', 'private')),
  view_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guides_user   ON public.guides(user_id, created_at DESC);
CREATE INDEX idx_guides_public ON public.guides(status, category, created_at DESC);

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guides_select_public" ON public.guides
  FOR SELECT USING (status = 'public' OR user_id = auth.uid());

CREATE POLICY "guides_insert" ON public.guides
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "guides_update" ON public.guides
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "guides_delete" ON public.guides
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_guides_updated_at
  BEFORE UPDATE ON public.guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
