'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatInput } from '@/components/chat/ChatInput';
import { RecommendationPanel } from '@/components/home/RecommendationPanel';

const ACTION_CHIPS = [
  { id: 'plan',  emoji: '✨', label: 'プランを作る',    prompt: 'どんな留学・ワーホリを考えていますか？目的・期間・予算を教えてください。' },
  { id: 'cost',  emoji: '💰', label: '費用シミュレート', prompt: '留学・ワーホリの費用をシミュレーションしたいです。渡航先と滞在期間を教えてください。' },
  { id: 'visa',  emoji: '📄', label: 'ビザについて',    prompt: 'ビザ申請について教えてください。' },
  { id: 'agent', emoji: '🎓', label: 'エージェント相談', prompt: 'エージェントに相談したいです。' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const aiId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) =>
          prev.map((m) => m.id === aiId ? { ...m, content: m.content + chunk } : m)
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === aiId ? { ...m, content: 'エラーが発生しました。もう一度お試しください。' } : m)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full">
      {/* チャットエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* トップバー */}
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-sm font-semibold text-primary">新しいチャット</span>
          <span className="text-muted text-xs ml-1">▾</span>
          <span className="ml-auto text-xs font-medium text-primary/60 italic tracking-wide">留学を、もっと自分らしく</span>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isEmpty ? (
            /* ── ホーム状態（チャットなし） ── */
            <div className="flex flex-col items-center justify-center h-full gap-8 px-8 pt-10">
              {/* ヒーロー */}
              <div className="text-center gap-3 flex flex-col">
                {/* 留学イラスト — web/public/hero.png を配置してください */}
                <div className="flex justify-center mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/hero.png" alt="留学イラスト" className="w-64 h-auto object-contain" />
                </div>
                <h1 className="text-3xl font-bold text-primary">今日は何する？</h1>
                <p className="text-primary leading-relaxed" style={{ fontSize: '18px' }}>
                  AI があなたの留学・ワーホリをまるごとサポートします。<br />
                  何でも気軽に聞いてみてください。
                </p>
              </div>

              {/* アクションチップ */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {ACTION_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => handleSend(chip.prompt)}
                    className="bg-white border border-border rounded-2xl px-4 py-3 text-left hover:border-primary/40 hover:shadow-sm transition-all group flex items-center gap-3"
                  >
                    <span className="text-xl flex-shrink-0">{chip.emoji}</span>
                    <span className="text-sm font-medium text-primary">{chip.label}</span>
                  </button>
                ))}
              </div>

              {/* 入力欄（ホーム） */}
              <div className="w-full max-w-lg">
                <ChatInput onSend={handleSend} disabled={isLoading} />
                <p className="text-xs text-muted text-center mt-2">Enter で送信 · Shift+Enter で改行</p>
              </div>
            </div>
          ) : (
            /* ── メッセージリスト ── */
            <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">Ab</span>
                    </div>
                  )}
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-white border border-border text-primary rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">Ab</span>
                  </div>
                  <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-2.5 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* 入力欄（チャットあり） */}
        {!isEmpty && (
          <div className="border-t border-border bg-white px-5 py-4">
            <div className="max-w-2xl mx-auto">
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </div>
        )}
      </div>

      {/* 右パネル */}
      <div className="w-96 xl:w-[420px] border-l border-border bg-background flex-shrink-0 flex flex-col h-full overflow-hidden">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white flex-shrink-0">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">おすすめ</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <RecommendationPanel />
        </div>
      </div>
    </div>
  );
}
