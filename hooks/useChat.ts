import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/stores/chat';
import type { Chat, Message, StructuredContent } from '@/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export function useChat() {
  const store = useChatStore();

  const fetchChats = useCallback(async () => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(30);

    if (!error && data) store.setChats(data as Chat[]);
  }, [store]);

  const fetchMessages = useCallback(async (chatId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (!error && data) store.setMessages(data as Message[]);
  }, [store]);

  const sendMessage = useCallback(async (
    content: string,
    chatId?: string,
    isNewChat = false,
  ): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // 楽観的にユーザーメッセージを追加
    const optimisticUserMsg: Message = {
      id: `optimistic-${Date.now()}`,
      chat_id: chatId ?? '',
      role: 'user',
      content,
      structured_content: null,
      created_at: new Date().toISOString(),
    };
    store.appendMessage(optimisticUserMsg);

    // ストリーミング用プレースホルダー
    const streamingId = `streaming-${Date.now()}`;
    store.setStreamingMessage({ id: streamingId, content: '', isStreaming: true });
    store.setIsLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          chat_id: chatId,
          message: content,
          create_new: isNewChat || !chatId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('AI への接続に失敗しました');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let resolvedChatId = chatId ?? null;
      let fullText = '';
      let finalStructured: StructuredContent | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.slice(6);
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr) as {
              type: string;
              chat_id?: string;
              text?: string;
              structured_content?: StructuredContent | null;
            };

            if (event.type === 'chat_id' && event.chat_id) {
              resolvedChatId = event.chat_id;
              store.setCurrentChatId(event.chat_id);
            } else if (event.type === 'delta' && event.text) {
              fullText += event.text;
              store.appendStreamingText(event.text);
            } else if (event.type === 'done') {
              finalStructured = event.structured_content ?? null;
            }
          } catch {
            // 不正な JSON は無視
          }
        }
      }

      store.finalizeStreaming(fullText, finalStructured);

      // チャット一覧を更新
      await fetchChats();

      return resolvedChatId;
    } catch (err) {
      store.setStreamingMessage(null);
      // エラーメッセージをアシスタントとして追加
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        chat_id: chatId ?? '',
        role: 'assistant',
        content: 'すみません、つながりにくいようです。少し待ってもう一度お試しください。',
        structured_content: null,
        created_at: new Date().toISOString(),
      };
      store.appendMessage(errorMsg);
      console.error(err);
      return null;
    } finally {
      store.setIsLoading(false);
    }
  }, [store, fetchChats]);

  return { fetchChats, fetchMessages, sendMessage };
}
