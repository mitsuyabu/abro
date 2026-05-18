'use client';

import { useState } from 'react';

const TABS = ['ダッシュボード', '収益履歴', '設定'];

const DUMMY_EARNINGS = [
  { id: '1', source: 'affiliate', label: 'Skyscanner アフィリエイト', amount: 3200,  date: '2025-05-10', status: 'paid' },
  { id: '2', source: 'plan_sale', label: 'プラン販売 — シドニー完全ガイド', amount: 1500, date: '2025-05-08', status: 'paid' },
  { id: '3', source: 'affiliate', label: 'World Nomads アフィリエイト', amount: 2800, date: '2025-05-06', status: 'pending' },
  { id: '4', source: 'agent_kickback', label: 'エージェント紹介料', amount: 5000, date: '2025-05-01', status: 'paid' },
];

const SOURCE_META: Record<string, { emoji: string; label: string }> = {
  affiliate:       { emoji: '🔗', label: 'アフィリエイト' },
  plan_sale:       { emoji: '📋', label: 'プラン販売' },
  agent_kickback:  { emoji: '🤝', label: '紹介料' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  paid:      { label: '支払い済み', color: 'bg-green-100 text-green-700' },
  pending:   { label: '処理中',     color: 'bg-yellow-100 text-yellow-700' },
  cancelled: { label: 'キャンセル', color: 'bg-red-100 text-red-600' },
};

export default function CreatorPage() {
  const [activeTab, setActiveTab] = useState('ダッシュボード');
  const [isRegistered] = useState(true);

  if (!isRegistered) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full gap-6 px-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 flex items-center justify-center">
          <span className="text-3xl">💰</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-primary mb-2">クリエイターになりましょう</h2>
          <p className="text-muted text-sm leading-relaxed max-w-sm">
            あなたの留学体験をシェアして収益を得られます。アフィリエイト・プラン販売・紹介料で月数万円の副収入も。
          </p>
        </div>
        <button className="bg-primary text-white font-semibold px-8 py-3 rounded-full hover:opacity-80 transition-opacity">
          クリエイター登録する
        </button>
      </div>
    );
  }

  const totalPaid = DUMMY_EARNINGS.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
  const totalPending = DUMMY_EARNINGS.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        {/* タブ */}
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-8 flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-8 py-6">
          {activeTab === 'ダッシュボード' && (
            <>
              {/* サマリーカード */}
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
                  <p className="text-2xl font-bold text-primary">3</p>
                  <p className="text-xs text-muted mt-1">公開中のガイド</p>
                </div>
              </div>

              {/* 収益ランキング */}
              <div className="bg-white border border-border rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-primary mb-4">収益源の内訳</h3>
                {[
                  { emoji: '🤝', label: '紹介料',         amount: 5000, pct: 40 },
                  { emoji: '🔗', label: 'アフィリエイト', amount: 6000, pct: 48 },
                  { emoji: '📋', label: 'プラン販売',      amount: 1500, pct: 12 },
                ].map((item) => (
                  <div key={item.label} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-primary">{item.emoji} {item.label}</span>
                      <span className="text-xs font-semibold text-primary">¥{item.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* 最近の収益 */}
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">最近の収益</h3>
              <div className="flex flex-col gap-3">
                {DUMMY_EARNINGS.slice(0, 3).map((e) => {
                  const src = SOURCE_META[e.source] ?? { emoji: '💰', label: e.source };
                  const sts = STATUS_META[e.status] ?? { label: e.status, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={e.id} className="bg-white border border-border rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                        {src.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">{e.label}</p>
                        <p className="text-xs text-muted">{src.label} · {e.date}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-primary">¥{e.amount.toLocaleString()}</p>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${sts.color}`}>{sts.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === '収益履歴' && (
            <div className="flex flex-col gap-3">
              {DUMMY_EARNINGS.map((e) => {
                const src = SOURCE_META[e.source] ?? { emoji: '💰', label: e.source };
                const sts = STATUS_META[e.status] ?? { label: e.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={e.id} className="bg-white border border-border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                      {src.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{e.label}</p>
                      <p className="text-xs text-muted">{src.label} · {e.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-primary">¥{e.amount.toLocaleString()}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${sts.color}`}>{sts.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === '設定' && (
            <div className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-primary">振込先設定</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: '銀行名', placeholder: '三菱UFJ銀行' },
                  { label: '支店名', placeholder: '渋谷支店' },
                  { label: '口座番号', placeholder: '1234567' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs text-muted font-medium block mb-1">{f.label}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                ))}
                <button className="mt-2 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-80 transition-opacity">
                  保存する
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右パネル */}
      <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">収益アップのヒント</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[
            { emoji: '📝', title: 'ガイドを書く', body: '詳細な渡航ガイドは月10〜50件のアフィリエイトを生みます' },
            { emoji: '🔗', title: 'リンクをシェア', body: 'SNSで紹介リンクをシェアするだけで収益が発生します' },
            { emoji: '🤝', title: 'エージェント紹介', body: '友人を留学エージェントに紹介すると紹介料が入ります' },
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
