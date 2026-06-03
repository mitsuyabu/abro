'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

type Category = 'すべて' | 'ガイド' | '体験' | '学校' | '店舗' | 'プラン';

interface Guide {
  id: string;
  title: string;
  author: string;
  authorPhase: '渡航中' | '帰国済' | '準備中';
  country: string;
  city: string;
  category: Exclude<Category, 'すべて' | 'プラン'>;
  coverImage: string;
  count: number;
  countUnit: string;
}

interface Plan {
  id: string;
  title: string;
  destination_country: string | null;
  destination_city: string | null;
  budget_jpy: number | null;
  budget_max_jpy: number | null;
  purpose: string | null;
  details: { duration_label?: string } | null;
  created_at: string;
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

const CITY_COVER: Record<string, string> = {
  シドニー: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1530276371031-2511efff9d5a.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTMwMjc2MzcxMDMxLTI1MTFlZmZmOWQ1YS5hdmlmIiwiaWF0IjoxNzc5MTc4MjM4LCJleHAiOjE4MTA3MTQyMzh9.7YZmpSpH8gMXHh3huHJabFDu4gshODOwZnCBvNEYn2U',
  メルボルン: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1514395462725-fb4566210144.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTE0Mzk1NDYyNzI1LWZiNDU2NjIxMDE0NC5hdmlmIiwiaWF0IjoxNzc5MTc3NjY1LCJleHAiOjE4MTA3MTM2NjV9.7yvlYrUzHDAAD_AQACsL6DpgLVJvvZTdUgZzNBvibLA',
  ブリスベン: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1589976567749-2f011d95ffec.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTg5OTc2NTY3NzQ5LTJmMDExZDk1ZmZlYy5hdmlmIiwiaWF0IjoxNzc5MTc4NDA3LCJleHAiOjE4MTA3MTQ0MDd9.Sf2jZikB9GAEzeWI6Yx0iaGH7KSRWeiSuEejGIyPA1s',
  ゴールドコースト: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1591701729564-3b5325d5a4bd.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTkxNzAxNzI5NTY0LTNiNTMyNWQ1YTRiZC5hdmlmIiwiaWF0IjoxNzc5MTc4NDI2LCJleHAiOjE4MTA3MTQ0MjZ9.dmCHZgfLr6uBg7RayDNFjybtBDTRiwXRfH6vrV0x7Is',
  ケアンズ: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1598948485421-33a1655d3c18.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTk4OTQ4NDg1NDIxLTMzYTE2NTVkM2MxOC5hdmlmIiwiaWF0IjoxNzc5MTc4NDcxLCJleHAiOjE4MTA3MTQ0NzF9.GBddv1v8S2u_AxdDKHfUuqF7HqXNJgQfXoCa60THTLY',
};
const FALLBACK_COVER = 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1530276371031-2511efff9d5a.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTMwMjc2MzcxMDMxLTI1MTFlZmZmOWQ1YS5hdmlmIiwiaWF0IjoxNzc5MTc4MjM4LCJleHAiOjE4MTA3MTQyMzh9.7YZmpSpH8gMXHh3huHJabFDu4gshODOwZnCBvNEYn2U';

const PURPOSE_LABEL: Record<string, string> = {
  study: '語学留学',
  workingholiday: 'ワーホリ',
  both: '留学＋ワーホリ',
};

const CATEGORIES: Category[] = ['すべて', 'プラン', 'ガイド', '体験', '学校', '店舗'];

const PHASE_STYLE: Record<Guide['authorPhase'], string> = {
  '渡航中': 'bg-green-100 text-green-700',
  '帰国済': 'bg-purple-100 text-purple-700',
  '準備中': 'bg-blue-100 text-blue-700',
};

export default function InspirationPage() {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<Category>('すべて');
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('plans')
      .select('id, title, destination_country, destination_city, budget_jpy, budget_max_jpy, purpose, details, created_at')
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPlans((data as Plan[]) ?? []));
  }, []);

  const filteredGuides = GUIDES.filter(g => {
    if (activeCategory === 'プラン') return false;
    if (activeCategory !== 'すべて' && activeCategory !== g.category) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.title.includes(search) || g.city.includes(search) || g.author.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredPlans = plans.filter(p => {
    if (activeCategory !== 'すべて' && activeCategory !== 'プラン') return false;
    if (search) {
      return p.title.includes(search) || (p.destination_city ?? '').includes(search) || (p.destination_country ?? '').includes(search);
    }
    return true;
  });

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const totalCount = filteredGuides.length + filteredPlans.length;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
              {cat === 'プラン' && plans.length > 0 && (
                <span className="ml-1.5 text-[11px] bg-white/30 px-1.5 py-0.5 rounded-full">{plans.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* グリッド */}
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-4xl">🔍</p>
            <p className="text-muted text-sm">
              {activeCategory === 'プラン' && plans.length === 0
                ? 'まだプランがありません。チャットでAIと一緒に作りましょう！'
                : '検索結果がありません'}
            </p>
            {activeCategory === 'プラン' && plans.length === 0 && (
              <Link href="/chat" className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-80 transition-opacity">
                ✨ プランを作成する
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-6 sm:gap-y-8">
            {/* プランカード */}
            {filteredPlans.map(plan => (
              <PlanCard key={`plan-${plan.id}`} plan={plan} />
            ))}
            {/* ガイドカード */}
            {filteredGuides.map(guide => (
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

function PlanCard({ plan }: { plan: Plan }) {
  const cover = (plan.destination_city && CITY_COVER[plan.destination_city]) || FALLBACK_COVER;
  const duration = plan.details?.duration_label;
  const budgetMin = plan.budget_jpy ? Math.round(plan.budget_jpy / 10000) : null;
  const budgetMax = plan.budget_max_jpy ? Math.round(plan.budget_max_jpy / 10000) : null;

  return (
    <div className="group block">
      <Link href={`/plans/${plan.id}`} className="block">
      <div className="relative rounded-2xl overflow-hidden aspect-[239/273] bg-gray-100 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={plan.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* プランバッジ */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-primary/90 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            AIプラン
          </span>
        </div>

        {/* 期間バッジ */}
        {duration && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {duration}
            </span>
          </div>
        )}
      </div>

      <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-2 mb-1.5">{plan.title}</h3>
      {(plan.destination_city || plan.destination_country) && (
        <p className="text-xs text-muted mb-1.5">
          📍 {plan.destination_city ?? plan.destination_country}
        </p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {plan.purpose && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
            {PURPOSE_LABEL[plan.purpose] ?? plan.purpose}
          </span>
        )}
        {budgetMin && (
          <span className="text-xs text-muted">
            💰 {budgetMin}{budgetMax && budgetMax !== budgetMin ? `〜${budgetMax}` : ''}万円
          </span>
        )}
      </div>
      </Link>
      <Link
        href={`/chat?ref=${plan.id}`}
        className="mt-2 w-full flex items-center justify-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold py-2 rounded-xl hover:bg-primary hover:text-white transition-all"
      >
        <span>✨</span><span>このプランを参考に作成する</span>
      </Link>
    </div>
  );
}

function GuideCard({ guide, isSaved, onSave }: { guide: Guide; isSaved: boolean; onSave: () => void }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative rounded-2xl overflow-hidden aspect-[239/273] bg-gray-100 mb-3">
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
