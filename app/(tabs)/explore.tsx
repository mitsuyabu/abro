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
import { ListingCard } from '@/components/listing/ListingCard';
import { CreateListingModal } from '@/components/listing/CreateListingModal';
import { useCommunity } from '@/hooks/useCommunity';
import { useListings } from '@/hooks/useListings';
import { usePosts } from '@/hooks/usePosts';
import { useCommunityStore } from '@/stores/community';
import { useSnsStore } from '@/stores/sns';
import type { Listing, ListingCategory } from '@/types';

type Tab = 'timeline' | 'community' | 'board';

const CATEGORY_CHIPS: Array<{ value: ListingCategory | null; label: string; emoji: string }> = [
  { value: null,               label: 'すべて',   emoji: '📋' },
  { value: 'job',              label: 'バイト',   emoji: '💼' },
  { value: 'roommate',         label: 'シェア',   emoji: '🏠' },
  { value: 'travel_companion', label: '同行者',   emoji: '✈️' },
  { value: 'item',             label: 'モノ',     emoji: '📦' },
  { value: 'other',            label: 'その他',   emoji: '📌' },
];

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

  // 掲示板
  const { fetchListings } = useListings();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | null>(null);
  const [showCreateListing, setShowCreateListing] = useState(false);

  useEffect(() => {
    fetchTimeline();
    fetchCommunities();
    fetchListings().then(setListings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (activeTab === 'timeline') await fetchTimeline();
    else if (activeTab === 'community') await fetchCommunities();
    else {
      const data = await fetchListings(selectedCategory ?? undefined);
      setListings(data);
    }
    setIsRefreshing(false);
  }, [activeTab, fetchTimeline, fetchCommunities, fetchListings, selectedCategory]);

  const handleCategoryFilter = useCallback(async (cat: ListingCategory | null) => {
    setSelectedCategory(cat);
    const data = await fetchListings(cat ?? undefined);
    setListings(data);
  }, [fetchListings]);

  const officialCommunities = communities.filter((c) => c.is_official);
  const customCommunities = communities.filter((c) => !c.is_official);

  const TAB_CONFIG: Array<{ key: Tab; label: string }> = [
    { key: 'timeline',  label: '🌏 投稿' },
    { key: 'community', label: '👥 コミュ' },
    { key: 'board',     label: '📋 掲示板' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ── タブヘッダー ── */}
      <View className="flex-row items-center border-b border-border px-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <View className="flex-row">
            {TAB_CONFIG.map((t) => (
              <Pressable
                key={t.key}
                className={`px-3 py-3 border-b-2 ${activeTab === t.key ? 'border-primary' : 'border-transparent'}`}
                onPress={() => setActiveTab(t.key)}
              >
                <Text className={`text-sm font-semibold ${activeTab === t.key ? 'text-primary' : 'text-muted'}`}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* アクションボタン */}
        {activeTab === 'timeline' && (
          <Pressable
            className="w-9 h-9 bg-primary rounded-full items-center justify-center active:opacity-80 mr-2"
            onPress={() => setShowCreatePost(true)}
          >
            <Text className="text-white text-xl font-light">+</Text>
          </Pressable>
        )}
        {activeTab === 'community' && (
          <Pressable
            className="mr-2 px-3 py-1.5 bg-primary rounded-full active:opacity-80"
            onPress={() => router.push('/community/new' as never)}
          >
            <Text className="text-white text-xs font-semibold">+ 作る</Text>
          </Pressable>
        )}
        {activeTab === 'board' && (
          <Pressable
            className="mr-2 px-3 py-1.5 bg-primary rounded-full active:opacity-80"
            onPress={() => setShowCreateListing(true)}
          >
            <Text className="text-white text-xs font-semibold">+ 投稿</Text>
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
                留学・ワーホリについて{'\n'}感じていることを投稿しよう！
              </Text>
              <Pressable className="mt-2 bg-primary rounded-xl px-6 py-3 active:opacity-80" onPress={() => setShowCreatePost(true)}>
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
          {myCommunities.length > 0 && (
            <View className="px-4 mt-4 gap-2">
              <Text className="text-xs font-semibold text-muted">参加中のコミュニティ</Text>
              {myCommunities.map((c) => (
                <CommunityCard key={c.id} community={c} onPress={() => router.push(`/community/${c.id}` as never)} />
              ))}
            </View>
          )}
          {officialCommunities.length > 0 && (
            <View className="px-4 mt-5 gap-2">
              <Text className="text-xs font-semibold text-muted">公式コミュニティ</Text>
              {officialCommunities.map((c) => (
                <CommunityCard key={c.id} community={c} onPress={() => router.push(`/community/${c.id}` as never)} onJoin={c.is_member ? undefined : () => join(c.id)} />
              ))}
            </View>
          )}
          {customCommunities.length > 0 && (
            <View className="px-4 mt-5 gap-2">
              <Text className="text-xs font-semibold text-muted">みんなのコミュニティ</Text>
              {customCommunities.map((c) => (
                <CommunityCard key={c.id} community={c} onPress={() => router.push(`/community/${c.id}` as never)} onJoin={c.is_member ? undefined : () => join(c.id)} />
              ))}
            </View>
          )}
          {communities.length === 0 && (
            <View className="py-20 items-center gap-2">
              <Text className="text-3xl">👥</Text>
              <Text className="text-muted text-sm">読み込み中...</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ─── 掲示板 ─── */}
      {activeTab === 'board' && (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-8 gap-3"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3 -mx-4 px-4">
              <View className="flex-row gap-2 pr-4">
                {CATEGORY_CHIPS.map((chip) => {
                  const active = selectedCategory === chip.value;
                  return (
                    <Pressable
                      key={chip.value ?? 'all'}
                      className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${active ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                      onPress={() => handleCategoryFilter(chip.value)}
                    >
                      <Text className="text-xs">{chip.emoji}</Text>
                      <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-primary'}`}>{chip.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          }
          ListEmptyComponent={
            <View className="py-20 items-center gap-3">
              <Text className="text-4xl">📋</Text>
              <Text className="text-primary font-semibold text-base">まだ投稿がありません</Text>
              <Text className="text-muted text-sm text-center leading-relaxed">
                バイト・シェアメイト・同行者など{'\n'}募集を投稿してみましょう
              </Text>
              <Pressable className="mt-2 bg-primary rounded-xl px-6 py-3 active:opacity-80" onPress={() => setShowCreateListing(true)}>
                <Text className="text-white text-sm font-semibold">投稿する</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}` as never)} />
          )}
        />
      )}

      {/* ── モーダル ── */}
      <CreatePostModal visible={showCreatePost} onClose={() => setShowCreatePost(false)} onPosted={() => setShowCreatePost(false)} />
      {commentPostId && (
        <CommentModal postId={commentPostId} visible={!!commentPostId} onClose={() => setCommentPostId(null)} />
      )}
      <CreateListingModal
        visible={showCreateListing}
        onClose={() => setShowCreateListing(false)}
        onCreated={(listing) => {
          setListings((prev) => [listing, ...prev]);
          setShowCreateListing(false);
        }}
      />
    </SafeAreaView>
  );
}
