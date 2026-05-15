import { create } from 'zustand';
import type { PostWithUser } from '@/types';

interface SnsState {
  timeline: PostWithUser[];
  setTimeline: (posts: PostWithUser[]) => void;
  prependPost: (post: PostWithUser) => void;
  updatePostLike: (postId: string, liked: boolean, count: number) => void;
}

export const useSnsStore = create<SnsState>((set) => ({
  timeline: [],
  setTimeline: (timeline) => set({ timeline }),
  prependPost: (post) => set((s) => ({ timeline: [post, ...s.timeline] })),
  updatePostLike: (postId, liked, count) =>
    set((s) => ({
      timeline: s.timeline.map((p) =>
        p.id === postId ? { ...p, like_count: count, liked_by_me: liked } : p
      ),
    })),
}));
