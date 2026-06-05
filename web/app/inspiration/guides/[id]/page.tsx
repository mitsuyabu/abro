'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface GuideSection { id: string; title: string; content: string; }
interface GuideItem    { id: string; name: string; description: string; tip?: string; }

interface Guide {
  id: string;
  user_id: string;
  category: string;
  title: string;
  location: string;
  cover_image: string | null;
  overview: string | null;
  sections: GuideSection[];
  items: GuideItem[];
  status: string;
  created_at: string;
  author_nickname?: string | null;
  author_phase?: string | null;
}

const PHASE_LABELS: Record<string, string> = {
  preparing: '準備中', abroad: '渡航中', returned: '帰国済', considering: '検討中',
};
const PHASE_COLORS: Record<string, string> = {
  preparing: 'bg-blue-100 text-blue-700',
  abroad: 'bg-emerald-100 text-emerald-700',
  returned: 'bg-violet-100 text-violet-700',
  considering: 'bg-gray-100 text-gray-600',
};
const CATEGORY_EMOJI: Record<string, string> = {
  '学校': '🏫', '店舗': '🏪', '場所': '📍', '体験': '✨', 'ガイド': '📖',
};
const COUNT_UNIT: Record<string, string> = {
  '学校': '学校', '店舗': '店舗', '場所': 'スポット', '体験': '体験',
};

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'map'>('overview');

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    supabase.from('guides').select('*').eq('id', id).single().then(async ({ data }) => {
      if (!data) { setLoading(false); return; }
      const { data: userData } = await supabase.from('users').select('id, nickname, phase').eq('id', data.user_id).single();
      setGuide({
        ...data,
        sections: (data.sections as GuideSection[]) ?? [],
        items: (data.items as GuideItem[]) ?? [],
        author_nickname: userData?.nickname ?? null,
        author_phase: userData?.phase ?? null,
      });
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}</div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted text-lg">ガイドが見つかりません</p>
        <Link href="/inspiration" className="text-primary text-sm font-semibold">← インスピレーションに戻る</Link>
      </div>
    );
  }

  const coverImg = guide.cover_image ?? 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80';
  const itemCount = guide.items.length;
  const countUnit = COUNT_UNIT[guide.category] ?? 'アイテム';
  const catEmoji = CATEGORY_EMOJI[guide.category] ?? '📖';

  return (
    <div className="h-full overflow-y-auto bg-gray-50 relative">

      {/* ── ヒーロー画像 ─────────────────────────────────────── */}
      <div className="relative h-[55vw] max-h-80 min-h-52 w-full flex-shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImg} alt={guide.title} className="w-full h-full object-cover" />
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* 戻るボタン */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-black/60 transition-colors"
        >
          ← 戻る
        </button>

        {/* 保存ボタン */}
        <button
          onClick={() => setSaved(v => !v)}
          className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-lg backdrop-blur-md transition-all ${
            saved ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
          }`}
        >
          {saved ? '♥' : '♡'}
        </button>

        {/* タイトルオーバーレイ */}
        <div className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-8">
          <h1 className="text-white text-2xl sm:text-3xl font-bold leading-snug drop-shadow-lg">{guide.title}</h1>
          {guide.location && (
            <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
              <span>📍</span>{guide.location}
            </p>
          )}
        </div>
      </div>

      {/* ── コンテンツカード（ヒーローに重なって滑り上がる） ───── */}
      <div className="relative -mt-4 rounded-t-3xl bg-white shadow-sm overflow-hidden">

        {/* カテゴリ・カウントチップ */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
            {catEmoji} {guide.category}
          </span>
          {itemCount > 0 && (
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {itemCount} {countUnit}
            </span>
          )}
          <span className="text-xs text-muted ml-auto">
            {new Date(guide.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* 著者 */}
        <div className="mx-5 mb-4 flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-base flex-shrink-0">👤</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary truncate">{guide.author_nickname ?? 'ユーザー'}</p>
            <p className="text-[11px] text-muted">ガイド作成者</p>
          </div>
          {guide.author_phase && (
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${PHASE_COLORS[guide.author_phase] ?? 'bg-gray-100 text-gray-600'}`}>
              {PHASE_LABELS[guide.author_phase]}
            </span>
          )}
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-100 px-5">
          {(['overview', 'map'] as const).map(t => (
            <button key={t} onClick={() => setActiveSection(t)}
              className={`pb-3 pr-6 text-sm font-semibold border-b-2 transition-colors ${
                activeSection === t ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-primary'
              }`}>
              {t === 'overview' ? '内容' : 'マップ'}
            </button>
          ))}
        </div>

        {/* ── 内容タブ ────────────────────── */}
        {activeSection === 'overview' && (
          <div className="px-5 py-5 flex flex-col gap-6">

            {/* 概要 */}
            {guide.overview && (
              <p className="text-sm text-gray-700 leading-relaxed">{guide.overview}</p>
            )}

            {/* セクション */}
            {guide.sections.map(section => (
              <div key={section.id}>
                <h2 className="text-base font-bold text-primary mb-2">{section.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}

            {/* アイテム一覧 */}
            {guide.items.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-primary mb-3">
                  {catEmoji} {guide.category === '学校' ? '紹介する学校' : guide.category === '店舗' ? '紹介するお店' : 'おすすめスポット'}
                </h2>
                <div className="flex flex-col gap-3">
                  {guide.items.map((item, i) => (
                    <div key={item.id}
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      {/* 番号 + 名前 */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm font-bold text-primary leading-snug">{item.name}</p>
                      </div>
                      {/* 説明 */}
                      {item.description && (
                        <p className="text-xs text-gray-600 leading-relaxed pl-11">{item.description}</p>
                      )}
                      {/* Tip */}
                      {item.tip && (
                        <div className="mt-2 ml-11 flex items-start gap-1.5 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                          <span className="text-amber-500 text-xs flex-shrink-0 mt-0.5">💡</span>
                          <p className="text-xs text-amber-800 leading-relaxed">{item.tip}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!guide.overview && guide.sections.length === 0 && guide.items.length === 0 && (
              <div className="py-16 text-center">
                <span className="text-4xl block mb-3">📝</span>
                <p className="text-muted text-sm">まだコンテンツがありません</p>
              </div>
            )}
          </div>
        )}

        {/* ── マップタブ ───────────────────── */}
        {activeSection === 'map' && (
          <div className="px-5 py-5">
            <div className="w-full h-72 bg-gray-100 rounded-2xl overflow-hidden">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(guide.location || guide.title)}&output=embed&z=13`}
                className="w-full h-full border-0"
                title="map"
              />
            </div>
            {guide.location && (
              <a
                href={`https://maps.google.com/maps?q=${encodeURIComponent(guide.location)}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-primary border border-primary/30 rounded-2xl py-3 hover:bg-primary/5 transition-colors"
              >
                <span>🗺</span> Google マップで開く
              </a>
            )}
          </div>
        )}

        {/* 下部余白（固定ボタン分） */}
        <div className="h-24" />
      </div>

      {/* ── 固定 CTA ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 px-5 py-3 pb-safe flex gap-3 z-30">
        <Link
          href="/chat"
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-bold py-3.5 rounded-2xl hover:opacity-80 transition-opacity shadow-lg"
        >
          <span>✨</span> このガイドを参考に相談する
        </Link>
        <button
          onClick={() => setSaved(v => !v)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl border-2 transition-all ${
            saved ? 'bg-red-50 border-red-300 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:border-primary hover:text-primary'
          }`}
        >
          {saved ? '♥' : '♡'}
        </button>
      </div>

      {/* デスクトップ用固定ボタン */}
      <div className="hidden md:block fixed bottom-6 right-6 z-30">
        <Link
          href="/chat"
          className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-6 py-3.5 rounded-2xl hover:opacity-80 transition-opacity shadow-lg"
        >
          <span>✨</span> このガイドを参考に相談する
        </Link>
      </div>
    </div>
  );
}
