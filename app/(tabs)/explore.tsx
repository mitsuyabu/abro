import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { CommunityCard } from '@/components/community/CommunityCard';
import { CommentModal } from '@/components/post/CommentModal';
import { CreatePostModal } from '@/components/post/CreatePostModal';
import { PostCard } from '@/components/post/PostCard';
import { useCommunity } from '@/hooks/useCommunity';
import { usePosts } from '@/hooks/usePosts';
import { useCommunityStore } from '@/stores/community';
import { useSnsStore } from '@/stores/sns';

type Tab = 'timeline' | 'community';

export default function ExploreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('timeline');

  // タイムライン
  const { timeline } = useSnsStore();
  const { fetchTimeline, toggleLike } = usePosts();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  // コミュニティ
  const { communities, myCommunities } = useCommunityStore();
  const { fetchCommunities, join } = useCommunity();

  useEffect(() => {
    fetchTimeline();
    fetchCommunities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (activeTab === 'timeline') await fetchTimeline();
    else await fetchCommunities();
    setIsRefreshing(false);
  }, [activeTab, fetchTimeline, fetchCommunities]);

  const officialCommunities = communities.filter((c) => c.is_official);
  const customCommunities = communities.filter((c) => !c.is_official);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-0 border-b border-border">
        <View className="flex-row gap-1">
          {(['timeline', 'community'] as Tab[]).map((tab) => (
            <Pressable
              key={tab}
              className={`px-3 py-2 border-b-2 ${activeTab === tab ? 'border-primary' : 'border-transparent'}`}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={`text-sm font-semibold ${activeTab === tab ? 'text-primary' : 'text-muted'}`}>
                {tab === 'timeline' ? '🌏 タイムライン' : '👥 コミュニティ'}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'timeline' ? (
          <Pressable
            className="w-9 h-9 bg-primary rounded-full items-center justify-center active:opacity-80 mb-1"
            onPress={() => setShowCreatePost(true)}
            accessibilityLabel="投稿する"
          >
            <Text className="text-white text-xl font-light">+</Text>
          </Pressable>
        ) : (
          <Pressable
            className="mb-1 px-3 py-1.5 bg-primary rounded-full active:opacity-80"
            onPress={() => router.push('/community/new' as never)}
            accessibilityLabel="コミュニティを作る"
          >
            <Text className="text-white text-xs font-semibold">+ 作る</Text>
          </Pressable>
        )}
      </View>

      {/* ─── タイムライン ─── */}
      {activeTab === 'timeline' && (
        <FlatList
          data={timeline}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <Pressable
              className="mx-4 mt-3 mb-1 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5 flex-row items-center gap-2 active:opacity-70"
              onPress={() => router.push('/agents' as never)}
              accessibilityLabel="エージェントに相談する"
            >
              <Text className="text-lg">🎓</Text>
              <Text className="flex-1 text-primary text-xs font-medium">エージェント・カウンセラーに相談する</Text>
              <Text className="text-muted text-xs">›</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <View className="py-20 px-6 items-center gap-3">
              <Text className="text-4xl">🌏</Text>
              <Text className="text-primary font-semibold text-base text-center">まだ投稿がありません</Text>
              <Text className="text-muted text-sm text-center leading-relaxed">
                留学・ワーホリについて感じていること、{'\n'}経験談、情報を投稿してみましょう！
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
      )}

      {/* ─── コミュニティ ─── */}
      {activeTab === 'community' && (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-8"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          {/* 参加中 */}
          {myCommunities.length > 0 && (
            <View className="px-4 mt-4 gap-2">
              <Text className="text-xs font-semibold text-muted">参加中のコミュニティ</Text>
              {myCommunities.map((c) => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  onPress={() => router.push(`/community/${c.id}` as never)}
                />
              ))}
            </View>
          )}

          {/* 公式 */}
          {officialCommunities.length > 0 && (
            <View className="px-4 mt-5 gap-2">
              <Text className="text-xs font-semibold text-muted">公式コミュニティ</Text>
              {officialCommunities.map((c) => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  onPress={() => router.push(`/community/${c.id}` as never)}
                  onJoin={c.is_member ? undefined : () => join(c.id)}
                />
              ))}
            </View>
          )}

          {/* カスタム */}
          {customCommunities.length > 0 && (
            <View className="px-4 mt-5 gap-2">
              <Text className="text-xs font-semibold text-muted">みんなのコミュニティ</Text>
              {customCommunities.map((c) => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  onPress={() => router.push(`/community/${c.id}` as never)}
                  onJoin={c.is_member ? undefined : () => join(c.id)}
                />
              ))}
            </View>
          )}

          {communities.length === 0 && (
            <View className="py-20 items-center gap-2">
              <Text className="text-3xl">👥</Text>
              <Text className="text-primary font-semibold text-base">コミュニティを探そう</Text>
              <Text className="text-muted text-sm">読み込み中...</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* 投稿モーダル */}
      <CreatePostModal
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPosted={() => setShowCreatePost(false)}
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
