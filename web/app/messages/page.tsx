'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Thread {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  other_user_id: string;
  other_nickname?: string | null;
  other_avatar?: string | null;
  unread?: number;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface ThreadUser {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  return new Date(ts).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<ThreadUser | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 初期化
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUser(data.user);
      await fetchThreads(data.user.id);

      // ?to=userId でDM開始
      const toUserId = searchParams.get('to');
      const threadId = searchParams.get('thread');
      if (toUserId) {
        await openOrCreateThread(data.user.id, toUserId);
      } else if (threadId) {
        await openThread(threadId, data.user.id);
      }
    });
  }, []);

  const fetchThreads = async (uid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('dm_threads')
      .select('*')
      .or(`participant_a.eq.${uid},participant_b.eq.${uid}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!data) { setLoadingThreads(false); return; }

    const otherIds = data.map(t => t.participant_a === uid ? t.participant_b : t.participant_a);
    const uniqueIds = [...new Set(otherIds)];
    const { data: usersData } = await supabase.from('users').select('id, nickname, avatar_url').in('id', uniqueIds);
    const userMap = new Map((usersData ?? []).map(u => [u.id, u]));

    setThreads(data.map(t => {
      const otherId = t.participant_a === uid ? t.participant_b : t.participant_a;
      const other = userMap.get(otherId);
      return {
        ...t,
        other_user_id: otherId,
        other_nickname: other?.nickname ?? null,
        other_avatar: other?.avatar_url ?? null,
      };
    }));
    setLoadingThreads(false);
  };

  const openOrCreateThread = async (myId: string, otherId: string) => {
    const supabase = createClient();
    const [a, b] = [myId, otherId].sort();

    let { data: existing } = await supabase
      .from('dm_threads')
      .select('id')
      .or(`and(participant_a.eq.${a},participant_b.eq.${b}),and(participant_a.eq.${b},participant_b.eq.${a})`)
      .single();

    if (!existing) {
      const { data: newThread } = await supabase
        .from('dm_threads')
        .insert({ participant_a: a, participant_b: b })
        .select('id')
        .single();
      existing = newThread;
    }

    if (existing) {
      await openThread(existing.id, myId);
      await fetchThreads(myId);
    }
  };

  const openThread = async (threadId: string, uid: string) => {
    setActiveThreadId(threadId);
    setLoadingMessages(true);

    const supabase = createClient();
    const [{ data: msgsData }, { data: threadData }] = await Promise.all([
      supabase.from('dm_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true }),
      supabase.from('dm_threads').select('*').eq('id', threadId).single(),
    ]);

    setMessages((msgsData as Message[]) ?? []);

    if (threadData) {
      const otherId = threadData.participant_a === uid ? threadData.participant_b : threadData.participant_a;
      const { data: otherData } = await supabase.from('users').select('id, nickname, avatar_url').eq('id', otherId).single();
      setOtherUser(otherData as ThreadUser);
    }
    setLoadingMessages(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeThreadId || !user || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data: msg } = await supabase
      .from('dm_messages')
      .insert({ thread_id: activeThreadId, sender_id: user.id, content: input.trim() })
      .select()
      .single();
    if (msg) {
      setMessages(prev => [...prev, msg as Message]);
      setInput('');
    }
    await fetchThreads(user.id);
    setSending(false);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showThreadList = !activeThreadId || !isMobile;
  const showChat = !!activeThreadId;

  return (
    <div className="flex h-full overflow-hidden">
      {/* スレッド一覧 */}
      {(showThreadList || !activeThreadId) && (
        <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 flex-shrink-0 border-r border-border bg-white`}>
          <div className="flex-shrink-0 h-12 border-b border-border flex items-center px-4">
            <h1 className="text-sm font-bold text-primary">メッセージ</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="flex flex-col gap-0">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                <span className="text-4xl">💬</span>
                <p className="text-sm text-muted">メッセージはまだありません</p>
                <p className="text-xs text-muted leading-relaxed">掲示板やコミュニティから<br />メンバーにDMを送ってみましょう</p>
              </div>
            ) : (
              threads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => user && openThread(thread.id, user.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/40 last:border-0 text-left hover:bg-gray-50 transition-colors ${
                    thread.id === activeThreadId ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
                    {thread.other_avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thread.other_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-primary truncate">{thread.other_nickname ?? '名前未設定'}</p>
                      {thread.last_message_at && (
                        <span className="text-[10px] text-muted flex-shrink-0">{timeAgo(thread.last_message_at)}</span>
                      )}
                    </div>
                    {thread.last_message_preview && (
                      <p className="text-xs text-muted truncate mt-0.5">{thread.last_message_preview}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* チャットエリア */}
      {showChat ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* チャットヘッダー */}
          <div className="flex-shrink-0 h-12 border-b border-border bg-white flex items-center px-4 gap-3">
            <button
              onClick={() => setActiveThreadId(null)}
              className="md:hidden text-muted hover:text-primary transition-colors text-sm mr-1"
            >
              ←
            </button>
            {otherUser && (
              <>
                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
                  {otherUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">👤</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-primary">{otherUser.nickname ?? '名前未設定'}</p>
              </>
            )}
          </div>

          {/* メッセージ一覧 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-gray-50">
            {loadingMessages ? (
              <div className="flex items-center justify-center flex-1">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                <span className="text-4xl">👋</span>
                <p className="text-sm text-muted">まだメッセージがありません</p>
                <p className="text-xs text-muted">最初のメッセージを送ってみましょう</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!isMe && otherUser && (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center self-end">
                        {otherUser.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : <span className="text-xs">👤</span>}
                      </div>
                    )}
                    <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isMe
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-white border border-border text-primary rounded-bl-md'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-muted">{timeAgo(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* 入力欄 */}
          <div className="flex-shrink-0 border-t border-border bg-white px-4 py-3 flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="メッセージを入力..."
              rows={1}
              maxLength={1000}
              className="flex-1 border border-border rounded-2xl px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary resize-none leading-relaxed"
              style={{ minHeight: '42px', maxHeight: '120px' }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 bg-primary text-white text-sm font-semibold w-10 h-10 rounded-2xl flex items-center justify-center disabled:opacity-40 hover:opacity-80 transition-opacity"
            >
              ↑
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-center flex-col gap-3">
          <span className="text-5xl">💬</span>
          <p className="text-sm font-semibold text-primary">会話を選択してください</p>
          <p className="text-xs text-muted">左のリストから会話を選ぶか<br />掲示板からDMを送れます</p>
        </div>
      )}
    </div>
  );
}
