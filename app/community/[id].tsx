import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CommunityPostCard } from '@/components/community/CommunityPostCard';
import { useCommunity } from '@/hooks/useCommunity';
import { useAuthStore } from '@/stores/auth';
import { useCommunityStore } from '@/stores/community';
import type { CommunityPost } from '@/types';

export default function CommunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { communities } = useCommunityStore();
  const { join, leave, fetchCommunityPosts, createPost, togglePostLike, deletePost } = useCommunity();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const community = communities.find((c) => c.id === id);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await fetchCommunityPosts(id);
    setPosts(data);
    setIsLoading(false);
  }, [id, fetchCommunityPosts]);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleJoin = async () => {
    if (!id) return;
    await join(id);
  };

  const handleLeave = () => {
    Alert.alert('退出', 'このコミュニティを退出しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await leave(id!);
          router.back();
        },
      },
    ]);
  };

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !id) return;
    setIsSending(true);
    const post = await createPost(id, trimmed);
    if (post) {
      setPosts((prev) => [post, ...prev]);
      setInputText('');
    }
    setIsSending(false);
  }, [inputText, isSending, id, createPost]);

  const handleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
    await togglePostLike(postId, currentlyLiked);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked_by_me: !currentlyLiked, like_count: currentlyLiked ? Math.max(0, p.like_count - 1) : p.like_count + 1 }
          : p
      )
    );
  }, [togglePostLike]);

  const handleDeletePost = useCallback((postId: string) => {
    Alert.alert('削除', 'この投稿を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deletePost(postId);
          setPosts((prev) => prev.filter((p) => p.id !== postId));
        },
      },
    ]);
  }, [deletePost]);

  if (!community) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">コミュニティが見つかりません</Text>
      </SafeAreaView>
    );
  }

  const isMember = !!community.is_member;

  const ListHeader = (
    <View>
      {/* コミュニティ情報 */}
      <View className="px-4 py-5 border-b border-border gap-3">
        <View className="flex-row items-center gap-3">
          <View className="w-14 h-14 rounded-2xl bg-primary/5 items-center justify-center">
            <Text className="text-3xl">{community.cover_emoji}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-primary font-bold text-base">{community.name}</Text>
              {community.is_official && (
                <View className="bg-blue-50 rounded-full px-2 py-0.5">
                  <Text className="text-blue-600 text-xs font-medium">公式</Text>
                </View>
              )}
            </View>
            <View className="flex-row gap-3 mt-1">
              <Text className="text-muted text-xs">👥 {community.member_count}人</Text>
              <Text className="text-muted text-xs">💬 {community.post_count}件</Text>
            </View>
          </View>
        </View>

        {community.description && (
          <Text className="text-primary text-sm leading-relaxed">{community.description}</Text>
        )}

        {/* 参加/退出ボタン */}
        {isMember ? (
          community.my_role !== 'owner' && (
            <Pressable
              className="border border-border rounded-xl py-2.5 items-center active:opacity-70"
              onPress={handleLeave}
            >
              <Text className="text-muted text-sm">退出する</Text>
            </Pressable>
          )
        ) : (
          <Pressable
            className="bg-primary rounded-xl py-3 items-center active:opacity-80"
            onPress={handleJoin}
          >
            <Text className="text-white text-sm font-semibold">このコミュニティに参加する</Text>
          </Pressable>
        )}
      </View>

      {/* 投稿ラベル */}
      <View className="px-4 py-2 bg-background">
        <Text className="text-xs font-semibold text-muted">みんなの投稿</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm" numberOfLines={1}>
          {community.name}
        </Text>
        <View className="w-9" />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted text-sm">読み込み中...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={posts}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={
              <View className="py-16 items-center gap-2">
                <Text className="text-muted text-sm">
                  {isMember ? 'まだ投稿がありません。最初の投稿をしよう！' : 'コミュニティに参加すると投稿が見えます'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <CommunityPostCard
                post={item}
                onLike={() => handleLike(item.id, !!item.liked_by_me)}
                onUserPress={() => router.push(`/profile/${item.user_id}` as never)}
                isOwn={item.user_id === user?.id}
                onDelete={() => handleDeletePost(item.id)}
              />
            )}
          />
        )}

        {/* 投稿入力 (メンバーのみ) */}
        {isMember && (
          <View className="px-4 py-3 border-t border-border flex-row items-center gap-2">
            <TextInput
              className="flex-1 bg-white border border-border rounded-2xl px-3 py-2.5 text-primary text-sm"
              placeholder="コミュニティに投稿する..."
              placeholderTextColor="#A0A0A0"
              value={inputText}
              onChangeText={setInputText}
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              className={`w-9 h-9 rounded-full items-center justify-center ${inputText.trim() && !isSending ? 'bg-primary' : 'bg-border'}`}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
            >
              <Text className="text-white text-sm">→</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
