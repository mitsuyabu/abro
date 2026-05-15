import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import { useChat } from '@/hooks/useChat';
import type { Chat } from '@/types';

const ACTION_CHIPS = [
  { id: 'plan', emoji: '✨', label: 'プランを作る', prompt: 'どんな留学・ワーホリを考えていますか？目的・期間・予算を教えてください。', available: true },
  { id: 'cost', emoji: '💰', label: '費用シミュレート', prompt: '留学・ワーホリの費用をシミュレーションしたいです。まず渡航先と滞在期間を教えてください。', available: true },
  { id: 'save', emoji: '📌', label: '情報を保存', prompt: '', available: true },
  { id: 'senpai', emoji: '👥', label: '先輩に質問', prompt: '', available: false },
  { id: 'agent', emoji: '🎓', label: 'エージェント相談', prompt: '', available: false },
] as const;

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { chats } = useChatStore();
  const { fetchChats, sendMessage } = useChat();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setInputText('');
    setIsSending(true);
    useChatStore.getState().reset();
    useChatStore.getState().setMessages([]);

    // 新規チャット作成 → チャット画面へ先に遷移
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/chat/[id]' as any, params: { id: 'new', initialMessage: trimmed } });
    setIsSending(false);
  }, [isSending, router]);

  const handleChipPress = useCallback((chip: typeof ACTION_CHIPS[number]) => {
    if (!chip.available) {
      return;
    }
    if (chip.id === 'cost') {
      useChatStore.getState().reset();
      useChatStore.getState().setMessages([]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push({ pathname: '/chat/[id]' as any, params: { id: 'new', initialMessage: chip.prompt, mode: 'cost_simulation' } });
      return;
    }
    if (chip.id === 'save') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/(tabs)/saved' as any);
      return;
    }
    handleSend(chip.prompt);
  }, [handleSend, router]);

  const handleChatPress = useCallback((chat: Chat) => {
    useChatStore.getState().reset();
    router.push(`/chat/${chat.id}`);
  }, [router]);

  const greeting = user?.nickname ? `こんにちは、${user.nickname}さん` : 'こんにちは';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {chats.length === 0 ? (
          /* ── ホーム画面(チャットなし) ── */
          <View className="flex-1 px-6">
            {/* ヘッダー */}
            <View className="pt-4 pb-6 flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-primary tracking-tight">Abro</Text>
            </View>

            {/* 挨拶エリア */}
            <View className="flex-1 justify-center items-center gap-2 mb-8">
              <Text className="text-xl font-semibold text-primary text-center">{greeting}</Text>
              <Text className="text-muted text-sm text-center">今日はどんな相談をしますか?</Text>
            </View>

            {/* アクションチップ */}
            <View className="gap-3 mb-4">
              <View className="flex-row gap-3">
                {ACTION_CHIPS.slice(0, 2).map((chip) => (
                  <ActionChip key={chip.id} chip={chip} onPress={() => handleChipPress(chip)} />
                ))}
              </View>
              <View className="flex-row gap-3">
                {ACTION_CHIPS.slice(2, 4).map((chip) => (
                  <ActionChip key={chip.id} chip={chip} onPress={() => handleChipPress(chip)} />
                ))}
              </View>
              <ActionChip chip={ACTION_CHIPS[4]} onPress={() => handleChipPress(ACTION_CHIPS[4])} wide />
            </View>
          </View>
        ) : (
          /* ── チャット履歴リスト ── */
          <View className="flex-1">
            <View className="px-6 pt-4 pb-2">
              <Text className="text-2xl font-bold text-primary tracking-tight">Abro</Text>
            </View>
            <FlatList
              data={chats}
              keyExtractor={(item) => item.id}
              contentContainerClassName="px-6 pb-4 gap-1"
              renderItem={({ item }) => (
                <Pressable
                  className="flex-row items-center py-4 border-b border-border active:opacity-60"
                  onPress={() => handleChatPress(item)}
                  accessibilityLabel={`チャット: ${item.title ?? '無題'}`}
                >
                  <View className="w-10 h-10 rounded-full bg-border items-center justify-center mr-3">
                    <Text className="text-lg">💬</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-primary font-medium text-sm" numberOfLines={1}>
                      {item.title ?? '無題のチャット'}
                    </Text>
                    <Text className="text-muted text-xs mt-0.5">
                      {formatRelativeTime(item.updated_at)}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* ── 入力欄(常時固定) ── */}
        <View className="px-4 py-3 border-t border-border bg-background">
          <View className="flex-row items-center bg-white border border-border rounded-2xl px-4 py-3 gap-2">
            <TextInput
              className="flex-1 text-primary text-sm"
              placeholder="何でも聞いてください..."
              placeholderTextColor="#A0A0A0"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={() => handleSend(inputText)}
              returnKeyType="send"
              blurOnSubmit
            />
            <Pressable
              className={`w-8 h-8 rounded-full items-center justify-center ${inputText.trim() ? 'bg-primary' : 'bg-border'}`}
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim() || isSending}
              accessibilityLabel="送信"
            >
              <Text className="text-white text-sm">→</Text>
            </Pressable>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ActionChip({
  chip,
  onPress,
  wide = false,
}: {
  chip: { emoji: string; label: string; available: boolean };
  onPress: () => void;
  wide?: boolean;
}) {
  return (
    <Pressable
      className={[
        'bg-white border border-border rounded-2xl p-4 active:opacity-70',
        wide ? 'flex-1' : 'flex-1',
        !chip.available ? 'opacity-40' : '',
      ].join(' ')}
      onPress={onPress}
      disabled={!chip.available}
      accessibilityLabel={chip.label}
    >
      <Text className="text-xl mb-1">{chip.emoji}</Text>
      <Text className="text-primary text-sm font-medium">{chip.label}</Text>
      {!chip.available && (
        <Text className="text-muted text-xs mt-0.5">準備中</Text>
      )}
    </Pressable>
  );
}
