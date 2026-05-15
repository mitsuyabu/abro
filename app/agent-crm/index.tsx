import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAgentCrm } from '@/hooks/useAgentCrm';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Agent, AgentAutoReply, AgentCrmContact, CrmConversionStatus } from '@/types';

const STATUS_META: Record<CrmConversionStatus, { label: string; color: string; bg: string }> = {
  prospect:  { label: '見込み',   color: 'text-blue-700',   bg: 'bg-blue-50' },
  active:    { label: '商談中',   color: 'text-yellow-700', bg: 'bg-yellow-50' },
  converted: { label: '成約',     color: 'text-green-700',  bg: 'bg-green-50' },
  lost:      { label: '失注',     color: 'text-gray-500',   bg: 'bg-gray-50' },
};

const PHASE_LABELS: Record<string, string> = {
  considering: '検討中', preparing: '準備中', abroad: '渡航中', returned: '帰国済',
};

export default function AgentCrmScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [contacts, setContacts] = useState<AgentCrmContact[]>([]);
  const [autoReply, setAutoReply] = useState<AgentAutoReply | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CrmConversionStatus | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAutoReply, setShowAutoReply] = useState(false);

  useEffect(() => {
    loadAgent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAgent = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('agent_counselors')
      .select('agent_id')
      .eq('user_id', user.id)
      .single();
    if (data?.agent_id) {
      const { data: agentData } = await (supabase as any)
        .from('agents')
        .select('*')
        .eq('id', data.agent_id)
        .single();
      if (agentData) { setAgent(agentData as Agent); }
    }
    setIsLoading(false);
  };

  const crm = agent ? useAgentCrmSafe(agent.id) : null;

  const load = useCallback(async () => {
    if (!crm) return;
    const [cs, ar] = await Promise.all([crm.fetchContacts(), crm.fetchAutoReply()]);
    setContacts(cs);
    setAutoReply(ar);
  }, [crm]);

  useEffect(() => {
    if (agent) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const filtered = selectedStatus ? contacts.filter((c) => c.conversion_status === selectedStatus) : contacts;

  const summary = {
    total: contacts.length,
    converted: contacts.filter((c) => c.conversion_status === 'converted').length,
    totalDeal: contacts.filter((c) => c.conversion_status === 'converted').reduce((s, c) => s + (c.deal_amount_jpy ?? 0), 0),
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (!agent) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
            <Text className="text-primary text-lg">←</Text>
          </Pressable>
          <Text className="flex-1 text-center font-semibold text-primary text-sm">エージェント CRM</Text>
          <View className="w-9" />
        </View>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-3xl">🏢</Text>
          <Text className="text-primary font-semibold text-base">エージェントアカウントが必要です</Text>
          <Text className="text-muted text-sm text-center">エージェントの担当者として登録されているアカウントでご利用ください</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">エージェント CRM</Text>
        <Pressable className="px-3 py-1.5 bg-primary rounded-full active:opacity-80" onPress={() => setShowAddContact(true)}>
          <Text className="text-white text-xs font-semibold">+ 顧客</Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4 gap-3"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View className="gap-3 mb-1">
            {/* 統計サマリー */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white border border-border rounded-2xl p-3 items-center gap-0.5">
                <Text className="text-xl font-bold text-primary">{summary.total}</Text>
                <Text className="text-muted text-xs">総顧客数</Text>
              </View>
              <View className="flex-1 bg-white border border-border rounded-2xl p-3 items-center gap-0.5">
                <Text className="text-xl font-bold text-green-600">{summary.converted}</Text>
                <Text className="text-muted text-xs">成約数</Text>
              </View>
              <View className="flex-1 bg-white border border-border rounded-2xl p-3 items-center gap-0.5">
                <Text className="text-lg font-bold text-primary">¥{(summary.totalDeal / 10000).toFixed(0)}万</Text>
                <Text className="text-muted text-xs">成約総額</Text>
              </View>
            </View>

            {/* AI 自動応答バナー */}
            <Pressable
              className={`flex-row items-center justify-between rounded-2xl p-3 border ${autoReply?.is_enabled ? 'bg-green-50 border-green-200' : 'bg-white border-border'}`}
              onPress={() => setShowAutoReply(true)}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">🤖</Text>
                <View className="gap-0.5">
                  <Text className="text-primary text-xs font-semibold">AI 夜間自動応答</Text>
                  <Text className="text-muted text-xs">{autoReply?.is_enabled ? `${autoReply.business_hours_start}〜${autoReply.business_hours_end} 以外は自動対応中` : '設定する'}</Text>
                </View>
              </View>
              <Text className="text-muted text-sm">›</Text>
            </Pressable>

            {/* ステータスフィルター */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              <Pressable
                className={`px-3 py-1.5 rounded-full border ${!selectedStatus ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                onPress={() => setSelectedStatus(null)}
              >
                <Text className={`text-xs font-medium ${!selectedStatus ? 'text-white' : 'text-primary'}`}>すべて ({contacts.length})</Text>
              </Pressable>
              {(Object.keys(STATUS_META) as CrmConversionStatus[]).map((s) => {
                const meta = STATUS_META[s];
                const count = contacts.filter((c) => c.conversion_status === s).length;
                const active = selectedStatus === s;
                return (
                  <Pressable
                    key={s}
                    className={`px-3 py-1.5 rounded-full border ${active ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                    onPress={() => setSelectedStatus(active ? null : s)}
                  >
                    <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-primary'}`}>{meta.label} ({count})</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View className="py-12 items-center gap-2">
            <Text className="text-3xl">👤</Text>
            <Text className="text-muted text-sm">顧客がいません</Text>
          </View>
        }
        renderItem={({ item }) => {
          const s = STATUS_META[item.conversion_status];
          return (
            <Pressable
              className="bg-white border border-border rounded-2xl p-4 gap-2 active:opacity-70"
              onPress={() => router.push(`/agent-crm/${item.id}` as never)}
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-0.5">
                  <Text className="text-primary font-semibold text-sm">{item.name}</Text>
                  <Text className="text-muted text-xs">
                    {PHASE_LABELS[item.phase]}{item.destination_country ? ` · ${item.destination_country}` : ''}{item.school_name ? ` · ${item.school_name}` : ''}
                  </Text>
                </View>
                <View className={`rounded-full px-2 py-0.5 ${s.bg}`}>
                  <Text className={`text-xs font-semibold ${s.color}`}>{s.label}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                {item.deal_amount_jpy != null && (
                  <Text className="text-primary text-xs font-semibold">¥{item.deal_amount_jpy.toLocaleString()}</Text>
                )}
                {item.next_follow_up && (
                  <Text className="text-yellow-600 text-xs">📅 {item.next_follow_up}</Text>
                )}
                {item.tags.map((tag) => (
                  <View key={tag} className="bg-gray-100 rounded-full px-2 py-0.5">
                    <Text className="text-gray-600 text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        }}
      />

      {crm && (
        <>
          <AddContactModal
            visible={showAddContact}
            onClose={() => setShowAddContact(false)}
            onAdded={(c) => { setContacts((prev) => [c, ...prev]); setShowAddContact(false); }}
            createContact={crm.createContact}
          />
          <AutoReplyModal
            visible={showAutoReply}
            current={autoReply}
            onClose={() => setShowAutoReply(false)}
            onSaved={(ar) => { setAutoReply(ar); setShowAutoReply(false); }}
            upsertAutoReply={crm.upsertAutoReply}
            agentId={agent.id}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function useAgentCrmSafe(agentId: string) {
  return useAgentCrm(agentId);
}

/* ── 顧客追加モーダル ── */
function AddContactModal({ visible, onClose, onAdded, createContact }: {
  visible: boolean;
  onClose: () => void;
  onAdded: (c: AgentCrmContact) => void;
  createContact: ReturnType<typeof useAgentCrm>['createContact'];
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [school, setSchool] = useState('');
  const [deal, setDeal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    const c = await createContact({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      destination_country: country.trim() || undefined,
      school_name: school.trim() || undefined,
      deal_amount_jpy: deal.trim() ? parseInt(deal.replace(/,/g, ''), 10) : undefined,
    });
    setIsSaving(false);
    if (c) { setName(''); setEmail(''); setPhone(''); setCountry(''); setSchool(''); setDeal(''); onAdded(c); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={onClose}><Text className="text-muted text-sm">キャンセル</Text></Pressable>
            <Text className="font-semibold text-primary text-sm">顧客を追加</Text>
            <Pressable className={`px-4 py-1.5 rounded-full ${canSave && !isSaving ? 'bg-primary' : 'bg-border'}`} onPress={handleSave} disabled={!canSave || isSaving}>
              <Text className={`text-xs font-semibold ${canSave && !isSaving ? 'text-white' : 'text-muted'}`}>{isSaving ? '保存中...' : '保存'}</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            <Text className="text-xs font-semibold text-muted mb-1.5">氏名 *</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="例: 田中 花子" placeholderTextColor="#A0A0A0" value={name} onChangeText={setName} maxLength={50} />
            <Text className="text-xs font-semibold text-muted mb-1.5">メールアドレス</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="hanako@example.com" placeholderTextColor="#A0A0A0" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={200} />
            <Text className="text-xs font-semibold text-muted mb-1.5">電話番号</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="+81-90-0000-0000" placeholderTextColor="#A0A0A0" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={20} />
            <Text className="text-xs font-semibold text-muted mb-1.5">渡航先</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="例: オーストラリア" placeholderTextColor="#A0A0A0" value={country} onChangeText={setCountry} maxLength={50} />
            <Text className="text-xs font-semibold text-muted mb-1.5">学校名</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="例: Sydney Language Academy" placeholderTextColor="#A0A0A0" value={school} onChangeText={setSchool} maxLength={100} />
            <Text className="text-xs font-semibold text-muted mb-1.5">成約想定額 (円)</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="例: 500000" placeholderTextColor="#A0A0A0" value={deal} onChangeText={setDeal} keyboardType="numeric" maxLength={10} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/* ── 自動応答設定モーダル ── */
function AutoReplyModal({ visible, current, onClose, onSaved, upsertAutoReply, agentId }: {
  visible: boolean;
  current: AgentAutoReply | null;
  onClose: () => void;
  onSaved: (ar: AgentAutoReply) => void;
  upsertAutoReply: ReturnType<typeof useAgentCrm>['upsertAutoReply'];
  agentId: string;
}) {
  const [isEnabled, setIsEnabled] = useState(current?.is_enabled ?? false);
  const [aiEnabled, setAiEnabled] = useState(current?.ai_enabled ?? true);
  const [start, setStart] = useState(current?.business_hours_start ?? '09:00');
  const [end, setEnd] = useState(current?.business_hours_end ?? '18:00');
  const [message, setMessage] = useState(current?.auto_reply_message ?? 'ただいま営業時間外です。翌営業日にご連絡いたします。');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await upsertAutoReply({ is_enabled: isEnabled, ai_enabled: aiEnabled, business_hours_start: start, business_hours_end: end, auto_reply_message: message });
    setIsSaving(false);
    onSaved({ agent_id: agentId, is_enabled: isEnabled, ai_enabled: aiEnabled, business_hours_start: start, business_hours_end: end, timezone: current?.timezone ?? 'Asia/Tokyo', auto_reply_message: message, updated_at: new Date().toISOString() });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={onClose}><Text className="text-muted text-sm">キャンセル</Text></Pressable>
            <Text className="font-semibold text-primary text-sm">AI 自動応答設定</Text>
            <Pressable className={`px-4 py-1.5 rounded-full ${!isSaving ? 'bg-primary' : 'bg-border'}`} onPress={handleSave} disabled={isSaving}>
              <Text className={`text-xs font-semibold ${!isSaving ? 'text-white' : 'text-muted'}`}>{isSaving ? '保存中...' : '保存'}</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            <View className="flex-row items-center justify-between bg-white border border-border rounded-xl px-4 py-3 mb-4">
              <View className="gap-0.5">
                <Text className="text-primary text-sm font-medium">自動応答を有効にする</Text>
                <Text className="text-muted text-xs">営業時間外に自動でメッセージ送信</Text>
              </View>
              <Switch value={isEnabled} onValueChange={setIsEnabled} trackColor={{ true: '#1A1A1A', false: '#E8E8E8' }} thumbColor="#FFFFFF" />
            </View>
            <View className="flex-row items-center justify-between bg-white border border-border rounded-xl px-4 py-3 mb-4">
              <View className="gap-0.5">
                <Text className="text-primary text-sm font-medium">AI 一次対応を使う</Text>
                <Text className="text-muted text-xs">AI が内容に合わせた返答を生成</Text>
              </View>
              <Switch value={aiEnabled} onValueChange={setAiEnabled} trackColor={{ true: '#1A1A1A', false: '#E8E8E8' }} thumbColor="#FFFFFF" />
            </View>
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-muted mb-1.5">営業開始時刻</Text>
                <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm" placeholder="09:00" placeholderTextColor="#A0A0A0" value={start} onChangeText={setStart} maxLength={5} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-muted mb-1.5">営業終了時刻</Text>
                <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm" placeholder="18:00" placeholderTextColor="#A0A0A0" value={end} onChangeText={setEnd} maxLength={5} />
              </View>
            </View>
            <Text className="text-xs font-semibold text-muted mb-1.5">自動返答メッセージ</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm" placeholder="営業時間外のメッセージ" placeholderTextColor="#A0A0A0" value={message} onChangeText={setMessage} multiline numberOfLines={4} maxLength={300} style={{ minHeight: 90, textAlignVertical: 'top' }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

