import { Text, View } from 'react-native';

import { CATEGORY_META } from './TransactionCard';
import type { TransactionCategory } from '@/types';

interface MonthlyReportProps {
  summary: Partial<Record<TransactionCategory, number>>;
}

export function MonthlyReport({ summary }: MonthlyReportProps) {
  const entries = (Object.entries(summary) as [TransactionCategory, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (entries.length === 0) {
    return (
      <View className="py-6 items-center">
        <Text className="text-muted text-sm">今月の取引はまだありません</Text>
      </View>
    );
  }

  const max = entries[0][1];

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-primary">今月の支出</Text>
        <Text className="text-primary font-bold text-sm">¥{Math.round(total).toLocaleString()}</Text>
      </View>
      {entries.map(([cat, amount]) => {
        const meta = CATEGORY_META[cat];
        const pct = max > 0 ? amount / max : 0;
        return (
          <View key={cat} className="gap-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-base">{meta.emoji}</Text>
                <Text className="text-primary text-xs font-medium">{meta.label}</Text>
              </View>
              <Text className="text-muted text-xs">¥{Math.round(amount).toLocaleString()}</Text>
            </View>
            <View className="h-1.5 bg-border rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
