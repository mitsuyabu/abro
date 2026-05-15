import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

import { AddBookmarkModal } from '@/components/bookmark/AddBookmarkModal';
import { BookmarkCard } from '@/components/bookmark/BookmarkCard';
import { CategoryTabs } from '@/components/bookmark/CategoryTabs';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useBookmarkStore } from '@/stores/bookmark';
import type { Bookmark } from '@/types';

export default function SavedScreen() {
  const router = useRouter();
  const { fetchBookmarks, createFromUrl, createFromNote, createFromImage } = useBookmarks();
  const { bookmarks, categories, selectedCategory, setSelectedCategory, isLoading } = useBookmarkStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // カテゴリ別件数
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const bm of bookmarks) {
      map[bm.category] = (map[bm.category] ?? 0) + 1;
    }
    return map;
  }, [bookmarks]);

  // 表示するブックマーク
  const displayed = useMemo(() =>
    selectedCategory
      ? bookmarks.filter((b) => b.category === selectedCategory)
      : bookmarks,
    [bookmarks, selectedCategory],
  );

  const handleSaveUrl = useCallback(async (url: string) => {
    setSaveStatus('🔍 URLを解析中...');
    const bm = await createFromUrl(url);
    setSaveStatus(bm ? '✅ 保存しました！AI が分類中です...' : '❌ 保存に失敗しました');
    setTimeout(() => setSaveStatus(null), 3000);
  }, [createFromUrl]);

  const handleSaveNote = useCallback(async (title: string, content: string) => {
    const bm = await createFromNote(title, content);
    setSaveStatus(bm ? '✅ 保存しました！' : '❌ 保存に失敗しました');
    setTimeout(() => setSaveStatus(null), 2000);
  }, [createFromNote]);

  const handleSaveImage = useCallback(async (uri: string, note?: string) => {
    const bm = await createFromImage(uri, note);
    setSaveStatus(bm ? '✅ 保存しました！' : '❌ 保存に失敗しました');
    setTimeout(() => setSaveStatus(null), 2000);
  }, [createFromImage]);

  const handleCategorySelect = useCallback((key: string | null) => {
    setSelectedCategory(key);
  }, [setSelectedCategory]);

  // AI からの提案(件数ベースで静的生成)
  const aiSuggestion = useMemo(() => {
    const topCat = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!topCat || topCat[1] < 3) return null;
    const cat = categories.find((c) => c.key === topCat[0]);
    if (!cat) return null;
    return `${cat.icon ?? '📌'} 「${cat.label}」が${topCat[1]}件あります。AI に比較・まとめを依頼しますか？`;
  }, [counts, categories]);

  const renderItem = useCallback(({ item, index }: { item: Bookmark; index: number }) => {
    // FlatList numColumns=2 のための偶数奇数対応
    if (index % 2 === 1) return null;
    const right = displayed[index + 1];
    return (
      <View className="flex-row px-2">
        <BookmarkCard
          bookmark={item}
          onPress={() => router.push(`/bookmark/${item.id}` as never)}
        />
        {right ? (
          <BookmarkCard
            bookmark={right}
            onPress={() => router.push(`/bookmark/${right.id}` as never)}
          />
        ) : (
          <View className="flex-1 m-1.5" />
        )}
      </View>
    );
  }, [displayed, router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-primary">保存した情報</Text>
        <Pressable
          className="w-9 h-9 bg-primary rounded-full items-center justify-center active:opacity-80"
          onPress={() => setShowAddModal(true)}
          accessibilityLabel="情報を追加"
        >
          <Text className="text-white font-bold text-lg">+</Text>
        </Pressable>
      </View>

      {/* カテゴリタブ */}
      <CategoryTabs
        categories={categories}
        selected={selectedCategory}
        counts={counts}
        onSelect={handleCategorySelect}
      />

      {/* 保存ステータス */}
      {saveStatus && (
        <View className="mx-4 mb-2 bg-primary/10 rounded-xl px-4 py-2">
          <Text className="text-primary text-xs text-center">{saveStatus}</Text>
        </View>
      )}

      {/* コンテンツ */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-sm">読み込み中...</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Text className="text-4xl">🔖</Text>
          <Text className="text-primary font-medium text-center">
            {selectedCategory ? `このカテゴリにはまだ保存がありません` : '保存した情報がありません'}
          </Text>
          <Text className="text-muted text-sm text-center">
            右上の＋ボタンから URL・メモ・画像を保存できます。
            AI が自動でカテゴリ分類します。
          </Text>
          <Pressable
            className="bg-primary rounded-xl px-6 py-3 active:opacity-80"
            onPress={() => setShowAddModal(true)}
            accessibilityLabel="情報を保存する"
          >
            <Text className="text-white font-semibold text-sm">📌 情報を保存する</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={displayed.filter((_, i) => i % 2 === 0)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="pb-6 pt-2"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            aiSuggestion ? (
              <View className="mx-4 mt-4 bg-white border border-border rounded-2xl p-4 gap-2">
                <Text className="text-xs font-semibold text-primary">✨ AI からの提案</Text>
                <Text className="text-sm text-primary">{aiSuggestion}</Text>
                <View className="flex-row gap-2 mt-1">
                  <Pressable
                    className="flex-1 bg-primary rounded-xl py-2.5 items-center active:opacity-80"
                    onPress={() => {
                      const cat = categories.find((c) => counts[c.key] === Math.max(...Object.values(counts)));
                      if (cat) {
                        router.push({
                          pathname: '/chat/[id]' as never,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          params: { id: 'new', initialMessage: `「${cat.label}」のブックマークを${counts[cat.key]}件保存しています。比較・まとめをお願いします。` } as any,
                        });
                      }
                    }}
                    accessibilityLabel="比較する"
                  >
                    <Text className="text-white text-xs font-semibold">AI に比較してもらう</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 border border-border rounded-xl py-2.5 items-center active:opacity-70"
                    onPress={() => {}}
                    accessibilityLabel="後で"
                  >
                    <Text className="text-muted text-xs">後で</Text>
                  </Pressable>
                </View>
              </View>
            ) : null
          }
        />
      )}

      <AddBookmarkModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaveUrl={handleSaveUrl}
        onSaveNote={handleSaveNote}
        onSaveImage={handleSaveImage}
      />
    </SafeAreaView>
  );
}
