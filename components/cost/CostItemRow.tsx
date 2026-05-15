import { useState, useCallback } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FREQUENCY_LABELS, getCategoryMeta } from '@/lib/cost/defaults';
import { formatJpy, itemTotalJpy } from '@/lib/cost/calculate';
import type { CostFrequency, CostItem } from '@/types';

const FREQUENCIES: CostFrequency[] = ['once', 'monthly', 'weekly', 'daily'];

interface Props {
  item: CostItem;
  onUpdate: (id: string, updates: Partial<Pick<CostItem, 'label' | 'amount_jpy' | 'frequency' | 'duration' | 'note'>>) => void;
  onDelete: (id: string) => void;
}

export function CostItemRow({ item, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [amountText, setAmountText] = useState(String(item.amount_jpy));
  const [durationText, setDurationText] = useState(String(item.duration));
  const meta = getCategoryMeta(item.category);

  const commitAmount = useCallback(() => {
    const v = parseInt(amountText.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(v) && v !== item.amount_jpy) onUpdate(item.id, { amount_jpy: v });
  }, [amountText, item.amount_jpy, item.id, onUpdate]);

  const commitDuration = useCallback(() => {
    const v = parseInt(durationText, 10);
    if (!isNaN(v) && v > 0 && v !== item.duration) onUpdate(item.id, { duration: v });
  }, [durationText, item.duration, item.id, onUpdate]);

  const handleDelete = useCallback(() => {
    Alert.alert('削除', `「${item.label}」を削除しますか?`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  }, [item.id, item.label, onDelete]);

  const total = itemTotalJpy(item);

  return (
    <View className="border-b border-border">
      {/* 折り畳み行 */}
      <Pressable
        className="flex-row items-center py-3 px-4 active:opacity-70"
        onPress={() => setExpanded((v) => !v)}
        accessibilityLabel={`${item.label} 編集`}
      >
        <Text className="text-base mr-2">{meta.icon}</Text>
        <View className="flex-1">
          <Text className="text-primary text-sm font-medium">{item.label}</Text>
          {item.frequency !== 'once' && (
            <Text className="text-muted text-xs">
              {formatJpy(item.amount_jpy)}/{FREQUENCY_LABELS[item.frequency]} × {item.duration}
              {item.frequency === 'monthly' ? 'ヶ月' : item.frequency === 'weekly' ? '週' : '日'}
            </Text>
          )}
        </View>
        <Text className="text-primary font-semibold text-sm">{formatJpy(total)}</Text>
        <Text className="text-muted text-xs ml-2">{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {/* 展開エリア */}
      {expanded && (
        <View className="px-4 pb-4 gap-3 bg-background">

          {/* 金額 */}
          <View className="flex-row items-center gap-2">
            <Text className="text-muted text-xs w-16">金額(円)</Text>
            <TextInput
              className="flex-1 border border-border rounded-lg px-3 py-2 text-primary text-sm bg-white"
              value={amountText}
              onChangeText={(t) => setAmountText(t.replace(/[^0-9]/g, ''))}
              onBlur={commitAmount}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={commitAmount}
              accessibilityLabel="金額入力"
            />
          </View>

          {/* 頻度 */}
          <View className="flex-row items-center gap-2">
            <Text className="text-muted text-xs w-16">頻度</Text>
            <View className="flex-row gap-1.5">
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f}
                  className={`px-3 py-1.5 rounded-full border ${
                    item.frequency === f
                      ? 'bg-primary border-primary'
                      : 'bg-white border-border'
                  }`}
                  onPress={() => onUpdate(item.id, { frequency: f, duration: f === 'once' ? 1 : item.duration })}
                  accessibilityLabel={FREQUENCY_LABELS[f]}
                >
                  <Text className={`text-xs font-medium ${item.frequency === f ? 'text-white' : 'text-primary'}`}>
                    {FREQUENCY_LABELS[f]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 期間(once 以外) */}
          {item.frequency !== 'once' && (
            <View className="flex-row items-center gap-2">
              <Text className="text-muted text-xs w-16">
                期間({item.frequency === 'monthly' ? 'ヶ月' : item.frequency === 'weekly' ? '週' : '日'})
              </Text>
              <TextInput
                className="w-20 border border-border rounded-lg px-3 py-2 text-primary text-sm bg-white"
                value={durationText}
                onChangeText={setDurationText}
                onBlur={commitDuration}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={commitDuration}
                accessibilityLabel="期間入力"
              />
              <Text className="text-muted text-xs">
                合計 {formatJpy(item.amount_jpy * parseInt(durationText || '1', 10) || 0)}
              </Text>
            </View>
          )}

          {/* 削除 */}
          <Pressable
            className="self-start active:opacity-60"
            onPress={handleDelete}
            accessibilityLabel="削除"
          >
            <Text className="text-xs text-muted">✕ 削除する</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
