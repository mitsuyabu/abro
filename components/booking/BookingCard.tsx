import { Alert, Pressable, Text, View } from 'react-native';

import type { Booking, BookingType } from '@/types';

const TYPE_ICONS: Record<BookingType, string> = {
  flight: '✈️',
  accommodation: '🏨',
  school: '🎓',
  insurance: '🛡️',
  activity: '🎯',
  transfer: '💳',
  other: '📌',
};

const TYPE_LABELS: Record<BookingType, string> = {
  flight: '航空券',
  accommodation: '宿泊',
  school: '学校',
  insurance: '保険',
  activity: '体験',
  transfer: '送金',
  other: 'その他',
};

const STATUS_COLORS: Record<Booking['status'], string> = {
  confirmed: 'text-green-600',
  pending: 'text-yellow-600',
  cancelled: 'text-red-400',
};

const STATUS_LABELS: Record<Booking['status'], string> = {
  confirmed: '確認済',
  pending: '保留中',
  cancelled: 'キャンセル',
};

interface BookingCardProps {
  booking: Booking;
  onDelete?: () => void;
}

export function BookingCard({ booking, onDelete }: BookingCardProps) {
  const icon = TYPE_ICONS[booking.type] ?? '📌';
  const label = TYPE_LABELS[booking.type] ?? booking.type;

  const handleDelete = () => {
    Alert.alert('削除', `「${booking.title}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View className="bg-white border border-border rounded-2xl p-4 gap-2">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-2xl">{icon}</Text>
          <View className="flex-1 gap-0.5">
            <Text className="text-xs text-muted">{label} · {booking.provider}</Text>
            <Text className="text-primary font-medium text-sm" numberOfLines={2}>{booking.title}</Text>
          </View>
        </View>
        <View className="items-end gap-1">
          <Text className={`text-xs font-semibold ${STATUS_COLORS[booking.status]}`}>
            {STATUS_LABELS[booking.status]}
          </Text>
          {onDelete && (
            <Pressable onPress={handleDelete} accessibilityLabel="削除" className="active:opacity-60">
              <Text className="text-muted text-xs">削除</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-4 pt-1">
        {booking.amount_jpy != null && (
          <Text className="text-primary font-semibold text-sm">¥{booking.amount_jpy.toLocaleString()}</Text>
        )}
        {booking.booked_at && (
          <Text className="text-muted text-xs">{booking.booked_at}</Text>
        )}
      </View>

      {booking.notes && (
        <Text className="text-muted text-xs leading-relaxed">{booking.notes}</Text>
      )}
    </View>
  );
}
