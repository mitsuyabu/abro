import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useBookings } from '@/hooks/useBookings';
import type { Booking, BookingType } from '@/types';

const BOOKING_TYPES: Array<{ value: BookingType; emoji: string; label: string }> = [
  { value: 'flight', emoji: '✈️', label: '航空券' },
  { value: 'accommodation', emoji: '🏨', label: '宿泊' },
  { value: 'school', emoji: '🎓', label: '学校' },
  { value: 'insurance', emoji: '🛡️', label: '保険' },
  { value: 'activity', emoji: '🎯', label: '体験' },
  { value: 'transfer', emoji: '💳', label: '送金' },
  { value: 'other', emoji: '📌', label: 'その他' },
];

interface AddBookingModalProps {
  visible: boolean;
  planId?: string;
  onClose: () => void;
  onAdded: (booking: Booking) => void;
}

export function AddBookingModal({ visible, planId, onClose, onAdded }: AddBookingModalProps) {
  const { addBooking } = useBookings();
  const [type, setType] = useState<BookingType>('flight');
  const [provider, setProvider] = useState('');
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [bookedAt, setBookedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const canPost = provider.trim().length > 0 && title.trim().length > 0;

  const handlePost = async () => {
    if (!canPost || isPosting) return;
    setIsPosting(true);
    const amount = amountText.trim() ? parseInt(amountText.replace(/,/g, ''), 10) : undefined;
    const booking = await addBooking({
      plan_id: planId,
      provider: provider.trim(),
      type,
      title: title.trim(),
      amount_jpy: amount,
      booked_at: bookedAt.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setIsPosting(false);
    if (booking) {
      reset();
      onAdded(booking);
    }
  };

  const reset = () => {
    setType('flight'); setProvider(''); setTitle('');
    setAmountText(''); setBookedAt(''); setNotes('');
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* ヘッダー */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={handleClose}>
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">予約を追加</Text>
            <Pressable
              className={`px-4 py-1.5 rounded-full ${canPost && !isPosting ? 'bg-primary' : 'bg-border'}`}
              onPress={handlePost}
              disabled={!canPost || isPosting}
            >
              <Text className={`text-xs font-semibold ${canPost && !isPosting ? 'text-white' : 'text-muted'}`}>
                {isPosting ? '保存中...' : '保存'}
              </Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
            {/* タイプ */}
            <Text className="text-xs font-semibold text-muted mb-2">種別</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {BOOKING_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${type === t.value ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                  onPress={() => setType(t.value)}
                >
                  <Text className="text-xs">{t.emoji}</Text>
                  <Text className={`text-xs font-medium ${type === t.value ? 'text-white' : 'text-primary'}`}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* 提供会社 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">会社・サービス名 <Text className="text-red-500">*</Text></Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
              placeholder="例: Skyscanner, Booking.com"
              placeholderTextColor="#A0A0A0"
              value={provider}
              onChangeText={setProvider}
              maxLength={100}
            />

            {/* タイトル */}
            <Text className="text-xs font-semibold text-muted mb-1.5">内容・タイトル <Text className="text-red-500">*</Text></Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
              placeholder="例: 成田→シドニー JL771"
              placeholderTextColor="#A0A0A0"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />

            {/* 金額 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">金額 (円)</Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
              placeholder="例: 85000"
              placeholderTextColor="#A0A0A0"
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* 予約日 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">予約日 / 出発日</Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
              placeholder="例: 2025-09-01"
              placeholderTextColor="#A0A0A0"
              value={bookedAt}
              onChangeText={setBookedAt}
              maxLength={10}
            />

            {/* メモ */}
            <Text className="text-xs font-semibold text-muted mb-1.5">メモ</Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
              placeholder="予約番号や確認事項など"
              placeholderTextColor="#A0A0A0"
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
