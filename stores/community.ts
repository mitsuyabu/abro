import { create } from 'zustand';
import type { Community } from '@/types';

interface CommunityState {
  communities: Community[];
  myCommunities: Community[];
  setCommunities: (c: Community[]) => void;
  setMyCommunities: (c: Community[]) => void;
  updateMembership: (communityId: string, isMember: boolean, role?: string) => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  communities: [],
  myCommunities: [],
  setCommunities: (communities) => set({ communities }),
  setMyCommunities: (myCommunities) => set({ myCommunities }),
  updateMembership: (communityId, isMember, role) =>
    set((s) => ({
      communities: s.communities.map((c) =>
        c.id === communityId
          ? {
              ...c,
              is_member: isMember,
              my_role: isMember ? (role as any) ?? 'member' : null, // eslint-disable-line @typescript-eslint/no-explicit-any
              member_count: isMember ? c.member_count + 1 : Math.max(0, c.member_count - 1),
            }
          : c
      ),
      myCommunities: isMember
        ? s.myCommunities
        : s.myCommunities.filter((c) => c.id !== communityId),
    })),
}));
