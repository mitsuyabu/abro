import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { getCategoryIcon, SOURCE_TYPE_ICONS } from '@/lib/bookmark/defaults';
import type { Bookmark } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  schools: '#EBF4FF',
  living_area: '#E8F5E9',
  jobs: '#FFF8E1',
  leisure: '#FCE4EC',
  visa: '#F3E5F5',
  study: '#E0F7FA',
  safety: '#FFF3E0',
  finance: '#E8EAF6',
  health: '#F1F8E9',
  food: '#FFF9C4',
  transport: '#E3F2FD',
  others: '#F5F5F5',
};

interface Props {
  bookmark: Bookmark;
  onPress: () => void;
}

export function BookmarkCard({ bookmark, onPress }: Props) {
  const bg = CATEGORY_COLORS[bookmark.category] ?? '#F5F5F5';
  const catIcon = getCategoryIcon(bookmark.category);
  const srcIcon = SOURCE_TYPE_ICONS[bookmark.source_type] ?? '🔗';

  return (
    <Pressable
      className="flex-1 m-1.5 rounded-2xl overflow-hidden bg-white border border-border active:opacity-70"
      onPress={onPress}
      accessibilityLabel={bookmark.title ?? 'ブックマーク'}
      style={{ minHeight: 140 }}
    >
      {/* サムネイル or カラー背景 */}
      {bookmark.thumbnail_url ? (
        <Image
          source={{ uri: bookmark.thumbnail_url }}
          style={{ width: '100%', height: 90 }}
          contentFit="cover"
        />
      ) : (
        <View style={{ backgroundColor: bg, height: 90, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32 }}>{catIcon}</Text>
        </View>
      )}

      {/* 情報エリア */}
      <View className="p-2.5 gap-1">
        <Text className="text-primary text-xs font-medium leading-tight" numberOfLines={2}>
          {bookmark.title ?? '無題'}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-muted text-xs">{srcIcon} {bookmark.source_type === 'video' ? '動画' : bookmark.source_type === 'note' ? 'メモ' : bookmark.source_type === 'image' ? '画像' : 'URL'}</Text>
          {!bookmark.ai_classified && (
            <Text className="text-xs text-muted">⏳</Text>
          )}
          {bookmark.ai_classified && bookmark.ai_confidence != null && bookmark.ai_confidence < 0.6 && (
            <Text className="text-xs text-muted">⚠️</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
