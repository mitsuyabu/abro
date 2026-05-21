'use client';

import { useState } from 'react';

// ─── Hub types ───────────────────────────────────────────────
type HubTab = 'hub' | 'earnings';

// ─── Wizard types ─────────────────────────────────────────────
type WizardStep = 0 | 1 | 2 | 3;
type GuideCategory = '学校' | '店舗' | '場所' | '体験';
type GuideLayout = 'fullscreen' | 'list';
type GuideTemplate = 'blank' | 'list' | 'itinerary';

interface GuideConfig {
  category: GuideCategory | null;
  layout: GuideLayout | null;
  title: string;
  location: string;
  template: GuideTemplate;
}

interface GuideEntry {
  id: string;
  title: string;
  count: number;
  countUnit: string;
  status: '公開中' | '下書き' | '非公開';
  statusColor: string;
  image: string;
}

// ─── Hub data ─────────────────────────────────────────────────
// オーストラリアの都市のみ：シドニー・メルボルン・ゴールドコースト・ブリスベン
const INSPIRATION_PHOTOS = [
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80',
  'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  'https://images.unsplash.com/photo-1524820801657-fd59673fbb05?w=400&q=80',
];

const INITIAL_GUIDES: GuideEntry[] = [
  { id: '1', title: 'シドニーワーホリ完全ガイド', count: 24, countUnit: 'スポット', status: '公開中', statusColor: 'bg-green-100 text-green-700', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80' },
];

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

function makeGuideEntry(config: GuideConfig, status: GuideEntry['status']): GuideEntry {
  return {
    id: Date.now().toString(),
    title: config.title,
    count: 0,
    countUnit: COUNT_UNIT[config.category ?? '場所'],
    status,
    statusColor: STATUS_COLOR[status],
    image: getCoverImage(config.location),
  };
}

// ─── Main page ────────────────────────────────────────────────
export default function CreatorPage() {
  const [activeTab, setActiveTab]   = useState<HubTab>('hub');
  const [showWizard, setShowWizard] = useState(false);
  const [myGuides, setMyGuides]     = useState<GuideEntry[]>(INITIAL_GUIDES);
  const [toast, setToast]           = useState<string | null>(null);

  const fireToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePublish = (config: GuideConfig) => {
    setMyGuides(prev => [makeGuideEntry(config, '公開中'), ...prev]);
    setShowWizard(false);
    setActiveTab('hub');
    fireToast('ガイドを公開しました！');
  };

  const handleSaveDraft = (config: GuideConfig) => {
    if (!config.title.trim()) { setShowWizard(false); return; }
    setMyGuides(prev => [makeGuideEntry(config, '下書き'), ...prev]);
    setShowWizard(false);
    setActiveTab('hub');
    fireToast('下書きとして保存しました');
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
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-3xl text-white font-light">＋</span>
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">美しいガイドを作ろう</h2>
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
              {myGuides.length > 0 && (
                <div className="px-6 pb-8 max-w-3xl">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">あなたのガイド</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {myGuides.map(guide => (
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
function GuideWizard({
  onClose,
  onPublish,
  onSaveDraft,
}: {
  onClose: () => void;
  onPublish: (config: GuideConfig) => void;
  onSaveDraft: (config: GuideConfig) => void;
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
        <div className="flex items-center justify-between px-8 py-4">
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
  const templates: { id: GuideTemplate; icon: string; label: string }[] = [
    { id: 'blank',     icon: '○', label: 'ブランク' },
    { id: 'list',      icon: '≡', label: 'リスト' },
    { id: 'itinerary', icon: '🗒', label: '旅程' },
  ];

  return (
    <div className="w-full max-w-lg">
      <h1 className="text-3xl font-bold text-center mb-2">ガイドを設定する</h1>
      <p className="text-center text-muted text-sm mb-10">タイトル・場所・テンプレートを入力してください</p>

      {/* タイトル */}
      <div className="mb-6">
        <label className="text-sm font-bold text-primary block mb-2">タイトル</label>
        <div className="relative">
          <input
            type="text"
            value={config.title}
            onChange={e => setConfig({ ...config, title: e.target.value })}
            placeholder="タイトルを入力してください"
            className={`w-full border-2 rounded-full px-5 py-3 text-sm text-primary placeholder:text-muted outline-none transition-colors ${
              config.title ? 'border-black' : 'border-gray-300 focus:border-gray-500'
            }`}
          />
          {config.title && (
            <button
              onClick={() => setConfig({ ...config, title: '' })}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 場所 */}
      <div className="mb-8">
        <label className="text-sm font-bold text-primary block mb-2">場所</label>
        <input
          type="text"
          value={config.location}
          onChange={e => setConfig({ ...config, location: e.target.value })}
          placeholder="場所を入力してください"
          className="w-full border-2 border-gray-200 rounded-full px-5 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-gray-500 transition-colors"
        />
      </div>

      {/* テンプレート */}
      <div>
        <label className="text-sm font-bold text-primary block mb-3">テンプレート</label>
        <div className="grid grid-cols-3 gap-3">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => setConfig({ ...config, template: t.id })}
              className={`flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 transition-all ${
                config.template === t.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-sm font-semibold text-primary">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
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
  onPublish: (config: GuideConfig) => void;
  onSaveDraft: (config: GuideConfig) => void;
}) {
  const coverImage = getCoverImage(config.location);
  const [activeTab, setActiveTab] = useState<'overview' | 'map'>('overview');
  const [summary, setSummary] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto">
      {/* トップバー */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-6 py-3 gap-3 z-10 flex-shrink-0">
        <button onClick={onBack} className="text-sm text-muted hover:text-primary transition-colors flex-shrink-0">
          ← 戻る
        </button>
        <span className="text-sm font-semibold flex-1 truncate">{config.title || '無題のガイド'}</span>
        <span className="text-xs bg-gray-100 text-muted px-2.5 py-1 rounded-full flex-shrink-0">下書き</span>
        <button
          onClick={() => onSaveDraft(config)}
          className="text-xs font-medium border border-border rounded-full px-3 py-1.5 hover:border-primary/40 transition-colors flex-shrink-0"
        >
          下書き保存
        </button>
        <button
          onClick={() => onPublish(config)}
          className="text-xs font-semibold bg-black text-white rounded-full px-4 py-1.5 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          公開する
        </button>
      </div>

      {/* カバー写真 */}
      <div className="relative h-64 sm:h-80 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-white transition-colors">
          ✏️ カバーを編集
        </button>
        <div className="absolute bottom-0 inset-x-0 p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2 drop-shadow">{config.title || '無題のガイド'}</h1>
          {config.location && <p className="text-sm opacity-80">📍 {config.location}</p>}
        </div>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-100 px-8 flex-shrink-0">
        <div className="flex gap-5">
          {(['overview', 'map'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-black text-primary' : 'border-transparent text-muted hover:text-primary'
              }`}
            >
              {tab === 'overview' ? '概要' : 'マップ'}
            </button>
          ))}
        </div>
      </div>

      {/* ボディ */}
      {activeTab === 'overview' ? (
        <div className="max-w-2xl mx-auto px-8 py-8 w-full">
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="概要を入力してください..."
            className="w-full text-sm text-primary resize-none outline-none min-h-[80px] placeholder:text-gray-300 leading-relaxed"
          />
          <div className="mt-8 pt-8 border-t border-gray-100">
            <button className="flex items-center gap-3 text-sm font-semibold text-primary hover:opacity-70 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xl flex-shrink-0">+</div>
              アイテムを追加
            </button>
          </div>

          {/* 著者 */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="text-base font-bold text-primary mb-4">著者について</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">👤</div>
              <div>
                <p className="text-sm font-semibold text-primary">あなた</p>
                <p className="text-xs text-muted">留学経験者</p>
              </div>
              <button className="ml-auto text-xs font-medium border border-border rounded-full px-3 py-1.5 hover:border-primary/40 transition-colors">
                プロフィールを見る
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-8 py-8 w-full">
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
  );
}
