import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

import { PostCard } from '@/components/post/PostCard';
import { CommentModal } from '@/components/post/CommentModal';
import { usePosts } from '@/hooks/usePosts';
import { useFollows } from '@/hooks/useFollows';
import { useDm } from '@/hooks/useDm';
import { useAuthStore } from '@/stores/auth';
import { useSnsStore } from '@/stores/sns';
import { supabase } from '@/lib/supabase';
import type { User, PostWithUser, UserPhase } from '@/types';

const PHASE_LABELS: Record<UserPhase, string> = {
  considering: '考え中',
  preparing: '準備中',
  abroad: '渡航中',
  returned: '帰国済',
};

const PHASE_BADGE_BG: Record<UserPhase, string> = {
  considering: 'bg-gray-100',
  preparing: 'bg-blue-100',
  abroad: 'bg-green-100',
  returned: 'bg-purple-100',
};

const PHASE_BADGE_TEXT: Record<UserPhase, string> = {
  considering: 'text-gray-600',
  preparing: 'text-blue-700',
  abroad: 'text-green-700',
  returned: 'text-purple-700',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const { toggleLike } = usePosts();
  const { fetchUserPosts } = usePosts();
  const { checkFollowing, follow, unfollow } = useFollows();
  const { fetchOrCreateThread } = useDm();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  const isOwn = currentUser?.id === id;

  useEffect(() => {
    if (!id) return;
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = async () => {
    setIsLoading(true);
    const [{ data: profileData }, userPosts, following] = await Promise.all([
      supabase.from('users').select('*').eq('id', id).single(),
      fetchUserPosts(id!),
      isOwn ? Promise.resolve(false) : checkFollowing(id!),
    ]);
    if (profileData) setProfile(profileData as User);
    setPosts(userPosts);
    setIsFollowing(following);
    setIsLoading(false);
  };

  const handleFollowToggle = async () => {
    if (!id) return;
    if (isFollowing) {
      await unfollow(id);
      setIsFollowing(false);
      setProfile((p) => p ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p);
    } else {
      await follow(id);
      setIsFollowing(true);
      setProfile((p) => p ? { ...p, followers_count: p.followers_count + 1 } : p);
    }
  };

  const handleDm = async () => {
    if (!id) return;
    const threadId = await fetchOrCreateThread(id);
    if (threadId) router.push(`/dm/${threadId}` as never);
    else Alert.alert('エラー', 'DMを開始できませんでした');
  };

  if (isLoading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  const phase = profile.phase as UserPhase;
  const badgeBg = PHASE_BADGE_BG[phase] ?? 'bg-gray-100';
  const badgeText = PHASE_BADGE_TEXT[phase] ?? 'text-gray-600';
  const initial = profile.nickname?.charAt(0)?.toUpperCase() ?? '?';

  const ListHeader = (
    <View>
      {/* プロフィールヘッダー */}
      <View className="px-4 pt-4 pb-5 gap-4">
        {/* アバター + 数値 */}
        <View className="flex-row items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
            <Text className="text-3xl font-bold text-primary">{initial}</Text>
          </View>
          <View className="flex-1 flex-row justify-around">
            <View className="items-center">
              <Text className="text-primary font-bold text-lg">{profile.posts_count}</Text>
              <Text className="text-muted text-xs">投稿</Text>
            </View>
            <View className="items-center">
              <Text className="text-primary font-bold text-lg">{profile.followers_count}</Text>
              <Text className="text-muted text-xs">フォロワー</Text>
            </View>
            <View className="items-center">
              <Text className="text-primary font-bold text-lg">{profile.following_count}</Text>
              <Text className="text-muted text-xs">フォロー中</Text>
            </View>
          </View>
        </View>

        {/* 名前 + フェーズ */}
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-primary font-bold text-lg">{profile.nickname ?? '名無し'}</Text>
            <View className={`rounded-full px-2 py-0.5 ${badgeBg}`}>
              <Text className={`text-xs font-medium ${badgeText}`}>{PHASE_LABELS[phase] ?? phase}</Text>
            </View>
          </View>
          {profile.bio && (
            <Text className="text-primary text-sm leading-relaxed">{profile.bio}</Text>
          )}
        </View>

        {/* アクションボタン */}
        {!isOwn && (
          <View className="flex-row gap-2">
            <Pressable
              className={`flex-1 rounded-xl py-2.5 items-center border active:opacity-70 ${isFollowing ? 'border-border bg-white' : 'bg-primary border-primary'}`}
              onPress={handleFollowToggle}
            >
              <Text className={`text-sm font-semibold ${isFollowing ? 'text-primary' : 'text-white'}`}>
                {isFollowing ? 'フォロー中' : 'フォローする'}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-xl py-2.5 items-center border border-border bg-white active:opacity-70"
              onPress={handleDm}
            >
              <Text className="text-primary text-sm font-semibold">💬 DM</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 区切り */}
      <View className="border-t border-border" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">
          {profile.nickname ?? 'プロフィール'}
        </Text>
        <View className="w-9" />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-muted text-sm">まだ投稿がありません</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={() => toggleLike(item.id, item.liked_by_me, item.like_count)}
            onComment={() => setCommentPostId(item.id)}
            onUserPress={() => {}}
            onPress={() => router.push(`/post/${item.id}` as never)}
          />
        )}
      />

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
