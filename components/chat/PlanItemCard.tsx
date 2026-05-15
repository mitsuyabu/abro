import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { PlanItemType, StructuredContent } from '@/types';

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

interface Props {
  item: StructuredContent;
  onAdopt?: (item: StructuredContent) => void;
}

export function PlanItemCard({ item, onAdopt }: Props) {
  const icon = ITEM_ICONS[item.item_type] ?? '📌';
  const label = ITEM_LABELS[item.item_type] ?? item.item_type;

  return (
    <Card className="mt-2 gap-3 border border-border">
      <View className="flex-row items-center gap-2">
        <Text className="text-xl">{icon}</Text>
        <View className="flex-1">
          <Text className="text-xs text-muted font-medium">{label}</Text>
          <Text className="text-primary font-semibold text-sm">{item.title}</Text>
        </View>
        {item.cost_jpy != null && item.cost_jpy > 0 && (
          <Text className="text-sm font-semibold text-primary">
            ¥{item.cost_jpy.toLocaleString()}
          </Text>
        )}
      </View>

      {item.description && (
        <Text className="text-muted text-xs leading-relaxed">{item.description}</Text>
      )}

      {onAdopt && (
        <Pressable
          className="bg-primary rounded-xl py-2.5 items-center active:opacity-80"
          onPress={() => onAdopt(item)}
          accessibilityLabel="プランに追加"
        >
          <Text className="text-white text-xs font-semibold">プランに追加する</Text>
        </Pressable>
      )}
    </Card>
  );
}
