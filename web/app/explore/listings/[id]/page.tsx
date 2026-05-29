'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Listing {
  id: string;
  category: string;
  title: string;
  description: string;
  city: string | null;
  country: string | null;
  price_amount: number | null;
  price_currency: string;
  price_frequency: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

interface ListingUser {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  phase: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  job: 'アルバイト',
  roommate: 'シェアハウス',
  item: '売買・譲渡',
  travel_companion: '旅行仲間',
  other: 'その他',
};
const CATEGORY_ICONS: Record<string, string> = {
  job: '💼',
  roommate: '🏠',
  item: '📦',
  travel_companion: '✈️',
  other: '📋',
};
const FREQ_LABELS: Record<string, string> = {
  hour: '時間', week: '週', month: '月', once: '一括', day: '日',
};
const PHASE_LABELS: Record<string, string> = {
  considering: '検討中', preparing: '準備中', abroad: '渡航中', returned: '帰国済',
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingUser, setListingUser] = useState<ListingUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    supabase.from('listings').select('*').eq('id', id).single().then(async ({ data }) => {
      setListing(data as Listing);
      if (data) {
        const { data: userData } = await supabase.from('users').select('id, nickname, avatar_url, phase').eq('id', (data as Listing).user_id).single();
        setListingUser(userData as ListingUser);
      }
      setLoading(false);
    });
  }, [id]);

  const handleDM = async () => {
    if (!user) { router.push('/login'); return; }
    if (!listing) return;
    router.push(`/messages?to=${listing.user_id}`);
  };

  const handleInquiry = async () => {
    if (!user) { router.push('/login'); return; }
    if (!inquiryMessage.trim() || !listing) return;
    setSending(true);
    const supabase = createClient();

    // まずDMスレッドを作成 or 既存を取得してメッセージ送信
    const [a, b] = [user.id, listing.user_id].sort();
    let threadId: string | null = null;

    const { data: existing } = await supabase
      .from('dm_threads')
      .select('id')
      .or(`and(participant_a.eq.${a},participant_b.eq.${b}),and(participant_a.eq.${b},participant_b.eq.${a})`)
      .single();

    if (existing) {
      threadId = existing.id;
    } else {
      const { data: newThread } = await supabase
        .from('dm_threads')
        .insert({ participant_a: a, participant_b: b })
        .select('id')
        .single();
      threadId = newThread?.id ?? null;
    }

    if (threadId) {
      const firstMessage = `【${CATEGORY_LABELS[listing.category]}への問い合わせ】\n「${listing.title}」についてお問い合わせします。\n\n${inquiryMessage.trim()}`;
      await supabase.from('dm_messages').insert({ thread_id: threadId, sender_id: user.id, content: firstMessage });
      setSent(true);
      setSending(false);
      setTimeout(() => router.push(`/messages?thread=${threadId}`), 1500);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-muted">投稿が見つかりません</p>
        <Link href="/explore" className="text-primary text-sm hover:opacity-70">← 掲示板に戻る</Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.user_id;

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/explore?tab=bulletin" className="text-muted hover:text-primary transition-colors text-sm">←</Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{CATEGORY_ICONS[listing.category]}</span>
          <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[listing.category]}
          </span>
        </div>
        {isOwner && (
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.from('listings').update({ status: 'closed' }).eq('id', listing.id);
              router.push('/explore');
            }}
            className="text-xs text-muted border border-border rounded-full px-3 py-1.5 hover:border-red-300 hover:text-red-400 transition-colors"
          >
            募集終了
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-5">
          {/* タイトル・詳細 */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <h1 className="text-base font-bold text-primary leading-snug mb-1">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(listing.city || listing.country) && (
                <span className="text-xs text-muted">📍 {listing.city ?? listing.country}</span>
              )}
              {listing.price_amount != null && (
                <span className="text-sm font-bold text-primary">
                  {listing.price_currency === 'JPY' ? '¥' : '$'}{listing.price_amount.toLocaleString()}
                  {listing.price_frequency && <span className="text-[10px] font-normal text-muted">/{FREQ_LABELS[listing.price_frequency]}</span>}
                </span>
              )}
              <span className="text-[10px] text-muted ml-auto">
                {new Date(listing.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* 投稿者 */}
          {listingUser && (
            <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
                {listingUser.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listingUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary">{listingUser.nickname ?? '匿名ユーザー'}</p>
                {listingUser.phase && (
                  <p className="text-[11px] text-muted">{PHASE_LABELS[listingUser.phase] ?? listingUser.phase}</p>
                )}
              </div>
            </div>
          )}

          {/* 問い合わせエリア */}
          {!isOwner && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">問い合わせる</p>
              </div>
              {sent ? (
                <div className="px-5 py-8 text-center">
                  <span className="text-3xl">✅</span>
                  <p className="text-sm font-semibold text-primary mt-2">メッセージを送信しました</p>
                  <p className="text-xs text-muted mt-1">メッセージページに移動します...</p>
                </div>
              ) : (
                <div className="px-5 py-4 flex flex-col gap-3">
                  <textarea
                    value={inquiryMessage}
                    onChange={e => setInquiryMessage(e.target.value)}
                    placeholder={`「${listing.title}」への問い合わせを入力...`}
                    rows={3}
                    maxLength={500}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleInquiry}
                      disabled={!inquiryMessage.trim() || sending}
                      className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 hover:opacity-80 transition-opacity"
                    >
                      {sending ? '送信中...' : '💬 メッセージで問い合わせる'}
                    </button>
                    <button
                      onClick={handleDM}
                      className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-border text-sm text-muted hover:border-primary hover:text-primary transition-colors"
                    >
                      DM
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isOwner && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 text-center">
              <p className="text-xs text-muted">これはあなたの投稿です</p>
              <p className="text-[11px] text-muted mt-1">問い合わせが来るとメッセージページに通知されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
