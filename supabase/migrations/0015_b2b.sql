-- ── B2B クライアント（学校・エージェント） ────────────────────────────────
CREATE TABLE public.b2b_clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'school'
                  CHECK (type IN ('school','agency','other')),
  country         TEXT,
  city            TEXT,
  website_url     TEXT,
  logo_url        TEXT,
  description     TEXT,
  contact_email   TEXT,
  plan            TEXT NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free','starter','pro','enterprise')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_b2b_clients_owner ON public.b2b_clients(owner_user_id);

ALTER TABLE public.b2b_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "b2b_clients_select" ON public.b2b_clients FOR SELECT USING (true);
CREATE POLICY "b2b_clients_insert" ON public.b2b_clients FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "b2b_clients_update" ON public.b2b_clients FOR UPDATE USING (owner_user_id = auth.uid());
CREATE POLICY "b2b_clients_delete" ON public.b2b_clients FOR DELETE USING (owner_user_id = auth.uid());

CREATE TRIGGER trg_b2b_clients_updated_at
  BEFORE UPDATE ON public.b2b_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── B2B ウィジェット ──────────────────────────────────────────────────────
CREATE TABLE public.b2b_widgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES public.b2b_clients(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'メインウィジェット',
  embed_key       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  primary_color   TEXT NOT NULL DEFAULT '#1A1A1A',
  welcome_message TEXT NOT NULL DEFAULT 'こんにちは！学校についてご質問ください。',
  faq_items       JSONB NOT NULL DEFAULT '[]',
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_b2b_widgets_client ON public.b2b_widgets(client_id);

ALTER TABLE public.b2b_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "b2b_widgets_select" ON public.b2b_widgets FOR SELECT USING (
  client_id IN (SELECT id FROM public.b2b_clients WHERE owner_user_id = auth.uid())
);
CREATE POLICY "b2b_widgets_insert" ON public.b2b_widgets FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM public.b2b_clients WHERE owner_user_id = auth.uid())
);
CREATE POLICY "b2b_widgets_update" ON public.b2b_widgets FOR UPDATE USING (
  client_id IN (SELECT id FROM public.b2b_clients WHERE owner_user_id = auth.uid())
);

CREATE TRIGGER trg_b2b_widgets_updated_at
  BEFORE UPDATE ON public.b2b_widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── ウィジェットセッション追跡 ────────────────────────────────────────────
CREATE TABLE public.b2b_widget_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id       UUID NOT NULL REFERENCES public.b2b_widgets(id) ON DELETE CASCADE,
  visitor_id      TEXT,
  referrer_url    TEXT,
  message_count   INT NOT NULL DEFAULT 0,
  led_to_signup   BOOLEAN NOT NULL DEFAULT false,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ
);

CREATE INDEX idx_b2b_widget_sessions_widget ON public.b2b_widget_sessions(widget_id, started_at DESC);

ALTER TABLE public.b2b_widget_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "b2b_widget_sessions_select" ON public.b2b_widget_sessions FOR SELECT USING (
  widget_id IN (
    SELECT w.id FROM public.b2b_widgets w
    JOIN public.b2b_clients c ON c.id = w.client_id
    WHERE c.owner_user_id = auth.uid()
  )
);
CREATE POLICY "b2b_widget_sessions_insert" ON public.b2b_widget_sessions FOR INSERT WITH CHECK (true);
