import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useSnsStore } from '@/stores/sns';
import type { PostComment, PostWithUser } from '@/types';

export function usePosts() {
  const { user } = useAuthStore();
  const { setTimeline, prependPost, updatePostLike } = useSnsStore();

  const fetchTimeline = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('posts') as any)
      .select('*, user:users(id, nickname, avatar_url, phase)')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data) return;

    const postIds = (data as any[]).map((p: any) => p.id); // eslint-disable-line @typescript-eslint/no-explicit-any
    let likedIds = new Set<string>();

    if (user && postIds.length > 0) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (likes) likedIds = new Set((likes as any[]).map((l: any) => l.post_id));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts: PostWithUser[] = (data as any[]).map((p: any) => ({
      ...p,
      user: p.user ?? { id: p.user_id, nickname: null, avatar_url: null, phase: 'considering' },
      liked_by_me: likedIds.has(p.id),
    }));

    setTimeline(posts);
  }, [user, setTimeline]);

  const createPost = useCallback(async (
    content: string,
    visibility: string = 'public',
  ): Promise<PostWithUser | null> => {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('posts') as any)
      .insert({
        user_id: user.id,
        content: content.trim(),
        visibility,
        user_phase: user.phase,
      })
      .select('*, user:users(id, nickname, avatar_url, phase)')
      .single();

    if (!data) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const post: PostWithUser = { ...(data as any), user: (data as any).user ?? { id: user.id, nickname: user.nickname, avatar_url: user.avatar_url, phase: user.phase }, liked_by_me: false };
    prependPost(post);
    return post;
  }, [user, prependPost]);

  const toggleLike = useCallback(async (postId: string, currentlyLiked: boolean, currentCount: number) => {
    if (!user) return;
    if (currentlyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      updatePostLike(postId, false, Math.max(0, currentCount - 1));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('post_likes') as any).insert({ post_id: postId, user_id: user.id });
      updatePostLike(postId, true, currentCount + 1);
    }
  }, [user, updatePostLike]);

  const fetchUserPosts = useCallback(async (userId: string): Promise<PostWithUser[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('posts') as any)
      .select('*, user:users(id, nickname, avatar_url, phase)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!data) return [];

    let likedIds = new Set<string>();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postIds = (data as any[]).map((p: any) => p.id);
      if (postIds.length > 0) {
        const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (likes) likedIds = new Set((likes as any[]).map((l: any) => l.post_id));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((p: any) => ({
      ...p,
      user: p.user ?? { id: p.user_id, nickname: null, avatar_url: null, phase: 'considering' },
      liked_by_me: likedIds.has(p.id),
    }));
  }, [user]);

  const fetchComments = useCallback(async (postId: string): Promise<PostComment[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('post_comments') as any)
      .select('*, user:users(id, nickname, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((c: any) => ({ ...c, user: c.user ?? undefined }));
  }, []);

  const addComment = useCallback(async (postId: string, content: string): Promise<PostComment | null> => {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('post_comments') as any)
      .insert({ post_id: postId, user_id: user.id, content: content.trim() })
      .select('*, user:users(id, nickname, avatar_url)')
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data ? { ...(data as any), user: (data as any).user ?? undefined } : null;
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
  }, []);

  return { fetchTimeline, createPost, toggleLike, fetchUserPosts, fetchComments, addComment, deletePost };
}
