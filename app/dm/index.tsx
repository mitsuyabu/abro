import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

import { useDm } from '@/hooks/useDm';
import type { DmThread } from '@/types';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

export default function DmListScreen() {
  const router = useRouter();
  const { fetchThreads } = useDm();
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchThreads();
    setThreads(data);
    setIsLoading(false);
  }, [fetchThreads]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">ダイレクトメッセージ</Text>
        <View className="w-9" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-sm">読み込み中...</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="flex-1 py-20 items-center gap-2">
              <Text className="text-3xl">💬</Text>
              <Text className="text-primary font-semibold text-base">まだDMがありません</Text>
              <Text className="text-muted text-sm text-center px-8">
                ユーザーのプロフィールから{'\n'}DM を送ることができます
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const other = item.other_user;
            const initial = other?.nickname?.charAt(0)?.toUpperCase() ?? '?';
            return (
              <Pressable
                className="flex-row items-center px-4 py-4 border-b border-border active:opacity-60"
                onPress={() => router.push(`/dm/${item.id}` as never)}
                accessibilityLabel={other?.nickname ?? 'DM'}
              >
                <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Text className="text-xl font-bold text-primary">{initial}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-primary font-semibold text-sm">{other?.nickname ?? '名無し'}</Text>
                    <Text className="text-muted text-xs">{formatRelativeTime(item.last_message_at)}</Text>
                  </View>
                  {item.last_message_preview && (
                    <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                      {item.last_message_preview}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
