-- 親子連携
CREATE TABLE public.parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('view', 'comment')) DEFAULT 'view',
  status TEXT CHECK (status IN ('pending', 'active', 'revoked')) DEFAULT 'pending',
  invitation_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  UNIQUE(child_user_id, parent_user_id)
);

CREATE INDEX parent_links_child_idx ON public.parent_links(child_user_id);
CREATE INDEX parent_links_parent_idx ON public.parent_links(parent_user_id);
CREATE INDEX parent_links_code_idx ON public.parent_links(invitation_code);

-- タスク
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  priority INTEGER DEFAULT 0,
  is_milestone BOOLEAN DEFAULT FALSE,
  auto_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX tasks_plan_id_idx ON public.tasks(plan_id);

-- 親コメント
CREATE TABLE public.parent_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_link_id UUID NOT NULL REFERENCES public.parent_links(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('plan', 'plan_item', 'cost_item', 'task')) NOT NULL,
  target_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_comments ENABLE ROW LEVEL SECURITY;

-- 親リンクは招待コードでも検索できるよう全員に SELECT を許可(invitation_code での照会用)
CREATE POLICY "Parent link participants" ON public.parent_links
  FOR SELECT USING (
    auth.uid() IN (child_user_id, parent_user_id)
    OR parent_user_id IS NULL
  );

CREATE POLICY "Child can manage own links" ON public.parent_links
  FOR ALL USING (auth.uid() = child_user_id);

CREATE POLICY "Parent can update link" ON public.parent_links
  FOR UPDATE USING (auth.uid() = parent_user_id OR parent_user_id IS NULL);

-- タスクは本人と承認済み親が閲覧可能
CREATE POLICY "Tasks readable by self and parent" ON public.tasks
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT parent_user_id FROM public.parent_links
      WHERE child_user_id = tasks.user_id AND status = 'active'
    )
  );

CREATE POLICY "Tasks editable by self" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tasks updatable by self" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Tasks deletable by self" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 親コメントは参加者のみ
CREATE POLICY "Parent comments visible to participants" ON public.parent_comments
  FOR SELECT USING (
    parent_link_id IN (
      SELECT id FROM public.parent_links
      WHERE auth.uid() IN (child_user_id, parent_user_id)
    )
  );

CREATE POLICY "Parent can insert comments" ON public.parent_comments
  FOR INSERT WITH CHECK (
    parent_link_id IN (
      SELECT id FROM public.parent_links
      WHERE parent_user_id = auth.uid() AND status = 'active' AND permission = 'comment'
    )
  );
