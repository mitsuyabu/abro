import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { AskModal } from '@/components/qa/AskModal';
import { QaCard, QA_CATEGORY_META } from '@/components/qa/QaCard';
import { useQa } from '@/hooks/useQa';
import type { QaCategory, QaThread } from '@/types';

const ALL_CATEGORIES: Array<{ value: QaCategory | null; emoji: string; label: string }> = [
  { value: null, emoji: '💬', label: 'すべて' },
  ...(['visa', 'life', 'school', 'work', 'money', 'housing', 'accident', 'other'] as QaCategory[]).map((c) => ({
    value: c,
    emoji: QA_CATEGORY_META[c].emoji,
    label: QA_CATEGORY_META[c].label,
  })),
];

export default function QaListScreen() {
  const router = useRouter();
  const { fetchThreads } = useQa();
  const [threads, setThreads] = useState<QaThread[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QaCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);

  const load = useCallback(async (cat?: QaCategory | null) => {
    const data = await fetchThreads(cat ?? undefined);
    setThreads(data);
  }, [fetchThreads]);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load(selectedCategory);
    setIsRefreshing(false);
  };

  const handleCategoryFilter = async (cat: QaCategory | null) => {
    setSelectedCategory(cat);
    await load(cat);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">先輩Q&A</Text>
        <Pressable
          className="px-3 py-1.5 bg-primary rounded-full active:opacity-80"
          onPress={() => setShowAskModal(true)}
        >
          <Text className="text-white text-xs font-semibold">質問する</Text>
        </Pressable>
      </View>

      {/* カテゴリフィルター */}
      <View className="border-b border-border">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 py-2.5 gap-2">
          {ALL_CATEGORIES.map((c) => {
            const active = selectedCategory === c.value;
            return (
              <Pressable
                key={c.value ?? 'all'}
                className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${active ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                onPress={() => handleCategoryFilter(c.value)}
              >
                <Text className="text-xs">{c.emoji}</Text>
                <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-primary'}`}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Q&A リスト */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-sm">読み込み中...</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4 gap-3"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            /* おすすめカテゴリ（失敗談ハイライト） */
            selectedCategory == null ? (
              <Pressable
                className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-1 flex-row items-center gap-3 active:opacity-70"
                onPress={() => handleCategoryFilter('accident')}
              >
                <Text className="text-3xl">😅</Text>
                <View className="flex-1">
                  <Text className="text-red-700 font-bold text-sm">やらかし・失敗談コーナー</Text>
                  <Text className="text-red-500 text-xs mt-0.5">先輩たちの失敗から学ぼう。投稿すると同じ失敗をする人が減ります！</Text>
                </View>
                <Text className="text-red-400">›</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View className="py-20 items-center gap-3">
              <Text className="text-4xl">🙋</Text>
              <Text className="text-primary font-semibold text-base">まだ質問がありません</Text>
              <Text className="text-muted text-sm text-center leading-relaxed">
                留学・ワーホリで気になることを{'\n'}先輩に聞いてみましょう！
              </Text>
              <Pressable className="mt-2 bg-primary rounded-xl px-6 py-3 active:opacity-80" onPress={() => setShowAskModal(true)}>
                <Text className="text-white text-sm font-semibold">質問してみる</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <QaCard thread={item} onPress={() => router.push(`/qa/${item.id}` as never)} />
          )}
        />
      )}

      <AskModal
        visible={showAskModal}
        onClose={() => setShowAskModal(false)}
        onAsked={(thread) => {
          setThreads((prev) => [thread, ...prev]);
          setShowAskModal(false);
          router.push(`/qa/${thread.id}` as never);
        }}
      />
    </SafeAreaView>
  );
}
