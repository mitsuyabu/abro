-- ── コミュニティ ────────────────────────────────────────────────────────
CREATE TABLE public.communities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  type         TEXT NOT NULL DEFAULT 'custom'
               CHECK (type IN ('city', 'school', 'purpose', 'custom')),
  is_official  BOOLEAN NOT NULL DEFAULT false,
  cover_emoji  TEXT NOT NULL DEFAULT '🌏',
  city         TEXT,
  country      TEXT,
  member_count INT NOT NULL DEFAULT 0,
  post_count   INT NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_communities_type     ON public.communities(type);
CREATE INDEX idx_communities_official ON public.communities(is_official DESC, member_count DESC);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities_select" ON public.communities FOR SELECT USING (true);
CREATE POLICY "communities_insert" ON public.communities FOR INSERT WITH CHECK (created_by = auth.uid());
-- communities_update は community_members 作成後に追加する

-- ── コミュニティメンバー ─────────────────────────────────────────────────
CREATE TABLE public.community_members (
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

CREATE INDEX idx_community_members_user ON public.community_members(user_id);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_members_select" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "community_members_insert" ON public.community_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "community_members_delete" ON public.community_members
  FOR DELETE USING (user_id = auth.uid());

-- member_count 自動更新
CREATE OR REPLACE FUNCTION public.update_community_member_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_member_count
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- communities_update: community_members が存在するここで追加
CREATE POLICY "communities_update" ON public.communities
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = id AND user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- ── コミュニティ投稿 ─────────────────────────────────────────────────────
CREATE TABLE public.community_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  like_count   INT NOT NULL DEFAULT 0,
  is_pinned    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_posts_community ON public.community_posts(community_id, is_pinned DESC, created_at DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_select" ON public.community_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_posts.community_id AND user_id = auth.uid())
  OR
  (SELECT is_official FROM public.communities WHERE id = community_posts.community_id)
);

CREATE POLICY "community_posts_insert" ON public.community_posts
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_posts.community_id AND user_id = auth.uid())
  );

CREATE POLICY "community_posts_delete" ON public.community_posts
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER trg_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- post_count 自動更新
CREATE OR REPLACE FUNCTION public.update_community_post_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET post_count = post_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_post_count
  AFTER INSERT OR DELETE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_community_post_count();

-- コミュニティ投稿いいね
CREATE TABLE public.community_post_likes (
  post_id    UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_post_likes_select" ON public.community_post_likes FOR SELECT USING (true);
CREATE POLICY "community_post_likes_insert" ON public.community_post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "community_post_likes_delete" ON public.community_post_likes FOR DELETE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_community_post_like_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_post_like_count
  AFTER INSERT OR DELETE ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_community_post_like_count();
