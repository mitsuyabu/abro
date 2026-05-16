'use client';

import { useState } from 'react';

const TABS = ['コレクション', 'ブックマーク', 'ガイド'];

const DUMMY_COLLECTIONS = [
  { id: '1', name: 'オーストラリア調査中', count: 12, emoji: '🇦🇺', updatedAt: '2日前' },
  { id: '2', name: 'ビザ関連情報',         count: 5,  emoji: '📄', updatedAt: '1週間前' },
  { id: '3', name: '学校候補',             count: 8,  emoji: '🎓', updatedAt: '3日前' },
];

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState('コレクション');

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <h1 className="text-2xl font-bold text-primary mb-6">保存済み</h1>

          {/* タブ */}
          <div className="flex items-center gap-1 border-b border-border mb-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-primary'
                }`}
              >
                {tab} {tab === 'コレクション' ? DUMMY_COLLECTIONS.length : 0}
              </button>
            ))}
          </div>

          {activeTab === 'コレクション' && (
            DUMMY_COLLECTIONS.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-200 to-red-200 flex items-center justify-center">
                  <span className="text-3xl">❤️</span>
                </div>
                <h2 className="text-lg font-semibold text-primary">コレクションがありません</h2>
                <p className="text-muted text-sm text-center">留学情報を保存してテーマ別に管理しましょう</p>
                <button className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity">
                  コレクションを作成
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 新規作成カード */}
                <button className="border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors text-center">
                  <span className="text-3xl">＋</span>
                  <span className="text-sm font-medium text-muted">コレクションを作成</span>
                </button>
                {DUMMY_COLLECTIONS.map((col) => (
                  <button
                    key={col.id}
                    className="bg-white border border-border rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <span className="text-3xl block mb-3">{col.emoji}</span>
                    <h3 className="text-sm font-semibold text-primary mb-1">{col.name}</h3>
                    <p className="text-xs text-muted">{col.count}件 · {col.updatedAt}に更新</p>
                  </button>
                ))}
              </div>
            )
          )}

          {activeTab !== 'コレクション' && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <span className="text-4xl">🔖</span>
              <p className="text-muted text-sm">保存したアイテムはここに表示されます</p>
            </div>
          )}
        </div>
      </div>

      {/* 右パネル */}
      <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">おすすめ保存</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs text-muted">気になる情報を保存して、あとで見返せるようにしましょう</p>
          {[
            { emoji: '📋', label: '人気のプラン', desc: '他のユーザーの公開プランを参考に' },
            { emoji: '📚', label: 'ガイド記事', desc: 'ビザ・費用・生活の詳細ガイド' },
            { emoji: '👥', label: '先輩体験談', desc: 'Q&A から役立つ回答を保存' },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-border rounded-xl p-4">
              <p className="text-sm font-semibold text-primary mb-0.5">{item.emoji} {item.label}</p>
              <p className="text-xs text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
