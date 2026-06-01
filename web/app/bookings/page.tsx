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

interface FlightSegment {
  departure_airport: { id: string; name: string; time: string };
  arrival_airport: { id: string; name: string; time: string };
  duration: number;
  airline: string;
  airline_logo?: string;
  flight_number: string;
}

interface FlightResult {
  flights: FlightSegment[];
  layovers?: { id: string; name: string; duration: number }[];
  total_duration: number;
  price: number;
  airline_logo?: string;
  booking_token?: string;
  type?: string;
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

function formatFlightTime(datetime: string): string {
  const d = new Date(datetime);
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

function FlightCard({ flight, origin, dest, date }: { flight: FlightResult; origin: string; dest: string; date: string }) {
  const first = flight.flights[0];
  const last = flight.flights[flight.flights.length - 1];
  const stops = flight.flights.length - 1;
  const logo = flight.airline_logo ?? first?.airline_logo;

  // Google Flights の該当便ページへのリンク
  const bookingUrl = flight.booking_token
    ? `https://www.google.com/travel/flights?tfs=${encodeURIComponent(flight.booking_token)}`
    : `https://www.google.com/travel/flights#flt=${origin}.${dest}.${date};c:JPY;e:1;sd:1;t:f`;

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-white hover:border-primary/40 hover:shadow-sm transition-all">
      <div className="px-4 py-3 flex items-center gap-3">
        {/* 航空会社ロゴ */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl border border-border flex items-center justify-center overflow-hidden bg-white">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={first?.airline} className="w-8 h-8 object-contain" />
          ) : (
            <span className="text-xl">✈️</span>
          )}
        </div>

        {/* 時刻・ルート */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary">{first ? formatFlightTime(first.departure_airport.time) : '--'}</span>
            <div className="flex-1 flex flex-col items-center min-w-0">
              <div className="flex items-center gap-1 w-full">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted flex-shrink-0">{formatDuration(flight.total_duration)}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <span className={`text-[9px] font-semibold mt-0.5 ${stops === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stops === 0 ? '直行' : `${stops}回乗継`}
              </span>
            </div>
            <span className="text-base font-bold text-primary">{last ? formatFlightTime(last.arrival_airport.time) : '--'}</span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-muted">{first?.departure_airport.id}</span>
            <span className="text-[10px] text-muted truncate px-1">{first?.airline} {first?.flight_number}</span>
            <span className="text-[10px] text-muted">{last?.arrival_airport.id}</span>
          </div>
        </div>

        {/* 価格 */}
        <div className="flex-shrink-0 text-right">
          <p className="text-base font-bold text-primary">¥{flight.price.toLocaleString()}</p>
          <p className="text-[9px] text-muted">片道・1名</p>
        </div>
      </div>

      {/* 乗継情報 */}
      {flight.layovers && flight.layovers.length > 0 && (
        <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-100">
          <p className="text-[10px] text-amber-700">
            乗継: {flight.layovers.map(l => `${l.name} (${formatDuration(l.duration)})`).join(' → ')}
          </p>
        </div>
      )}

      {/* 確認ボタン */}
      <div className="px-4 pb-3 pt-0">
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-primary/10 text-primary text-xs font-semibold py-2 rounded-xl hover:bg-primary hover:text-white transition-all"
        >
          この便を Google Flights で確認 →
        </a>
      </div>
    </div>
  );
}

function FlightSearchCard({ destCity }: { destCity: string | null }) {
  const defaultDest = (destCity ? CITY_TO_IATA[destCity] : null) ?? 'SYD';
  const [origin, setOrigin] = useState('NRT');
  const [dest, setDest] = useState(defaultDest);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [notConfigured, setNotConfigured] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!date) return;
    setLoading(true);
    setSearched(true);
    setFlights([]);
    const res = await fetch('/api/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination: dest, departureDate: date }),
    });
    const data = await res.json() as { configured: boolean; flights?: FlightResult[] };
    if (!data.configured) { setNotConfigured(true); setLoading(false); return; }
    setFlights(data.flights ?? []);
    setLoading(false);
  };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <span className="text-lg">✈️</span>
        <p className="text-xs font-semibold text-primary">フライト検索</p>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">Google Flights</span>
      </div>

      {/* 検索フォーム */}
      <div className="px-5 pt-4 pb-3 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[10px] text-muted mb-1">出発地</p>
            <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary bg-white">
              <option value="NRT">東京 成田 (NRT)</option>
              <option value="HND">東京 羽田 (HND)</option>
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
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <p className="text-[10px] text-muted mb-1">出発日</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!date || loading}
            className="flex-shrink-0 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      </div>

      {/* 結果エリア */}
      {notConfigured && (
        <div className="mx-5 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">SerpAPI キーが未設定です</p>
          <p><a href="https://serpapi.com/users/sign_up" target="_blank" rel="noopener noreferrer" className="underline">serpapi.com</a> で無料登録後、<code className="bg-amber-100 px-1 rounded">SERPAPI_KEY</code> を .env.local に追加してください。</p>
          <p className="mt-1 text-amber-600">無料プラン：100回/月</p>
        </div>
      )}

      {loading && (
        <div className="px-5 pb-5 flex flex-col gap-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {searched && !loading && !notConfigured && flights.length === 0 && (
        <p className="px-5 pb-5 text-xs text-muted text-center py-4">
          該当するフライトが見つかりませんでした。<br />日付や目的地を変えてお試しください。
        </p>
      )}

      {flights.length > 0 && (
        <div className="px-5 pb-5 flex flex-col gap-2">
          <p className="text-[10px] text-muted mb-1">{flights.length}件の候補が見つかりました</p>
          {flights.map((flight, i) => (
            <FlightCard key={i} flight={flight} origin={origin} dest={dest} date={date} />
          ))}
        </div>
      )}
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
