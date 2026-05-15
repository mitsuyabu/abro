import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export function useFollows() {
  const { user } = useAuthStore();

  const checkFollowing = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user || user.id === targetUserId) return false;
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();
    return !!data;
  }, [user]);

  const follow = useCallback(async (targetUserId: string) => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('follows') as any).insert({ follower_id: user.id, following_id: targetUserId });
  }, [user]);

  const unfollow = useCallback(async (targetUserId: string) => {
    if (!user) return;
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
  }, [user]);

  return { checkFollowing, follow, unfollow };
}
