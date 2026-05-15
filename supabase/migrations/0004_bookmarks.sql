-- pgvector 拡張を先に有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- ブックマーク
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN (
    'url', 'image', 'pdf', 'note', 'map_pin', 'video'
  )) NOT NULL,
  source_url TEXT,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  content_text TEXT,
  category TEXT DEFAULT 'others',
  tags TEXT[] DEFAULT '{}',
  location JSONB,
  metadata JSONB,
  ai_classified BOOLEAN DEFAULT FALSE,
  ai_confidence REAL,
  embedding VECTOR(1536),
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX bookmarks_user_idx ON public.bookmarks(user_id);
CREATE INDEX bookmarks_category_idx ON public.bookmarks(user_id, category);
-- ivfflat インデックスはデータが十分に溜まってから手動で追加:
-- CREATE INDEX bookmarks_embedding_idx ON public.bookmarks
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- カスタムカテゴリ
CREATE TABLE public.bookmark_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(user_id, key)
);

-- RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own categories" ON public.bookmark_categories
  FOR ALL USING (auth.uid() = user_id);

-- updated_at トリガー
CREATE TRIGGER bookmarks_updated_at
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 新規ユーザー登録時にデフォルトカテゴリを挿入
CREATE OR REPLACE FUNCTION public.insert_default_bookmark_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.bookmark_categories (user_id, key, label, icon, is_default, order_index) VALUES
    (NEW.id, 'schools', '学校候補', '🎓', TRUE, 0),
    (NEW.id, 'living_area', '生活エリア候補', '🏘️', TRUE, 1),
    (NEW.id, 'jobs', '仕事探し候補', '💼', TRUE, 2),
    (NEW.id, 'leisure', '観光・休日候補', '🌅', TRUE, 3),
    (NEW.id, 'visa', 'ビザ・手続き', '📄', TRUE, 4),
    (NEW.id, 'study', '英語学習', '📚', TRUE, 5),
    (NEW.id, 'safety', '不安解消メモ', '🛡️', TRUE, 6),
    (NEW.id, 'finance', 'お金・銀行', '💳', TRUE, 7),
    (NEW.id, 'health', '健康・医療', '🏥', TRUE, 8),
    (NEW.id, 'food', '食・グルメ', '🍴', TRUE, 9),
    (NEW.id, 'transport', '交通', '🚇', TRUE, 10),
    (NEW.id, 'others', 'その他', '📌', TRUE, 11);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_insert_bookmark_categories
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.insert_default_bookmark_categories();
