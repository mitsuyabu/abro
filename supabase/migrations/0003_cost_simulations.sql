-- 費用シミュレーション(プラン単位)
CREATE TABLE public.cost_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'JPY',
  exchange_rates JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 費用項目
CREATE TABLE public.cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES public.cost_simulations(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN (
    'visa', 'tuition', 'flight', 'accommodation',
    'food', 'transport', 'insurance', 'phone',
    'pocket_money', 'reserve', 'other'
  )) NOT NULL,
  label TEXT NOT NULL,
  amount_jpy INTEGER NOT NULL DEFAULT 0,
  frequency TEXT CHECK (frequency IN ('once', 'monthly', 'weekly', 'daily')) DEFAULT 'once',
  duration INTEGER DEFAULT 1,
  note TEXT,
  is_estimated BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.cost_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own simulations" ON public.cost_simulations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own cost items" ON public.cost_items
  FOR ALL USING (
    simulation_id IN (
      SELECT id FROM public.cost_simulations WHERE user_id = auth.uid()
    )
  );

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_cost_simulation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cost_simulations_updated_at
  BEFORE UPDATE ON public.cost_simulations
  FOR EACH ROW EXECUTE FUNCTION update_cost_simulation_updated_at();
