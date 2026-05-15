import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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

import { useDm } from '@/hooks/useDm';
import { useAuthStore } from '@/stores/auth';
import type { DmMessage } from '@/types';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

export default function DmThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { fetchMessages, sendMessage } = useDm();

  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    fetchMessages(id).then((data) => {
      setMessages(data);
      setIsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !id) return;
    setIsSending(true);
    const msg = await sendMessage(id, trimmed);
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setIsSending(false);
  }, [inputText, isSending, id, sendMessage]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
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
        <Text className="flex-1 text-center font-semibold text-primary text-sm">メッセージ</Text>
        <View className="w-9" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4 gap-2"
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="py-10 items-center">
              <Text className="text-muted text-sm">最初のメッセージを送ってみましょう</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View className={`flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                <View
                  className={`max-w-xs px-3 py-2 rounded-2xl ${isMe ? 'bg-primary rounded-br-sm' : 'bg-white border border-border rounded-bl-sm'}`}
                >
                  <Text className={`text-sm ${isMe ? 'text-white' : 'text-primary'}`}>{item.content}</Text>
                  <Text className={`text-xs mt-0.5 text-right ${isMe ? 'text-white/70' : 'text-muted'}`}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* 入力エリア */}
        <View className="px-4 py-3 border-t border-border flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-white border border-border rounded-2xl px-4 py-2.5 text-primary text-sm"
            placeholder="メッセージを入力..."
            placeholderTextColor="#A0A0A0"
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            className={`w-10 h-10 rounded-full items-center justify-center ${inputText.trim() && !isSending ? 'bg-primary' : 'bg-border'}`}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            accessibilityLabel="送信"
          >
            <Text className="text-white text-sm">→</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
