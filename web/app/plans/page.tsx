'use client';

import { useState } from 'react';

const DUMMY_PLANS = [
  { id: '1', title: 'オーストラリア・シドニー語学留学', country: 'オーストラリア', city: 'シドニー', duration: '12週間', budget: 1500000, status: 'draft' as const, updatedAt: '2025-05-10' },
  { id: '2', title: 'カナダ・バンクーバーワーホリ', country: 'カナダ', city: 'バンクーバー', duration: '1年', budget: 2800000, status: 'private' as const, updatedAt: '2025-04-20' },
];

const STATUS_META = {
  draft:   { label: '下書き', color: 'bg-gray-100 text-gray-600' },
  private: { label: '非公開', color: 'bg-blue-100 text-blue-700' },
  shared:  { label: '共有中', color: 'bg-green-100 text-green-700' },
  public:  { label: '公開中', color: 'bg-purple-100 text-purple-700' },
};

export default function PlansPage() {
  const [bookedOnly, setBookedOnly] = useState(false);

  return (
    <div className="flex h-full">
      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary">あなたのプラン</h1>
            <button className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-80 transition-opacity">
              <span>＋</span>
              <span>新規プラン</span>
            </button>
          </div>

          {/* フィルター */}
          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`w-10 h-6 rounded-full transition-colors ${bookedOnly ? 'bg-primary' : 'bg-gray-200'}`}
                onClick={() => setBookedOnly(!bookedOnly)}
              >
                <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${bookedOnly ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm text-muted">予約済みのみ</span>
            </label>
            <select className="text-sm text-muted border border-border rounded-lg px-3 py-1.5 bg-white">
              <option>すべて</option>
              <option>下書き</option>
              <option>非公開</option>
              <option>公開中</option>
            </select>
          </div>

          {/* プランリスト */}
          {DUMMY_PLANS.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-200 to-green-200 flex items-center justify-center">
                <span className="text-3xl">🧳</span>
              </div>
              <h2 className="text-lg font-semibold text-primary">まだプランがありません</h2>
              <p className="text-muted text-sm text-center">作成したプランがここに表示されます。<br />AI に相談して最初のプランを作りましょう！</p>
              <button className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity">
                プランを作成する
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {DUMMY_PLANS.map((plan) => {
                const s = STATUS_META[plan.status];
                return (
                  <button
                    key={plan.id}
                    className="bg-white border border-border rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 gap-1.5 flex flex-col">
                        <h3 className="text-base font-semibold text-primary truncate">{plan.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted">📍 {plan.country} / {plan.city}</span>
                          <span className="text-muted text-xs">·</span>
                          <span className="text-xs text-muted">🗓 {plan.duration}</span>
                          <span className="text-muted text-xs">·</span>
                          <span className="text-xs text-muted">💰 ¥{plan.budget.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted">更新: {plan.updatedAt}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 右パネル — ヒント */}
      <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">プランのヒント</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[
            { emoji: '🤖', title: 'AI に提案してもらう', body: 'チャットで目的・期間・予算を伝えると AI が自動でプランを組み立てます' },
            { emoji: '👨‍👩‍👧', title: '親と共有する', body: '親子連携機能で保護者にプランを安全に共有できます' },
            { emoji: '🎓', title: 'エージェントを招待', body: 'プランにエージェントを招待して一緒に編集・相談できます' },
          ].map((tip) => (
            <div key={tip.title} className="bg-white border border-border rounded-xl p-4">
              <p className="text-sm font-semibold text-primary mb-1">{tip.emoji} {tip.title}</p>
              <p className="text-xs text-muted leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
