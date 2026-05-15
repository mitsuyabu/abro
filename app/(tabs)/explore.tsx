import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

import { CommentModal } from '@/components/post/CommentModal';
import { CreatePostModal } from '@/components/post/CreatePostModal';
import { PostCard } from '@/components/post/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useSnsStore } from '@/stores/sns';

export default function ExploreScreen() {
  const router = useRouter();
  const { timeline } = useSnsStore();
  const { fetchTimeline, toggleLike } = usePosts();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTimeline();
    setIsRefreshing(false);
  }, [fetchTimeline]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Text className="text-2xl font-bold text-primary">タイムライン</Text>
        <Pressable
          className="w-9 h-9 bg-primary rounded-full items-center justify-center active:opacity-80"
          onPress={() => setShowCreatePost(true)}
          accessibilityLabel="投稿する"
        >
          <Text className="text-white text-xl font-light">+</Text>
        </Pressable>
      </View>

      {/* エージェントバナー */}
      <Pressable
        className="mx-4 mt-3 mb-1 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5 flex-row items-center gap-2 active:opacity-70"
        onPress={() => router.push('/agents' as never)}
        accessibilityLabel="エージェントに相談する"
      >
        <Text className="text-lg">🎓</Text>
        <Text className="flex-1 text-primary text-xs font-medium">エージェント・カウンセラーに相談する</Text>
        <Text className="text-muted text-xs">›</Text>
      </Pressable>

      {/* タイムライン */}
      <FlatList
        data={timeline}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View className="py-20 px-6 items-center gap-3">
            <Text className="text-4xl">🌏</Text>
            <Text className="text-primary font-semibold text-base text-center">まだ投稿がありません</Text>
            <Text className="text-muted text-sm text-center leading-relaxed">
              留学・ワーホリについて感じていること、{'\n'}
              経験談、情報を投稿してみましょう！
            </Text>
            <Pressable
              className="mt-2 bg-primary rounded-xl px-6 py-3 active:opacity-80"
              onPress={() => setShowCreatePost(true)}
            >
              <Text className="text-white text-sm font-semibold">最初の投稿をする</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={() => toggleLike(item.id, item.liked_by_me, item.like_count)}
            onComment={() => setCommentPostId(item.id)}
            onUserPress={() => router.push(`/profile/${item.user_id}` as never)}
            onPress={() => router.push(`/post/${item.id}` as never)}
          />
        )}
      />

      {/* 投稿モーダル */}
      <CreatePostModal
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPosted={() => setShowCreatePost(false)}
      />

      {/* コメントモーダル */}
      {commentPostId && (
        <CommentModal
          postId={commentPostId}
          visible={!!commentPostId}
          onClose={() => setCommentPostId(null)}
        />
      )}
    </SafeAreaView>
  );
}
