-- users にエージェントフラグを追加
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_agent BOOLEAN DEFAULT FALSE;

-- エージェント会社
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  specialties TEXT[] DEFAULT '{}',
  countries TEXT[] DEFAULT '{}',
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  plan TEXT CHECK (plan IN ('basic', 'premium', 'enterprise')) DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- カウンセラー
CREATE TABLE public.agent_counselors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{ja}',
  years_experience INTEGER,
  is_online BOOLEAN DEFAULT FALSE,
  available_hours JSONB,
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- レビュー
CREATE TABLE public.agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES public.agent_counselors(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(counselor_id, reviewer_id)
);

-- プラン共同編集の招待
CREATE TABLE public.plan_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  collaborator_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('agent', 'friend', 'parent')) NOT NULL,
  permission TEXT CHECK (permission IN ('view', 'suggest', 'edit')) DEFAULT 'suggest',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(plan_id, collaborator_user_id)
);

-- プラン編集提案履歴
CREATE TABLE public.plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  change_type TEXT CHECK (change_type IN ('add', 'edit', 'delete', 'suggest')) NOT NULL,
  target_type TEXT,
  target_id UUID,
  before_data JSONB,
  after_data JSONB,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_changes ENABLE ROW LEVEL SECURITY;

-- エージェント・カウンセラーは認証ユーザー全員が読める(マーケットプレイス)
CREATE POLICY "Anyone can read agents" ON public.agents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read counselors" ON public.agent_counselors
  FOR SELECT USING (auth.role() = 'authenticated');

-- レビューは認証ユーザーが読める、書くのは本人のみ
CREATE POLICY "Anyone can read reviews" ON public.agent_reviews
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own review" ON public.agent_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- plan_collaborators はプランオーナーと参加者が読める
CREATE POLICY "Plan collaborators visible to plan owner and collaborators" ON public.plan_collaborators
  FOR SELECT USING (
    collaborator_user_id = auth.uid() OR
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Plan owner can manage collaborators" ON public.plan_collaborators
  FOR ALL USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Collaborator can update own acceptance" ON public.plan_collaborators
  FOR UPDATE USING (collaborator_user_id = auth.uid());

-- plan_changes はプランオーナーと参加者が読める
CREATE POLICY "Plan changes visible to owner and collaborators" ON public.plan_changes
  FOR SELECT USING (
    changed_by = auth.uid() OR
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Collaborators can suggest changes" ON public.plan_changes
  FOR INSERT WITH CHECK (
    changed_by = auth.uid() AND (
      plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid()) OR
      plan_id IN (
        SELECT plan_id FROM public.plan_collaborators
        WHERE collaborator_user_id = auth.uid() AND accepted_at IS NOT NULL
      )
    )
  );

CREATE POLICY "Plan owner can update change status" ON public.plan_changes
  FOR UPDATE USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );
