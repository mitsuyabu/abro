import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { CommentModal } from '@/components/post/CommentModal';
import { PostCard } from '@/components/post/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuthStore } from '@/stores/auth';
import { useSnsStore } from '@/stores/sns';
import type { PostWithUser } from '@/types';

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { timeline } = useSnsStore();
  const { fetchUserPosts, toggleLike, deletePost } = usePosts();

  const [post, setPost] = useState<PostWithUser | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    // Try to get post from store first
    const cached = timeline.find((p) => p.id === id);
    if (cached) {
      setPost(cached);
      setIsLoading(false);
    } else {
      // Fallback: fetch from the post's author (we don't know it, fetch timeline again)
      setIsLoading(false);
    }
  }, [id, timeline]);

  const handleDelete = () => {
    if (!post || !user || post.user_id !== user.id) return;
    Alert.alert('削除', 'この投稿を削除しますか?', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deletePost(post.id);
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">投稿が見つかりません</Text>
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
        <Text className="flex-1 text-center font-semibold text-primary text-sm">投稿</Text>
        {user?.id === post.user_id ? (
          <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={handleDelete}>
            <Text className="text-muted text-xs">削除</Text>
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      <ScrollView className="flex-1">
        <PostCard
          post={post}
          onLike={() => toggleLike(post.id, post.liked_by_me, post.like_count)}
          onComment={() => setShowComments(true)}
          onUserPress={() => router.push(`/profile/${post.user_id}` as never)}
          onPress={() => setShowComments(true)}
          truncate={false}
        />

        {/* コメントを開くボタン */}
        <Pressable
          className="mx-4 mt-4 border border-border rounded-xl py-3 items-center active:opacity-70"
          onPress={() => setShowComments(true)}
          accessibilityLabel="コメントを見る・書く"
        >
          <Text className="text-primary text-sm font-medium">
            💬 コメント {post.comment_count > 0 ? `(${post.comment_count}件)` : 'を書く'}
          </Text>
        </Pressable>
      </ScrollView>

      {showComments && (
        <CommentModal
          postId={post.id}
          visible={showComments}
          onClose={() => setShowComments(false)}
        />
      )}
    </SafeAreaView>
  );
}
