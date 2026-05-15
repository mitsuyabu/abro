import { Alert, Pressable, Text, View } from 'react-native';

import type { FinancialTransaction, TransactionCategory } from '@/types';

export const CATEGORY_META: Record<TransactionCategory, { emoji: string; label: string }> = {
  food:          { emoji: '🍽️', label: '食費' },
  transport:     { emoji: '🚌', label: '交通' },
  accommodation: { emoji: '🏠', label: '住居' },
  school:        { emoji: '🎓', label: '学費' },
  insurance:     { emoji: '🛡️', label: '保険' },
  phone:         { emoji: '📱', label: '通信' },
  entertainment: { emoji: '🎉', label: '娯楽' },
  shopping:      { emoji: '🛍️', label: '買い物' },
  medical:       { emoji: '🏥', label: '医療' },
  transfer:      { emoji: '💳', label: '送金' },
  other:         { emoji: '📌', label: 'その他' },
};

interface TransactionCardProps {
  tx: FinancialTransaction;
  onDelete?: () => void;
}

export function TransactionCard({ tx, onDelete }: TransactionCardProps) {
  const meta = CATEGORY_META[tx.category] ?? CATEGORY_META.other;
  const displayAmount = tx.amount_jpy != null
    ? `¥${Math.round(tx.amount_jpy).toLocaleString()}`
    : `${tx.currency} ${tx.amount_local.toLocaleString()}`;

  const handleDelete = () => {
    Alert.alert('削除', `「${tx.merchant ?? meta.label}」の取引を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View className="bg-white border border-border rounded-xl px-4 py-3 flex-row items-center gap-3">
      <Text className="text-2xl">{meta.emoji}</Text>
      <View className="flex-1 gap-0.5">
        <Text className="text-primary text-sm font-medium">
          {tx.merchant ?? meta.label}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-muted text-xs">{meta.label}</Text>
          <Text className="text-muted text-xs">·</Text>
          <Text className="text-muted text-xs">{tx.date}</Text>
          {tx.ai_categorized && <Text className="text-muted text-xs">· AI分類</Text>}
        </View>
        {tx.note && <Text className="text-muted text-xs">{tx.note}</Text>}
      </View>
      <View className="items-end gap-1">
        <Text className="text-primary font-semibold text-sm">{displayAmount}</Text>
        {onDelete && (
          <Pressable onPress={handleDelete} accessibilityLabel="削除" className="active:opacity-60">
            <Text className="text-muted text-xs">削除</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
