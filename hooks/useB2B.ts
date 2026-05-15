import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { B2BClient, B2BClientType, B2BWidget, B2BWidgetSession } from '@/types';

export function useB2B() {
  const { user } = useAuthStore();

  const fetchMyClients = async (): Promise<B2BClient[]> => {
    if (!user) return [];
    const { data } = await (supabase as any)
      .from('b2b_clients')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false });
    return (data ?? []) as B2BClient[];
  };

  const fetchClient = async (clientId: string): Promise<B2BClient | null> => {
    const { data } = await (supabase as any)
      .from('b2b_clients')
      .select('*')
      .eq('id', clientId)
      .single();
    return data as B2BClient | null;
  };

  const createClient = async (params: {
    name: string;
    type: B2BClientType;
    country?: string;
    city?: string;
    website_url?: string;
    description?: string;
    contact_email?: string;
  }): Promise<B2BClient | null> => {
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from('b2b_clients')
      .insert({ owner_user_id: user.id, ...params })
      .select()
      .single();
    if (error) return null;
    return data as B2BClient;
  };

  const fetchWidgets = async (clientId: string): Promise<B2BWidget[]> => {
    const { data } = await (supabase as any)
      .from('b2b_widgets')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at');
    return (data ?? []) as B2BWidget[];
  };

  const createWidget = async (clientId: string, name = 'メインウィジェット'): Promise<B2BWidget | null> => {
    const { data, error } = await (supabase as any)
      .from('b2b_widgets')
      .insert({ client_id: clientId, name })
      .select()
      .single();
    if (error) return null;
    return data as B2BWidget;
  };

  const updateWidget = async (widgetId: string, params: Partial<Pick<B2BWidget, 'name' | 'primary_color' | 'welcome_message' | 'faq_items' | 'allowed_domains' | 'is_active'>>): Promise<void> => {
    await (supabase as any)
      .from('b2b_widgets')
      .update({ ...params, updated_at: new Date().toISOString() })
      .eq('id', widgetId);
  };

  const fetchSessionStats = async (widgetId: string): Promise<{
    total: number;
    signups: number;
    avgMessages: number;
  }> => {
    const { data } = await (supabase as any)
      .from('b2b_widget_sessions')
      .select('message_count, led_to_signup')
      .eq('widget_id', widgetId);
    const rows = (data ?? []) as B2BWidgetSession[];
    const total = rows.length;
    const signups = rows.filter((r) => r.led_to_signup).length;
    const avgMessages = total > 0 ? rows.reduce((s, r) => s + r.message_count, 0) / total : 0;
    return { total, signups, avgMessages: Math.round(avgMessages * 10) / 10 };
  };

  return { fetchMyClients, fetchClient, createClient, fetchWidgets, createWidget, updateWidget, fetchSessionStats };
}
