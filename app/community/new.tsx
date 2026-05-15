import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useCommunity } from '@/hooks/useCommunity';
import { useCommunityStore } from '@/stores/community';

const EMOJI_OPTIONS = ['🌏', '🏙️', '✈️', '🎓', '💬', '🏠', '💼', '🌱', '🤝', '🎯', '📚', '💰', '🗺️', '🌊', '🏔️'];

export default function NewCommunityScreen() {
  const router = useRouter();
  const { createCommunity } = useCommunity();
  const { setCommunities, communities } = useCommunityStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverEmoji, setCoverEmoji] = useState('🌏');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);
    const community = await createCommunity(name.trim(), description.trim(), coverEmoji);
    if (community) {
      setCommunities([community, ...communities]);
      router.replace(`/community/${community.id}` as never);
    } else {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">コミュニティを作る</Text>
        <Pressable
          className={`px-3 py-1.5 rounded-full ${name.trim() && !isCreating ? 'bg-primary' : 'bg-border'}`}
          onPress={handleCreate}
          disabled={!name.trim() || isCreating}
        >
          <Text className={`text-xs font-semibold ${name.trim() && !isCreating ? 'text-white' : 'text-muted'}`}>
            {isCreating ? '作成中...' : '作成'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView className="flex-1 px-4 py-5" keyboardShouldPersistTaps="handled">

          {/* プレビュー */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-2xl bg-primary/5 items-center justify-center mb-2">
              <Text className="text-4xl">{coverEmoji}</Text>
            </View>
            <Text className="text-primary font-bold text-base">{name || 'コミュニティ名'}</Text>
          </View>

          {/* 絵文字選択 */}
          <Text className="text-xs font-semibold text-muted mb-2">アイコン絵文字</Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {EMOJI_OPTIONS.map((e) => (
              <Pressable
                key={e}
                className={`w-12 h-12 rounded-xl items-center justify-center active:opacity-70 ${e === coverEmoji ? 'bg-primary/10 border-2 border-primary' : 'bg-white border border-border'}`}
                onPress={() => setCoverEmoji(e)}
              >
                <Text className="text-2xl">{e}</Text>
              </Pressable>
            ))}
          </View>

          {/* 名前 */}
          <Text className="text-xs font-semibold text-muted mb-1.5">コミュニティ名 <Text className="text-red-500">*</Text></Text>
          <TextInput
            className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
            placeholder="例: バンクーバーの日本人"
            placeholderTextColor="#A0A0A0"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />

          {/* 説明 */}
          <Text className="text-xs font-semibold text-muted mb-1.5">説明（任意）</Text>
          <TextInput
            className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm"
            placeholder="このコミュニティはどんな人向けですか？"
            placeholderTextColor="#A0A0A0"
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          <Text className="text-muted text-xs mt-3 leading-relaxed">
            コミュニティを作ると、あなたがオーナーになります。{'\n'}
            公序良俗に反するコミュニティは削除される場合があります。
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
