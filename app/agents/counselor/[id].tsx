import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/stores/chat';
import type { AgentCounselor, AgentReview } from '@/types';

function StarButton({ value, selected, onPress }: { value: number; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={`${value}星`}>
      <Text className={`text-2xl ${selected ? 'text-yellow-500' : 'text-border'}`}>★</Text>
    </Pressable>
  );
}

export default function CounselorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [counselor, setCounselor] = useState<AgentCounselor | null>(null);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    const [{ data: counselorData }, { data: reviewData }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agent_counselors') as any).select('*, agents(name)').eq('id', id).single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('agent_reviews') as any).select('*').eq('counselor_id', id).order('created_at', { ascending: false }),
    ]);

    if (counselorData) setCounselor(counselorData as AgentCounselor);
    if (reviewData) setReviews(reviewData as AgentReview[]);
    setIsLoading(false);
  };

  const handleStartChat = async () => {
    if (!counselor) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // エージェントチャットを作成
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: chat } = await (supabase.from('chats') as any)
      .insert({
        user_id: user.id,
        title: `${counselor.display_name}さんへの相談`,
        type: 'agent',
      })
      .select()
      .single();

    if (chat) {
      useChatStore.getState().reset();
      useChatStore.getState().setMessages([]);
      router.push(`/chat/${(chat as { id: string }).id}` as never);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) { Alert.alert('評価を選んでください'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsSubmittingReview(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('agent_reviews') as any).insert({
      counselor_id: id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      agent_id: (counselor as any)?.agent_id ?? null,
      reviewer_id: user.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });

    setIsSubmittingReview(false);
    if (error) {
      Alert.alert('エラー', 'すでにレビュー済みか、エラーが発生しました。');
    } else {
      Alert.alert('ありがとうございます！', 'レビューを投稿しました。');
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment('');
      fetchData();
    }
  };

  if (isLoading || !counselor) {
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
        <Text className="flex-1 text-center font-semibold text-primary text-sm">{counselor.display_name}</Text>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-8">

        {/* プロフィール */}
        <View className="px-4 py-6 gap-4 items-center">
          <View className="relative">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
              <Text className="text-4xl">👤</Text>
            </View>
            {counselor.is_online && (
              <View className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
            )}
          </View>

          <View className="items-center gap-1">
            <Text className="text-xl font-bold text-primary">{counselor.display_name}</Text>
            {counselor.is_online
              ? <Text className="text-green-600 text-sm font-medium">● オンライン中</Text>
              : <Text className="text-muted text-sm">● オフライン</Text>
            }
            <Text className="text-yellow-500">
              {'★'.repeat(Math.round(counselor.rating))}{'☆'.repeat(5 - Math.round(counselor.rating))}
              {' '}{counselor.rating.toFixed(1)} ({counselor.review_count}件)
            </Text>
          </View>

          {counselor.bio && (
            <Text className="text-primary text-sm leading-relaxed text-center">{counselor.bio}</Text>
          )}

          {/* 専門・言語 */}
          <View className="flex-row flex-wrap gap-2 justify-center">
            {counselor.specialties.map((s) => (
              <View key={s} className="bg-primary/10 rounded-full px-3 py-1">
                <Text className="text-primary text-xs font-medium">{s}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row gap-2">
            {counselor.languages.map((l) => (
              <View key={l} className="bg-border rounded-full px-2 py-0.5">
                <Text className="text-muted text-xs">🗣️ {l}</Text>
              </View>
            ))}
            {counselor.years_experience && (
              <View className="bg-border rounded-full px-2 py-0.5">
                <Text className="text-muted text-xs">経験 {counselor.years_experience}年</Text>
              </View>
            )}
          </View>
        </View>

        {/* CTA ボタン */}
        <View className="px-4 gap-3">
          <Pressable
            className={`rounded-xl py-4 items-center ${counselor.is_online ? 'bg-primary' : 'bg-border'}`}
            onPress={counselor.is_online ? handleStartChat : () => Alert.alert('現在オフラインです', 'カウンセラーがオンラインになったら通知します。')}
            accessibilityLabel={counselor.is_online ? '今すぐ話す' : 'オフライン'}
          >
            <Text className={`font-semibold ${counselor.is_online ? 'text-white' : 'text-muted'}`}>
              {counselor.is_online ? '💬 今すぐ話す' : '🔔 オンライン時に通知'}
            </Text>
          </Pressable>

          <Pressable
            className="border border-border rounded-xl py-3.5 items-center active:opacity-70"
            onPress={() => Alert.alert('面談予約', '準備中です。チャットでご相談ください。')}
            accessibilityLabel="面談を予約する"
          >
            <Text className="text-primary text-sm font-medium">📅 面談を予約する</Text>
          </Pressable>
        </View>

        {/* レビュー投稿 */}
        <View className="px-4 mt-6 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-primary">レビュー ({reviews.length}件)</Text>
            {!showReviewForm && (
              <Pressable onPress={() => setShowReviewForm(true)} accessibilityLabel="レビューを書く">
                <Text className="text-primary text-xs font-medium">+ レビューを書く</Text>
              </Pressable>
            )}
          </View>

          {showReviewForm && (
            <View className="bg-white border border-border rounded-2xl p-4 gap-3">
              <Text className="text-sm font-medium text-primary">評価</Text>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <StarButton key={v} value={v} selected={reviewRating >= v} onPress={() => setReviewRating(v)} />
                ))}
              </View>
              <TextInput
                className="border border-border rounded-xl px-3 py-2 text-primary text-sm bg-background"
                placeholder="コメント(任意)"
                placeholderTextColor="#A0A0A0"
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 border border-border rounded-xl py-2.5 items-center active:opacity-70"
                  onPress={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment(''); }}
                >
                  <Text className="text-muted text-sm">キャンセル</Text>
                </Pressable>
                <Pressable
                  className={`flex-1 rounded-xl py-2.5 items-center ${reviewRating > 0 ? 'bg-primary' : 'bg-border'}`}
                  onPress={handleSubmitReview}
                  disabled={reviewRating === 0 || isSubmittingReview}
                >
                  <Text className={`text-sm font-semibold ${reviewRating > 0 ? 'text-white' : 'text-muted'}`}>投稿する</Text>
                </Pressable>
              </View>
            </View>
          )}

          {reviews.map((r) => (
            <View key={r.id} className="bg-white border border-border rounded-xl p-3 gap-1.5">
              <Text className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
              {r.comment && <Text className="text-primary text-xs leading-relaxed">{r.comment}</Text>}
              <Text className="text-muted text-xs">{new Date(r.created_at).toLocaleDateString('ja-JP')}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
