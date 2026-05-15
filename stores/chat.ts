import { create } from 'zustand';

import type { Chat, Message, StructuredContent } from '@/types';

interface StreamingMessage {
  id: string;
  content: string;
  isStreaming: boolean;
}

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  messages: Message[];
  streamingMessage: StreamingMessage | null;
  isLoading: boolean;

  setChats: (chats: Chat[]) => void;
  setCurrentChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  setStreamingMessage: (msg: StreamingMessage | null) => void;
  appendStreamingText: (text: string) => void;
  finalizeStreaming: (fullContent: string, structuredContent: StructuredContent | null) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,
  messages: [],
  streamingMessage: null,
  isLoading: false,

  setChats: (chats) => set({ chats }),
  setCurrentChatId: (id) => set({ currentChatId: id }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setIsLoading: (isLoading) => set({ isLoading }),

  setStreamingMessage: (msg) => set({ streamingMessage: msg }),

  appendStreamingText: (text) => set((s) => {
    if (!s.streamingMessage) return {};
    return {
      streamingMessage: {
        ...s.streamingMessage,
        content: s.streamingMessage.content + text,
      },
    };
  }),

  finalizeStreaming: (fullContent, structuredContent) => {
    const { streamingMessage, messages } = get();
    if (!streamingMessage) return;

    const finalMessage: Message = {
      id: streamingMessage.id,
      chat_id: get().currentChatId ?? '',
      role: 'assistant',
      content: fullContent,
      structured_content: structuredContent,
      created_at: new Date().toISOString(),
    };

    set({ messages: [...messages, finalMessage], streamingMessage: null });
  },

  reset: () => set({ currentChatId: null, messages: [], streamingMessage: null }),
}));
