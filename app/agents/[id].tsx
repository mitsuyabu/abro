import { useLocalSearchParams, useRouter } from 'expo-router';
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
import type { Agent, AgentCounselor, AgentReview } from '@/types';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'text-base' : 'text-xs';
  return (
    <Text className={`text-yellow-500 ${cls}`}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))} {rating.toFixed(1)}
    </Text>
  );
}

export default function AgentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [counselors, setCounselors] = useState<AgentCounselor[]>([]);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    const [{ data: agentData }, { data: counselorData }, { data: reviewData }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agents') as any).select('*').eq('id', id).single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agent_counselors') as any).select('*').eq('agent_id', id).order('is_online', { ascending: false }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agent_reviews') as any).select('*').eq('agent_id', id).order('created_at', { ascending: false }).limit(10),
    ]);

    if (agentData) setAgent(agentData as Agent);
    if (counselorData) setCounselors(counselorData as AgentCounselor[]);
    if (reviewData) setReviews(reviewData as AgentReview[]);
    setIsLoading(false);
  };

  if (isLoading || !agent) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm" numberOfLines={1}>{agent.name}</Text>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-8">

        {/* 会社情報 */}
        <View className="px-4 py-5 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center">
              <Text className="text-3xl">🏢</Text>
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-bold text-primary">{agent.name}</Text>
                {agent.plan === 'premium' && (
                  <View className="bg-yellow-100 rounded px-2 py-0.5">
                    <Text className="text-yellow-700 text-xs font-semibold">PRO</Text>
                  </View>
                )}
              </View>
              <StarRating rating={agent.rating} size="lg" />
              <Text className="text-muted text-xs">{agent.review_count}件のレビュー</Text>
            </View>
          </View>

          {agent.description && (
            <Text className="text-primary text-sm leading-relaxed">{agent.description}</Text>
          )}

          <View className="flex-row flex-wrap gap-2">
            {agent.countries.map((c) => (
              <View key={c} className="bg-blue-50 rounded-full px-3 py-1">
                <Text className="text-blue-700 text-xs">🌏 {c}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {agent.specialties.map((s) => (
              <View key={s} className="bg-border rounded-full px-3 py-1">
                <Text className="text-muted text-xs">{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* カウンセラー一覧 */}
        <View className="px-4 gap-3">
          <Text className="text-sm font-semibold text-primary">カウンセラー({counselors.length}人)</Text>
          {counselors.map((c) => (
            <Pressable
              key={c.id}
              className="bg-white border border-border rounded-2xl p-4 gap-2 active:opacity-70"
              onPress={() => router.push(`/agents/counselor/${c.id}` as never)}
              accessibilityLabel={c.display_name}
            >
              <View className="flex-row items-start gap-3">
                <View className="relative">
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                    <Text className="text-2xl">👤</Text>
                  </View>
                  {c.is_online && (
                    <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </View>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-primary font-semibold text-sm">{c.display_name}</Text>
                    {c.is_online && <Text className="text-green-600 text-xs">● オンライン</Text>}
                  </View>
                  <StarRating rating={c.rating} />
                  {c.years_experience && (
                    <Text className="text-muted text-xs">経験 {c.years_experience}年</Text>
                  )}
                </View>
                <Text className="text-muted">›</Text>
              </View>
              {c.bio && (
                <Text className="text-muted text-xs leading-relaxed" numberOfLines={2}>{c.bio}</Text>
              )}
              <Pressable
                className={`rounded-xl py-2.5 items-center ${c.is_online ? 'bg-primary' : 'bg-border'}`}
                onPress={() => router.push(`/agents/counselor/${c.id}` as never)}
                accessibilityLabel={c.is_online ? '今すぐ話す' : '予約する'}
              >
                <Text className={`text-sm font-semibold ${c.is_online ? 'text-white' : 'text-muted'}`}>
                  {c.is_online ? '💬 今すぐ話す' : '📅 予約する'}
                </Text>
              </Pressable>
            </Pressable>
          ))}
        </View>

        {/* レビュー */}
        {reviews.length > 0 && (
          <View className="px-4 mt-5 gap-3">
            <Text className="text-sm font-semibold text-primary">レビュー</Text>
            {reviews.map((r) => (
              <View key={r.id} className="bg-white border border-border rounded-xl p-3 gap-1.5">
                <StarRating rating={r.rating} />
                {r.comment && <Text className="text-primary text-xs leading-relaxed">{r.comment}</Text>}
                <Text className="text-muted text-xs">{new Date(r.created_at).toLocaleDateString('ja-JP')}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
