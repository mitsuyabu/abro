-- ── エージェント CRM 顧客 ─────────────────────────────────────────────────
CREATE TABLE public.agent_crm_contacts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id           UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id            UUID REFERENCES public.users(id) ON DELETE SET NULL,
  counselor_id       UUID REFERENCES public.agent_counselors(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  email              TEXT,
  phone              TEXT,
  phase              TEXT NOT NULL DEFAULT 'considering'
                     CHECK (phase IN ('considering','preparing','abroad','returned')),
  conversion_status  TEXT NOT NULL DEFAULT 'prospect'
                     CHECK (conversion_status IN ('prospect','active','converted','lost')),
  destination_country TEXT,
  destination_city   TEXT,
  school_name        TEXT,
  plan_id            UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  deal_amount_jpy    INT,
  tags               TEXT[] NOT NULL DEFAULT '{}',
  next_follow_up     DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_crm_contacts_agent   ON public.agent_crm_contacts(agent_id, created_at DESC);
CREATE INDEX idx_agent_crm_contacts_user    ON public.agent_crm_contacts(user_id);
CREATE INDEX idx_agent_crm_contacts_status  ON public.agent_crm_contacts(agent_id, conversion_status);

ALTER TABLE public.agent_crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_crm_contacts_select" ON public.agent_crm_contacts FOR SELECT USING (
  agent_id IN (SELECT id FROM public.agents WHERE id IN (
    SELECT agent_id FROM public.agent_counselors WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "agent_crm_contacts_insert" ON public.agent_crm_contacts FOR INSERT WITH CHECK (
  agent_id IN (SELECT id FROM public.agents WHERE id IN (
    SELECT agent_id FROM public.agent_counselors WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "agent_crm_contacts_update" ON public.agent_crm_contacts FOR UPDATE USING (
  agent_id IN (SELECT id FROM public.agents WHERE id IN (
    SELECT agent_id FROM public.agent_counselors WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "agent_crm_contacts_delete" ON public.agent_crm_contacts FOR DELETE USING (
  agent_id IN (SELECT id FROM public.agents WHERE id IN (
    SELECT agent_id FROM public.agent_counselors WHERE user_id = auth.uid()
  ))
);

CREATE TRIGGER trg_agent_crm_contacts_updated_at
  BEFORE UPDATE ON public.agent_crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── CRM メモ・相談記録 ────────────────────────────────────────────────────
CREATE TABLE public.agent_crm_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   UUID NOT NULL REFERENCES public.agent_crm_contacts(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES public.agent_counselors(id) ON DELETE SET NULL,
  note_type    TEXT NOT NULL DEFAULT 'other'
               CHECK (note_type IN ('call','meeting','email','chat','other')),
  content      TEXT NOT NULL,
  follow_up_date DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_crm_notes_contact ON public.agent_crm_notes(contact_id, created_at DESC);

ALTER TABLE public.agent_crm_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_crm_notes_select" ON public.agent_crm_notes FOR SELECT USING (
  contact_id IN (
    SELECT c.id FROM public.agent_crm_contacts c
    JOIN public.agent_counselors ac ON ac.agent_id = c.agent_id
    WHERE ac.user_id = auth.uid()
  )
);
CREATE POLICY "agent_crm_notes_insert" ON public.agent_crm_notes FOR INSERT WITH CHECK (
  contact_id IN (
    SELECT c.id FROM public.agent_crm_contacts c
    JOIN public.agent_counselors ac ON ac.agent_id = c.agent_id
    WHERE ac.user_id = auth.uid()
  )
);

-- ── AI 自動応答設定 ───────────────────────────────────────────────────────
CREATE TABLE public.agent_auto_replies (
  agent_id              UUID PRIMARY KEY REFERENCES public.agents(id) ON DELETE CASCADE,
  is_enabled            BOOLEAN NOT NULL DEFAULT false,
  ai_enabled            BOOLEAN NOT NULL DEFAULT true,
  business_hours_start  TEXT NOT NULL DEFAULT '09:00',
  business_hours_end    TEXT NOT NULL DEFAULT '18:00',
  timezone              TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  auto_reply_message    TEXT NOT NULL DEFAULT 'ただいま営業時間外です。翌営業日にご連絡いたします。',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_auto_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_auto_replies_select" ON public.agent_auto_replies FOR SELECT USING (
  agent_id IN (SELECT agent_id FROM public.agent_counselors WHERE user_id = auth.uid())
);
CREATE POLICY "agent_auto_replies_upsert" ON public.agent_auto_replies FOR INSERT WITH CHECK (
  agent_id IN (SELECT agent_id FROM public.agent_counselors WHERE user_id = auth.uid())
);
CREATE POLICY "agent_auto_replies_update" ON public.agent_auto_replies FOR UPDATE USING (
  agent_id IN (SELECT agent_id FROM public.agent_counselors WHERE user_id = auth.uid())
);
