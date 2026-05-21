'use client';

import { useState } from 'react';

type HubTab = 'hub' | 'earnings';

const INSPIRATION_PHOTOS = [
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80',
  'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=400&q=80',
  'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400&q=80',
  'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
];

const MY_GUIDES = [
  { id: '1', title: 'シドニーワーホリ完全ガイド', count: 24, countUnit: 'スポット', status: '公開中', statusColor: 'bg-green-100 text-green-700', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80' },
];

const DUMMY_EARNINGS = [
  { id: '1', source: 'affiliate', label: 'Skyscanner アフィリエイト', amount: 3200, date: '2025-05-10', status: 'paid' },
  { id: '2', source: 'plan_sale', label: 'プラン販売 — シドニー完全ガイド', amount: 1500, date: '2025-05-08', status: 'paid' },
  { id: '3', source: 'affiliate', label: 'World Nomads アフィリエイト', amount: 2800, date: '2025-05-06', status: 'pending' },
  { id: '4', source: 'agent_kickback', label: 'エージェント紹介料', amount: 5000, date: '2025-05-01', status: 'paid' },
];

const SOURCE_EMOJI: Record<string, string> = { affiliate: '🔗', plan_sale: '📋', agent_kickback: '🤝' };
const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  paid:    { label: '支払い済み', color: 'bg-green-100 text-green-700' },
  pending: { label: '処理中',     color: 'bg-yellow-100 text-yellow-700' },
};

export default function CreatorPage() {
  const [activeTab, setActiveTab] = useState<HubTab>('hub');

  const totalPaid    = DUMMY_EARNINGS.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
  const totalPending = DUMMY_EARNINGS.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="h-12 border-b border-border flex items-center px-6 bg-white flex-shrink-0 gap-3">
        <span className="text-sm font-bold text-primary flex-1">Creator Hub</span>
        <button
          onClick={() => setActiveTab(t => t === 'hub' ? 'earnings' : 'hub')}
          className="text-xs font-medium text-muted hover:text-primary border border-border rounded-full px-3 py-1.5 transition-colors"
        >
          {activeTab === 'hub' ? '収益を見る' : 'ハブに戻る'}
        </button>
        <button className="text-xs font-semibold bg-primary text-white rounded-full px-4 py-1.5 hover:opacity-80 transition-opacity">
          ガイドを作成する
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {activeTab === 'hub' ? (
          <>
            {/* CTA */}
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center mb-6 shadow-lg">
                <span className="text-3xl text-white font-light">＋</span>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">美しいガイドを作ろう</h2>
              <p className="text-muted text-sm mb-8 leading-relaxed">
                あなたの留学・ワーホリ体験を共有して、<br />
                次の世代の旅人を助けましょう
              </p>
              <button className="bg-primary text-white font-semibold px-8 py-3 rounded-full hover:opacity-80 transition-opacity shadow-md">
                ガイドを作成する
              </button>
            </div>

            {/* インスピレーション写真 */}
            <div className="flex gap-3 px-6 overflow-x-auto pb-6 scrollbar-hide">
              {INSPIRATION_PHOTOS.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="flex-shrink-0 w-52 h-36 object-cover rounded-2xl"
                />
              ))}
            </div>

            {/* 自分のガイド */}
            {MY_GUIDES.length > 0 && (
              <div className="px-6 pb-8 max-w-3xl">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">あなたのガイド</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {MY_GUIDES.map(guide => (
                    <div key={guide.id} className="border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                      <div className="relative h-28 bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={guide.image} alt={guide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-primary line-clamp-1 mb-1">{guide.title}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted">{guide.count} {guide.countUnit}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${guide.statusColor}`}>{guide.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* 収益ダッシュボード */
          <div className="max-w-3xl mx-auto px-6 py-6">
            {/* サマリー */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-border rounded-2xl p-5">
                <p className="text-xs text-muted mb-2">今月の収益</p>
                <p className="text-2xl font-bold text-primary">¥{totalPaid.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">支払い済み</p>
              </div>
              <div className="bg-white border border-border rounded-2xl p-5">
                <p className="text-xs text-muted mb-2">処理中</p>
                <p className="text-2xl font-bold text-primary">¥{totalPending.toLocaleString()}</p>
                <p className="text-xs text-yellow-600 mt-1">入金待ち</p>
              </div>
              <div className="bg-white border border-border rounded-2xl p-5">
                <p className="text-xs text-muted mb-2">コンテンツ</p>
                <p className="text-2xl font-bold text-primary">{MY_GUIDES.length}</p>
                <p className="text-xs text-muted mt-1">公開中のガイド</p>
              </div>
            </div>

            {/* 収益源の内訳 */}
            <div className="bg-white border border-border rounded-2xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-primary mb-4">収益源の内訳</h3>
              {[
                { emoji: '🤝', label: '紹介料', amount: 5000, pct: 40 },
                { emoji: '🔗', label: 'アフィリエイト', amount: 6000, pct: 48 },
                { emoji: '📋', label: 'プラン販売', amount: 1500, pct: 12 },
              ].map(item => (
                <div key={item.label} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-primary">{item.emoji} {item.label}</span>
                    <span className="text-xs font-semibold text-primary">¥{item.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 収益履歴 */}
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">収益履歴</h3>
            <div className="flex flex-col gap-3">
              {DUMMY_EARNINGS.map(e => {
                const sts = STATUS_STYLE[e.status] ?? { label: e.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={e.id} className="bg-white border border-border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                      {SOURCE_EMOJI[e.source] ?? '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{e.label}</p>
                      <p className="text-xs text-muted">{e.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-primary">¥{e.amount.toLocaleString()}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${sts.color}`}>{sts.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
