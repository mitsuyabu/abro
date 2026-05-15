import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { QaAnswer, QaCategory, QaThread } from '@/types';

export function useQa() {
  const { user } = useAuthStore();

  const fetchThreads = useCallback(async (category?: QaCategory): Promise<QaThread[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('qa_threads') as any)
      .select('*, questioner:users(id, nickname, avatar_url, phase)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (category) query = query.eq('category', category);
    const { data } = await query;
    if (!data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((t: any) => ({ ...t, questioner: t.questioner ?? undefined }));
  }, []);

  const fetchThread = useCallback(async (id: string): Promise<QaThread | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('qa_threads') as any)
      .select('*, questioner:users(id, nickname, avatar_url, phase)')
      .eq('id', id)
      .single();
    if (!data) return null;
    // Increment view count (fire and forget)
    supabase.from('qa_threads').update({ view_count: (data as any).view_count + 1 }).eq('id', id); // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...(data as any), questioner: (data as any).questioner ?? undefined };
  }, []);

  const fetchAnswers = useCallback(async (threadId: string): Promise<QaAnswer[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('qa_answers') as any)
      .select('*, answerer:users(id, nickname, avatar_url, phase)')
      .eq('thread_id', threadId)
      .order('is_best', { ascending: false })
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: true });
    if (!data) return [];

    let votedIds = new Set<string>();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const answerIds = (data as any[]).map((a: any) => a.id);
      if (answerIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: votes } = await (supabase.from('qa_votes') as any)
          .select('answer_id').eq('user_id', user.id).in('answer_id', answerIds);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (votes) votedIds = new Set((votes as any[]).map((v: any) => v.answer_id));
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((a: any) => ({
      ...a,
      answerer: a.answerer ?? undefined,
      voted_by_me: votedIds.has(a.id),
    }));
  }, [user]);

  const createThread = useCallback(async (params: {
    category: QaCategory;
    title: string;
    content: string;
    isAnonymous: boolean;
  }): Promise<QaThread | null> => {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('qa_threads') as any)
      .insert({
        questioner_id: user.id,
        category: params.category,
        title: params.title.trim(),
        content: params.content.trim(),
        is_anonymous: params.isAnonymous,
      })
      .select('*, questioner:users(id, nickname, avatar_url, phase)')
      .single();
    if (!data) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...(data as any), questioner: (data as any).questioner ?? undefined };
  }, [user]);

  const addAnswer = useCallback(async (threadId: string, content: string): Promise<QaAnswer | null> => {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('qa_answers') as any)
      .insert({ thread_id: threadId, answerer_id: user.id, content: content.trim() })
      .select('*, answerer:users(id, nickname, avatar_url, phase)')
      .single();
    if (!data) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...(data as any), answerer: (data as any).answerer ?? undefined, voted_by_me: false };
  }, [user]);

  const toggleVote = useCallback(async (answerId: string, currentlyVoted: boolean) => {
    if (!user) return;
    if (currentlyVoted) {
      await supabase.from('qa_votes').delete().eq('answer_id', answerId).eq('user_id', user.id);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('qa_votes') as any).insert({ answer_id: answerId, user_id: user.id });
    }
  }, [user]);

  const markBestAnswer = useCallback(async (threadId: string, answerId: string) => {
    await supabase.from('qa_threads').update({ best_answer_id: answerId, is_resolved: true }).eq('id', threadId);
    await supabase.from('qa_answers').update({ is_best: true }).eq('id', answerId);
    // Clear any previously marked best answers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('qa_answers') as any)
      .update({ is_best: false })
      .eq('thread_id', threadId)
      .neq('id', answerId);
  }, []);

  return { fetchThreads, fetchThread, fetchAnswers, createThread, addAnswer, toggleVote, markBestAnswer };
}
