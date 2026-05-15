import { Pressable, Text, View } from 'react-native';
import type { Listing, ListingCategory, UserPhase } from '@/types';

export const CATEGORY_META: Record<ListingCategory, { emoji: string; label: string; bg: string; text: string }> = {
  job:               { emoji: '💼', label: 'バイト・仕事',  bg: 'bg-orange-50',  text: 'text-orange-700' },
  roommate:          { emoji: '🏠', label: 'シェアメイト',  bg: 'bg-blue-50',    text: 'text-blue-700'   },
  item:              { emoji: '📦', label: 'モノ',         bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  travel_companion:  { emoji: '✈️', label: '同行者募集',    bg: 'bg-purple-50',  text: 'text-purple-700' },
  other:             { emoji: '📌', label: 'その他',       bg: 'bg-gray-50',    text: 'text-gray-600'   },
};

const FREQUENCY_LABELS: Record<string, string> = {
  hour: '/ 時間',
  day:  '/ 日',
  week: '/ 週',
  month:'/ 月',
  once: '(一括)',
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

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
}

export function ListingCard({ listing, onPress }: ListingCardProps) {
  const meta = CATEGORY_META[listing.category] ?? CATEGORY_META.other;
  const phase = (listing.user?.phase ?? 'considering') as UserPhase;
  const initial = listing.user?.nickname?.charAt(0)?.toUpperCase() ?? '?';

  const location = [listing.city, listing.country].filter(Boolean).join(', ');

  return (
    <Pressable
      className="bg-white border border-border rounded-2xl p-4 gap-2.5 active:opacity-70"
      onPress={onPress}
      accessibilityLabel={listing.title}
    >
      {/* カテゴリバッジ + 日時 */}
      <View className="flex-row items-center justify-between">
        <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${meta.bg}`}>
          <Text className="text-xs">{meta.emoji}</Text>
          <Text className={`text-xs font-semibold ${meta.text}`}>{meta.label}</Text>
        </View>
        <Text className="text-muted text-xs">{formatRelativeTime(listing.created_at)}</Text>
      </View>

      {/* タイトル */}
      <Text className="text-primary font-bold text-sm" numberOfLines={2}>{listing.title}</Text>

      {/* 説明 */}
      <Text className="text-muted text-xs leading-relaxed" numberOfLines={3}>{listing.description}</Text>

      {/* 場所 + 価格 */}
      <View className="flex-row items-center justify-between">
        {location ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-muted text-xs">📍</Text>
            <Text className="text-muted text-xs">{location}</Text>
          </View>
        ) : <View />}

        {listing.price_amount != null && (
          <View className="bg-green-50 rounded-full px-2.5 py-1">
            <Text className="text-green-700 text-xs font-semibold">
              ¥{listing.price_amount.toLocaleString()}{listing.price_frequency ? FREQUENCY_LABELS[listing.price_frequency] ?? '' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* 投稿者 */}
      <View className="flex-row items-center gap-2 pt-1 border-t border-border">
        <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
          <Text className="text-xs font-bold text-primary">{initial}</Text>
        </View>
        <Text className="text-muted text-xs">{listing.user?.nickname ?? '名無し'}</Text>
        <View className={`rounded-full px-1.5 py-0.5 ${PHASE_BADGE_BG[phase]}`}>
          <Text className={`text-xs ${PHASE_BADGE_TEXT[phase]}`}>{PHASE_LABELS[phase]}</Text>
        </View>
      </View>
    </Pressable>
  );
}
