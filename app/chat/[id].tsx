import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/stores/chat';
import { useChat } from '@/hooks/useChat';
import type { Message, StructuredContent } from '@/types';

export default function ChatScreen() {
  const router = useRouter();
  const { id, initialMessage } = useLocalSearchParams<{ id: string; initialMessage?: string }>();
  const isNew = id === 'new';

  const { messages, streamingMessage, isLoading, currentChatId } = useChatStore();
  const { fetchMessages, sendMessage } = useChat();

  const [inputText, setInputText] = useState('');
  const [hasPlan, setHasPlan] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const didSendInitial = useRef(false);

  useEffect(() => {
    if (!isNew && id) {
      useChatStore.getState().setCurrentChatId(id);
      fetchMessages(id);
    }
  }, [id, isNew, fetchMessages]);

  // 新規チャット: 初回メッセージを自動送信
  useEffect(() => {
    if (isNew && initialMessage && !didSendInitial.current) {
      didSendInitial.current = true;
      sendMessage(initialMessage, undefined, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // プランが存在するか確認
  useEffect(() => {
    const chatId = currentChatId ?? (isNew ? undefined : id);
    if (!chatId) return;

    supabase
      .from('chats')
      .select('plan_id')
      .eq('id', chatId)
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }) => setHasPlan(!!(data as any)?.plan_id));
  }, [currentChatId, id, isNew, messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    setInputText('');

    const chatId = currentChatId ?? (isNew ? undefined : id);
    await sendMessage(trimmed, chatId ?? undefined, false);
  }, [inputText, isLoading, currentChatId, isNew, id, sendMessage]);

  const handleAdoptPlanItem = useCallback(async (item: StructuredContent) => {
    const chatId = currentChatId ?? (isNew ? undefined : id);
    if (!chatId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: chat } = await supabase.from('chats').select('plan_id').eq('id', chatId).single() as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let planId: string | undefined = (chat as any)?.plan_id;

    if (!planId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: plan, error } = await (supabase.from('plans') as any)
        .insert({ user_id: user.id, title: '留学プラン', status: 'draft' })
        .select()
        .single();

      if (error || !plan) {
        Alert.alert('エラー', 'プランの作成に失敗しました。');
        return;
      }

      planId = (plan as { id: string }).id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('chats') as any).update({ plan_id: planId }).eq('id', chatId);
      setHasPlan(true);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('plan_items') as any).insert({
      plan_id: planId,
      item_type: item.item_type,
      title: item.title,
      description: item.description ?? null,
      cost_jpy: item.cost_jpy ?? null,
      metadata: item.metadata ?? null,
      order_index: 0,
    });

    Alert.alert('追加しました', `「${item.title}」をプランに追加しました。`);
  }, [currentChatId, isNew, id]);

  // メッセージ追加時に最下部へスクロール
  useEffect(() => {
    if (messages.length > 0 || streamingMessage) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, streamingMessage?.content]);

  // 表示用メッセージリスト(ストリーミング中は末尾に追加)
  const displayMessages: (Message | { id: string; isStreaming: true; content: string })[] = [
    ...messages,
    ...(streamingMessage ? [{ ...streamingMessage, isStreaming: true as const }] : []),
  ];

  const chatId = currentChatId ?? (isNew ? undefined : id);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable
          className="w-9 h-9 items-center justify-center active:opacity-60"
          onPress={() => router.back()}
          accessibilityLabel="戻る"
        >
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center text-primary font-semibold text-sm" numberOfLines={1}>
          AI アドバイザー
        </Text>
        {hasPlan && chatId && (
          <Pressable
            className="active:opacity-60"
            onPress={() => {
              supabase
                .from('chats')
                .select('plan_id')
                .eq('id', chatId)
                .single()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .then(({ data }) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const planId = (data as any)?.plan_id;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  if (planId) router.push(`/plan/${planId}` as any);
                });
            }}
            accessibilityLabel="プランを見る"
          >
            <Text className="text-sm text-primary font-medium">📋 プラン</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* メッセージリスト */}
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4 gap-3"
          renderItem={({ item }) => {
            if ('isStreaming' in item) {
              return (
                <View className="self-start max-w-[85%]">
                  {item.content ? (
                    <View className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                      <Text className="text-primary text-sm leading-relaxed">{item.content}</Text>
                    </View>
                  ) : (
                    <TypingIndicator />
                  )}
                </View>
              );
            }
            return (
              <MessageBubble
                message={item as Message}
                onAdoptPlanItem={handleAdoptPlanItem}
              />
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* 入力欄 */}
        <View className="px-4 py-3 border-t border-border">
          <View className="flex-row items-end bg-white border border-border rounded-2xl px-4 py-2 gap-2">
            <TextInput
              className="flex-1 text-primary text-sm py-1.5"
              placeholder="メッセージを入力..."
              placeholderTextColor="#A0A0A0"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            <Pressable
              className={`w-8 h-8 rounded-full items-center justify-center mb-0.5 ${inputText.trim() && !isLoading ? 'bg-primary' : 'bg-border'}`}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
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
