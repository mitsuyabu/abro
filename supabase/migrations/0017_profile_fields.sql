-- プロフィール拡張カラムを追加
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name    TEXT,
  ADD COLUMN IF NOT EXISTS last_name     TEXT,
  ADD COLUMN IF NOT EXISTS username      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS location      TEXT,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS birthday      DATE,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url    TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url   TEXT;

-- upsert に必要な INSERT ポリシーを追加（なければ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
      AND policyname = 'Users can insert own record'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users can insert own record"
        ON public.users FOR INSERT
        WITH CHECK (auth.uid() = id)
    $p$;
  END IF;
END $$;
