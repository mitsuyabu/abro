'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type Category = 'すべて' | 'ガイド' | '体験' | '学校' | '店舗' | 'プラン';

interface Guide {
  id: string;
  guideId?: string;        // DB に保存された実ガイドのID
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
  user_id: string;
  author_nickname?: string | null;
  author_avatar?: string | null;
  author_phase?: string | null;
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

// 自分のプランに参照追加するモーダル
function AddRefToMyPlanModal({
  targetPlan,
  myPlans,
  onAdd,
  onClose,
}: {
  targetPlan: Plan;
  myPlans: { id: string; title: string; destination_city: string | null }[];
  onAdd: (myPlanId: string) => void;
  onClose: () => void;
}) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <p className="text-xs text-muted">参照として追加するプランを選択</p>
          <p className="text-sm font-bold text-primary truncate mt-0.5">「{targetPlan.title}」</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {myPlans.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted">まだプランがありません</p>
              <Link href="/chat" className="text-xs text-primary mt-2 block">チャットでプランを作成 →</Link>
            </div>
          ) : myPlans.map(p => {
            const isAdded = addedIds.has(p.id);
            return (
              <button key={p.id} onClick={() => { if (!isAdded) { onAdd(p.id); setAddedIds(prev => new Set([...prev, p.id])); } }}
                disabled={isAdded}
                className={`w-full flex items-center justify-between px-5 py-3.5 border-b border-border/40 last:border-0 text-left transition-colors ${isAdded ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                <div>
                  <p className="text-sm font-semibold text-primary truncate max-w-[260px]">{p.title}</p>
                  {p.destination_city && <p className="text-[10px] text-muted mt-0.5">📍 {p.destination_city}</p>}
                </div>
                <span className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${isAdded ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-primary text-white border-primary hover:opacity-80'}`}>
                  {isAdded ? '✓ 追加済み' : '追加'}
                </span>
              </button>
            );
          })}
        </div>
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-border text-sm text-muted hover:bg-gray-50 transition-colors">閉じる</button>
        </div>
      </div>
    </div>
  );
}

export default function InspirationPage() {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [realGuides, setRealGuides] = useState<Guide[]>([]);
  const [savedPlanIds, setSavedPlanIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myPlans, setMyPlans] = useState<{ id: string; title: string; destination_city: string | null }[]>([]);
  const [addRefTarget, setAddRefTarget] = useState<Plan | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('すべて');
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setCurrentUserId(uid);
      if (uid) {
        const [{ data: savesData }, { data: myPlansData }] = await Promise.all([
          supabase.from('plan_saves').select('plan_id').eq('user_id', uid),
          supabase.from('plans').select('id, title, destination_city').eq('user_id', uid).order('created_at', { ascending: false }),
        ]);
        setSavedPlanIds(new Set((savesData ?? []).map(s => s.plan_id)));
        setMyPlans((myPlansData ?? []) as { id: string; title: string; destination_city: string | null }[]);
      }
    });
  }, []);

  useEffect(() => {
    supabase
      .from('plans')
      .select('id, title, destination_country, destination_city, budget_jpy, budget_max_jpy, purpose, details, created_at, user_id')
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        if (!data) { setPlans([]); return; }
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: usersData } = await supabase.from('users').select('id, nickname, avatar_url, phase').in('id', userIds);
        const userMap = new Map((usersData ?? []).map(u => [u.id, u]));
        setPlans((data as Plan[]).map(p => ({
          ...p,
          author_nickname: userMap.get(p.user_id)?.nickname ?? null,
          author_avatar: userMap.get(p.user_id)?.avatar_url ?? null,
          author_phase: userMap.get(p.user_id)?.phase ?? null,
        })));
      });
  }, []);

  // Supabase から公開ガイドを取得してダミーに混ぜる
  useEffect(() => {
    supabase
      .from('guides')
      .select('id, title, category, location, cover_image, items, user_id')
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        if (!data || data.length === 0) return;
        const userIds = [...new Set(data.map(g => g.user_id))];
        const { data: usersData } = await supabase.from('users').select('id, nickname, phase').in('id', userIds);
        const userMap = new Map((usersData ?? []).map(u => [u.id, u]));
        const PHASE_MAP: Record<string, Guide['authorPhase']> = { preparing: '準備中', abroad: '渡航中', returned: '帰国済', considering: '準備中' };
        const COUNT_UNIT_MAP: Record<string, string> = { '学校': '学校', '店舗': '店舗', '場所': 'スポット', '体験': '体験' };
        const realGuides: Guide[] = data.map(g => {
          const u = userMap.get(g.user_id);
          return {
            id: g.id,
            guideId: g.id,   // 詳細ページへのリンクに使用
            title: g.title,
            author: u?.nickname ?? 'ユーザー',
            authorPhase: PHASE_MAP[u?.phase ?? 'preparing'] ?? '準備中',
            country: '',      // locationだけ表示（重複防止）
            city: g.location,
            category: (g.category as Guide['category']) ?? '体験',
            coverImage: g.cover_image ?? 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=500&q=80',
            count: Array.isArray(g.items) ? (g.items as unknown[]).length : 0,
            countUnit: COUNT_UNIT_MAP[g.category] ?? 'アイテム',
          };
        });
        // ダミーより前に実データを表示
        setRealGuides(realGuides);
      });
  }, []);

  const allGuides = [...realGuides, ...GUIDES];

  const filteredGuides = allGuides.filter(g => {
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

  const handleTogglePlanSave = async (plan: Plan) => {
    if (!currentUserId) { router.push('/login'); return; }
    if (savedPlanIds.has(plan.id)) {
      await supabase.from('plan_saves').delete().eq('user_id', currentUserId).eq('plan_id', plan.id);
      setSavedPlanIds(prev => { const n = new Set(prev); n.delete(plan.id); return n; });
    } else {
      await supabase.from('plan_saves').insert({ user_id: currentUserId, plan_id: plan.id });
      setSavedPlanIds(prev => new Set([...prev, plan.id]));
    }
  };

  const handleAddRefToMyPlan = async (myPlanId: string) => {
    if (!addRefTarget) return;
    const supabase2 = createClient();
    const { data: planData } = await supabase2.from('plans').select('details').eq('id', myPlanId).single();
    const currentRefs = (planData?.details?.ref_plans as { id: string; title: string; destination_city: string | null; destination_country: string | null; duration_label?: string | null; purpose?: string | null }[] | null) ?? [];
    if (currentRefs.some(r => r.id === addRefTarget.id)) return;
    const newRef = {
      id: addRefTarget.id,
      title: addRefTarget.title,
      destination_city: addRefTarget.destination_city,
      destination_country: addRefTarget.destination_country,
      duration_label: addRefTarget.details?.duration_label ?? null,
      purpose: addRefTarget.purpose,
    };
    const updatedDetails = { ...(planData?.details ?? {}), ref_plans: [...currentRefs, newRef] };
    await supabase2.from('plans').update({ details: updatedDetails }).eq('id', myPlanId);
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
              <PlanCard
                key={`plan-${plan.id}`}
                plan={plan}
                isSaved={savedPlanIds.has(plan.id)}
                onSave={() => handleTogglePlanSave(plan)}
                onAddRef={() => setAddRefTarget(plan)}
              />
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
      {addRefTarget && (
        <AddRefToMyPlanModal
          targetPlan={addRefTarget}
          myPlans={myPlans}
          onAdd={handleAddRefToMyPlan}
          onClose={() => setAddRefTarget(null)}
        />
      )}
    </div>
  );
}

function PlanCard({ plan, isSaved, onSave, onAddRef }: {
  plan: Plan;
  isSaved?: boolean;
  onSave?: () => void;
  onAddRef?: () => void;
}) {
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

        {/* ♡ + ボタン */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          {onSave && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onSave(); }}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <span className="text-sm">{isSaved ? '❤️' : '🤍'}</span>
            </button>
          )}
          {onAddRef && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onAddRef(); }}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors text-primary font-bold text-base"
            >
              ＋
            </button>
          )}
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
      {/* 作成者情報 */}
      <div className="flex items-center gap-1.5 mt-2">
        <div className="w-5 h-5 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
          {plan.author_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={plan.author_avatar} alt="" className="w-full h-full object-cover" />
          ) : <span className="text-[9px]">👤</span>}
        </div>
        <span className="text-[11px] text-muted">{plan.author_nickname ?? '匿名ユーザー'}</span>
        {plan.author_phase && (
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${PHASE_STYLE[plan.author_phase as Guide['authorPhase']] ?? 'bg-gray-100 text-gray-600'}`}>
            {plan.author_phase === 'considering' ? '検討中' : plan.author_phase === 'preparing' ? '準備中' : plan.author_phase === 'abroad' ? '渡航中' : '帰国済'}
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

const CATEGORY_BADGE: Record<string, { label: string; color: string }> = {
  '学校': { label: '🏫 学校',  color: 'bg-blue-100 text-blue-700' },
  '店舗': { label: '🏪 店舗',  color: 'bg-orange-100 text-orange-700' },
  '場所': { label: '📍 場所',  color: 'bg-green-100 text-green-700' },
  '体験': { label: '✨ 体験',  color: 'bg-purple-100 text-purple-700' },
  'ガイド': { label: '📖 ガイド', color: 'bg-gray-100 text-gray-700' },
};

function GuideCard({ guide, isSaved, onSave }: { guide: Guide; isSaved: boolean; onSave: () => void }) {
  const detailHref = guide.guideId ? `/inspiration/guides/${guide.guideId}` : null;
  const badge = CATEGORY_BADGE[guide.category] ?? CATEGORY_BADGE['ガイド'];

  return (
    <div className="group">
      {/* 画像エリア：実ガイドはリンク、ダミーはそのまま */}
      <div className="relative rounded-2xl overflow-hidden aspect-[239/273] bg-gray-100 mb-3">
        {detailHref ? (
          <Link href={detailHref} className="block w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={guide.coverImage} alt={guide.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </Link>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={guide.coverImage} alt={guide.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />

        {/* バッジ群（左上） */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
          {/* カテゴリバッジ */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
          {/* カウントバッジ */}
          {guide.count > 0 && (
            <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {guide.count} {guide.countUnit}
            </span>
          )}
        </div>

        {/* アクションボタン（右上） */}
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
        </div>
      </div>

      {/* タイトル */}
      {detailHref ? (
        <Link href={detailHref} className="block hover:opacity-80 transition-opacity">
          <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-2 mb-1.5">{guide.title}</h3>
        </Link>
      ) : (
        <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-2 mb-1.5">{guide.title}</h3>
      )}
      <p className="text-xs text-muted mb-1.5">📍 {guide.city}{guide.country ? ` · ${guide.country}` : ''}</p>
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
