import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { ParentLink } from '@/types';

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function useParentLink() {
  const [myLinks, setMyLinks] = useState<ParentLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMyLinks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('parent_links') as any)
      .select('*')
      .or(`child_user_id.eq.${user.id},parent_user_id.eq.${user.id}`)
      .neq('status', 'revoked');

    if (data) setMyLinks(data as ParentLink[]);
  }, []);

  // 子側: 招待コードを生成
  const generateInviteCode = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 既存の pending リンクがあれば削除して再生成
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('parent_links') as any)
      .delete()
      .eq('child_user_id', user.id)
      .eq('status', 'pending')
      .is('parent_user_id', null);

    const code = generateCode();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('parent_links') as any).insert({
      child_user_id: user.id,
      invitation_code: code,
      status: 'pending',
    });

    if (error) return null;
    return code;
  }, []);

  // 親側: 招待コードを入力して連携
  const acceptInviteCode = useCallback(async (code: string): Promise<'ok' | 'not_found' | 'error'> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'error';

    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: link } = await (supabase.from('parent_links') as any)
        .select('*')
        .eq('invitation_code', code.toUpperCase())
        .eq('status', 'pending')
        .maybeSingle();

      if (!link) return 'not_found';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('parent_links') as any)
        .update({
          parent_user_id: user.id,
          status: 'active',
          approved_at: new Date().toISOString(),
        })
        .eq('id', (link as ParentLink).id);

      await fetchMyLinks();
      return 'ok';
    } catch {
      return 'error';
    } finally {
      setIsLoading(false);
    }
  }, [fetchMyLinks]);

  // 連携解除
  const revokeLink = useCallback(async (linkId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('parent_links') as any)
      .update({ status: 'revoked' })
      .eq('id', linkId);
    setMyLinks((prev) => prev.filter((l) => l.id !== linkId));
  }, []);

  return {
    myLinks,
    isLoading,
    fetchMyLinks,
    generateInviteCode,
    acceptInviteCode,
    revokeLink,
  };
}
