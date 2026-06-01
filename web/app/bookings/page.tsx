'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

// ── 型 ────────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  type: string;
  title: string;
  provider: string;
  amount_jpy: number | null;
  currency: string;
  booked_at: string | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

interface UserPlan {
  id: string;
  title: string;
  destination_city: string | null;
  destination_country: string | null;
}

// ── 定数 ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  flight:        { emoji: '✈️', label: '航空券' },
  accommodation: { emoji: '🏠', label: '宿泊' },
  school:        { emoji: '🎓', label: '学校' },
  insurance:     { emoji: '🛡️', label: '保険' },
  activity:      { emoji: '🎡', label: 'アクティビティ' },
  transfer:      { emoji: '💸', label: '送金' },
  other:         { emoji: '📦', label: 'その他' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  confirmed: { label: '確定',     color: 'bg-green-100 text-green-700' },
  pending:   { label: '保留中',   color: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'キャンセル', color: 'bg-red-100 text-red-600' },
};

// 日本語都市名 → IATA コード
const CITY_TO_IATA: Record<string, string> = {
  シドニー: 'SYD', メルボルン: 'MEL', ブリスベン: 'BNE',
  ゴールドコースト: 'OOL', ケアンズ: 'CNS', パース: 'PER',
  トロント: 'YYZ', バンクーバー: 'YVR', ロンドン: 'LON',
  オークランド: 'AKL', マニラ: 'MNL', バレッタ: 'MLA',
  ダブリン: 'DUB', アデレード: 'ADL', ホバート: 'HBA',
};

// 日本語都市名 → Booking.com 検索用英語名
const CITY_TO_EN: Record<string, string> = {
  シドニー: 'Sydney', メルボルン: 'Melbourne', ブリスベン: 'Brisbane',
  ゴールドコースト: 'Gold+Coast', ケアンズ: 'Cairns', パース: 'Perth',
  トロント: 'Toronto', バンクーバー: 'Vancouver', ロンドン: 'London',
  オークランド: 'Auckland', マニラ: 'Manila', バレッタ: 'Valletta',
  ダブリン: 'Dublin',
};

// 国名 → World Nomads 国コード
const COUNTRY_TO_WN: Record<string, string> = {
  オーストラリア: 'AU', カナダ: 'CA', イギリス: 'GB',
  ニュージーランド: 'NZ', フィリピン: 'PH', マルタ: 'MT',
  アメリカ: 'US', アイルランド: 'IE',
};

// ── サブコンポーネント ────────────────────────────────────────────────────

function AddBookingModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [type, setType] = useState<string>('flight');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from('bookings').insert({
      user_id: user.id,
      type,
      title: title.trim(),
      provider: provider.trim() || type,
      amount_jpy: amount ? parseInt(amount) : null,
      currency,
      booked_at: date || null,
      notes: notes.trim() || null,
      status: 'confirmed',
    });
    onAdded();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-primary">予約を追加</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* タイプ */}
          <div>
            <p className="text-xs text-muted mb-2">種別</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    type === key ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-border hover:border-primary/50'
                  }`}
                >
                  <span>{meta.emoji}</span><span>{meta.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* タイトル */}
          <div>
            <p className="text-xs text-muted mb-1">タイトル *</p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="例：成田→シドニー (QF80)" className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary" />
          </div>
          {/* プロバイダー */}
          <div>
            <p className="text-xs text-muted mb-1">サービス・会社名</p>
            <input value={provider} onChange={e => setProvider(e.target.value)} placeholder="例：Qantas, Booking.com" className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary" />
          </div>
          {/* 金額 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">金額</p>
              <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="0" className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary" />
            </div>
            <div className="w-24">
              <p className="text-xs text-muted mb-1">通貨</p>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary bg-white">
                <option>JPY</option><option>AUD</option><option>CAD</option><option>GBP</option><option>NZD</option><option>USD</option>
              </select>
            </div>
          </div>
          {/* 日付 */}
          <div>
            <p className="text-xs text-muted mb-1">予約日・利用日</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary" />
          </div>
          {/* メモ */}
          <div>
            <p className="text-xs text-muted mb-1">メモ（任意）</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary resize-none" />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:bg-gray-50 transition-colors">キャンセル</button>
          <button onClick={handleSave} disabled={!title.trim() || saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:opacity-80 transition-opacity">
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FlightSearchCard({ destCity }: { destCity: string | null }) {
  const defaultDest = (destCity ? CITY_TO_IATA[destCity] : null) ?? 'SYD';
  const [origin, setOrigin] = useState('NRT');
  const [dest, setDest] = useState(defaultDest);
  const [date, setDate] = useState('');

  const skyscannerUrl = () => {
    const d = date.replace(/-/g, '').slice(2); // YYMMDD
    return `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${d}/`;
  };

  const googleFlightsUrl = () =>
    `https://www.google.com/travel/flights#flt=${origin}.${dest}.${date};c:JPY;e:1;sd:1;t:f`;

  const ready = !!date;

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <span className="text-lg">✈️</span>
        <p className="text-xs font-semibold text-primary">フライト検索</p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-muted mb-1">出発地</p>
            <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary bg-white">
              <option value="NRT">東京 (NRT)</option>
              <option value="HND">東京 (HND)</option>
              <option value="KIX">大阪 (KIX)</option>
              <option value="NGO">名古屋 (NGO)</option>
              <option value="CTS">札幌 (CTS)</option>
              <option value="FUK">福岡 (FUK)</option>
            </select>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted mb-1">目的地</p>
            <select value={dest} onChange={e => setDest(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary bg-white">
              {Object.entries(CITY_TO_IATA).map(([city, iata]) => (
                <option key={iata} value={iata}>{city} ({iata})</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted mb-1">出発日</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary" />
        </div>
        <div className="flex gap-2">
          <a
            href={ready ? googleFlightsUrl() : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!ready}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              ready ? 'bg-primary text-white hover:opacity-80' : 'bg-gray-100 text-gray-400 pointer-events-none'
            }`}
          >
            <span>🔍</span><span>Google Flights</span>
          </a>
          <a
            href={ready ? skyscannerUrl() : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!ready}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              ready ? 'border-primary text-primary hover:bg-primary/5' : 'border-border text-gray-400 pointer-events-none'
            }`}
          >
            <span>✈️</span><span>Skyscanner</span>
          </a>
        </div>
        {!ready && (
          <p className="text-[10px] text-muted text-center">出発日を選ぶと検索ボタンが有効になります</p>
        )}
      </div>
    </div>
  );
}

function PartnerLinks({ destCity, destCountry }: { destCity: string | null; destCountry: string | null }) {
  const cityEn = destCity ? (CITY_TO_EN[destCity] ?? destCity) : 'Australia';
  const countryCode = destCountry ? (COUNTRY_TO_WN[destCountry] ?? 'AU') : 'AU';

  const partners = [
    {
      emoji: '🏨',
      name: 'Booking.com',
      desc: `${destCity ?? '目的地'}の宿泊を検索`,
      url: `https://www.booking.com/searchresults.html?ss=${cityEn}`,
      badge: 'アフィリエイト',
    },
    {
      emoji: '🛡️',
      name: 'World Nomads',
      desc: '海外旅行保険に加入',
      url: `https://www.worldnomads.com/travel-insurance/get-a-quote?residency=jp&nationality=jp&countryTravelling=${countryCode}`,
      badge: 'アフィリエイト',
    },
    {
      emoji: '💸',
      name: 'Wise',
      desc: '海外送金・外貨両替',
      url: 'https://wise.com/jp/',
      badge: 'アフィリエイト',
    },
    {
      emoji: '✈️',
      name: 'Skyscanner',
      desc: '航空券を比較・検索',
      url: `https://www.skyscanner.net/`,
      badge: 'アフィリエイト',
    },
  ];

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">提携サービスから予約</p>
      </div>
      <div className="grid grid-cols-2 gap-0">
        {partners.map((p, i) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${
              i % 2 === 0 ? 'border-r border-border' : ''
            } ${i < 2 ? 'border-b border-border' : ''}`}
          >
            <span className="text-2xl flex-shrink-0">{p.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-primary">{p.name}</p>
              <p className="text-[10px] text-muted leading-snug">{p.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',           label: 'すべて' },
  { key: 'flight',        label: '航空券' },
  { key: 'accommodation', label: '宿泊' },
  { key: 'school',        label: '学校' },
  { key: 'insurance',     label: '保険' },
  { key: 'other',         label: 'その他' },
];

export default function BookingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [latestPlan, setLatestPlan] = useState<UserPlan | null>(null);

  const fetchBookings = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('booked_at', { ascending: true, nullsFirst: false });
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // 最新プランを取得（目的地の自動補完用）
    supabase.from('plans').select('id, title, destination_city, destination_country').order('created_at', { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data) setLatestPlan(data as UserPlan); });

    fetchBookings();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return bookings;
    if (activeTab === 'other') return bookings.filter(b => !['flight', 'accommodation', 'school', 'insurance'].includes(b.type));
    return bookings.filter(b => b.type === activeTab);
  }, [bookings, activeTab]);

  // 費用サマリー
  const summary = useMemo(() => {
    const jpyBookings = bookings.filter(b => b.status !== 'cancelled' && b.amount_jpy != null && b.currency === 'JPY');
    const total = jpyBookings.reduce((sum, b) => sum + (b.amount_jpy ?? 0), 0);
    const byType = Object.keys(TYPE_META).map(type => ({
      type,
      total: jpyBookings.filter(b => b.type === type).reduce((s, b) => s + (b.amount_jpy ?? 0), 0),
    })).filter(x => x.total > 0);
    return { total, byType };
  }, [bookings]);

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('bookings').delete().eq('id', id);
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const handleStatusChange = async (id: string, status: Booking['status']) => {
    const supabase = createClient();
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* メインエリア */}
      <div className="flex-1 overflow-y-auto">
        {/* タブ */}
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-shrink-0 text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                  activeTab === t.key ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-5">
          {/* フライト検索（航空券タブ or すべてタブのみ表示） */}
          {(activeTab === 'all' || activeTab === 'flight') && (
            <FlightSearchCard destCity={latestPlan?.destination_city ?? null} />
          )}

          {/* 提携パートナー */}
          {activeTab === 'all' && (
            <PartnerLinks
              destCity={latestPlan?.destination_city ?? null}
              destCountry={latestPlan?.destination_country ?? null}
            />
          )}

          {/* 予約リスト */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">あなたの予約</p>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
              >
                <span>＋</span><span>追加</span>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-center bg-white border border-border rounded-2xl">
                <span className="text-4xl">📋</span>
                <p className="text-sm text-muted">まだ予約がありません</p>
                <button onClick={() => setShowAdd(true)} className="text-xs text-primary border border-primary rounded-full px-4 py-1.5 hover:bg-primary hover:text-white transition-all">
                  ＋ 予約を追加する
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map(booking => {
                  const meta = TYPE_META[booking.type] ?? { emoji: '📦', label: 'その他' };
                  const statusMeta = STATUS_META[booking.status];
                  return (
                    <div key={booking.id} className="bg-white border border-border rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                          {meta.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-1">{booking.title}</h3>
                            <select
                              value={booking.status}
                              onChange={e => handleStatusChange(booking.id, e.target.value as Booking['status'])}
                              className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border-none outline-none cursor-pointer ${statusMeta.color}`}
                            >
                              <option value="confirmed">確定</option>
                              <option value="pending">保留中</option>
                              <option value="cancelled">キャンセル</option>
                            </select>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            {booking.provider}
                            {booking.booked_at ? ` · ${booking.booked_at}` : ''}
                          </p>
                          {booking.amount_jpy != null && (
                            <p className="text-sm font-bold text-primary mt-1">
                              {booking.currency !== 'JPY' ? booking.currency + ' ' : '¥'}
                              {booking.amount_jpy.toLocaleString()}
                            </p>
                          )}
                          {booking.notes && (
                            <p className="text-[11px] text-muted mt-1 leading-relaxed">{booking.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="flex-shrink-0 text-muted hover:text-red-400 transition-colors text-sm p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右パネル（デスクトップのみ） */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white flex-shrink-0">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">費用サマリー</span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* 合計 */}
          <div className="bg-white border border-border rounded-2xl p-4">
            <p className="text-xs text-muted mb-2 font-semibold">JPY 合計（確定分）</p>
            <p className="text-2xl font-bold text-primary">
              {summary.total === 0 ? '¥0' : `¥${summary.total.toLocaleString()}`}
            </p>
            {summary.total === 0 && (
              <p className="text-[10px] text-muted mt-1">予約を追加すると自動集計されます</p>
            )}
          </div>

          {/* カテゴリ別 */}
          {summary.byType.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs text-muted font-semibold">カテゴリ別</p>
              {summary.byType.map(({ type, total }) => {
                const meta = TYPE_META[type] ?? { emoji: '📦', label: type };
                const pct = summary.total > 0 ? Math.round((total / summary.total) * 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-primary">{meta.emoji} {meta.label}</span>
                      <span className="text-xs font-semibold text-primary">¥{total.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* プランリンク */}
          {latestPlan && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <p className="text-xs text-muted font-semibold mb-1">連携プラン</p>
              <p className="text-sm font-semibold text-primary leading-snug">{latestPlan.title}</p>
              <p className="text-[11px] text-muted mt-0.5">
                {latestPlan.destination_city ?? latestPlan.destination_country ?? '行き先未設定'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* モーダル */}
      {showAdd && (
        <AddBookingModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchBookings(); }}
        />
      )}
    </div>
  );
}
