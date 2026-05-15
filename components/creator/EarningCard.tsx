import { Text, View } from 'react-native';

import type { CreatorEarning, CreatorEarningSource } from '@/types';

const SOURCE_ICONS: Record<CreatorEarningSource, string> = {
  affiliate: '🔗',
  agent_kickback: '🎓',
  plan_sale: '📋',
};

const SOURCE_LABELS: Record<CreatorEarningSource, string> = {
  affiliate: 'アフィリエイト',
  agent_kickback: 'エージェント紹介',
  plan_sale: 'プラン販売',
};

const STATUS_COLORS: Record<CreatorEarning['status'], string> = {
  pending: 'text-yellow-600',
  paid: 'text-green-600',
  cancelled: 'text-red-400',
};

const STATUS_LABELS: Record<CreatorEarning['status'], string> = {
  pending: '確認中',
  paid: '支払済',
  cancelled: 'キャンセル',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

interface EarningCardProps {
  earning: CreatorEarning;
}

export function EarningCard({ earning }: EarningCardProps) {
  return (
    <View className="bg-white border border-border rounded-2xl px-4 py-3 flex-row items-center gap-3">
      <Text className="text-2xl">{SOURCE_ICONS[earning.source_type]}</Text>
      <View className="flex-1 gap-0.5">
        <Text className="text-primary text-sm font-medium">{SOURCE_LABELS[earning.source_type]}</Text>
        {earning.note && <Text className="text-muted text-xs">{earning.note}</Text>}
        <Text className="text-muted text-xs">{formatDate(earning.created_at)}</Text>
      </View>
      <View className="items-end gap-0.5">
        <Text className="text-primary font-bold text-sm">¥{earning.amount_jpy.toLocaleString()}</Text>
        <Text className={`text-xs font-medium ${STATUS_COLORS[earning.status]}`}>
          {STATUS_LABELS[earning.status]}
        </Text>
      </View>
    </View>
  );
}
