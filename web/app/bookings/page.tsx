'use client';

import { useState } from 'react';

const TABS = ['すべて', '航空券', '宿泊', '学校', '保険', 'その他'];

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  flight:        { emoji: '✈️', label: '航空券' },
  accommodation: { emoji: '🏠', label: '宿泊' },
  school:        { emoji: '🎓', label: '学校' },
  insurance:     { emoji: '🏥', label: '保険' },
  activity:      { emoji: '🎡', label: 'アクティビティ' },
  transfer:      { emoji: '💸', label: '送金' },
  other:         { emoji: '📦', label: 'その他' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  confirmed: { label: '確定',   color: 'bg-green-100 text-green-700' },
  pending:   { label: '保留中', color: 'bg-yellow-100 text-yellow-700' },
  cancelled: { label: 'キャンセル', color: 'bg-red-100 text-red-600' },
};

const DUMMY_BOOKINGS = [
  { id: '1', type: 'flight',        title: '成田→シドニー (QF80)', provider: 'Skyscanner', amount: 98000,  currency: 'JPY', date: '2025-09-01', status: 'confirmed' },
  { id: '2', type: 'accommodation', title: 'Sydney CBD シェアハウス 初月', provider: 'Booking.com', amount: 1200, currency: 'AUD', date: '2025-09-02', status: 'confirmed' },
  { id: '3', type: 'school',        title: 'EF English School Sydney 12週', provider: 'EF Education', amount: 350000, currency: 'JPY', date: '2025-09-08', status: 'pending' },
  { id: '4', type: 'insurance',     title: '海外旅行保険 1年プラン', provider: 'World Nomads', amount: 42000, currency: 'JPY', date: '2025-09-01', status: 'confirmed' },
];

const AFFILIATES = [
  { emoji: '✈️', name: 'Skyscanner', desc: '最安値航空券を比較' },
  { emoji: '🏨', name: 'Booking.com', desc: '宿泊・ホテルを予約' },
  { emoji: '🏥', name: 'World Nomads', desc: '海外保険に加入' },
  { emoji: '💸', name: 'Wise', desc: '安心の海外送金' },
];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('すべて');

  const filtered = activeTab === 'すべて'
    ? DUMMY_BOOKINGS
    : DUMMY_BOOKINGS.filter((b) => {
        const tabMap: Record<string, string> = { '航空券': 'flight', '宿泊': 'accommodation', '学校': 'school', '保険': 'insurance' };
        return b.type === tabMap[activeTab];
      });

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        {/* トップバー */}
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                  activeTab === tab ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {/* 提携サービス */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">提携サービスから予約</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AFFILIATES.map((a) => (
                <button
                  key={a.name}
                  className="bg-white border border-border rounded-2xl p-4 text-left hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <span className="text-2xl block mb-2">{a.emoji}</span>
                  <p className="text-sm font-semibold text-primary">{a.name}</p>
                  <p className="text-xs text-muted mt-0.5">{a.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* 予約リスト */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">あなたの予約</h2>
              <button className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity">
                <span>＋</span>
                <span>追加</span>
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-4xl">📋</span>
                <p className="text-muted text-sm">このカテゴリの予約はありません</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((booking) => {
                  const type = TYPE_META[booking.type] ?? { emoji: '📦', label: 'その他' };
                  const status = STATUS_META[booking.status] ?? { label: booking.status, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <button
                      key={booking.id}
                      className="bg-white border border-border rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                          {type.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-primary leading-snug">{booking.title}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-1">{booking.provider} · {booking.date}</p>
                          <p className="text-sm font-semibold text-primary mt-1.5">
                            {booking.currency === 'JPY' ? '¥' : booking.currency + ' '}
                            {booking.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 右パネル（lg以上のみ表示） */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">費用サマリー</span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-white border border-border rounded-2xl p-4">
            <p className="text-xs text-muted mb-3 font-semibold">合計費用</p>
            <p className="text-2xl font-bold text-primary">¥490,000</p>
            <p className="text-xs text-muted mt-1">+ AUD 1,200</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-xs text-muted font-semibold">カテゴリ別</p>
            {[
              { emoji: '✈️', label: '航空券', amount: '¥98,000', pct: 20 },
              { emoji: '🎓', label: '学校',   amount: '¥350,000', pct: 71 },
              { emoji: '🏥', label: '保険',   amount: '¥42,000', pct: 9 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-primary">{item.emoji} {item.label}</span>
                  <span className="text-xs font-semibold text-primary">{item.amount}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
