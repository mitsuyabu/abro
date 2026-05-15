-- ── 金融口座 ────────────────────────────────────────────────────────────
CREATE TABLE public.financial_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL
               CHECK (provider IN ('wise','revolut','manual','other')),
  label        TEXT NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'JPY',
  balance      NUMERIC,
  last_synced  TIMESTAMPTZ,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_accounts_user ON public.financial_accounts(user_id);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_accounts_select" ON public.financial_accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "financial_accounts_insert" ON public.financial_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "financial_accounts_update" ON public.financial_accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "financial_accounts_delete" ON public.financial_accounts FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_financial_accounts_updated_at
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 取引履歴 ────────────────────────────────────────────────────────────
CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_local    NUMERIC NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'JPY',
  amount_jpy      NUMERIC,
  category        TEXT NOT NULL DEFAULT 'other'
                  CHECK (category IN ('food','transport','accommodation','school','insurance','phone','entertainment','shopping','medical','transfer','other')),
  merchant        TEXT,
  note            TEXT,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_categorized  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user    ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account ON public.transactions(account_id, date DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (user_id = auth.uid());
