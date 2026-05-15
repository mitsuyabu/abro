import { ScrollView, Pressable, Text, View } from 'react-native';
import type { BookmarkCategory } from '@/types';

interface Props {
  categories: BookmarkCategory[];
  selected: string | null;
  counts: Record<string, number>;
  onSelect: (key: string | null) => void;
}

export function CategoryTabs({ categories, selected, counts, onSelect }: Props) {
  const tabs = [
    { key: null, label: '全て', icon: '📋', count: Object.values(counts).reduce((a, b) => a + b, 0) },
    ...categories.map((c) => ({ key: c.key, label: c.label, icon: c.icon ?? '📌', count: counts[c.key] ?? 0 })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2"
    >
      {tabs.map((tab) => {
        const isActive = selected === tab.key;
        return (
          <Pressable
            key={String(tab.key)}
            className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
              isActive ? 'bg-primary border-primary' : 'bg-white border-border'
            }`}
            onPress={() => onSelect(tab.key)}
            accessibilityLabel={tab.label}
          >
            <Text className="text-sm">{tab.icon}</Text>
            <Text className={`text-xs font-medium ${isActive ? 'text-white' : 'text-primary'}`}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View className={`rounded-full px-1.5 py-0.5 ${isActive ? 'bg-white/30' : 'bg-border'}`}>
                <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-muted'}`}>
                  {tab.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
