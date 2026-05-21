'use client';

import { useState } from 'react';

type Category = 'すべて' | 'ガイド' | '体験' | '学校' | '店舗';

interface Guide {
  id: string;
  title: string;
  author: string;
  authorPhase: '渡航中' | '帰国済' | '準備中';
  country: string;
  city: string;
  category: Exclude<Category, 'すべて'>;
  coverImage: string;
  count: number;
  countUnit: string;
}

const GUIDES: Guide[] = [
  { id: '1', title: 'シドニーワーホリ完全ガイド 2025年版', author: 'Yuki', authorPhase: '帰国済', country: 'オーストラリア', city: 'シドニー', category: 'ガイド', coverImage: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=500&q=80', count: 24, countUnit: 'スポット' },
  { id: '2', title: 'バンクーバーで月15万円生活する方法', author: 'Hana', authorPhase: '渡航中', country: 'カナダ', city: 'バンクーバー', category: '体験', coverImage: 'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=500&q=80', count: 6, countUnit: '日間' },
  { id: '3', title: 'ロンドン語学学校おすすめ10選', author: 'Taro', authorPhase: '帰国済', country: 'イギリス', city: 'ロンドン', category: '学校', coverImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&q=80', count: 10, countUnit: '学校' },
  { id: '4', title: 'メルボルンカフェ巡り完全版', author: 'Saki', authorPhase: '渡航中', country: 'オーストラリア', city: 'メルボルン', category: '店舗', coverImage: 'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=500&q=80', count: 18, countUnit: 'カフェ' },
  { id: '5', title: 'ニュージーランド農場バイト体験記', author: 'Ken', authorPhase: '帰国済', country: 'ニュージーランド', city: 'オークランド', category: '体験', coverImage: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=500&q=80', count: 8, countUnit: '日間' },
  { id: '6', title: 'ゴールドコーストでサーフィン留学', author: 'Miku', authorPhase: '渡航中', country: 'オーストラリア', city: 'ゴールドコースト', category: '体験', coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80', count: 12, countUnit: 'スポット' },
  { id: '7', title: 'トロントで見つけた日本食レストラン15選', author: 'Ryo', authorPhase: '渡航中', country: 'カナダ', city: 'トロント', category: '店舗', coverImage: 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=500&q=80', count: 15, countUnit: '店舗' },
  { id: '8', title: 'エジンバラ語学留学 3ヶ月の記録', author: 'Ai', authorPhase: '帰国済', country: 'イギリス', city: 'エジンバラ', category: 'ガイド', coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80', count: 30, countUnit: '日間' },
  { id: '9', title: 'セブ島留学で英語力爆上がりした話', author: 'Nana', authorPhase: '帰国済', country: 'フィリピン', city: 'セブ', category: '体験', coverImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=500&q=80', count: 4, countUnit: '週間' },
  { id: '10', title: 'ブリスベン語学学校体験談まとめ', author: 'Keita', authorPhase: '帰国済', country: 'オーストラリア', city: 'ブリスベン', category: '学校', coverImage: 'https://images.unsplash.com/photo-1524820801657-fd59673fbb05?w=500&q=80', count: 5, countUnit: '学校' },
];

const CATEGORIES: Category[] = ['すべて', 'ガイド', '体験', '学校', '店舗'];

const PHASE_STYLE: Record<Guide['authorPhase'], string> = {
  '渡航中': 'bg-green-100 text-green-700',
  '帰国済': 'bg-purple-100 text-purple-700',
  '準備中': 'bg-blue-100 text-blue-700',
};

export default function InspirationPage() {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<Category>('すべて');
  const [search, setSearch] = useState('');

  const filtered = GUIDES.filter(g => {
    if (activeCategory !== 'すべて' && g.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.title.includes(search) || g.city.includes(search) || g.author.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-primary mb-1">インスピレーション</h1>
        <p className="text-muted text-sm mb-6">先輩たちのリアルな体験談・ガイドを参考にしよう</p>

        {/* 検索 */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="場所・ユーザー名で検索"
            className="w-full bg-gray-50 border border-border rounded-full pl-10 pr-4 py-2.5 text-sm text-primary placeholder:text-muted outline-none focus:border-primary/40 focus:bg-white transition-colors"
          />
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* グリッド */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-4xl">🔍</p>
            <p className="text-muted text-sm">検索結果がありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {filtered.map(guide => (
              <GuideCard
                key={guide.id}
                guide={guide}
                isSaved={saved.has(guide.id)}
                onSave={() => toggleSave(guide.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GuideCard({ guide, isSaved, onSave }: { guide: Guide; isSaved: boolean; onSave: () => void }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={guide.coverImage}
          alt={guide.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

        {/* カウントバッジ */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            {guide.count} {guide.countUnit}
          </span>
        </div>

        {/* アクションボタン */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onSave(); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all shadow-md ${
              isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:text-red-500'
            }`}
            title={isSaved ? '保存を解除' : '保存する'}
          >
            {isSaved ? '♥' : '♡'}
          </button>
          <button
            onClick={e => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-white/90 text-gray-600 hover:bg-primary hover:text-white flex items-center justify-center text-sm transition-all shadow-md"
            title="プランに追加"
          >
            ＋
          </button>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-2 mb-1.5">{guide.title}</h3>
      <p className="text-xs text-muted mb-1.5">📍 {guide.city} · {guide.country}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] flex-shrink-0">👤</div>
        <span className="text-xs text-muted">{guide.author}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${PHASE_STYLE[guide.authorPhase]}`}>
          {guide.authorPhase}
        </span>
      </div>
    </div>
  );
}
