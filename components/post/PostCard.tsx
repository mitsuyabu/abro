import { Pressable, Text, View } from 'react-native';
import type { PostWithUser, UserPhase } from '@/types';

const PHASE_LABELS: Record<UserPhase, string> = {
  considering: '考え中',
  preparing: '準備中',
  abroad: '渡航中',
  returned: '帰国済',
};

const PHASE_BADGE_BG: Record<UserPhase, string> = {
  considering: 'bg-gray-100',
  preparing: 'bg-blue-100',
  abroad: 'bg-green-100',
  returned: 'bg-purple-100',
};

const PHASE_BADGE_TEXT: Record<UserPhase, string> = {
  considering: 'text-gray-600',
  preparing: 'text-blue-700',
  abroad: 'text-green-700',
  returned: 'text-purple-700',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

interface PostCardProps {
  post: PostWithUser;
  onLike: () => void;
  onComment: () => void;
  onUserPress: () => void;
  onPress: () => void;
  truncate?: boolean;
}

export function PostCard({ post, onLike, onComment, onUserPress, onPress, truncate = true }: PostCardProps) {
  const phase = (post.user.phase ?? post.user_phase ?? 'considering') as UserPhase;
  const badgeBg = PHASE_BADGE_BG[phase] ?? 'bg-gray-100';
  const badgeText = PHASE_BADGE_TEXT[phase] ?? 'text-gray-600';
  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const initial = post.user.nickname?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <Pressable
      className="bg-white border-b border-border px-4 py-4 active:opacity-90"
      onPress={onPress}
      accessibilityLabel="投稿を見る"
    >
      {/* ユーザー行 */}
      <Pressable className="flex-row items-center gap-3 mb-2 active:opacity-70" onPress={onUserPress}>
        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
          <Text className="text-base font-bold text-primary">{initial}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-primary font-semibold text-sm">
              {post.user.nickname ?? '名無し'}
            </Text>
            <View className={`rounded-full px-2 py-0.5 ${badgeBg}`}>
              <Text className={`text-xs font-medium ${badgeText}`}>{phaseLabel}</Text>
            </View>
          </View>
          <Text className="text-muted text-xs">{formatRelativeTime(post.created_at)}</Text>
        </View>
      </Pressable>

      {/* 本文 */}
      <Text
        className="text-primary text-sm leading-relaxed mb-3"
        numberOfLines={truncate ? 5 : undefined}
      >
        {post.content}
      </Text>

      {/* アクション */}
      <View className="flex-row gap-5">
        <Pressable
          className="flex-row items-center gap-1 active:opacity-60"
          onPress={onLike}
          accessibilityLabel={post.liked_by_me ? 'いいね解除' : 'いいね'}
        >
          <Text className={`text-base ${post.liked_by_me ? 'text-red-500' : 'text-muted'}`}>
            {post.liked_by_me ? '♥' : '♡'}
          </Text>
          <Text className={`text-xs ${post.liked_by_me ? 'text-red-500' : 'text-muted'}`}>
            {post.like_count}
          </Text>
        </Pressable>

        <Pressable
          className="flex-row items-center gap-1 active:opacity-60"
          onPress={onComment}
          accessibilityLabel="コメント"
        >
          <Text className="text-muted text-base">💬</Text>
          <Text className="text-muted text-xs">{post.comment_count}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
