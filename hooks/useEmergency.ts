import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { EmergencyCategory, EmergencyContact, EmergencyLog, EmergencyRelationship, EmergencySeverity } from '@/types';

export function useEmergency() {
  const { user } = useAuthStore();

  const fetchContacts = async (): Promise<EmergencyContact[]> => {
    if (!user) return [];
    const { data } = await (supabase as any)
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    return (data ?? []) as EmergencyContact[];
  };

  const addContact = async (params: {
    label: string;
    phone?: string;
    email?: string;
    relationship: EmergencyRelationship;
    notify_on_sos?: boolean;
  }): Promise<EmergencyContact | null> => {
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from('emergency_contacts')
      .insert({ user_id: user.id, ...params })
      .select()
      .single();
    if (error) return null;
    return data as EmergencyContact;
  };

  const deleteContact = async (contactId: string): Promise<void> => {
    await (supabase as any).from('emergency_contacts').delete().eq('id', contactId);
  };

  const logEmergency = async (params: {
    category: EmergencyCategory;
    severity: EmergencySeverity;
    description?: string;
    country?: string;
    city?: string;
  }): Promise<EmergencyLog | null> => {
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from('emergency_logs')
      .insert({ user_id: user.id, ...params })
      .select()
      .single();
    if (error) return null;
    return data as EmergencyLog;
  };

  const resolveLog = async (logId: string): Promise<void> => {
    await (supabase as any)
      .from('emergency_logs')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', logId);
  };

  return { fetchContacts, addContact, deleteContact, logEmergency, resolveLog };
}
