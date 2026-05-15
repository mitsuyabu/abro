-- ── 緊急連絡先 ──────────────────────────────────────────────────────────
CREATE TABLE public.emergency_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  relationship TEXT NOT NULL DEFAULT 'other'
               CHECK (relationship IN ('parent','friend','agent','doctor','other')),
  notify_on_sos BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emergency_contacts_user ON public.emergency_contacts(user_id);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergency_contacts_select" ON public.emergency_contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "emergency_contacts_insert" ON public.emergency_contacts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "emergency_contacts_update" ON public.emergency_contacts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "emergency_contacts_delete" ON public.emergency_contacts FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 緊急サポートログ ──────────────────────────────────────────────────────
CREATE TABLE public.emergency_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category     TEXT NOT NULL
               CHECK (category IN ('medical','theft','trouble','mental','accident','other')),
  severity     TEXT NOT NULL DEFAULT 'medium'
               CHECK (severity IN ('low','medium','high','critical')),
  description  TEXT,
  country      TEXT,
  city         TEXT,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emergency_logs_user ON public.emergency_logs(user_id, created_at DESC);

ALTER TABLE public.emergency_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergency_logs_select" ON public.emergency_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "emergency_logs_insert" ON public.emergency_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "emergency_logs_update" ON public.emergency_logs FOR UPDATE USING (user_id = auth.uid());
