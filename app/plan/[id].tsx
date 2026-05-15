import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import type { Plan, PlanItem, PlanItemType } from '@/types';

const ITEM_ICONS: Record<PlanItemType, string> = {
  school: '🎓',
  accommodation: '🏠',
  flight: '✈️',
  insurance: '🛡️',
  visa: '📄',
  activity: '🎯',
  other: '📌',
};

const ITEM_LABELS: Record<PlanItemType, string> = {
  school: '学校',
  accommodation: '宿泊',
  flight: '航空券',
  insurance: '保険',
  visa: 'ビザ',
  activity: 'アクティビティ',
  other: 'その他',
};

export default function PlanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchPlan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPlan = async () => {
    setIsLoading(true);
    const [{ data: planData }, { data: itemsData }] = await Promise.all([
      supabase.from('plans').select('*').eq('id', id).single(),
      supabase.from('plan_items').select('*').eq('plan_id', id).order('order_index'),
    ]);

    if (planData) setPlan(planData as Plan);
    if (itemsData) setItems(itemsData as PlanItem[]);
    setIsLoading(false);
  };

  const handleDeleteItem = async (itemId: string, title: string) => {
    Alert.alert(
      '削除',
      `「${title}」を削除しますか?`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('plan_items').delete().eq('id', itemId);
            setItems((prev) => prev.filter((i) => i.id !== itemId));
          },
        },
      ],
    );
  };

  const totalCost = items.reduce((sum, item) => sum + (item.cost_jpy ?? 0), 0);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">プランが見つかりません</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable
          className="w-9 h-9 items-center justify-center active:opacity-60"
          onPress={() => router.back()}
          accessibilityLabel="戻る"
        >
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center text-primary font-semibold text-sm" numberOfLines={1}>
          {plan.title}
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4">

        {/* プラン概要 */}
        <Card className="gap-3">
          <Text className="text-xl font-bold text-primary">{plan.title}</Text>
          <View className="gap-1.5">
            {plan.destination_country && (
              <InfoRow label="渡航先" value={`${plan.destination_country}${plan.destination_city ? ` / ${plan.destination_city}` : ''}`} />
            )}
            {plan.duration_weeks && (
              <InfoRow label="期間" value={`${plan.duration_weeks}週間`} />
            )}
            {plan.purpose && (
              <InfoRow label="目的" value={plan.purpose} />
            )}
            {plan.budget_jpy && (
              <InfoRow label="予算" value={`¥${plan.budget_jpy.toLocaleString()}`} />
            )}
          </View>
        </Card>

        {/* 費用合計 */}
        {totalCost > 0 && (
          <Card className="flex-row items-center justify-between">
            <Text className="text-sm text-muted font-medium">現在の合計費用</Text>
            <Text className="text-primary font-bold text-lg">¥{totalCost.toLocaleString()}</Text>
          </Card>
        )}

        {/* プラン要素リスト */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-primary">プラン要素</Text>

          {items.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-muted text-sm text-center">
                まだ要素がありません。{'\n'}チャットで AI に提案してもらいましょう。
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="gap-2">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text className="text-xl">{ITEM_ICONS[item.item_type] ?? '📌'}</Text>
                    <View className="flex-1">
                      <Text className="text-xs text-muted">{ITEM_LABELS[item.item_type] ?? item.item_type}</Text>
                      <Text className="text-primary font-medium text-sm">{item.title}</Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    {item.cost_jpy != null && item.cost_jpy > 0 && (
                      <Text className="text-primary font-semibold text-sm">
                        ¥{item.cost_jpy.toLocaleString()}
                      </Text>
                    )}
                    <Pressable
                      onPress={() => handleDeleteItem(item.id, item.title)}
                      accessibilityLabel="削除"
                      className="active:opacity-60"
                    >
                      <Text className="text-muted text-xs">削除</Text>
                    </Pressable>
                  </View>
                </View>
                {item.description && (
                  <Text className="text-muted text-xs leading-relaxed">{item.description}</Text>
                )}
              </Card>
            ))
          )}
        </View>

        {/* アクション */}
        <View className="gap-2 pt-2">
          <Pressable
            className="border border-border rounded-xl py-3 items-center active:opacity-60"
            onPress={() => router.back()}
            accessibilityLabel="チャットに戻る"
          >
            <Text className="text-primary text-sm font-medium">チャットに戻る</Text>
          </Pressable>
          <Pressable
            className="border border-border rounded-xl py-3 items-center opacity-40"
            accessibilityLabel="公開する(準備中)"
          >
            <Text className="text-muted text-sm">公開する(準備中)</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row gap-2">
      <Text className="text-muted text-xs w-16">{label}</Text>
      <Text className="text-primary text-xs flex-1">{value}</Text>
    </View>
  );
}
