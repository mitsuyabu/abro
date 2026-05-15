-- ── 先輩Q&A ─────────────────────────────────────────────────────────────
CREATE TABLE public.qa_threads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questioner_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category       TEXT NOT NULL
                 CHECK (category IN ('visa','life','school','work','money','housing','accident','other')),
  title          TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  content        TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  is_anonymous   BOOLEAN NOT NULL DEFAULT false,
  answer_count   INT NOT NULL DEFAULT 0,
  view_count     INT NOT NULL DEFAULT 0,
  is_resolved    BOOLEAN NOT NULL DEFAULT false,
  best_answer_id UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qa_threads_category   ON public.qa_threads(category, created_at DESC);
CREATE INDEX idx_qa_threads_created_at ON public.qa_threads(created_at DESC);
CREATE INDEX idx_qa_threads_resolved   ON public.qa_threads(is_resolved);

ALTER TABLE public.qa_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_threads_select" ON public.qa_threads FOR SELECT USING (true);
CREATE POLICY "qa_threads_insert" ON public.qa_threads FOR INSERT WITH CHECK (questioner_id = auth.uid());
CREATE POLICY "qa_threads_update" ON public.qa_threads FOR UPDATE USING (questioner_id = auth.uid());

CREATE TRIGGER trg_qa_threads_updated_at
  BEFORE UPDATE ON public.qa_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 回答 ────────────────────────────────────────────────────────────────
CREATE TABLE public.qa_answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID NOT NULL REFERENCES public.qa_threads(id) ON DELETE CASCADE,
  answerer_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  vote_count   INT NOT NULL DEFAULT 0,
  is_best      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qa_answers_thread ON public.qa_answers(thread_id, vote_count DESC);

ALTER TABLE public.qa_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_answers_select" ON public.qa_answers FOR SELECT USING (true);
CREATE POLICY "qa_answers_insert" ON public.qa_answers FOR INSERT WITH CHECK (answerer_id = auth.uid());
CREATE POLICY "qa_answers_update" ON public.qa_answers FOR UPDATE USING (
  answerer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.qa_threads WHERE id = thread_id AND questioner_id = auth.uid())
);
CREATE POLICY "qa_answers_delete" ON public.qa_answers FOR DELETE USING (answerer_id = auth.uid());

CREATE TRIGGER trg_qa_answers_updated_at
  BEFORE UPDATE ON public.qa_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- answer_count 自動更新
CREATE OR REPLACE FUNCTION public.update_qa_answer_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.qa_threads SET answer_count = answer_count + 1 WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.qa_threads SET answer_count = GREATEST(0, answer_count - 1) WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_qa_answer_count
  AFTER INSERT OR DELETE ON public.qa_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_qa_answer_count();

-- ── 参考になった（投票） ───────────────────────────────────────────────
CREATE TABLE public.qa_votes (
  answer_id  UUID NOT NULL REFERENCES public.qa_answers(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (answer_id, user_id)
);

ALTER TABLE public.qa_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_votes_select" ON public.qa_votes FOR SELECT USING (true);
CREATE POLICY "qa_votes_insert" ON public.qa_votes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "qa_votes_delete" ON public.qa_votes FOR DELETE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_qa_vote_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.qa_answers SET vote_count = vote_count + 1 WHERE id = NEW.answer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.qa_answers SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.answer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_qa_vote_count
  AFTER INSERT OR DELETE ON public.qa_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_qa_vote_count();
