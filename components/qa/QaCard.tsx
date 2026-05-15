import { Pressable, Text, View } from 'react-native';
import type { QaCategory, QaThread, UserPhase } from '@/types';

export const QA_CATEGORY_META: Record<QaCategory, { emoji: string; label: string; bg: string; text: string }> = {
  visa:     { emoji: '📄', label: 'ビザ・手続き',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  life:     { emoji: '🏙️', label: '現地生活',       bg: 'bg-green-50',  text: 'text-green-700'  },
  school:   { emoji: '📚', label: '語学学校',       bg: 'bg-purple-50', text: 'text-purple-700' },
  work:     { emoji: '💼', label: 'バイト・仕事',    bg: 'bg-orange-50', text: 'text-orange-700' },
  money:    { emoji: '💰', label: '費用・節約',      bg: 'bg-yellow-50', text: 'text-yellow-700' },
  housing:  { emoji: '🏠', label: '住居',           bg: 'bg-pink-50',   text: 'text-pink-700'   },
  accident: { emoji: '😅', label: 'やらかし・失敗談', bg: 'bg-red-50',    text: 'text-red-700'    },
  other:    { emoji: '💬', label: 'その他',         bg: 'bg-gray-50',   text: 'text-gray-600'   },
};

const PHASE_BADGE_BG: Record<UserPhase, string> = {
  considering: 'bg-gray-100', preparing: 'bg-blue-100', abroad: 'bg-green-100', returned: 'bg-purple-100',
};
const PHASE_BADGE_TEXT: Record<UserPhase, string> = {
  considering: 'text-gray-600', preparing: 'text-blue-700', abroad: 'text-green-700', returned: 'text-purple-700',
};
const PHASE_LABELS: Record<UserPhase, string> = {
  considering: '考え中', preparing: '準備中', abroad: '渡航中', returned: '帰国済',
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

interface QaCardProps {
  thread: QaThread;
  onPress: () => void;
}

export function QaCard({ thread, onPress }: QaCardProps) {
  const meta = QA_CATEGORY_META[thread.category] ?? QA_CATEGORY_META.other;
  const phase = (thread.questioner?.phase ?? 'considering') as UserPhase;
  const displayName = thread.is_anonymous ? '匿名' : (thread.questioner?.nickname ?? '名無し');
  const initial = thread.is_anonymous ? '?' : (thread.questioner?.nickname?.charAt(0)?.toUpperCase() ?? '?');

  return (
    <Pressable
      className="bg-white border border-border rounded-2xl p-4 gap-2.5 active:opacity-70"
      onPress={onPress}
      accessibilityLabel={thread.title}
    >
      {/* カテゴリ + 解決済み */}
      <View className="flex-row items-center justify-between">
        <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${meta.bg}`}>
          <Text className="text-xs">{meta.emoji}</Text>
          <Text className={`text-xs font-semibold ${meta.text}`}>{meta.label}</Text>
        </View>
        {thread.is_resolved && (
          <View className="flex-row items-center gap-1 bg-green-50 rounded-full px-2 py-0.5">
            <Text className="text-green-600 text-xs font-medium">✓ 解決済み</Text>
          </View>
        )}
      </View>

      {/* タイトル */}
      <Text className="text-primary font-bold text-sm leading-snug" numberOfLines={2}>{thread.title}</Text>

      {/* プレビュー */}
      <Text className="text-muted text-xs leading-relaxed" numberOfLines={2}>{thread.content}</Text>

      {/* フッター */}
      <View className="flex-row items-center justify-between pt-1 border-t border-border">
        <View className="flex-row items-center gap-2">
          <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center">
            <Text className="text-xs font-bold text-primary">{initial}</Text>
          </View>
          <Text className="text-muted text-xs">{displayName}</Text>
          {!thread.is_anonymous && (
            <View className={`rounded-full px-1.5 py-0.5 ${PHASE_BADGE_BG[phase]}`}>
              <Text className={`text-xs ${PHASE_BADGE_TEXT[phase]}`}>{PHASE_LABELS[phase]}</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="text-muted text-xs">💬 {thread.answer_count}</Text>
          <Text className="text-muted text-xs">{formatRelativeTime(thread.created_at)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
