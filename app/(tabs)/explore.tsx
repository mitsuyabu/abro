import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import type { Agent, AgentCounselor } from '@/types';

export default function ExploreScreen() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [onlineCounselors, setOnlineCounselors] = useState<AgentCounselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [{ data: agentsData }, { data: counselorsData }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agents') as any).select('*').order('rating', { ascending: false }).limit(5),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agent_counselors') as any).select('*').eq('is_online', true).order('rating', { ascending: false }).limit(6),
    ]);
    if (agentsData) setAgents(agentsData as Agent[]);
    if (counselorsData) setOnlineCounselors(counselorsData as AgentCounselor[]);
    setIsLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-primary">探す</Text>
        <Text className="text-muted text-sm mt-1">エージェント・カウンセラーに相談しよう</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-8">

        {/* オンライン中 */}
        {onlineCounselors.length > 0 && (
          <View className="mt-3 gap-3">
            <View className="flex-row items-center gap-2 px-4">
              <View className="w-2 h-2 rounded-full bg-green-500" />
              <Text className="text-sm font-semibold text-primary">今すぐ話せるカウンセラー</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 gap-3">
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
                  <View className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500" />
                  <Text className="text-primary text-xs font-medium text-center" numberOfLines={1}>{c.display_name}</Text>
                  <Text className="text-yellow-500 text-xs">★ {c.rating.toFixed(1)}</Text>
                  <Pressable
                    className="bg-primary rounded-lg px-3 py-1 mt-0.5 active:opacity-80"
                    onPress={() => router.push(`/agents/counselor/${c.id}` as never)}
                  >
                    <Text className="text-white text-xs font-semibold">話す</Text>
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* エージェント一覧 */}
        <View className="mt-5 px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-primary">エージェント一覧</Text>
            <Pressable onPress={() => router.push('/agents' as never)} accessibilityLabel="すべて見る">
              <Text className="text-primary text-xs">すべて見る →</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View className="py-8 items-center">
              <Text className="text-muted text-sm">読み込み中...</Text>
            </View>
          ) : agents.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-muted text-sm">エージェントが見つかりません</Text>
            </View>
          ) : (
            agents.map((agent) => (
              <Pressable
                key={agent.id}
                className="bg-white border border-border rounded-2xl p-4 gap-2 active:opacity-70"
                onPress={() => router.push(`/agents/${agent.id}` as never)}
                accessibilityLabel={agent.name}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                    <Text className="text-xl">🏢</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-primary font-semibold text-sm">{agent.name}</Text>
                    <Text className="text-yellow-500 text-xs">★ {agent.rating.toFixed(1)} ({agent.review_count}件)</Text>
                  </View>
                  <Text className="text-muted">›</Text>
                </View>
                <View className="flex-row flex-wrap gap-1.5">
                  {agent.countries.slice(0, 3).map((c) => (
                    <View key={c} className="bg-blue-50 rounded-full px-2 py-0.5">
                      <Text className="text-blue-700 text-xs">{c}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
