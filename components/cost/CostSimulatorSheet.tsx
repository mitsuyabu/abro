import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';

import { AddItemModal } from '@/components/cost/AddItemModal';
import { CostItemRow } from '@/components/cost/CostItemRow';
import { buildShareText, calculateTotalJpy, formatJpy } from '@/lib/cost/calculate';
import { getCategoryMeta } from '@/lib/cost/defaults';
import { useCostSimulation } from '@/hooks/useCostSimulation';
import { useCostStore } from '@/stores/cost';
import type { CostCategory, CostFrequency } from '@/types';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Props {
  planDestination?: string;
  planDurationMonths?: number;
}

export function CostSimulatorSheet({ planDestination, planDurationMonths }: Props) {
  const { simulation, items, isSheetVisible, hideSheet, addItem, updateItem, deleteItem } = useCostSimulation();
  const { isLoading } = useCostStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isSheetVisible ? 0 : SCREEN_HEIGHT,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [isSheetVisible, slideAnim]);

  const total = calculateTotalJpy(items);

  const handleAdd = useCallback(async (data: {
    category: CostCategory;
    label: string;
    amount_jpy: number;
    frequency: CostFrequency;
    duration: number;
  }) => {
    if (!simulation) return;
    await addItem(simulation.id, data, items.length);
  }, [simulation, addItem, items.length]);

  const handleUpdate = useCallback(async (
    id: string,
    updates: Parameters<typeof updateItem>[1],
  ) => {
    await updateItem(id, updates);
  }, [updateItem]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteItem(id);
  }, [deleteItem]);

  const handleShare = useCallback(async () => {
    const text = buildShareText(items, total, planDestination, planDurationMonths);
    try {
      await Share.share({ message: text, title: '留学費用見積もり' });
    } catch {
      // user cancelled
    }
  }, [items, total, planDestination, planDurationMonths]);

  if (!isSheetVisible) return null;

  return (
    <Modal
      visible={isSheetVisible}
      transparent
      animationType="none"
      onRequestClose={hideSheet}
    >
      {/* 半透明オーバーレイ */}
      <Pressable
        className="flex-1 bg-black/30"
        onPress={hideSheet}
        accessibilityLabel="シミュレーターを閉じる"
      />

      {/* シート本体 */}
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT * 0.85,
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'hidden',
        }}
      >
        <SafeAreaView className="flex-1">
          {/* ドラッグハンドル */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          {/* ヘッダー */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="font-bold text-primary text-base">💰 費用シミュレーター</Text>
            <Pressable
              onPress={hideSheet}
              accessibilityLabel="閉じる"
              className="active:opacity-60"
            >
              <Text className="text-muted text-sm">✕</Text>
            </Pressable>
          </View>

          {/* 合計 */}
          <View className="px-4 py-4 border-b border-border bg-background">
            <Text className="text-xs text-muted mb-0.5">
              合計見積もり{planDurationMonths ? `（${planDurationMonths}ヶ月想定）` : ''}
            </Text>
            <Text className="text-2xl font-bold text-primary">{formatJpy(total)}</Text>
            {planDestination && (
              <Text className="text-xs text-muted mt-0.5">🌏 {planDestination}</Text>
            )}
          </View>

          {/* 項目リスト */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted text-sm">読み込み中...</Text>
            </View>
          ) : (
            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
              {items.length === 0 ? (
                <View className="py-10 items-center px-6">
                  <Text className="text-muted text-sm text-center">
                    まだ費用項目がありません。{'\n'}「+ 項目を追加」で費用を入力しましょう。
                  </Text>
                </View>
              ) : (
                items.map((item) => (
                  <CostItemRow
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}

              {/* カテゴリ別小計ヒント */}
              {items.length > 0 && (
                <View className="px-4 py-3 gap-1.5">
                  {Array.from(new Set(items.map((i) => i.category))).map((cat) => {
                    const catItems = items.filter((i) => i.category === cat);
                    const catTotal = catItems.reduce((s, i) => s + i.amount_jpy * (i.frequency === 'once' ? 1 : i.duration), 0);
                    const meta = getCategoryMeta(cat as CostCategory);
                    return (
                      <View key={cat} className="flex-row justify-between">
                        <Text className="text-xs text-muted">{meta.icon} {meta.label}</Text>
                        <Text className="text-xs text-muted">{formatJpy(catTotal)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}

          {/* フッター */}
          <View className="border-t border-border px-4 py-3 gap-2">
            <Pressable
              className="border border-dashed border-border rounded-xl py-3 items-center active:opacity-70"
              onPress={() => setShowAddModal(true)}
              accessibilityLabel="項目を追加"
            >
              <Text className="text-primary text-sm font-medium">+ 項目を追加</Text>
            </Pressable>

            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 bg-primary rounded-xl py-3 items-center active:opacity-80"
                onPress={handleShare}
                accessibilityLabel="LINEで共有"
              >
                <Text className="text-white text-sm font-semibold">📤 共有する</Text>
              </Pressable>
              <Pressable
                className="flex-1 border border-border rounded-xl py-3 items-center active:opacity-70"
                onPress={handleShare}
                accessibilityLabel="親に送る"
              >
                <Text className="text-primary text-sm font-medium">👨‍👩‍👧 親に送る</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />
    </Modal>
  );
}
