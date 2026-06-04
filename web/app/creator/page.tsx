'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// ─── Hub types ───────────────────────────────────────────────
type HubTab = 'hub' | 'earnings';

// ─── Wizard types ─────────────────────────────────────────────
type WizardStep = 0 | 1 | 2 | 3;
type GuideCategory = '学校' | '店舗' | '場所' | '体験';
type GuideLayout = 'fullscreen' | 'list';
type GuideTemplate = 'blank' | 'list' | 'itinerary';

interface GuideSection {
  id: string;
  title: string;
  content: string;
}

interface GuideItem {
  id: string;
  name: string;
  description: string;
  tip?: string;
}

interface AiDraft {
  overview: string;
  sections: GuideSection[];
  items: GuideItem[];
}

interface GuideConfig {
  category: GuideCategory | null;
  layout: GuideLayout | null;
  title: string;
  location: string;
  template: GuideTemplate;
  aiDraft?: AiDraft | null;
}

interface GuideEntry {
  id: string;
  title: string;
  category: string;
  location: string;
  cover_image: string | null;
  status: '公開中' | '下書き' | '非公開';
  statusColor: string;
  items: { id: string; name: string }[];
}

// ─── Hub data ─────────────────────────────────────────────────
// オーストラリアの都市：シドニー×2・メルボルン×2・ブリスベン×1・ゴールドコースト×1
const INSPIRATION_PHOTOS = [
  'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1530276371031-2511efff9d5a.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTMwMjc2MzcxMDMxLTI1MTFlZmZmOWQ1YS5hdmlmIiwiaWF0IjoxNzc5MTc4MjM4LCJleHAiOjE4MTA3MTQyMzh9.7YZmpSpH8gMXHh3huHJabFDu4gshODOwZnCBvNEYn2U',
  'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1598948485421-33a1655d3c18.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTk4OTQ4NDg1NDIxLTMzYTE2NTVkM2MxOC5hdmlmIiwiaWF0IjoxNzc5MTc4NDcxLCJleHAiOjE4MTA3MTQ0NzF9.GBddv1v8S2u_AxdDKHfUuqF7HqXNJgQfXoCa60THTLY',
  'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1514395462725-fb4566210144.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTE0Mzk1NDYyNzI1LWZiNDU2NjIxMDE0NC5hdmlmIiwiaWF0IjoxNzc5MTc3NjY1LCJleHAiOjE4MTA3MTM2NjV9.7yvlYrUzHDAAD_AQACsL6DpgLVJvvZTdUgZzNBvibLA',
  'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1545044846-351ba102b6d5.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTQ1MDQ0ODQ2LTM1MWJhMTAyYjZkNS5hdmlmIiwiaWF0IjoxNzc5MTc4Mjc1LCJleHAiOjE4MTA3MTQyNzV9.uAnMYHtaZrGLWSKI-7PXFMVWltcBdIpAyfBbM47Ywi4',
  'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1589976567749-2f011d95ffec.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTg5OTc2NTY3NzQ5LTJmMDExZDk1ZmZlYy5hdmlmIiwiaWF0IjoxNzc5MTc4NDA3LCJleHAiOjE4MTA3MTQ0MDd9.Sf2jZikB9GAEzeWI6Yx0iaGH7KSRWeiSuEejGIyPA1s',
  'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1591701729564-3b5325d5a4bd.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTkxNzAxNzI5NTY0LTNiNTMyNWQ1YTRiZC5hdmlmIiwiaWF0IjoxNzc5MTc4NDI2LCJleHAiOjE4MTA3MTQ0MjZ9.dmCHZgfLr6uBg7RayDNFjybtBDTRiwXRfH6vrV0x7Is',
];

const DB_STATUS: Record<string, GuideEntry['status']> = {
  public: '公開中', draft: '下書き', private: '非公開',
};

const DUMMY_EARNINGS = [
  { id: '1', source: 'affiliate',      label: 'Skyscanner アフィリエイト',      amount: 3200, date: '2025-05-10', status: 'paid' },
  { id: '2', source: 'plan_sale',      label: 'プラン販売 — シドニー完全ガイド', amount: 1500, date: '2025-05-08', status: 'paid' },
  { id: '3', source: 'affiliate',      label: 'World Nomads アフィリエイト',     amount: 2800, date: '2025-05-06', status: 'pending' },
  { id: '4', source: 'agent_kickback', label: 'エージェント紹介料',              amount: 5000, date: '2025-05-01', status: 'paid' },
];

const SOURCE_EMOJI: Record<string, string> = { affiliate: '🔗', plan_sale: '📋', agent_kickback: '🤝' };
const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  paid:    { label: '支払い済み', color: 'bg-green-100 text-green-700' },
  pending: { label: '処理中',     color: 'bg-yellow-100 text-yellow-700' },
};

// ─── Wizard data ──────────────────────────────────────────────
const GUIDE_CATEGORIES: { id: GuideCategory; icon: string; title: string; desc: string }[] = [
  { id: '学校', icon: '🏫', title: '学校', desc: '語学学校・大学・コースを紹介する' },
  { id: '店舗', icon: '🏪', title: '店舗', desc: 'カフェ・レストラン・お店を紹介する' },
  { id: '場所', icon: '📍', title: '場所', desc: '都市・観光スポットのガイドを作る' },
  { id: '体験', icon: '✨', title: '体験', desc: 'アクティビティ・体験談をシェアする' },
];

// ── 写真ライブラリ（キーワードマッチング用） ──────────────────────────
const PHOTO_LIBRARY: { url: string; credit: string; keywords: string[] }[] = [
  // ── オーストラリア都市 ──
  { url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80', credit: 'Dan Freeman', keywords: ['sydney', 'シドニー', 'australia', 'オーストラリア', 'opera'] },
  { url: 'https://images.unsplash.com/photo-1524820801657-fd59673fbb05?w=1200&q=80', credit: 'Unsplash', keywords: ['sydney', 'シドニー', 'harbour', '港', 'australia'] },
  { url: 'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=1200&q=80', credit: 'Denys Nevozhai', keywords: ['melbourne', 'メルボルン', 'australia', 'city', '都市'] },
  { url: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=1200&q=80', credit: 'Unsplash', keywords: ['melbourne', 'メルボルン', 'australia', 'オーストラリア'] },
  { url: 'https://images.unsplash.com/photo-1589976567749-2f011d95ffec?w=1200&q=80', credit: 'Unsplash', keywords: ['brisbane', 'ブリスベン', 'australia', 'queensland'] },
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', credit: 'Sean Oulashin', keywords: ['gold coast', 'ゴールドコースト', 'beach', 'ビーチ', 'surf', 'サーフ', 'australia', 'summer', '夏'] },
  { url: 'https://images.unsplash.com/photo-1591701729564-3b5325d5a4bd?w=1200&q=80', credit: 'Unsplash', keywords: ['gold coast', 'ゴールドコースト', 'surfers paradise', 'australia'] },
  { url: 'https://images.unsplash.com/photo-1598948485421-33a1655d3c18?w=1200&q=80', credit: 'Unsplash', keywords: ['cairns', 'ケアンズ', 'australia', 'reef', 'tropical', 'トロピカル', '熱帯'] },
  // ── カナダ ──
  { url: 'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=1200&q=80', credit: 'Dan Meyers', keywords: ['vancouver', 'バンクーバー', 'canada', 'カナダ', 'bc'] },
  { url: 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=1200&q=80', credit: 'Yentl Jacobs', keywords: ['toronto', 'トロント', 'canada', 'カナダ', 'ontario'] },
  // ── イギリス ──
  { url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80', credit: 'Benjamin Davies', keywords: ['london', 'ロンドン', 'uk', 'england', 'イギリス', 'britain', 'tower bridge'] },
  { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80', credit: 'Unsplash', keywords: ['edinburgh', 'エジンバラ', 'scotland', 'スコットランド', 'uk', 'イギリス', 'castle'] },
  // ── ニュージーランド ──
  { url: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&q=80', credit: 'Tobias Keller', keywords: ['auckland', 'オークランド', 'new zealand', 'ニュージーランド', 'nz'] },
  // ── フィリピン ──
  { url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200&q=80', credit: 'Humphrey Muleba', keywords: ['cebu', 'セブ', 'manila', 'マニラ', 'philippines', 'フィリピン', 'tropical'] },
  // ── アイルランド ──
  { url: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200&q=80', credit: 'Unsplash', keywords: ['dublin', 'ダブリン', 'ireland', 'アイルランド'] },
  // ── 語学学校・勉強 ──
  { url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80', credit: 'Element5 Digital', keywords: ['school', '学校', '語学学校', 'study', '勉強', 'classroom', 'english', '英語', 'language', '留学'] },
  { url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80', credit: 'Dom Fou', keywords: ['university', '大学', 'campus', 'student', '留学', 'study abroad', 'school', '学校'] },
  { url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80', credit: 'Abbie Bernet', keywords: ['study', '勉強', 'library', '図書館', 'reading', '読書', 'student', 'school'] },
  // ── カフェ・店舗 ──
  { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80', credit: 'Nathan Dumlao', keywords: ['cafe', 'カフェ', 'coffee', 'コーヒー', '店舗', 'barista', 'latte'] },
  { url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80', credit: 'Brooke Lark', keywords: ['cafe', 'カフェ', 'brunch', 'breakfast', '朝食', 'restaurant', 'food', '食事'] },
  { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80', credit: 'Rene Asmussen', keywords: ['cafe', 'カフェ', 'interior', 'shop', '店舗', 'bar', 'pub', 'drink'] },
  { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80', credit: 'Jay Wennington', keywords: ['restaurant', 'レストラン', 'food', '食事', 'dining', '飲食', 'meal', 'グルメ'] },
  // ── 仕事・ワーホリ ──
  { url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80', credit: 'Annie Spratt', keywords: ['work', '仕事', 'working', 'アルバイト', 'バイト', 'job', 'office', 'team'] },
  { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80', credit: 'Todd Quackenbush', keywords: ['farm', '農場', 'farming', 'rural', '田舎', 'countryside', 'harvest', 'セカンドビザ', 'fruit picking'] },
  // ── 体験・アクティビティ ──
  { url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80', credit: 'Anete Lūsiņa', keywords: ['travel', '旅行', 'adventure', '体験', 'explore', 'journey', 'backpack', 'backpacker'] },
  { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80', credit: 'Luca Bravo', keywords: ['nature', '自然', 'outdoor', 'mountain', '山', 'hiking', '体験', 'adventure'] },
  { url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80', credit: 'Te lensFix', keywords: ['travel', 'abroad', '海外', 'backpack', 'working holiday', 'ワーホリ', 'life', 'freedom'] },
  // ── 住まい ──
  { url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80', credit: 'Sidekix Media', keywords: ['house', '家', 'share house', 'シェアハウス', 'home', 'apartment', '住まい', 'accommodation'] },
  // ── 都市・汎用 ──
  { url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80', credit: 'Pedro Lastra', keywords: ['city', '都市', 'urban', 'skyline', 'downtown', '場所', 'travel'] },
];

function findPhotos(title: string, location: string, category: string): { url: string; credit: string }[] {
  const query = `${title} ${location} ${category}`.toLowerCase();
  const scored = PHOTO_LIBRARY.map(photo => ({
    ...photo,
    score: photo.keywords.reduce((s, kw) => s + (query.includes(kw.toLowerCase()) ? 1 : 0), 0),
  }));
  // スコア降順・重複URL排除
  const seen = new Set<string>();
  const sorted = scored
    .filter(p => { if (seen.has(p.url)) return false; seen.add(p.url); return true; })
    .sort((a, b) => b.score - a.score);
  return sorted.slice(0, 6);
}

const COVER_IMAGES: Record<string, string> = {
  'シドニー':         'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80',
  'メルボルン':       'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=1200&q=80',
  'バンクーバー':     'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=1200&q=80',
  'ロンドン':         'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
  'トロント':         'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=1200&q=80',
  'オークランド':     'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&q=80',
  'ゴールドコースト': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  'セブ':             'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200&q=80',
};

const COUNT_UNIT: Record<GuideCategory, string> = {
  '学校': '学校', '店舗': '店舗', '場所': 'スポット', '体験': '体験',
};

const STATUS_COLOR: Record<GuideEntry['status'], string> = {
  '公開中': 'bg-green-100 text-green-700',
  '下書き': 'bg-gray-100 text-gray-600',
  '非公開': 'bg-blue-100 text-blue-700',
};

function getCoverImage(location: string): string {
  for (const [city, url] of Object.entries(COVER_IMAGES)) {
    if (location.includes(city)) return url;
  }
  return 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80';
}

// ─── Main page ────────────────────────────────────────────────
export default function CreatorPage() {
  const [activeTab, setActiveTab]   = useState<HubTab>('hub');
  const [showWizard, setShowWizard] = useState(false);
  const [myGuides, setMyGuides]     = useState<GuideEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState<string | null>(null);
  const supabase = createClient();

  const fireToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchGuides = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('guides')
      .select('id, title, category, location, cover_image, status, items')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setMyGuides(data.map(g => ({
        id: g.id,
        title: g.title,
        category: g.category,
        location: g.location,
        cover_image: g.cover_image,
        status: DB_STATUS[g.status] ?? '下書き',
        statusColor: STATUS_COLOR[DB_STATUS[g.status] ?? '下書き'],
        items: (g.items as { id: string; name: string }[]) ?? [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchGuides(); }, []);

  const handlePublish = async (
    config: GuideConfig,
    coverImage: string,
    overview: string,
    sections: GuideSection[],
    items: GuideItem[]
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { fireToast('ログインが必要です'); return; }
    const { error } = await supabase.from('guides').insert({
      user_id: user.id,
      category: config.category ?? '場所',
      layout: config.layout ?? 'list',
      title: config.title,
      location: config.location,
      cover_image: coverImage || null,
      overview,
      sections,
      items,
      status: 'public',
    });
    if (error) { fireToast('保存に失敗しました'); return; }
    setShowWizard(false);
    setActiveTab('hub');
    fireToast('ガイドを公開しました！インスピレーションに表示されます 🎉');
    fetchGuides();
  };

  const handleSaveDraft = async (
    config: GuideConfig,
    coverImage: string,
    overview: string,
    sections: GuideSection[],
    items: GuideItem[]
  ) => {
    if (!config.title.trim()) { setShowWizard(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { fireToast('ログインが必要です'); return; }
    const { error } = await supabase.from('guides').insert({
      user_id: user.id,
      category: config.category ?? '場所',
      layout: config.layout ?? 'list',
      title: config.title,
      location: config.location,
      cover_image: coverImage || null,
      overview,
      sections,
      items,
      status: 'draft',
    });
    if (error) { fireToast('保存に失敗しました'); return; }
    setShowWizard(false);
    setActiveTab('hub');
    fireToast('下書きとして保存しました');
    fetchGuides();
  };

  const totalPaid    = DUMMY_EARNINGS.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
  const totalPending = DUMMY_EARNINGS.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

  return (
    <>
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
          <button
            onClick={() => setShowWizard(true)}
            className="text-xs font-semibold bg-primary text-white rounded-full px-4 py-1.5 hover:opacity-80 transition-opacity"
          >
            ガイドを作成する
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {activeTab === 'hub' ? (
            <>
              {/* CTA */}
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-3xl text-white font-light">＋</span>
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">あなたの体験をガイドにしよう</h2>
                <p className="text-muted text-sm mb-8 leading-relaxed">
                  あなたの留学・ワーホリ体験を共有して、<br />次の世代の旅人を助けましょう
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="bg-primary text-white font-semibold px-8 py-3 rounded-full hover:opacity-80 transition-opacity shadow-md"
                >
                  ガイドを作成する
                </button>
              </div>

              {/* 写真ストリップ */}
              <div className="flex gap-3 px-4 overflow-x-auto pb-6 scrollbar-hide">
                {INSPIRATION_PHOTOS.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className="flex-shrink-0 w-[280px] aspect-[304/347] object-cover rounded-2xl" />
                ))}
              </div>

              {/* 自分のガイド */}
              <div className="px-6 pb-8 max-w-3xl">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">あなたのガイド</h3>
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse" />)}
                  </div>
                ) : myGuides.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">まだガイドがありません。作成してみましょう！</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {myGuides.map(guide => {
                      const coverImg = guide.cover_image || getCoverImage(guide.location);
                      return (
                        <div key={guide.id} className="border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                          <div className="relative h-28 bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={coverImg} alt={guide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-primary line-clamp-1 mb-1">{guide.title}</h4>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted">📍 {guide.location || guide.category}</p>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${guide.statusColor}`}>{guide.status}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* 収益ダッシュボード */
            <div className="max-w-3xl mx-auto px-6 py-6">
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
                  <p className="text-2xl font-bold text-primary">{myGuides.filter(g => g.status === '公開中').length}</p>
                  <p className="text-xs text-muted mt-1">公開中のガイド</p>
                </div>
              </div>
              <div className="bg-white border border-border rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-primary mb-4">収益源の内訳</h3>
                {[
                  { emoji: '🤝', label: '紹介料',       amount: 5000, pct: 40 },
                  { emoji: '🔗', label: 'アフィリエイト', amount: 6000, pct: 48 },
                  { emoji: '📋', label: 'プラン販売',    amount: 1500, pct: 12 },
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

      {/* トースト通知 */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-[60] whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* ウィザードオーバーレイ */}
      {showWizard && (
        <GuideWizard
          onClose={() => setShowWizard(false)}
          onPublish={handlePublish}
          onSaveDraft={handleSaveDraft}
        />
      )}
    </>
  );
}

// ─── Wizard ───────────────────────────────────────────────────
type EditorCallback = (config: GuideConfig, coverImage: string, overview: string, sections: GuideSection[], items: GuideItem[]) => void;

function GuideWizard({
  onClose,
  onPublish,
  onSaveDraft,
}: {
  onClose: () => void;
  onPublish: EditorCallback;
  onSaveDraft: EditorCallback;
}) {
  const [step, setStep] = useState<WizardStep>(0);
  const [config, setConfig] = useState<GuideConfig>({
    category: null, layout: null, title: '', location: '', template: 'blank',
  });

  const progressPct = (step / 3) * 100;
  const canNext =
    step === 0 ? !!config.category :
    step === 1 ? !!config.layout :
    step === 2 ? !!config.title.trim() : false;

  const next = () => { if (step < 3) setStep(s => (s + 1) as WizardStep); };
  const back = () => { if (step === 0) onClose(); else setStep(s => (s - 1) as WizardStep); };

  if (step === 3) {
    return (
      <GuideEditor
        config={config}
        onBack={() => setStep(2)}
        onPublish={onPublish}
        onSaveDraft={onSaveDraft}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-16">
        {step === 0 && <StepCategory config={config} setConfig={setConfig} />}
        {step === 1 && <StepLayout   config={config} setConfig={setConfig} />}
        {step === 2 && <StepConfigure config={config} setConfig={setConfig} />}
      </div>

      {/* 下部ナビ */}
      <div className="flex-shrink-0">
        <div className="h-1 bg-gray-200">
          <div className="h-full bg-black transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex items-center justify-between px-4 sm:px-8 py-4">
          <button onClick={back} className="text-sm font-medium text-primary hover:opacity-60 transition-opacity">
            {step === 0 ? 'キャンセル' : '戻る'}
          </button>
          <button
            onClick={next}
            disabled={!canNext}
            className={`text-sm font-semibold px-6 py-2.5 rounded-full transition-all ${
              canNext ? 'bg-black text-white hover:opacity-80' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: カテゴリ ─────────────────────────────────────────
function StepCategory({ config, setConfig }: { config: GuideConfig; setConfig: (c: GuideConfig) => void }) {
  return (
    <div className="w-full max-w-lg">
      <h1 className="text-3xl font-bold text-center mb-10">どんなガイドを作りますか？</h1>
      <div className="flex flex-col gap-3">
        {GUIDE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setConfig({ ...config, category: cat.id })}
            className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all ${
              config.category === cat.id
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <span className="text-2xl flex-shrink-0">{cat.icon}</span>
            <div className="flex-1">
              <p className="text-base font-semibold text-primary">{cat.title}</p>
              <p className="text-sm text-muted">{cat.desc}</p>
            </div>
            {config.category === cat.id && (
              <span className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✓</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: レイアウト ────────────────────────────────────────
function StepLayout({ config, setConfig }: { config: GuideConfig; setConfig: (c: GuideConfig) => void }) {
  const layouts: { id: GuideLayout; label: string; desc: string; preview: React.ReactNode }[] = [
    {
      id: 'fullscreen',
      label: 'フルスクリーン',
      desc: '大きなカバー写真でインパクトのあるガイド',
      preview: (
        <div className="rounded-xl overflow-hidden h-44 bg-gradient-to-br from-sky-400 to-teal-300 relative">
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 inset-x-0 p-4">
            <div className="h-3 bg-white/80 rounded-full w-2/3 mb-2" />
            <div className="h-2 bg-white/50 rounded-full w-1/3" />
          </div>
        </div>
      ),
    },
    {
      id: 'list',
      label: 'リスト形式',
      desc: 'スポットを整理してリストで見せるガイド',
      preview: (
        <div className="rounded-xl overflow-hidden h-44 bg-white border border-gray-100 p-3 flex flex-col gap-2">
          <div className="h-16 bg-gray-100 rounded-lg flex-shrink-0" />
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full w-3/4 mb-1" />
                <div className="h-1.5 bg-gray-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-10">レイアウトを選んでください</h1>
      <div className="grid grid-cols-2 gap-5">
        {layouts.map(opt => (
          <button
            key={opt.id}
            onClick={() => setConfig({ ...config, layout: opt.id })}
            className={`text-left rounded-2xl border-2 p-4 transition-all ${
              config.layout === opt.id ? 'border-black' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {opt.preview}
            <p className="text-sm font-semibold text-primary mt-3">{opt.label}</p>
            <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: 設定 ─────────────────────────────────────────────
function StepConfigure({ config, setConfig }: { config: GuideConfig; setConfig: (c: GuideConfig) => void }) {
  const [userNotes, setUserNotes] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  const handleGenerateAI = async () => {
    if (!config.title.trim() || !config.category) return;
    setAiLoading(true);
    const res = await fetch('/api/guides/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: config.category,
        location: config.location,
        title: config.title,
        userNotes: userNotes.trim() || undefined,
      }),
    });
    const data = await res.json() as AiDraft & { error?: string };
    if (!data.error) {
      setConfig({ ...config, aiDraft: { overview: data.overview, sections: data.sections, items: data.items } });
      setAiGenerated(true);
    }
    setAiLoading(false);
  };

  return (
    <div className="w-full max-w-lg">
      <h1 className="text-3xl font-bold text-center mb-2">ガイドを設定する</h1>
      <p className="text-center text-muted text-sm mb-10">タイトル・場所を入力して AI に下書きを作ってもらいましょう</p>

      {/* タイトル */}
      <div className="mb-6">
        <label className="text-sm font-bold text-primary block mb-2">タイトル</label>
        <div className="relative">
          <input
            type="text"
            value={config.title}
            onChange={e => setConfig({ ...config, title: e.target.value })}
            placeholder="例：シドニーのおすすめ語学学校5選"
            className={`w-full border-2 rounded-full px-5 py-3 text-sm text-primary placeholder:text-muted outline-none transition-colors ${
              config.title ? 'border-black' : 'border-gray-300 focus:border-gray-500'
            }`}
          />
          {config.title && (
            <button onClick={() => setConfig({ ...config, title: '' })} className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs">×</button>
          )}
        </div>
      </div>

      {/* 場所 */}
      <div className="mb-6">
        <label className="text-sm font-bold text-primary block mb-2">場所</label>
        <input
          type="text"
          value={config.location}
          onChange={e => setConfig({ ...config, location: e.target.value })}
          placeholder="例：シドニー・オーストラリア"
          className="w-full border-2 border-gray-200 rounded-full px-5 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-gray-500 transition-colors"
        />
      </div>

      {/* AI 補助 */}
      <div className="border-2 border-primary/20 rounded-2xl p-5 bg-primary/5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✨</span>
          <p className="text-sm font-bold text-primary">AI 下書き生成</p>
          {aiGenerated && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">生成済み</span>}
        </div>
        <p className="text-xs text-muted mb-3">あなたの体験やメモを入力すると、AI がガイドの下書きを自動生成します（任意）</p>
        <textarea
          value={userNotes}
          onChange={e => setUserNotes(e.target.value)}
          placeholder={`例：3ヶ月間${config.location || 'シドニー'}に滞在して語学学校に通いました。日本人が少なくて英語環境が良かった…`}
          rows={3}
          className="w-full border border-primary/20 rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary resize-none bg-white mb-3"
        />
        <button
          onClick={handleGenerateAI}
          disabled={!config.title.trim() || aiLoading}
          className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
        >
          {aiLoading ? (
            <><span className="animate-spin inline-block">⏳</span> 生成中...</>
          ) : (
            <><span>✨</span> {aiGenerated ? 'もう一度生成する' : 'AI で下書きを生成する'}</>
          )}
        </button>
      </div>

      {aiGenerated && config.aiDraft && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm font-semibold text-emerald-700">✓ 下書きが準備できました</p>
          <p className="text-xs text-emerald-600 mt-0.5">「次へ」を押してエディターで編集・公開できます</p>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: エディター ────────────────────────────────────────
function GuideEditor({
  config,
  onBack,
  onPublish,
  onSaveDraft,
}: {
  config: GuideConfig;
  onBack: () => void;
  onPublish: EditorCallback;
  onSaveDraft: EditorCallback;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'map'>('overview');
  const [overview, setOverview] = useState(config.aiDraft?.overview ?? '');
  const [sections, setSections] = useState<GuideSection[]>(config.aiDraft?.sections ?? []);
  const [items, setItems] = useState<GuideItem[]>(config.aiDraft?.items ?? []);
  const [aiLoading, setAiLoading] = useState(false);

  // カバー画像（ライブラリから自動マッチング）
  const initialPhotos = findPhotos(config.title, config.location, config.category ?? '');
  const [coverImage, setCoverImage] = useState(initialPhotos[0]?.url ?? getCoverImage(config.location));
  const [photoOptions, setPhotoOptions] = useState<{ url: string; credit: string }[]>(initialPhotos);
  const [showPhotoSelector, setShowPhotoSelector] = useState(initialPhotos.length > 0);

  const refreshPhotos = () => {
    const photos = findPhotos(config.title, config.location, config.category ?? '');
    setPhotoOptions(photos);
    if (photos.length > 0) setCoverImage(photos[0].url);
    setShowPhotoSelector(true);
  };

  const handleRegenerate = async () => {
    setAiLoading(true);
    refreshPhotos(); // 即時・同期（APIなし）
    const res = await fetch('/api/guides/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: config.category, location: config.location, title: config.title }),
    });
    const data = await res.json() as AiDraft & { error?: string };
    if (!data.error) {
      setOverview(data.overview ?? '');
      setSections(data.sections ?? []);
      setItems(data.items ?? []);
    }
    setAiLoading(false);
  };

  const updateSection = (id: string, field: keyof GuideSection, value: string) =>
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const removeSection = (id: string) => setSections(prev => prev.filter(s => s.id !== id));

  const addSection = () => setSections(prev => [...prev, { id: Date.now().toString(), title: '新しいセクション', content: '' }]);

  const updateItem = (id: string, field: keyof GuideItem, value: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), name: '', description: '', tip: '' }]);

  const hasContent = overview || sections.length > 0 || items.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* トップバー */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 sm:px-6 py-3 gap-2 z-10 flex-shrink-0">
        <button onClick={onBack} className="text-sm text-muted hover:text-primary transition-colors flex-shrink-0">← 戻る</button>
        <span className="text-sm font-semibold flex-1 truncate min-w-0">{config.title || '無題のガイド'}</span>
        <button
          onClick={handleRegenerate}
          disabled={aiLoading}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-medium border border-primary/30 text-primary rounded-full px-3 py-1.5 hover:bg-primary/5 transition-colors disabled:opacity-40"
        >
          {aiLoading ? '⏳' : '✨'} AI再生成
        </button>
        <button onClick={() => onSaveDraft(config, coverImage, overview, sections, items)} className="flex-shrink-0 text-xs font-medium border border-border rounded-full px-3 py-1.5 hover:border-primary/40 transition-colors">
          下書き
        </button>
        <button onClick={() => onPublish(config, coverImage, overview, sections, items)} className="flex-shrink-0 text-xs font-semibold bg-black text-white rounded-full px-4 py-1.5 hover:opacity-80 transition-opacity">
          公開する
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* カバー写真 */}
        <div className="relative h-52 sm:h-72 flex-shrink-0 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt="" className="w-full h-full object-cover transition-opacity duration-300" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow">{config.title || '無題のガイド'}</h1>
            {config.location && <p className="text-sm opacity-80">📍 {config.location}</p>}
          </div>
          {/* 写真変更ボタン */}
          <button
            onClick={() => setShowPhotoSelector(v => !v)}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-white transition-colors shadow"
          >
            📷 写真を選ぶ
          </button>
        </div>

        {/* 写真セレクター */}
        {showPhotoSelector && (
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted">📸 タイトル・場所から選んだ候補（{photoOptions.length}件）</p>
              <button onClick={() => setShowPhotoSelector(false)} className="text-xs text-muted hover:text-primary">閉じる</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {photoOptions.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setCoverImage(photo.url); setShowPhotoSelector(false); }}
                  className={`flex-shrink-0 relative w-32 h-20 rounded-xl overflow-hidden border-2 transition-all hover:opacity-90 ${coverImage === photo.url ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-white/60'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  {coverImage === photo.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">✓</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1 py-0.5">
                    <p className="text-[8px] text-white/70 truncate">📷 {photo.credit}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* タブ */}
        <div className="border-b border-gray-100 px-4 sm:px-8 flex-shrink-0 bg-white sticky top-0 z-[5]">
          <div className="flex gap-5">
            {(['overview', 'map'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-black text-primary' : 'border-transparent text-muted hover:text-primary'}`}>
                {tab === 'overview' ? '内容を編集' : 'マップ'}
              </button>
            ))}
          </div>
        </div>

        {/* 概要タブ */}
        {activeTab === 'overview' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 w-full">
            {/* AI 未生成の場合のバナー */}
            {!hasContent && (
              <div className="mb-6 bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
                <p className="text-sm font-semibold text-primary mb-1">✨ AI で下書きを生成しましょう</p>
                <p className="text-xs text-muted mb-3">Step 3 で AI 生成をスキップした場合でも、ここから生成できます</p>
                <button onClick={handleRegenerate} disabled={aiLoading}
                  className="bg-primary text-white text-sm font-semibold px-6 py-2 rounded-full disabled:opacity-40 hover:opacity-80 transition-opacity">
                  {aiLoading ? '⏳ 生成中...' : '✨ AI で下書きを生成'}
                </button>
              </div>
            )}

            {aiLoading && (
              <div className="flex flex-col items-center py-12 gap-3">
                <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}</div>
                <p className="text-sm text-muted">AI がガイドを生成中...</p>
              </div>
            )}

            {!aiLoading && (
              <>
                {/* 概要 */}
                <div className="mb-8">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-2">概要</label>
                  <textarea
                    value={overview}
                    onChange={e => setOverview(e.target.value)}
                    placeholder="ガイドの導入文を入力してください..."
                    rows={4}
                    className="w-full text-sm text-primary resize-none outline-none placeholder:text-gray-300 leading-relaxed border border-transparent focus:border-primary/30 rounded-xl px-1 py-1 transition-colors"
                  />
                </div>

                {/* セクション */}
                {sections.length > 0 && (
                  <div className="mb-8 flex flex-col gap-5">
                    {sections.map(section => (
                      <div key={section.id} className="group border border-transparent hover:border-primary/20 rounded-2xl p-3 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            value={section.title}
                            onChange={e => updateSection(section.id, 'title', e.target.value)}
                            className="flex-1 text-base font-bold text-primary outline-none bg-transparent border-b border-transparent focus:border-primary/40 pb-0.5 transition-colors"
                          />
                          <button onClick={() => removeSection(section.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all text-sm">✕</button>
                        </div>
                        <textarea
                          value={section.content}
                          onChange={e => updateSection(section.id, 'content', e.target.value)}
                          rows={3}
                          className="w-full text-sm text-muted resize-none outline-none leading-relaxed placeholder:text-gray-300"
                          placeholder="内容を入力..."
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* アイテム */}
                {items.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                      {config.category === '学校' ? '紹介する学校' : config.category === '店舗' ? '紹介するお店' : 'おすすめスポット'}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {items.map((item, idx) => (
                        <div key={item.id} className="group border border-border rounded-2xl p-4 hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{idx + 1}</span>
                            <input
                              value={item.name}
                              onChange={e => updateItem(item.id, 'name', e.target.value)}
                              placeholder="名前・タイトル"
                              className="flex-1 text-sm font-semibold text-primary outline-none bg-transparent"
                            />
                            <button onClick={() => removeItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all text-xs">✕</button>
                          </div>
                          <textarea
                            value={item.description}
                            onChange={e => updateItem(item.id, 'description', e.target.value)}
                            placeholder="説明..."
                            rows={2}
                            className="w-full text-xs text-muted resize-none outline-none leading-relaxed mb-2"
                          />
                          {item.tip !== undefined && (
                            <div className="flex items-start gap-1.5">
                              <span className="text-amber-500 text-xs flex-shrink-0">💡</span>
                              <input
                                value={item.tip}
                                onChange={e => updateItem(item.id, 'tip', e.target.value)}
                                placeholder="ポイント・Tip"
                                className="flex-1 text-xs text-amber-700 outline-none bg-transparent"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* アクション */}
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                  <button onClick={addSection} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors py-1">
                    <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-base leading-none">+</span>
                    セクションを追加
                  </button>
                  <button onClick={addItem} className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors py-1">
                    <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-base leading-none">+</span>
                    アイテムを追加
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* マップタブ */}
        {activeTab === 'map' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 w-full">
            <h3 className="text-base font-bold text-primary mb-1">マップ</h3>
            {config.location && <p className="text-xs text-muted mb-4">📍 {config.location}</p>}
            <div className="w-full h-72 bg-gray-100 rounded-2xl overflow-hidden">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(config.location || 'Tokyo')}&output=embed&z=12`}
                className="w-full h-full border-0"
                title="map"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
