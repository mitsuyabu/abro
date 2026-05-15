import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useCommunityStore } from '@/stores/community';
import type { Community, CommunityPost } from '@/types';

export function useCommunity() {
  const { user } = useAuthStore();
  const { setCommunities, setMyCommunities, updateMembership } = useCommunityStore();

  const fetchCommunities = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('communities') as any)
      .select('*')
      .order('is_official', { ascending: false })
      .order('member_count', { ascending: false });

    if (!data) return;

    let memberMap = new Map<string, string>();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberships } = await (supabase.from('community_members') as any)
        .select('community_id, role')
        .eq('user_id', user.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (memberships) memberMap = new Map((memberships as any[]).map((m: any) => [m.community_id, m.role]));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const communities: Community[] = (data as any[]).map((c: any) => ({
      ...c,
      is_member: memberMap.has(c.id),
      my_role: memberMap.get(c.id) ?? null,
    }));

    setCommunities(communities);
    setMyCommunities(communities.filter((c) => c.is_member));
  }, [user, setCommunities, setMyCommunities]);

  const join = useCallback(async (communityId: string) => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('community_members') as any).insert({
      community_id: communityId,
      user_id: user.id,
      role: 'member',
    });
    updateMembership(communityId, true, 'member');
  }, [user, updateMembership]);

  const leave = useCallback(async (communityId: string) => {
    if (!user) return;
    await supabase.from('community_members').delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);
    updateMembership(communityId, false);
  }, [user, updateMembership]);

  const createCommunity = useCallback(async (
    name: string,
    description: string,
    coverEmoji: string,
  ): Promise<Community | null> => {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('communities') as any)
      .insert({ name, description: description || null, cover_emoji: coverEmoji, created_by: user.id, type: 'custom' })
      .select()
      .single();

    if (!data) return null;

    // Auto-join as owner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('community_members') as any).insert({
      community_id: (data as any).id, // eslint-disable-line @typescript-eslint/no-explicit-any
      user_id: user.id,
      role: 'owner',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...(data as any), is_member: true, my_role: 'owner', member_count: 1 };
  }, [user]);

  const fetchCommunityPosts = useCallback(async (communityId: string): Promise<CommunityPost[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('community_posts') as any)
      .select('*, user:users(id, nickname, avatar_url, phase)')
      .eq('community_id', communityId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data) return [];

    let likedIds = new Set<string>();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postIds = (data as any[]).map((p: any) => p.id);
      if (postIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: likes } = await (supabase.from('community_post_likes') as any)
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (likes) likedIds = new Set((likes as any[]).map((l: any) => l.post_id));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((p: any) => ({
      ...p,
      user: p.user ?? undefined,
      liked_by_me: likedIds.has(p.id),
    }));
  }, [user]);

  const createPost = useCallback(async (communityId: string, content: string): Promise<CommunityPost | null> => {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('community_posts') as any)
      .insert({ community_id: communityId, user_id: user.id, content: content.trim() })
      .select('*, user:users(id, nickname, avatar_url, phase)')
      .single();
    if (!data) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...(data as any), user: (data as any).user ?? undefined, liked_by_me: false };
  }, [user]);

  const togglePostLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;
    if (currentlyLiked) {
      await supabase.from('community_post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('community_post_likes') as any).insert({ post_id: postId, user_id: user.id });
    }
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId);
  }, []);

  return {
    fetchCommunities,
    join,
    leave,
    createCommunity,
    fetchCommunityPosts,
    createPost,
    togglePostLike,
    deletePost,
  };
}
