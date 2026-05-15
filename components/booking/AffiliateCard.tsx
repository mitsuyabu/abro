import { Pressable, ScrollView, Text, View } from 'react-native';

import { AFFILIATE_PROVIDERS } from '@/lib/affiliate/providers';
import { useBookings } from '@/hooks/useBookings';

interface AffiliateCardProps {
  planId?: string;
}

export function AffiliateSection({ planId }: AffiliateCardProps) {
  const { openAffiliate } = useBookings();

  return (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-primary">おすすめサービス</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-4">
        {AFFILIATE_PROVIDERS.map((p) => (
          <Pressable
            key={p.id}
            className="bg-white border border-border rounded-2xl p-4 items-center gap-2 active:opacity-70"
            style={{ width: 110 }}
            onPress={() => openAffiliate(p, planId)}
            accessibilityLabel={`${p.name}を開く`}
          >
            <Text className="text-3xl">{p.emoji}</Text>
            <Text className="text-primary text-xs font-semibold text-center">{p.name}</Text>
            <Text className="text-muted text-xs text-center leading-tight">{p.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
