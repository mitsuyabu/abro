import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

import { AddBookingModal } from '@/components/booking/AddBookingModal';
import { AffiliateSection } from '@/components/booking/AffiliateCard';
import { BookingCard } from '@/components/booking/BookingCard';
import { useBookings } from '@/hooks/useBookings';
import type { Booking } from '@/types';

export default function BookingsScreen() {
  const router = useRouter();
  const { fetchBookings, deleteBooking } = useBookings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchBookings();
    setBookings(data);
  }, [fetchBookings]);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const handleDelete = async (bookingId: string) => {
    await deleteBooking(bookingId);
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">予約管理</Text>
        <Pressable
          className="px-3 py-1.5 bg-primary rounded-full active:opacity-80"
          onPress={() => setShowAddModal(true)}
          accessibilityLabel="予約を追加"
        >
          <Text className="text-white text-xs font-semibold">+ 追加</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-sm">読み込み中...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4 gap-4"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <AffiliateSection />
          }
          ListEmptyComponent={
            <View className="py-16 items-center gap-3">
              <Text className="text-4xl">🗒️</Text>
              <Text className="text-primary font-semibold text-base">予約記録がありません</Text>
              <Text className="text-muted text-sm text-center leading-relaxed">
                フライト・宿泊・学校など{'\n'}予約した内容を記録しておきましょう
              </Text>
              <Pressable
                className="mt-2 bg-primary rounded-xl px-6 py-3 active:opacity-80"
                onPress={() => setShowAddModal(true)}
              >
                <Text className="text-white text-sm font-semibold">予約を追加する</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      )}

      <AddBookingModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={(booking) => {
          setBookings((prev) => [booking, ...prev]);
          setShowAddModal(false);
        }}
      />
    </SafeAreaView>
  );
}
