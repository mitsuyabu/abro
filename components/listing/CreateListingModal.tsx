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

import { CATEGORY_META } from './ListingCard';
import { useListings } from '@/hooks/useListings';
import type { Listing, ListingCategory } from '@/types';

const CATEGORIES: ListingCategory[] = ['job', 'roommate', 'travel_companion', 'item', 'other'];

const FREQUENCY_OPTIONS = [
  { value: 'hour',  label: '/ 時間' },
  { value: 'day',   label: '/ 日'   },
  { value: 'week',  label: '/ 週'   },
  { value: 'month', label: '/ 月'   },
  { value: 'once',  label: '一括'   },
];

interface CreateListingModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (listing: Listing) => void;
}

export function CreateListingModal({ visible, onClose, onCreated }: CreateListingModalProps) {
  const { createListing } = useListings();
  const [category, setCategory] = useState<ListingCategory>('job');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [priceAmount, setPriceAmount] = useState('');
  const [priceFrequency, setPriceFrequency] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const canPost = title.trim().length > 0 && description.trim().length > 0;

  const handleCreate = async () => {
    if (!canPost || isCreating) return;
    setIsCreating(true);
    const listing = await createListing({
      category,
      title,
      description,
      country: country || undefined,
      city: city || undefined,
      priceAmount: priceAmount ? parseInt(priceAmount, 10) : undefined,
      priceFrequency: priceFrequency || undefined,
    });
    setIsCreating(false);
    if (listing) {
      reset();
      onCreated(listing);
    }
  };

  const reset = () => {
    setTitle(''); setDescription(''); setCountry(''); setCity('');
    setPriceAmount(''); setPriceFrequency(''); setCategory('job');
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
            <Text className="font-semibold text-primary text-sm">掲示板に投稿</Text>
            <Pressable
              className={`px-4 py-1.5 rounded-full ${canPost && !isCreating ? 'bg-primary' : 'bg-border'}`}
              onPress={handleCreate}
              disabled={!canPost || isCreating}
            >
              <Text className={`text-xs font-semibold ${canPost && !isCreating ? 'text-white' : 'text-muted'}`}>
                {isCreating ? '投稿中...' : '投稿する'}
              </Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">

            {/* カテゴリ */}
            <Text className="text-xs font-semibold text-muted mb-2">カテゴリ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2 pr-4">
                {CATEGORIES.map((c) => {
                  const meta = CATEGORY_META[c];
                  const selected = category === c;
                  return (
                    <Pressable
                      key={c}
                      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                      onPress={() => setCategory(c)}
                    >
                      <Text className="text-sm">{meta.emoji}</Text>
                      <Text className={`text-xs font-medium ${selected ? 'text-white' : 'text-primary'}`}>{meta.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* タイトル */}
            <Text className="text-xs font-semibold text-muted mb-1.5">タイトル <Text className="text-red-500">*</Text></Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
              placeholder="例: バンクーバーでシェアメイト募集"
              placeholderTextColor="#A0A0A0"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            {/* 説明 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">詳細 <Text className="text-red-500">*</Text></Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
              placeholder="条件、場所、連絡方法など詳しく書いてください"
              placeholderTextColor="#A0A0A0"
              value={description}
              onChangeText={setDescription}
              maxLength={1000}
              multiline
              numberOfLines={5}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />

            {/* 場所 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">場所（任意）</Text>
            <View className="flex-row gap-2 mb-4">
              <TextInput
                className="flex-1 bg-white border border-border rounded-xl px-3 py-3 text-primary text-sm"
                placeholder="国 例: カナダ"
                placeholderTextColor="#A0A0A0"
                value={country}
                onChangeText={setCountry}
                maxLength={50}
              />
              <TextInput
                className="flex-1 bg-white border border-border rounded-xl px-3 py-3 text-primary text-sm"
                placeholder="都市 例: バンクーバー"
                placeholderTextColor="#A0A0A0"
                value={city}
                onChangeText={setCity}
                maxLength={50}
              />
            </View>

            {/* 報酬・金額 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">金額（任意）</Text>
            <View className="flex-row gap-2 mb-6">
              <TextInput
                className="w-28 bg-white border border-border rounded-xl px-3 py-3 text-primary text-sm"
                placeholder="¥ 金額"
                placeholderTextColor="#A0A0A0"
                value={priceAmount}
                onChangeText={(t) => setPriceAmount(t.replace(/\D/g, ''))}
                keyboardType="numeric"
                maxLength={8}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {FREQUENCY_OPTIONS.map((f) => (
                    <Pressable
                      key={f.value}
                      className={`px-3 py-3 rounded-xl border ${priceFrequency === f.value ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                      onPress={() => setPriceFrequency(priceFrequency === f.value ? '' : f.value)}
                    >
                      <Text className={`text-xs font-medium ${priceFrequency === f.value ? 'text-white' : 'text-primary'}`}>{f.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
