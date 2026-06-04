'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface GuideSection { id: string; title: string; content: string; }
interface GuideItem { id: string; name: string; description: string; tip?: string; }

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
  abroad: 'bg-green-100 text-green-700',
  returned: 'bg-purple-100 text-purple-700',
  considering: 'bg-gray-100 text-gray-600',
};
const COUNT_UNIT: Record<string, string> = {
  '学校': '学校', '店舗': '店舗', '場所': 'スポット', '体験': '体験',
};

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'map'>('overview');

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    supabase.from('guides').select('*').eq('id', id).single().then(async ({ data }) => {
      if (!data) { setLoading(false); return; }
      const { data: userData } = await supabase
        .from('users').select('id, nickname, phase').eq('id', data.user_id).single();
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
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}</div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-muted">ガイドが見つかりません</p>
        <Link href="/inspiration" className="text-primary text-sm">← インスピレーションに戻る</Link>
      </div>
    );
  }

  const coverImg = guide.cover_image ?? 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80';
  const itemCount = guide.items.length;
  const countUnit = COUNT_UNIT[guide.category] ?? 'アイテム';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/inspiration" className="text-muted hover:text-primary transition-colors text-sm flex-shrink-0">←</Link>
        <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {guide.category}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* カバー */}
        <div className="relative h-56 sm:h-72 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImg} alt={guide.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 inset-x-0 p-6 text-white">
            {itemCount > 0 && (
              <span className="text-[11px] font-semibold bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full mb-2 inline-block">
                {itemCount} {countUnit}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold drop-shadow leading-snug">{guide.title}</h1>
            {guide.location && <p className="text-sm opacity-80 mt-1">📍 {guide.location}</p>}
          </div>
        </div>

        {/* 著者 */}
        <div className="bg-white border-b border-border px-5 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">👤</div>
          <div>
            <p className="text-xs font-semibold text-primary">{guide.author_nickname ?? 'ユーザー'}</p>
            <p className="text-[10px] text-muted">{new Date(guide.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })} 公開</p>
          </div>
          {guide.author_phase && (
            <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${PHASE_COLORS[guide.author_phase] ?? 'bg-gray-100 text-gray-600'}`}>
              {PHASE_LABELS[guide.author_phase]}
            </span>
          )}
        </div>

        {/* タブ */}
        <div className="bg-white border-b border-border px-4">
          <div className="flex gap-5">
            {(['overview', 'map'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-primary'}`}>
                {t === 'overview' ? '内容' : 'マップ'}
              </button>
            ))}
          </div>
        </div>

        {/* 概要タブ */}
        {activeTab === 'overview' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
            {/* 概要文 */}
            {guide.overview && (
              <div>
                <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{guide.overview}</p>
              </div>
            )}

            {/* セクション */}
            {guide.sections.map(section => (
              <div key={section.id}>
                <h2 className="text-base font-bold text-primary mb-2">{section.title}</h2>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}

            {/* アイテム */}
            {guide.items.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-primary mb-3">
                  {guide.category === '学校' ? '紹介する学校' : guide.category === '店舗' ? '紹介するお店' : 'おすすめスポット'}
                </h2>
                <div className="flex flex-col gap-3">
                  {guide.items.map((item, i) => (
                    <div key={item.id} className="border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{i + 1}</span>
                        <p className="text-sm font-bold text-primary">{item.name}</p>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted leading-relaxed mb-2">{item.description}</p>
                      )}
                      {item.tip && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-amber-500 text-xs flex-shrink-0">💡</span>
                          <p className="text-xs text-amber-700 leading-relaxed">{item.tip}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!guide.overview && guide.sections.length === 0 && guide.items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted text-sm">まだコンテンツがありません</p>
              </div>
            )}
          </div>
        )}

        {/* マップタブ */}
        {activeTab === 'map' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            <div className="w-full h-72 bg-gray-100 rounded-2xl overflow-hidden">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(guide.location || guide.title)}&output=embed&z=12`}
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
