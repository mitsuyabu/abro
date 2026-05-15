import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useB2B } from '@/hooks/useB2B';
import type { B2BClient, B2BClientType } from '@/types';

const CLIENT_TYPES: Array<{ value: B2BClientType; emoji: string; label: string }> = [
  { value: 'school', emoji: '🎓', label: '語学学校' },
  { value: 'agency', emoji: '🏢', label: '留学エージェント' },
  { value: 'other', emoji: '📋', label: 'その他' },
];

const PLAN_BADGES: Record<B2BClient['plan'], { label: string; color: string }> = {
  free:       { label: 'Free',       color: 'bg-gray-100 text-gray-600' },
  starter:    { label: 'Starter',    color: 'bg-blue-100 text-blue-700' },
  pro:        { label: 'Pro',        color: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', color: 'bg-yellow-100 text-yellow-700' },
};

export default function B2BIndexScreen() {
  const router = useRouter();
  const { fetchMyClients, createClient } = useB2B();

  const [clients, setClients] = useState<B2BClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchMyClients();
    setClients(data);
  }, [fetchMyClients]);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">B2B ポータル</Text>
        <Pressable
          className="px-3 py-1.5 bg-primary rounded-full active:opacity-80"
          onPress={() => setShowCreate(true)}
          accessibilityLabel="クライアントを追加"
        >
          <Text className="text-white text-xs font-semibold">+ 追加</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-sm">読み込み中...</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4 gap-3"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-1 gap-2">
              <Text className="text-blue-700 font-bold text-sm">🏫 学校・エージェント向け SaaS</Text>
              <Text className="text-blue-600 text-xs leading-relaxed">
                AI チャットウィジェットを学校サイトに埋め込み、入学相談を自動化。
                興味あるユーザーを Abro に誘導し、成約率を高めます。
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="py-16 items-center gap-3">
              <Text className="text-4xl">🏫</Text>
              <Text className="text-primary font-semibold text-base">クライアントがありません</Text>
              <Text className="text-muted text-sm text-center leading-relaxed">
                学校・エージェントを登録して{'\n'}AI ウィジェットを発行しましょう
              </Text>
              <Pressable
                className="mt-2 bg-primary rounded-xl px-6 py-3 active:opacity-80"
                onPress={() => setShowCreate(true)}
              >
                <Text className="text-white text-sm font-semibold">クライアントを追加する</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const typeInfo = CLIENT_TYPES.find((t) => t.value === item.type);
            const planBadge = PLAN_BADGES[item.plan];
            return (
              <Pressable
                className="bg-white border border-border rounded-2xl p-4 gap-2 active:opacity-70"
                onPress={() => router.push(`/b2b/${item.id}` as never)}
                accessibilityLabel={item.name}
              >
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text className="text-2xl">{typeInfo?.emoji ?? '🏢'}</Text>
                    <View className="flex-1 gap-0.5">
                      <Text className="text-primary font-semibold text-sm">{item.name}</Text>
                      <Text className="text-muted text-xs">{typeInfo?.label}{item.country ? ` · ${item.country}` : ''}{item.city ? ` / ${item.city}` : ''}</Text>
                    </View>
                  </View>
                  <View className={`rounded-full px-2 py-0.5 ${planBadge.color}`}>
                    <Text className="text-xs font-semibold">{planBadge.label}</Text>
                  </View>
                </View>
                {item.description && (
                  <Text className="text-muted text-xs leading-relaxed" numberOfLines={2}>{item.description}</Text>
                )}
                <View className="flex-row items-center gap-1">
                  <Text className={`text-xs font-medium ${item.is_active ? 'text-green-600' : 'text-muted'}`}>
                    {item.is_active ? '● 稼働中' : '○ 停止中'}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <CreateClientModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(client) => {
          setClients((prev) => [client, ...prev]);
          setShowCreate(false);
          router.push(`/b2b/${client.id}` as never);
        }}
        createClient={createClient}
      />
    </SafeAreaView>
  );
}

function CreateClientModal({ visible, onClose, onCreated, createClient }: {
  visible: boolean;
  onClose: () => void;
  onCreated: (c: B2BClient) => void;
  createClient: ReturnType<typeof useB2B>['createClient'];
}) {
  const [type, setType] = useState<B2BClientType>('school');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    const client = await createClient({
      name: name.trim(), type,
      country: country.trim() || undefined,
      city: city.trim() || undefined,
      website_url: website.trim() || undefined,
      contact_email: email.trim() || undefined,
      description: description.trim() || undefined,
    });
    setIsSaving(false);
    if (client) { setName(''); setCountry(''); setCity(''); setWebsite(''); setEmail(''); setDescription(''); onCreated(client); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={onClose}>
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">クライアントを追加</Text>
            <Pressable className={`px-4 py-1.5 rounded-full ${canSave && !isSaving ? 'bg-primary' : 'bg-border'}`} onPress={handleSave} disabled={!canSave || isSaving}>
              <Text className={`text-xs font-semibold ${canSave && !isSaving ? 'text-white' : 'text-muted'}`}>{isSaving ? '保存中...' : '保存'}</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            <Text className="text-xs font-semibold text-muted mb-2">種別</Text>
            <View className="flex-row gap-2 mb-4">
              {CLIENT_TYPES.map((t) => (
                <Pressable key={t.value} className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${type === t.value ? 'bg-primary border-primary' : 'bg-white border-border'}`} onPress={() => setType(t.value)}>
                  <Text className="text-xs">{t.emoji}</Text>
                  <Text className={`text-xs font-medium ${type === t.value ? 'text-white' : 'text-primary'}`}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-xs font-semibold text-muted mb-1.5">名前 *</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="例: Sydney Language Academy" placeholderTextColor="#A0A0A0" value={name} onChangeText={setName} maxLength={100} />
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-muted mb-1.5">国</Text>
                <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm" placeholder="Australia" placeholderTextColor="#A0A0A0" value={country} onChangeText={setCountry} maxLength={50} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-muted mb-1.5">都市</Text>
                <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm" placeholder="Sydney" placeholderTextColor="#A0A0A0" value={city} onChangeText={setCity} maxLength={50} />
              </View>
            </View>
            <Text className="text-xs font-semibold text-muted mb-1.5">ウェブサイト</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="https://example.com" placeholderTextColor="#A0A0A0" value={website} onChangeText={setWebsite} maxLength={200} keyboardType="url" autoCapitalize="none" />
            <Text className="text-xs font-semibold text-muted mb-1.5">担当者メール</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="contact@example.com" placeholderTextColor="#A0A0A0" value={email} onChangeText={setEmail} maxLength={200} keyboardType="email-address" autoCapitalize="none" />
            <Text className="text-xs font-semibold text-muted mb-1.5">概要</Text>
            <TextInput className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4" placeholder="学校・エージェントの特徴など" placeholderTextColor="#A0A0A0" value={description} onChangeText={setDescription} multiline numberOfLines={3} maxLength={300} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

