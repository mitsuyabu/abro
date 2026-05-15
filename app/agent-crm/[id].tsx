import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { useAgentCrm } from '@/hooks/useAgentCrm';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { AgentCrmContact, AgentCrmNote, CrmConversionStatus, CrmNoteType, CrmPhase } from '@/types';

const STATUS_META: Record<CrmConversionStatus, { label: string; color: string }> = {
  prospect:  { label: '見込み',   color: 'text-blue-700' },
  active:    { label: '商談中',   color: 'text-yellow-700' },
  converted: { label: '成約',     color: 'text-green-700' },
  lost:      { label: '失注',     color: 'text-gray-500' },
};

const PHASE_LABELS: Record<CrmPhase, string> = {
  considering: '検討中', preparing: '準備中', abroad: '渡航中', returned: '帰国済',
};

const NOTE_ICONS: Record<CrmNoteType, string> = {
  call: '📞', meeting: '🤝', email: '📧', chat: '💬', other: '📝',
};

const NOTE_TYPE_OPTIONS: Array<{ value: CrmNoteType; label: string }> = [
  { value: 'call', label: '電話' },
  { value: 'meeting', label: '面談' },
  { value: 'email', label: 'メール' },
  { value: 'chat', label: 'チャット' },
  { value: 'other', label: 'その他' },
];

const STATUSES: CrmConversionStatus[] = ['prospect', 'active', 'converted', 'lost'];
const PHASES: CrmPhase[] = ['considering', 'preparing', 'abroad', 'returned'];

function formatDate(str: string) {
  const d = new Date(str);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AgentCrmContactScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [agentId, setAgentId] = useState<string | null>(null);

  const [contact, setContact] = useState<AgentCrmContact | null>(null);
  const [notes, setNotes] = useState<AgentCrmNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<CrmNoteType>('call');
  const [isSendingNote, setIsSendingNote] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      const { data } = await (supabase as any).from('agent_counselors').select('agent_id').eq('user_id', user.id).single();
      if (data?.agent_id) setAgentId(data.agent_id);
    };
    init();
  }, [user]);

  const crm = agentId ? useAgentCrmSafe(agentId) : null;

  const load = useCallback(async () => {
    if (!crm || !id) return;
    const [c, ns] = await Promise.all([crm.fetchContact(id), crm.fetchNotes(id)]);
    setContact(c);
    setNotes(ns);
  }, [crm, id]);

  useEffect(() => {
    if (agentId) load().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const handleAddNote = async () => {
    if (!crm || !id || !noteText.trim() || isSendingNote) return;
    setIsSendingNote(true);
    const note = await crm.addNote(id, { note_type: noteType, content: noteText.trim() });
    if (note) { setNotes((prev) => [note, ...prev]); setNoteText(''); }
    setIsSendingNote(false);
  };

  const handleStatusChange = async (status: CrmConversionStatus) => {
    if (!crm || !id || !contact) return;
    await crm.updateContact(id, { conversion_status: status });
    setContact((c) => c ? { ...c, conversion_status: status } : c);
  };

  const handlePhaseChange = async (phase: CrmPhase) => {
    if (!crm || !id || !contact) return;
    await crm.updateContact(id, { phase });
    setContact((c) => c ? { ...c, phase } : c);
  };

  const handleDelete = () => {
    if (!crm || !id || !contact) return;
    Alert.alert('削除', `「${contact.name}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: async () => { await crm.deleteContact(id); router.back(); } },
    ]);
  };

  if (isLoading || !contact) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">{isLoading ? '読み込み中...' : '顧客が見つかりません'}</Text>
      </SafeAreaView>
    );
  }

  const statusMeta = STATUS_META[contact.conversion_status];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm" numberOfLines={1}>{contact.name}</Text>
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={handleDelete}>
          <Text className="text-red-400 text-sm">削除</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4 gap-3"
          ListHeaderComponent={
            <View className="gap-3 mb-1">
              {/* 顧客情報 */}
              <Card className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-primary">{contact.name}</Text>
                  <Text className={`text-sm font-bold ${statusMeta.color}`}>{statusMeta.label}</Text>
                </View>
                <View className="gap-1.5">
                  {contact.email && <InfoRow label="メール" value={contact.email} />}
                  {contact.phone && <InfoRow label="電話" value={contact.phone} />}
                  {contact.destination_country && <InfoRow label="渡航先" value={contact.destination_country} />}
                  {contact.school_name && <InfoRow label="学校" value={contact.school_name} />}
                  {contact.deal_amount_jpy != null && <InfoRow label="成約額" value={`¥${contact.deal_amount_jpy.toLocaleString()}`} />}
                  {contact.next_follow_up && <InfoRow label="次回フォロー" value={contact.next_follow_up} />}
                </View>
              </Card>

              {/* フェーズ変更 */}
              <Card className="gap-2">
                <Text className="text-xs font-semibold text-muted">フェーズ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                  {PHASES.map((p) => (
                    <Pressable key={p} className={`px-3 py-1.5 rounded-full border ${contact.phase === p ? 'bg-primary border-primary' : 'bg-white border-border'}`} onPress={() => handlePhaseChange(p)}>
                      <Text className={`text-xs font-medium ${contact.phase === p ? 'text-white' : 'text-primary'}`}>{PHASE_LABELS[p]}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Card>

              {/* ステータス変更 */}
              <Card className="gap-2">
                <Text className="text-xs font-semibold text-muted">商談ステータス</Text>
                <View className="flex-row gap-2 flex-wrap">
                  {STATUSES.map((s) => {
                    const meta = STATUS_META[s];
                    const active = contact.conversion_status === s;
                    return (
                      <Pressable key={s} className={`px-3 py-1.5 rounded-full border ${active ? 'bg-primary border-primary' : 'bg-white border-border'}`} onPress={() => handleStatusChange(s)}>
                        <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-primary'}`}>{meta.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              <Text className="text-sm font-semibold text-primary">相談メモ</Text>

              {/* メモ種別 */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                {NOTE_TYPE_OPTIONS.map((t) => (
                  <Pressable key={t.value} className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${noteType === t.value ? 'bg-primary border-primary' : 'bg-white border-border'}`} onPress={() => setNoteType(t.value)}>
                    <Text className="text-xs">{NOTE_ICONS[t.value]}</Text>
                    <Text className={`text-xs font-medium ${noteType === t.value ? 'text-white' : 'text-primary'}`}>{t.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View className="py-8 items-center gap-1">
              <Text className="text-muted text-sm">まだメモがありません</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white border border-border rounded-2xl px-4 py-3 gap-1.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm">{NOTE_ICONS[item.note_type]}</Text>
                <Text className="text-primary text-xs font-semibold">{NOTE_TYPE_OPTIONS.find((t) => t.value === item.note_type)?.label}</Text>
                <Text className="text-muted text-xs">{formatDate(item.created_at)}</Text>
              </View>
              <Text className="text-primary text-sm leading-relaxed">{item.content}</Text>
              {item.follow_up_date && <Text className="text-yellow-600 text-xs">📅 フォロー: {item.follow_up_date}</Text>}
            </View>
          )}
        />

        {/* メモ入力欄 */}
        <View className="px-4 py-3 border-t border-border flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-white border border-border rounded-2xl px-3 py-2.5 text-primary text-sm"
            placeholder="メモを追加..."
            placeholderTextColor="#A0A0A0"
            value={noteText}
            onChangeText={setNoteText}
            returnKeyType="send"
            onSubmitEditing={handleAddNote}
          />
          <Pressable
            className={`w-9 h-9 rounded-full items-center justify-center ${noteText.trim() && !isSendingNote ? 'bg-primary' : 'bg-border'}`}
            onPress={handleAddNote}
            disabled={!noteText.trim() || isSendingNote}
          >
            <Text className="text-white text-sm">→</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useAgentCrmSafe(agentId: string) {
  return useAgentCrm(agentId);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row gap-2">
      <Text className="text-muted text-xs w-20">{label}</Text>
      <Text className="text-primary text-xs flex-1">{value}</Text>
    </View>
  );
}

