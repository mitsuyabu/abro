import { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COST_CATEGORIES, FREQUENCY_LABELS } from '@/lib/cost/defaults';
import type { CostCategory, CostFrequency } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    category: CostCategory;
    label: string;
    amount_jpy: number;
    frequency: CostFrequency;
    duration: number;
  }) => void;
}

const FREQUENCIES: CostFrequency[] = ['once', 'monthly', 'weekly', 'daily'];

export function AddItemModal({ visible, onClose, onAdd }: Props) {
  const [category, setCategory] = useState<CostCategory>('other');
  const [label, setLabel] = useState('');
  const [amountText, setAmountText] = useState('');
  const [frequency, setFrequency] = useState<CostFrequency>('once');
  const [durationText, setDurationText] = useState('1');

  const selectedMeta = COST_CATEGORIES.find((c) => c.key === category);

  const handleCategorySelect = (cat: (typeof COST_CATEGORIES)[number]) => {
    setCategory(cat.key);
    setLabel(cat.label);
    setFrequency(cat.defaultFrequency);
    setDurationText('1');
  };

  const handleAdd = () => {
    const amount = parseInt(amountText.replace(/[^0-9]/g, ''), 10);
    const duration = parseInt(durationText, 10);
    if (!label.trim() || isNaN(amount) || amount <= 0) return;
    onAdd({
      category,
      label: label.trim(),
      amount_jpy: amount,
      frequency,
      duration: frequency === 'once' ? 1 : (isNaN(duration) || duration < 1 ? 1 : duration),
    });
    // reset
    setCategory('other');
    setLabel('');
    setAmountText('');
    setFrequency('once');
    setDurationText('1');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* ヘッダー */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable onPress={onClose} accessibilityLabel="閉じる">
            <Text className="text-muted text-sm">キャンセル</Text>
          </Pressable>
          <Text className="font-semibold text-primary text-sm">項目を追加</Text>
          <Pressable onPress={handleAdd} accessibilityLabel="追加">
            <Text className={`text-sm font-semibold ${label.trim() && amountText ? 'text-primary' : 'text-muted'}`}>
              追加
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 py-5 gap-5">

          {/* カテゴリ選択 */}
          <View className="gap-2">
            <Text className="text-xs font-medium text-muted">カテゴリ</Text>
            <View className="flex-row flex-wrap gap-2">
              {COST_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
                    category === cat.key ? 'bg-primary border-primary' : 'bg-white border-border'
                  }`}
                  onPress={() => handleCategorySelect(cat)}
                  accessibilityLabel={cat.label}
                >
                  <Text className="text-sm">{cat.icon}</Text>
                  <Text className={`text-xs font-medium ${category === cat.key ? 'text-white' : 'text-primary'}`}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ラベル */}
          <View className="gap-1.5">
            <Text className="text-xs font-medium text-muted">項目名</Text>
            <TextInput
              className="border border-border rounded-xl px-4 py-3 text-primary text-sm bg-white"
              placeholder={selectedMeta?.label ?? '例: ビザ申請料'}
              placeholderTextColor="#A0A0A0"
              value={label}
              onChangeText={setLabel}
              maxLength={40}
            />
          </View>

          {/* 金額 */}
          <View className="gap-1.5">
            <Text className="text-xs font-medium text-muted">金額(円)</Text>
            <TextInput
              className="border border-border rounded-xl px-4 py-3 text-primary text-sm bg-white"
              placeholder="例: 50000"
              placeholderTextColor="#A0A0A0"
              value={amountText}
              onChangeText={(t) => setAmountText(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </View>

          {/* 頻度 */}
          <View className="gap-1.5">
            <Text className="text-xs font-medium text-muted">頻度</Text>
            <View className="flex-row gap-2">
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f}
                  className={`flex-1 py-2.5 rounded-xl border items-center ${
                    frequency === f ? 'bg-primary border-primary' : 'bg-white border-border'
                  }`}
                  onPress={() => setFrequency(f)}
                  accessibilityLabel={FREQUENCY_LABELS[f]}
                >
                  <Text className={`text-xs font-medium ${frequency === f ? 'text-white' : 'text-primary'}`}>
                    {FREQUENCY_LABELS[f]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 期間 */}
          {frequency !== 'once' && (
            <View className="gap-1.5">
              <Text className="text-xs font-medium text-muted">
                期間({frequency === 'monthly' ? 'ヶ月' : frequency === 'weekly' ? '週' : '日'})
              </Text>
              <TextInput
                className="border border-border rounded-xl px-4 py-3 text-primary text-sm bg-white"
                placeholder="例: 6"
                placeholderTextColor="#A0A0A0"
                value={durationText}
                onChangeText={setDurationText}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
