-- チャットセッション
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  type TEXT CHECK (type IN ('ai', 'agent', 'community')) DEFAULT 'ai',
  plan_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX chats_user_id_idx ON public.chats(user_id);
CREATE INDEX chats_updated_at_idx ON public.chats(updated_at DESC);

-- メッセージ
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  structured_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_chat_id_idx ON public.messages(chat_id);

-- プラン
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination_country TEXT,
  destination_city TEXT,
  start_date DATE,
  end_date DATE,
  duration_weeks INTEGER,
  purpose TEXT,
  budget_jpy INTEGER,
  status TEXT CHECK (status IN ('draft', 'private', 'shared', 'public')) DEFAULT 'draft',
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX plans_user_id_idx ON public.plans(user_id);

-- プラン要素
CREATE TABLE public.plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('school', 'accommodation', 'flight', 'insurance', 'visa', 'activity', 'other')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cost_jpy INTEGER,
  start_date DATE,
  end_date DATE,
  metadata JSONB,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX plan_items_plan_id_idx ON public.plan_items(plan_id);

-- RLS 有効化
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own chats" ON public.chats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own messages" ON public.messages
  FOR ALL USING (chat_id IN (SELECT id FROM public.chats WHERE user_id = auth.uid()));

CREATE POLICY "Users own plans" ON public.plans
  FOR ALL USING (auth.uid() = user_id OR status = 'public');

CREATE POLICY "Users own plan items" ON public.plan_items
  FOR ALL USING (plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid() OR status = 'public'));

-- updated_at 自動更新
CREATE TRIGGER chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
