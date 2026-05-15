import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EarningCard } from '@/components/creator/EarningCard';
import { useCreator } from '@/hooks/useCreator';
import type { CreatorEarning, CreatorProfile } from '@/types';

export default function CreatorScreen() {
  const router = useRouter();
  const { fetchProfile, registerCreator, fetchEarnings } = useCreator();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [earnings, setEarnings] = useState<CreatorEarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, e] = await Promise.all([fetchProfile(), fetchEarnings()]);
    setProfile(p);
    setEarnings(e);
  }, [fetchProfile, fetchEarnings]);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const handleRegister = async () => {
    if (!displayName.trim() || isSaving) return;
    setIsSaving(true);
    const p = await registerCreator(displayName.trim(), bio.trim() || undefined);
    setIsSaving(false);
    if (p) {
      setProfile(p);
      setShowRegister(false);
    } else {
      Alert.alert('エラー', '登録に失敗しました。もう一度お試しください。');
    }
  };

  const totalEarned = profile?.total_earned_jpy ?? 0;
  const pending = profile?.pending_payout_jpy ?? 0;
  const paidTotal = earnings.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount_jpy, 0);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">クリエイター</Text>
        <View className="w-9" />
      </View>

      {!profile && !showRegister ? (
        /* ── 未登録 ── */
        <View className="flex-1 px-6 py-12 items-center gap-6">
          <Text className="text-5xl">💰</Text>
          <View className="gap-2 items-center">
            <Text className="text-primary font-bold text-xl text-center">クリエイターになる</Text>
            <Text className="text-muted text-sm text-center leading-relaxed">
              プランやアフィリエイトリンクをシェアして{'\n'}報酬を受け取ることができます
            </Text>
          </View>
          <View className="w-full gap-3 bg-white border border-border rounded-2xl p-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">🔗</Text>
              <Text className="text-primary text-sm">アフィリエイトリンクのクリック報酬</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">📋</Text>
              <Text className="text-primary text-sm">プランが参照されると報酬発生</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">🎓</Text>
              <Text className="text-primary text-sm">エージェント紹介でキックバック</Text>
            </View>
          </View>
          <Pressable
            className="w-full bg-primary rounded-xl py-3.5 items-center active:opacity-80"
            onPress={() => setShowRegister(true)}
          >
            <Text className="text-white font-semibold">クリエイター登録する</Text>
          </Pressable>
        </View>
      ) : showRegister ? (
        /* ── 登録フォーム ── */
        <View className="flex-1 px-6 py-6 gap-4">
          <Text className="text-xs font-semibold text-muted">表示名 *</Text>
          <TextInput
            className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm"
            placeholder="例: Yuriのシドニー留学記"
            placeholderTextColor="#A0A0A0"
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={50}
          />
          <Text className="text-xs font-semibold text-muted">自己紹介</Text>
          <TextInput
            className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm"
            placeholder="どんな留学をしたか、得意な情報など"
            placeholderTextColor="#A0A0A0"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={300}
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />
          <Pressable
            className={`rounded-xl py-3.5 items-center ${displayName.trim() && !isSaving ? 'bg-primary' : 'bg-border'}`}
            onPress={handleRegister}
            disabled={!displayName.trim() || isSaving}
          >
            <Text className={`font-semibold ${displayName.trim() && !isSaving ? 'text-white' : 'text-muted'}`}>
              {isSaving ? '登録中...' : '登録する'}
            </Text>
          </Pressable>
          <Pressable onPress={() => setShowRegister(false)} className="items-center">
            <Text className="text-muted text-sm">キャンセル</Text>
          </Pressable>
        </View>
      ) : (
        /* ── ダッシュボード ── */
        <FlatList
          data={earnings}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4 gap-3"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <View className="gap-3 mb-2">
              {/* サマリーカード */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-white border border-border rounded-2xl p-4 items-center gap-1">
                  <Text className="text-2xl font-bold text-primary">¥{totalEarned.toLocaleString()}</Text>
                  <Text className="text-muted text-xs">累計収益</Text>
                </View>
                <View className="flex-1 bg-white border border-border rounded-2xl p-4 items-center gap-1">
                  <Text className="text-2xl font-bold text-yellow-600">¥{pending.toLocaleString()}</Text>
                  <Text className="text-muted text-xs">支払待ち</Text>
                </View>
              </View>
              <View className="bg-white border border-border rounded-2xl p-4 items-center gap-1">
                <Text className="text-xl font-bold text-green-600">¥{paidTotal.toLocaleString()}</Text>
                <Text className="text-muted text-xs">支払済み合計</Text>
              </View>

              {/* プロフィール情報 */}
              <View className="bg-white border border-border rounded-2xl p-4 gap-1">
                <Text className="text-primary font-semibold text-sm">{profile!.display_name}</Text>
                {profile!.bio && <Text className="text-muted text-xs">{profile!.bio}</Text>}
              </View>

              <Text className="text-sm font-semibold text-primary">報酬履歴</Text>
            </View>
          }
          ListEmptyComponent={
            <View className="py-12 items-center gap-2">
              <Text className="text-3xl">📭</Text>
              <Text className="text-muted text-sm">まだ報酬はありません</Text>
              <Text className="text-muted text-xs text-center">プランやアフィリエイトリンクをシェアしましょう</Text>
            </View>
          }
          renderItem={({ item }) => <EarningCard earning={item} />}
        />
      )}
    </SafeAreaView>
  );
}
