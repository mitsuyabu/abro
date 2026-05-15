-- ユーザープロフィール拡張 (SNS用カウンター)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS followers_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posts_count    INT NOT NULL DEFAULT 0;

-- パブリックプロフィール閲覧を許可（既存のself-only policyを置き換え）
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "users_select_any" ON public.users FOR SELECT USING (true);

-- ── 投稿 ────────────────────────────────────────────────────────────────
CREATE TABLE public.posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  media_urls   TEXT[] NOT NULL DEFAULT '{}',
  location     JSONB,
  visibility   TEXT NOT NULL DEFAULT 'public'
               CHECK (visibility IN ('public', 'phase_only', 'community_only')),
  user_phase   TEXT,
  like_count    INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_user_id   ON public.posts(user_id);
CREATE INDEX idx_posts_timeline  ON public.posts(created_at DESC) WHERE visibility = 'public';

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.update_posts_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_posts_count
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_posts_count();

-- ── フォロー ────────────────────────────────────────────────────────────
CREATE TABLE public.follows (
  follower_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower  ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (follower_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_follow_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    UPDATE public.users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- ── いいね ──────────────────────────────────────────────────────────────
CREATE TABLE public.post_likes (
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete" ON public.post_likes FOR DELETE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_post_like_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_post_like_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_like_count();

-- ── コメント ────────────────────────────────────────────────────────────
CREATE TABLE public.post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post ON public.post_comments(post_id, created_at);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_comments_select" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_comments_delete" ON public.post_comments FOR DELETE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_post_comment_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_post_comment_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();

-- ── DM スレッド ─────────────────────────────────────────────────────────
CREATE TABLE public.dm_threads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_b         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at       TIMESTAMPTZ,
  last_message_preview  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dm_threads_a ON public.dm_threads(participant_a, last_message_at DESC);
CREATE INDEX idx_dm_threads_b ON public.dm_threads(participant_b, last_message_at DESC);

ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_threads_select" ON public.dm_threads
  FOR SELECT USING (participant_a = auth.uid() OR participant_b = auth.uid());
CREATE POLICY "dm_threads_insert" ON public.dm_threads
  FOR INSERT WITH CHECK (participant_a = auth.uid() OR participant_b = auth.uid());

-- ── DM メッセージ ────────────────────────────────────────────────────────
CREATE TABLE public.dm_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dm_messages_thread ON public.dm_messages(thread_id, created_at);

ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_messages_select" ON public.dm_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dm_threads t
      WHERE t.id = thread_id
        AND (t.participant_a = auth.uid() OR t.participant_b = auth.uid())
    )
  );
CREATE POLICY "dm_messages_insert" ON public.dm_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_dm_last_message() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dm_threads
  SET last_message_at      = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 50)
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dm_last_message
  AFTER INSERT ON public.dm_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_dm_last_message();
