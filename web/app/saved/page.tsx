'use client';

import { useState } from 'react';
import Link from 'next/link';

const TABS = ['学校', '店舗', '体験', 'ガイド'] as const;
type Tab = typeof TABS[number];

interface SavedCard {
  id: string;
  title: string;
  sub: string;
  image?: string;
  badge?: string;
}

const DUMMY: Record<Tab, SavedCard[]> = {
  '学校': [
    { id: 's1', title: 'ELSIS Sydney', sub: 'シドニー · 語学学校 · ⭐ 4.2', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80' },
    { id: 's2', title: 'LSI London', sub: 'ロンドン · 語学学校 · ⭐ 4.5', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80' },
  ],
  '店舗': [
    { id: 'st1', title: 'Market Lane Coffee', sub: 'メルボルン · カフェ', image: 'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=400&q=80' },
  ],
  '体験': [
    { id: 'e1', title: 'ゴールドコーストサーフィン体験', sub: 'ゴールドコースト · by Miku', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' },
  ],
  'ガイド': [
    { id: 'g1', title: 'シドニーワーホリ完全ガイド 2025年版', sub: 'シドニー · by Yuki · 24 スポット', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80', badge: '24 スポット' },
    { id: 'g2', title: 'エジンバラ語学留学 3ヶ月の記録', sub: 'エジンバラ · by Ai · 30 日間', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', badge: '30 日間' },
  ],
};

const EMPTY_ICON: Record<Tab, string> = { '学校': '🏫', '店舗': '🏪', '体験': '🌏', 'ガイド': '📖' };
const EMPTY_LINK: Record<Tab, string> = { '学校': '/chat', '店舗': '/inspiration', '体験': '/inspiration', 'ガイド': '/inspiration' };
const EMPTY_CTA: Record<Tab, string> = { '学校': 'チャットで探す', '店舗': 'インスピレーションを見る', '体験': 'インスピレーションを見る', 'ガイド': 'インスピレーションを見る' };

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ガイド');
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const items = DUMMY[activeTab].filter(i => !removedIds.has(i.id));

  const remove = (id: string) => setRemovedIds(prev => new Set([...prev, id]));

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-primary mb-6">保存済み</h1>

        {/* タブ */}
        <div className="flex border-b border-border mb-8">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-primary'
              }`}
            >
              {tab}
              <span className={`text-xs font-semibold tabular-nums ${activeTab === tab ? 'text-primary' : 'text-muted'}`}>
                {DUMMY[tab].filter(i => !removedIds.has(i.id)).length}
              </span>
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-200 to-teal-200 flex items-center justify-center">
              <span className="text-3xl">{EMPTY_ICON[activeTab]}</span>
            </div>
            <h2 className="text-lg font-semibold text-primary">まだ{activeTab}の保存がありません</h2>
            <p className="text-muted text-sm text-center">
              インスピレーションやチャットから<br />
              気になる{activeTab}を♥で保存してみましょう
            </p>
            <Link
              href={EMPTY_LINK[activeTab]}
              className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity"
            >
              {EMPTY_CTA[activeTab]}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7">
            {items.map(item => (
              <div key={item.id} className="group cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden aspect-[502/376] bg-gray-100 mb-3">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                  {item.badge && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* 保存解除ボタン */}
                  <button
                    onClick={e => { e.stopPropagation(); remove(item.id); }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="保存を解除"
                  >
                    ♥
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-primary line-clamp-2 leading-snug mb-1">{item.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
