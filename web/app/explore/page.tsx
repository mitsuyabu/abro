'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Community {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_official: boolean;
  cover_emoji: string;
  member_count: number;
  post_count: number;
  is_member?: boolean;
}

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
  created_at: string;
  user_id: string;
  user_nickname?: string | null;
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
const PHASE_LABELS: Record<string, string> = {
  considering: '検討中',
  preparing: '準備中',
  abroad: '渡航中',
  returned: '帰国済',
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

function CreateCommunityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🌏');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('communities')
      .insert({ name: name.trim(), description: description.trim() || null, cover_emoji: emoji, type: 'custom', created_by: user.id })
      .select('id')
      .single();

    if (!error && data) {
      await supabase.from('community_members').insert({ community_id: data.id, user_id: user.id, role: 'owner' });
      onCreated();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-primary">コミュニティを作成</h2>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button className="text-4xl w-16 h-16 rounded-2xl bg-gray-50 border border-border flex items-center justify-center hover:bg-gray-100 transition-colors">
              {emoji}
            </button>
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">コミュニティ名</p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例：シドニーワーホリ組、ABC Language School"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary"
                maxLength={50}
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">説明（任意）</p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="このコミュニティについて説明してください"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary resize-none"
              rows={3}
              maxLength={200}
            />
          </div>
          <div>
            <p className="text-xs text-muted mb-2">絵文字を選ぶ</p>
            <div className="flex flex-wrap gap-2">
              {['🌏', '🎓', '🏖️', '💼', '🏠', '✈️', '🇦🇺', '🇨🇦', '🇬🇧', '🇳🇿', '🌍', '🤝', '💬', '🎉', '⭐'].map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all ${emoji === e ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-gray-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:bg-gray-50 transition-colors">
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            {loading ? '作成中...' : '作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateListingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [category, setCategory] = useState<'job' | 'roommate' | 'item' | 'travel_companion' | 'other'>('job');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [priceFreq, setPriceFreq] = useState<'hour' | 'day' | 'week' | 'month' | 'once' | ''>('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    await supabase.from('listings').insert({
      user_id: user.id,
      category,
      title: title.trim(),
      description: description.trim(),
      city: city.trim() || null,
      price_amount: price ? parseInt(price) : null,
      price_frequency: priceFreq || null,
    });

    onCreated();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-primary">掲示板に投稿</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted mb-2">カテゴリ</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat as typeof category)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    category === cat ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-border hover:border-primary/50'
                  }`}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  <span>{CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">タイトル</p>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：カフェバリスタ募集、シドニーCBD近くシェアハウス"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary"
              maxLength={100}
            />
          </div>
          <div>
            <p className="text-xs text-muted mb-1">詳細</p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="詳細な説明を入力してください"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary resize-none"
              rows={4}
              maxLength={500}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">都市（任意）</p>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="例：シドニー"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary"
              />
            </div>
            {(category === 'job' || category === 'item' || category === 'roommate') && (
              <div className="flex-1">
                <p className="text-xs text-muted mb-1">金額（任意）</p>
                <div className="flex gap-1">
                  <input
                    value={price}
                    onChange={e => setPrice(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="flex-1 min-w-0 border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary"
                  />
                  <select
                    value={priceFreq}
                    onChange={e => setPriceFreq(e.target.value as typeof priceFreq)}
                    className="flex-shrink-0 border border-border rounded-xl px-2 py-2 text-xs text-muted focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="">-</option>
                    <option value="hour">/時間</option>
                    <option value="week">/週</option>
                    <option value="month">/月</option>
                    <option value="once">一括</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:bg-gray-50 transition-colors">
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || !description.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            {loading ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [tab, setTab] = useState<'community' | 'bulletin'>('community');
  const [user, setUser] = useState<User | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingCategory, setListingCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const fetchCommunities = async () => {
    setLoadingCommunities(true);
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('communities')
      .select('*')
      .order('is_official', { ascending: false })
      .order('member_count', { ascending: false });

    if (data && u) {
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', u.id);
      const memberSet = new Set((memberships ?? []).map(m => m.community_id));
      setCommunities((data as Community[]).map(c => ({ ...c, is_member: memberSet.has(c.id) })));
    } else {
      setCommunities((data as Community[]) ?? []);
    }
    setLoadingCommunities(false);
  };

  const fetchListings = async () => {
    setLoadingListings(true);
    const supabase = createClient();
    const query = supabase
      .from('listings')
      .select('id, category, title, description, city, country, price_amount, price_currency, price_frequency, created_at, user_id')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const { data } = await query;
    setListings((data as Listing[]) ?? []);
    setLoadingListings(false);
  };

  useEffect(() => { fetchCommunities(); }, []);
  useEffect(() => { fetchListings(); }, []);

  const handleJoin = async (communityId: string, isMember: boolean) => {
    if (!user) { router.push('/login'); return; }
    const supabase = createClient();
    if (isMember) {
      await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', user.id);
    } else {
      await supabase.from('community_members').insert({ community_id: communityId, user_id: user.id });
    }
    fetchCommunities();
  };

  const myCommunities = communities.filter(c => c.is_member);
  const otherCommunities = communities.filter(c => !c.is_member);
  const filteredCommunities = (search
    ? communities.filter(c => c.name.includes(search) || (c.description ?? '').includes(search))
    : null
  );

  const filteredListings = listings.filter(l => listingCategory === 'all' || l.category === listingCategory);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* タブバー */}
        <div className="flex-shrink-0 bg-white border-b border-border">
          <div className="flex gap-0">
            {(['community', 'bulletin'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-primary'
                }`}
              >
                {t === 'community' ? 'コミュニティ' : '掲示板'}
              </button>
            ))}
          </div>
        </div>

        {/* コミュニティタブ */}
        {tab === 'community' && (
          <div className="flex-1 overflow-y-auto">
            {/* 検索 + 作成 */}
            <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex gap-2 z-10">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="コミュニティを検索..."
                  className="w-full border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary bg-white"
                />
              </div>
              <button
                onClick={() => setShowCreateCommunity(true)}
                className="flex-shrink-0 flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-80 transition-opacity"
              >
                <span>＋</span>
                <span className="hidden sm:inline">作成</span>
              </button>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-6">
              {loadingCommunities ? (
                <div className="flex flex-col gap-3">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : filteredCommunities ? (
                <>
                  <p className="text-xs text-muted">「{search}」の検索結果 {filteredCommunities.length}件</p>
                  <CommunityList communities={filteredCommunities} onJoin={handleJoin} />
                </>
              ) : (
                <>
                  {myCommunities.length > 0 && (
                    <section>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">参加中</p>
                      <CommunityList communities={myCommunities} onJoin={handleJoin} />
                    </section>
                  )}
                  {otherCommunities.length > 0 && (
                    <section>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                        {myCommunities.length > 0 ? 'おすすめ' : 'コミュニティ一覧'}
                      </p>
                      <CommunityList communities={otherCommunities} onJoin={handleJoin} />
                    </section>
                  )}
                  {communities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                      <span className="text-5xl">🌏</span>
                      <p className="text-sm text-muted">まだコミュニティがありません</p>
                      <button onClick={() => setShowCreateCommunity(true)} className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity">
                        最初のコミュニティを作る
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 掲示板タブ */}
        {tab === 'bulletin' && (
          <div className="flex-1 overflow-y-auto">
            {/* カテゴリフィルタ + 投稿ボタン */}
            <div className="sticky top-0 bg-white border-b border-border z-10">
              <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setListingCategory('all')}
                  className={`flex-shrink-0 text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                    listingCategory === 'all' ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-gray-100'
                  }`}
                >
                  すべて
                </button>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setListingCategory(key)}
                    className={`flex-shrink-0 flex items-center gap-1 text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                      listingCategory === key ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-gray-100'
                    }`}
                  >
                    <span>{CATEGORY_ICONS[key]}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3">
              {/* 投稿ボタン */}
              <button
                onClick={() => setShowCreateListing(true)}
                className="bg-white border border-border rounded-2xl p-4 text-left hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                    {user?.user_metadata?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : '👤'}
                  </div>
                  <span className="text-muted text-sm flex-1">アルバイト・シェアハウス・売買を募集する...</span>
                  <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-medium">投稿</span>
                </div>
              </button>

              {loadingListings ? (
                <div className="flex flex-col gap-3">
                  {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <span className="text-5xl">{listingCategory !== 'all' ? CATEGORY_ICONS[listingCategory] : '📋'}</span>
                  <p className="text-sm text-muted">まだ投稿がありません</p>
                  <button onClick={() => setShowCreateListing(true)} className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity">
                    最初の投稿をする
                  </button>
                </div>
              ) : (
                filteredListings.map(listing => (
                  <Link
                    key={listing.id}
                    href={`/explore/listings/${listing.id}`}
                    className="block bg-white border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0 mt-0.5">{CATEGORY_ICONS[listing.category] ?? '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {CATEGORY_LABELS[listing.category]}
                          </span>
                          {listing.city && <span className="text-[11px] text-muted">📍 {listing.city}</span>}
                        </div>
                        <p className="text-sm font-semibold text-primary leading-snug line-clamp-1">{listing.title}</p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">{listing.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          {listing.price_amount != null ? (
                            <span className="text-sm font-bold text-primary">
                              {listing.price_currency === 'JPY' ? '¥' : '$'}{listing.price_amount.toLocaleString()}
                              {listing.price_frequency ? <span className="text-[10px] font-normal text-muted ml-0.5">/{listing.price_frequency === 'hour' ? '時間' : listing.price_frequency === 'week' ? '週' : listing.price_frequency === 'month' ? '月' : '一括'}</span> : null}
                            </span>
                          ) : <span />}
                          <span className="text-[10px] text-muted">{timeAgo(listing.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* モーダル */}
      {showCreateCommunity && (
        <CreateCommunityModal
          onClose={() => setShowCreateCommunity(false)}
          onCreated={() => { setShowCreateCommunity(false); fetchCommunities(); }}
        />
      )}
      {showCreateListing && (
        <CreateListingModal
          onClose={() => setShowCreateListing(false)}
          onCreated={() => { setShowCreateListing(false); fetchListings(); }}
        />
      )}
    </div>
  );
}

function CommunityList({ communities, onJoin }: { communities: Community[]; onJoin: (id: string, isMember: boolean) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {communities.map(c => (
        <Link
          key={c.id}
          href={`/explore/communities/${c.id}`}
          className="flex items-center gap-3 bg-white border border-border rounded-2xl px-4 py-3.5 hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <span className="text-3xl flex-shrink-0">{c.cover_emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-primary truncate">{c.name}</span>
              {c.is_official && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">公式</span>}
            </div>
            {c.description && <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{c.description}</p>}
            <p className="text-[10px] text-muted mt-0.5">{c.member_count.toLocaleString()} メンバー · {c.post_count} 投稿</p>
          </div>
          <button
            onClick={e => { e.preventDefault(); onJoin(c.id, !!c.is_member); }}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              c.is_member
                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'
            }`}
          >
            {c.is_member ? '参加中' : '参加'}
          </button>
        </Link>
      ))}
    </div>
  );
}
