import { Pressable, Text, View } from 'react-native';
import type { Community } from '@/types';

interface CommunityCardProps {
  community: Community;
  onPress: () => void;
  onJoin?: () => void;
}

export function CommunityCard({ community, onPress, onJoin }: CommunityCardProps) {
  return (
    <Pressable
      className="bg-white border border-border rounded-2xl p-4 gap-2 active:opacity-70"
      onPress={onPress}
      accessibilityLabel={community.name}
    >
      <View className="flex-row items-start gap-3">
        {/* アイコン */}
        <View className="w-12 h-12 rounded-xl bg-primary/5 items-center justify-center flex-shrink-0">
          <Text className="text-2xl">{community.cover_emoji}</Text>
        </View>

        {/* 情報 */}
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text className="text-primary font-semibold text-sm flex-shrink">{community.name}</Text>
            {community.is_official && (
              <View className="bg-blue-50 rounded-full px-1.5 py-0.5">
                <Text className="text-blue-600 text-xs font-medium">公式</Text>
              </View>
            )}
          </View>
          {community.description && (
            <Text className="text-muted text-xs leading-relaxed" numberOfLines={2}>
              {community.description}
            </Text>
          )}
          <View className="flex-row items-center gap-3 mt-1">
            <Text className="text-muted text-xs">👥 {community.member_count}人</Text>
            <Text className="text-muted text-xs">💬 {community.post_count}件</Text>
          </View>
        </View>

        {/* 参加ボタン */}
        {!community.is_member && onJoin && (
          <Pressable
            className="bg-primary rounded-lg px-3 py-1.5 active:opacity-80 flex-shrink-0"
            onPress={(e) => { e.stopPropagation?.(); onJoin(); }}
            accessibilityLabel="参加する"
          >
            <Text className="text-white text-xs font-semibold">参加</Text>
          </Pressable>
        )}
        {community.is_member && (
          <View className="bg-green-50 rounded-lg px-3 py-1.5 flex-shrink-0">
            <Text className="text-green-600 text-xs font-medium">参加中</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
