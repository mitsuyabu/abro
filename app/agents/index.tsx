import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import type { Agent, AgentCounselor } from '@/types';

function StarRating({ rating }: { rating: number }) {
  return <Text className="text-yellow-500 text-xs">{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))} {rating.toFixed(1)}</Text>;
}

export default function AgentsScreen() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [onlineCounselors, setOnlineCounselors] = useState<(AgentCounselor & { agent_name: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [{ data: agentsData }, { data: counselorsData }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agents') as any).select('*').order('rating', { ascending: false }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agent_counselors') as any)
        .select('*, agents(name)')
        .eq('is_online', true)
        .order('rating', { ascending: false }),
    ]);

    if (agentsData) setAgents(agentsData as Agent[]);
    if (counselorsData) {
      setOnlineCounselors(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (counselorsData as any[]).map((c) => ({ ...c, agent_name: c.agents?.name ?? '' })),
      );
    }
    setIsLoading(false);
  };

  const allCountries = useMemo(() => {
    const set = new Set<string>();
    agents.forEach((a) => a.countries.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [agents]);

  const filtered = useMemo(() =>
    agents.filter((a) => {
      if (searchText && !a.name.includes(searchText) && !a.description?.includes(searchText)) return false;
      if (selectedCountry && !a.countries.includes(selectedCountry)) return false;
      return true;
    }),
    [agents, searchText, selectedCountry],
  );

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
        <Text className="flex-1 text-center font-semibold text-primary text-sm">🎓 エージェントを探す</Text>
        <View className="w-9" />
      </View>

      {/* 検索 */}
      <View className="px-4 py-2">
        <TextInput
          className="bg-white border border-border rounded-xl px-4 py-2.5 text-primary text-sm"
          placeholder="エージェント名・専門で検索..."
          placeholderTextColor="#A0A0A0"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* 国フィルタ */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 pb-2 gap-2">
        <Pressable
          className={`px-3 py-1 rounded-full border ${!selectedCountry ? 'bg-primary border-primary' : 'bg-white border-border'}`}
          onPress={() => setSelectedCountry(null)}
        >
          <Text className={`text-xs font-medium ${!selectedCountry ? 'text-white' : 'text-primary'}`}>すべて</Text>
        </Pressable>
        {allCountries.map((c) => (
          <Pressable
            key={c}
            className={`px-3 py-1 rounded-full border ${selectedCountry === c ? 'bg-primary border-primary' : 'bg-white border-border'}`}
            onPress={() => setSelectedCountry(selectedCountry === c ? null : c)}
          >
            <Text className={`text-xs font-medium ${selectedCountry === c ? 'text-white' : 'text-primary'}`}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8 gap-3"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          onlineCounselors.length > 0 ? (
            <View className="gap-3 mb-2">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-green-500" />
                <Text className="text-sm font-semibold text-primary">オンライン中({onlineCounselors.length}人)</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
                {onlineCounselors.map((c) => (
                  <Pressable
                    key={c.id}
                    className="w-28 bg-white border border-border rounded-2xl p-3 gap-1.5 items-center active:opacity-70"
                    onPress={() => router.push(`/agents/counselor/${c.id}` as never)}
                    accessibilityLabel={c.display_name}
                  >
                    <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                      <Text className="text-2xl">👤</Text>
                    </View>
                    <View className="w-2.5 h-2.5 rounded-full bg-green-500 absolute top-2 right-2" />
                    <Text className="text-primary text-xs font-medium text-center" numberOfLines={1}>{c.display_name}</Text>
                    <Text className="text-muted text-xs text-center" numberOfLines={1}>{c.agent_name}</Text>
                    <StarRating rating={c.rating} />
                    <Pressable
                      className="bg-primary rounded-lg px-3 py-1 mt-1 active:opacity-80"
                      onPress={() => router.push(`/agents/counselor/${c.id}` as never)}
                      accessibilityLabel="話す"
                    >
                      <Text className="text-white text-xs font-semibold">話す</Text>
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>

              <Text className="text-sm font-semibold text-primary mt-1">全てのエージェント</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="py-12 items-center">
              <Text className="text-muted text-sm">読み込み中...</Text>
            </View>
          ) : (
            <View className="py-12 items-center">
              <Text className="text-muted text-sm">エージェントが見つかりません</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            className="bg-white border border-border rounded-2xl p-4 gap-3 active:opacity-70"
            onPress={() => router.push(`/agents/${item.id}` as never)}
            accessibilityLabel={item.name}
          >
            <View className="flex-row items-start gap-3">
              <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
                <Text className="text-2xl">🏢</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-primary font-bold text-sm">{item.name}</Text>
                  {item.plan === 'premium' && (
                    <View className="bg-yellow-100 rounded px-1.5 py-0.5">
                      <Text className="text-yellow-700 text-xs font-medium">PRO</Text>
                    </View>
                  )}
                </View>
                <StarRating rating={item.rating} />
                <Text className="text-muted text-xs">{item.review_count}件のレビュー</Text>
              </View>
              <Text className="text-muted text-lg">›</Text>
            </View>

            {item.description && (
              <Text className="text-muted text-xs leading-relaxed" numberOfLines={2}>{item.description}</Text>
            )}

            <View className="flex-row flex-wrap gap-1.5">
              {item.countries.slice(0, 3).map((c) => (
                <View key={c} className="bg-blue-50 rounded-full px-2 py-0.5">
                  <Text className="text-blue-700 text-xs">🌏 {c}</Text>
                </View>
              ))}
              {item.specialties.slice(0, 2).map((s) => (
                <View key={s} className="bg-border rounded-full px-2 py-0.5">
                  <Text className="text-muted text-xs">{s}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
