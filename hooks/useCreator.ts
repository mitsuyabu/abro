import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { CreatorEarning, CreatorProfile } from '@/types';

export function useCreator() {
  const { user } = useAuthStore();

  const fetchProfile = async (): Promise<CreatorProfile | null> => {
    if (!user) return null;
    const { data } = await (supabase as any)
      .from('creator_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    return data as CreatorProfile | null;
  };

  const registerCreator = async (displayName: string, bio?: string): Promise<CreatorProfile | null> => {
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from('creator_profiles')
      .upsert({ user_id: user.id, display_name: displayName, bio: bio ?? null, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) return null;
    return data as CreatorProfile;
  };

  const fetchEarnings = async (): Promise<CreatorEarning[]> => {
    if (!user) return [];
    const { data } = await (supabase as any)
      .from('creator_earnings')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    return (data ?? []) as CreatorEarning[];
  };

  return { fetchProfile, registerCreator, fetchEarnings };
}
