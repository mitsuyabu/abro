import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { DmMessage, DmThread } from '@/types';

export function useDm() {
  const { user } = useAuthStore();

  const fetchOrCreateThread = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    // Check existing thread (either direction)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingA } = await (supabase.from('dm_threads') as any)
      .select('id')
      .eq('participant_a', user.id)
      .eq('participant_b', otherUserId)
      .maybeSingle();
    if (existingA) return (existingA as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingB } = await (supabase.from('dm_threads') as any)
      .select('id')
      .eq('participant_a', otherUserId)
      .eq('participant_b', user.id)
      .maybeSingle();
    if (existingB) return (existingB as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newThread } = await (supabase.from('dm_threads') as any)
      .insert({ participant_a: user.id, participant_b: otherUserId })
      .select('id')
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return newThread ? (newThread as any).id : null;
  }, [user]);

  const fetchThreads = useCallback(async (): Promise<DmThread[]> => {
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('dm_threads') as any)
      .select('*')
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!data) return [];

    // Fetch other users separately to avoid multi-FK join ambiguity
    const otherUserIds = (data as any[]).map((t: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      t.participant_a === user.id ? t.participant_b : t.participant_a
    );

    const { data: usersData } = await supabase
      .from('users')
      .select('id, nickname, avatar_url')
      .in('id', otherUserIds);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userMap = new Map((usersData as any[] ?? []).map((u: any) => [u.id, u]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((t: any) => {
      const otherId = t.participant_a === user.id ? t.participant_b : t.participant_a;
      return { ...t, other_user: userMap.get(otherId) };
    });
  }, [user]);

  const fetchMessages = useCallback(async (threadId: string): Promise<DmMessage[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('dm_messages') as any)
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    return (data as DmMessage[]) ?? [];
  }, []);

  const sendMessage = useCallback(async (threadId: string, content: string): Promise<DmMessage | null> => {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('dm_messages') as any)
      .insert({ thread_id: threadId, sender_id: user.id, content: content.trim() })
      .select()
      .single();
    return data as DmMessage ?? null;
  }, [user]);

  return { fetchOrCreateThread, fetchThreads, fetchMessages, sendMessage };
}
