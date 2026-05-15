import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { getCategoryIcon, getCategoryLabel, SOURCE_TYPE_ICONS } from '@/lib/bookmark/defaults';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useBookmarkStore } from '@/stores/bookmark';
import type { Bookmark } from '@/types';

export default function BookmarkDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const { categories, updateCategory, deleteBookmark } = useBookmarks();
  const storeBookmark = useBookmarkStore((s) => s.bookmarks.find((b) => b.id === id));

  useEffect(() => {
    if (storeBookmark) {
      setBookmark(storeBookmark);
      setIsLoading(false);
      return;
    }
    if (!id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('bookmarks') as any).select('*').eq('id', id).single().then(({ data }: any) => {
      if (data) setBookmark(data as Bookmark);
      setIsLoading(false);
    });
  }, [id, storeBookmark]);

  const handleDelete = () => {
    Alert.alert('削除', 'このブックマークを削除しますか?', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          await deleteBookmark(id);
          router.back();
        },
      },
    ]);
  };

  const handleChangeCategory = async (key: string) => {
    if (!id) return;
    await updateCategory(id, key);
    setBookmark((prev) => prev ? { ...prev, category: key } : prev);
    setShowCategoryModal(false);
  };

  const handleOpenUrl = async () => {
    if (!bookmark?.source_url) return;
    const canOpen = await Linking.canOpenURL(bookmark.source_url);
    if (canOpen) await Linking.openURL(bookmark.source_url);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (!bookmark) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">ブックマークが見つかりません</Text>
      </SafeAreaView>
    );
  }

  const catIcon = getCategoryIcon(bookmark.category);
  const catLabel = getCategoryLabel(bookmark.category);
  const srcIcon = SOURCE_TYPE_ICONS[bookmark.source_type] ?? '🔗';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable
          className="w-9 h-9 items-center justify-center active:opacity-60"
          onPress={() => router.back()}
          accessibilityLabel="戻る"
        >
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center text-primary font-semibold text-sm" numberOfLines={1}>
          {catIcon} {catLabel}
        </Text>
        <Pressable
          className="w-9 h-9 items-center justify-center active:opacity-60"
          onPress={handleDelete}
          accessibilityLabel="削除"
        >
          <Text className="text-muted text-sm">🗑️</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-8">

        {/* サムネイル */}
        {bookmark.thumbnail_url && (
          <Image
            source={{ uri: bookmark.thumbnail_url }}
            style={{ width: '100%', height: 200 }}
            contentFit="cover"
          />
        )}

        <View className="px-4 py-5 gap-4">

          {/* タイトル + ソース種別 */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm">{srcIcon}</Text>
              <Text className="text-muted text-xs">{bookmark.source_type}</Text>
              {!bookmark.ai_classified && (
                <Text className="text-xs text-muted">· AI 分類中...</Text>
              )}
              {bookmark.ai_classified && bookmark.ai_confidence != null && bookmark.ai_confidence < 0.6 && (
                <Text className="text-xs text-muted">· ⚠️ 仮分類</Text>
              )}
            </View>
            <Text className="text-xl font-bold text-primary leading-snug">
              {bookmark.title ?? '無題'}
            </Text>
          </View>

          {/* AI サマリ / 説明 */}
          {bookmark.description && (
            <View className="bg-white border border-border rounded-xl p-4">
              <Text className="text-xs font-semibold text-muted mb-1.5">✨ AI サマリ</Text>
              <Text className="text-primary text-sm leading-relaxed">{bookmark.description}</Text>
            </View>
          )}

          {/* タグ */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5">
              {bookmark.tags.map((tag) => (
                <View key={tag} className="bg-border rounded-full px-2.5 py-1">
                  <Text className="text-xs text-muted">#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* カテゴリ変更 */}
          <Pressable
            className="flex-row items-center justify-between bg-white border border-border rounded-xl px-4 py-3 active:opacity-70"
            onPress={() => setShowCategoryModal(true)}
            accessibilityLabel="カテゴリを変更"
          >
            <Text className="text-sm text-primary">カテゴリ</Text>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm">{catIcon}</Text>
              <Text className="text-sm text-primary font-medium">{catLabel}</Text>
              <Text className="text-muted text-xs">›</Text>
            </View>
          </Pressable>

          {/* URL を開く */}
          {bookmark.source_url && (
            <Pressable
              className="bg-primary rounded-xl py-3.5 items-center active:opacity-80"
              onPress={handleOpenUrl}
              accessibilityLabel="URLを開く"
            >
              <Text className="text-white font-semibold text-sm">🔗 元の URL を開く</Text>
            </Pressable>
          )}

          {/* 保存日 */}
          <Text className="text-xs text-muted text-center">
            保存: {new Date(bookmark.created_at).toLocaleDateString('ja-JP')}
          </Text>

        </View>
      </ScrollView>

      {/* カテゴリ選択モーダル */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable onPress={() => setShowCategoryModal(false)} accessibilityLabel="閉じる">
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">カテゴリを選ぶ</Text>
            <View className="w-16" />
          </View>
          <ScrollView>
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                className="flex-row items-center px-4 py-4 border-b border-border active:opacity-70"
                onPress={() => handleChangeCategory(cat.key)}
                accessibilityLabel={cat.label}
              >
                <Text className="text-xl mr-3">{cat.icon ?? '📌'}</Text>
                <Text className="text-primary text-sm flex-1">{cat.label}</Text>
                {bookmark.category === cat.key && (
                  <Text className="text-primary text-sm font-bold">✓</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
