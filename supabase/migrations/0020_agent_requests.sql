-- エージェント相談申し込みテーブル
CREATE TABLE IF NOT EXISTS public.agent_consultation_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  plan_id    UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  context    TEXT,   -- プランサマリーまたはチャット要約
  message    TEXT,
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_consultation_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_consultation_requests' AND policyname = 'Users can insert own requests'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users can insert own requests"
      ON public.agent_consultation_requests FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    $p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_consultation_requests' AND policyname = 'Users can view own requests'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users can view own requests"
      ON public.agent_consultation_requests FOR SELECT
      USING (auth.uid() = user_id);
    $p$;
  END IF;
END $$;
