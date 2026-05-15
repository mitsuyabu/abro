import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CATEGORY_META } from '@/components/listing/ListingCard';
import { useDm } from '@/hooks/useDm';
import { useListings } from '@/hooks/useListings';
import { useAuthStore } from '@/stores/auth';
import type { Listing, ListingPriceFrequency } from '@/types';
import { supabase } from '@/lib/supabase';

const FREQUENCY_LABELS: Record<ListingPriceFrequency, string> = {
  hour: '/ 時間', day: '/ 日', week: '/ 週', month: '/ 月', once: '(一括)',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

export default function ListingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { closeListing, sendInquiry, checkInquired } = useListings();
  const { fetchOrCreateThread } = useDm();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInquired, setHasInquired] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryText, setInquiryText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const [{ data }, inquired] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('listings') as any).select('*, user:users(id, nickname, avatar_url, phase)').eq('id', id).single(),
      checkInquired(id),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (data) setListing({ ...(data as any), user: (data as any).user ?? undefined });
    setHasInquired(inquired);
    setIsLoading(false);
  }, [id, checkInquired]);

  useEffect(() => { load(); }, [load]);

  const handleClose = () => {
    Alert.alert('募集終了', 'この投稿を募集終了にしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '終了する',
        style: 'destructive',
        onPress: async () => {
          await closeListing(id!);
          router.back();
        },
      },
    ]);
  };

  const handleDmOwner = async () => {
    if (!listing?.user_id) return;
    const threadId = await fetchOrCreateThread(listing.user_id);
    if (threadId) router.push(`/dm/${threadId}` as never);
  };

  const handleSendInquiry = async () => {
    if (!inquiryText.trim() || isSending) return;
    setIsSending(true);
    const ok = await sendInquiry(id!, inquiryText);
    setIsSending(false);
    if (ok) {
      setHasInquired(true);
      setShowInquiryModal(false);
      setInquiryText('');
      Alert.alert('送信完了', '問い合わせを送りました。DMでやり取りを続けましょう。', [
        { text: 'DMを開く', onPress: handleDmOwner },
        { text: '閉じる', style: 'cancel' },
      ]);
    } else {
      Alert.alert('エラー', 'すでに問い合わせ済みか、エラーが発生しました。');
    }
  };

  if (isLoading || !listing) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">{isLoading ? '読み込み中...' : '投稿が見つかりません'}</Text>
      </SafeAreaView>
    );
  }

  const meta = CATEGORY_META[listing.category] ?? CATEGORY_META.other;
  const isOwn = listing.user_id === user?.id;
  const location = [listing.city, listing.country].filter(Boolean).join(', ');
  const initial = listing.user?.nickname?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">掲示板</Text>
        {isOwn ? (
          <Pressable className="active:opacity-60" onPress={handleClose}>
            <Text className="text-muted text-xs">募集終了</Text>
          </Pressable>
        ) : <View className="w-16" />}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-5 gap-4">
        {/* カテゴリ + 日時 */}
        <View className="flex-row items-center justify-between">
          <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${meta.bg}`}>
            <Text>{meta.emoji}</Text>
            <Text className={`text-xs font-semibold ${meta.text}`}>{meta.label}</Text>
          </View>
          <Text className="text-muted text-xs">{formatRelativeTime(listing.created_at)}</Text>
        </View>

        {/* タイトル */}
        <Text className="text-primary font-bold text-xl leading-snug">{listing.title}</Text>

        {/* 場所・価格 */}
        {(location || listing.price_amount != null) && (
          <View className="flex-row gap-4">
            {location && (
              <View className="flex-row items-center gap-1">
                <Text className="text-sm">📍</Text>
                <Text className="text-primary text-sm">{location}</Text>
              </View>
            )}
            {listing.price_amount != null && (
              <View className="flex-row items-center gap-1">
                <Text className="text-sm">💴</Text>
                <Text className="text-green-700 font-semibold text-sm">
                  ¥{listing.price_amount.toLocaleString()}
                  {listing.price_frequency ? FREQUENCY_LABELS[listing.price_frequency] ?? '' : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 説明 */}
        <View className="bg-white border border-border rounded-2xl p-4">
          <Text className="text-primary text-sm leading-relaxed">{listing.description}</Text>
        </View>

        {/* 投稿者 */}
        <Pressable
          className="flex-row items-center gap-3 bg-white border border-border rounded-2xl p-4 active:opacity-70"
          onPress={() => router.push(`/profile/${listing.user_id}` as never)}
        >
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <Text className="text-base font-bold text-primary">{initial}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-primary font-semibold text-sm">{listing.user?.nickname ?? '名無し'}</Text>
            <Text className="text-muted text-xs">投稿者プロフィールを見る →</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* アクションボタン */}
      {!isOwn && listing.status === 'active' && (
        <View className="px-4 py-3 border-t border-border gap-2">
          <Pressable
            className={`rounded-xl py-3.5 items-center ${hasInquired ? 'bg-border' : 'bg-primary active:opacity-80'}`}
            onPress={hasInquired ? undefined : () => setShowInquiryModal(true)}
            disabled={hasInquired}
          >
            <Text className={`font-semibold text-sm ${hasInquired ? 'text-muted' : 'text-white'}`}>
              {hasInquired ? '問い合わせ済み ✓' : '📩 問い合わせる'}
            </Text>
          </Pressable>
          <Pressable
            className="border border-border rounded-xl py-3 items-center active:opacity-70"
            onPress={handleDmOwner}
          >
            <Text className="text-primary text-sm font-medium">💬 DM を送る</Text>
          </Pressable>
        </View>
      )}

      {/* 問い合わせモーダル */}
      <Modal visible={showInquiryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowInquiryModal(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable onPress={() => setShowInquiryModal(false)}>
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">問い合わせ</Text>
            <Pressable
              className={`px-4 py-1.5 rounded-full ${inquiryText.trim() && !isSending ? 'bg-primary' : 'bg-border'}`}
              onPress={handleSendInquiry}
              disabled={!inquiryText.trim() || isSending}
            >
              <Text className={`text-xs font-semibold ${inquiryText.trim() && !isSending ? 'text-white' : 'text-muted'}`}>
                {isSending ? '送信中...' : '送信'}
              </Text>
            </Pressable>
          </View>
          <View className="px-4 pt-4 gap-3">
            <Text className="text-muted text-xs">投稿者に問い合わせメッセージを送ります。送信後はDMでやり取りできます。</Text>
            <TextInput
              className="bg-white border border-border rounded-2xl px-4 py-3 text-primary text-sm"
              placeholder="例: シェアメイトについて詳しく教えてください。いつからお部屋は空いていますか？"
              placeholderTextColor="#A0A0A0"
              value={inquiryText}
              onChangeText={setInquiryText}
              multiline
              numberOfLines={5}
              maxLength={500}
              autoFocus
              style={{ minHeight: 120, textAlignVertical: 'top' }}
            />
            <Text className="text-muted text-xs text-right">{500 - inquiryText.length}文字</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
