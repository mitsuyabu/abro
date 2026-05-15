import { Pressable, Text, View } from 'react-native';
import type { CommunityPost, UserPhase } from '@/types';

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
const PHASE_LABELS: Record<UserPhase, string> = {
  considering: '考え中',
  preparing: '準備中',
  abroad: '渡航中',
  returned: '帰国済',
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

interface CommunityPostCardProps {
  post: CommunityPost;
  onLike: () => void;
  onUserPress: () => void;
  onDelete?: () => void;
  isOwn?: boolean;
}

export function CommunityPostCard({ post, onLike, onUserPress, onDelete, isOwn }: CommunityPostCardProps) {
  const phase = (post.user?.phase ?? 'considering') as UserPhase;
  const badgeBg = PHASE_BADGE_BG[phase] ?? 'bg-gray-100';
  const badgeText = PHASE_BADGE_TEXT[phase] ?? 'text-gray-600';
  const initial = post.user?.nickname?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View className={`bg-white border-b border-border px-4 py-3 ${post.is_pinned ? 'border-l-2 border-l-primary' : ''}`}>
      {post.is_pinned && (
        <Text className="text-primary text-xs font-medium mb-1">📌 ピン留め</Text>
      )}
      {/* ユーザー行 */}
      <Pressable className="flex-row items-center gap-2 mb-2 active:opacity-70" onPress={onUserPress}>
        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
          <Text className="text-xs font-bold text-primary">{initial}</Text>
        </View>
        <View className="flex-row items-center gap-1.5 flex-1">
          <Text className="text-primary font-semibold text-xs">{post.user?.nickname ?? '名無し'}</Text>
          <View className={`rounded-full px-1.5 py-0.5 ${badgeBg}`}>
            <Text className={`text-xs ${badgeText}`}>{PHASE_LABELS[phase]}</Text>
          </View>
        </View>
        <Text className="text-muted text-xs">{formatRelativeTime(post.created_at)}</Text>
        {isOwn && onDelete && (
          <Pressable onPress={onDelete} className="ml-1 active:opacity-60">
            <Text className="text-muted text-xs">削除</Text>
          </Pressable>
        )}
      </Pressable>

      {/* 本文 */}
      <Text className="text-primary text-sm leading-relaxed mb-2">{post.content}</Text>

      {/* いいね */}
      <Pressable
        className="flex-row items-center gap-1 active:opacity-60 self-start"
        onPress={onLike}
      >
        <Text className={`text-base ${post.liked_by_me ? 'text-red-500' : 'text-muted'}`}>
          {post.liked_by_me ? '♥' : '♡'}
        </Text>
        <Text className={`text-xs ${post.liked_by_me ? 'text-red-500' : 'text-muted'}`}>
          {post.like_count}
        </Text>
      </Pressable>
    </View>
  );
}
