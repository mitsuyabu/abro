-- ── プラン保存（他ユーザーのプランをブックマーク）────────────────────────
CREATE TABLE public.plan_saves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id    UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_id)
);

CREATE INDEX idx_plan_saves_user ON public.plan_saves(user_id, created_at DESC);

ALTER TABLE public.plan_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_saves_select" ON public.plan_saves FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "plan_saves_insert" ON public.plan_saves FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "plan_saves_delete" ON public.plan_saves FOR DELETE USING (user_id = auth.uid());
