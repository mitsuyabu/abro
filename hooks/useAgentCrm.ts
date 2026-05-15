import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { AgentAutoReply, AgentCrmContact, AgentCrmNote, CrmConversionStatus, CrmNoteType, CrmPhase } from '@/types';

export function useAgentCrm(agentId: string) {
  const { user } = useAuthStore();

  const fetchContacts = async (): Promise<AgentCrmContact[]> => {
    const { data } = await (supabase as any)
      .from('agent_crm_contacts')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    return (data ?? []) as AgentCrmContact[];
  };

  const fetchContact = async (contactId: string): Promise<AgentCrmContact | null> => {
    const { data } = await (supabase as any)
      .from('agent_crm_contacts')
      .select('*')
      .eq('id', contactId)
      .single();
    return data as AgentCrmContact | null;
  };

  const createContact = async (params: {
    name: string;
    email?: string;
    phone?: string;
    phase?: CrmPhase;
    destination_country?: string;
    destination_city?: string;
    school_name?: string;
    deal_amount_jpy?: number;
    tags?: string[];
    next_follow_up?: string;
  }): Promise<AgentCrmContact | null> => {
    const { data, error } = await (supabase as any)
      .from('agent_crm_contacts')
      .insert({ agent_id: agentId, ...params })
      .select()
      .single();
    if (error) return null;
    return data as AgentCrmContact;
  };

  const updateContact = async (contactId: string, params: Partial<Pick<AgentCrmContact, 'phase' | 'conversion_status' | 'school_name' | 'deal_amount_jpy' | 'tags' | 'next_follow_up'>>): Promise<void> => {
    await (supabase as any)
      .from('agent_crm_contacts')
      .update({ ...params, updated_at: new Date().toISOString() })
      .eq('id', contactId);
  };

  const deleteContact = async (contactId: string): Promise<void> => {
    await (supabase as any).from('agent_crm_contacts').delete().eq('id', contactId);
  };

  const fetchNotes = async (contactId: string): Promise<AgentCrmNote[]> => {
    const { data } = await (supabase as any)
      .from('agent_crm_notes')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });
    return (data ?? []) as AgentCrmNote[];
  };

  const addNote = async (contactId: string, params: {
    note_type: CrmNoteType;
    content: string;
    follow_up_date?: string;
  }): Promise<AgentCrmNote | null> => {
    const { data, error } = await (supabase as any)
      .from('agent_crm_notes')
      .insert({ contact_id: contactId, ...params })
      .select()
      .single();
    if (error) return null;
    return data as AgentCrmNote;
  };

  const fetchAutoReply = async (): Promise<AgentAutoReply | null> => {
    const { data } = await (supabase as any)
      .from('agent_auto_replies')
      .select('*')
      .eq('agent_id', agentId)
      .single();
    return data as AgentAutoReply | null;
  };

  const upsertAutoReply = async (params: Partial<Omit<AgentAutoReply, 'agent_id' | 'updated_at'>>): Promise<void> => {
    await (supabase as any)
      .from('agent_auto_replies')
      .upsert({ agent_id: agentId, ...params, updated_at: new Date().toISOString() });
  };

  return { fetchContacts, fetchContact, createContact, updateContact, deleteContact, fetchNotes, addNote, fetchAutoReply, upsertAutoReply };
}
