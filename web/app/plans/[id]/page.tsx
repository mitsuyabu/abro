'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AgentContactModal } from '@/components/AgentContactModal';
import type { SchoolItem } from '@/components/chat/DynamicSidebar';
import type { User } from '@supabase/supabase-js';

type TaskStatus = 'none' | 'doing' | 'done';

interface CitySpot {
  id: string;
  name: string;
  rating?: number;
  address?: string;
  mapsUrl?: string;
  photoName?: string;
  category: 'tourist' | 'food' | 'daily' | 'nature' | 'weekend';
}

interface FirstWeekDay {
  day: string;
  highlight: string;
  tips: string;
  eats?: string[];
}

interface YearlyTrip {
  area: string;
  stay?: string;
  spots?: string;
  shops?: string;
}

interface YearlyMonth {
  month: string;
  title: string;
  detail: string;
  trip?: YearlyTrip;
}

interface RefPlanItem {
  id: string;
  title: string;
  destination_city: string | null;
  destination_country: string | null;
  duration_label?: string | null;
  purpose?: string | null;
}

interface BudgetItem { label: string; amount: number | null; }

interface PlanDetails {
  duration_label?: string;
  pre_departure?: Record<string, string>;
  timeline?: { period: string; tasks: string[] }[];
  timeline_status?: Record<string, TaskStatus>;
  first_week?: FirstWeekDay[];
  yearly_plan?: YearlyMonth[];
  city_spots?: CitySpot[];
  notes?: string[];
  saved_items?: { label: string; type: 'school' | 'city' | 'other' }[];
  ref_plans?: RefPlanItem[];
  cover_image_url?: string | null;
  budget_breakdown?: { items: BudgetItem[]; notes?: string };
}

interface Plan {
  id: string;
  user_id: string;
  title: string;
  destination_country: string | null;
  destination_city: string | null;
  duration_weeks: number | null;
  budget_jpy: number | null;
  budget_max_jpy: number | null;
  purpose: string | null;
  reason: string | null;
  initial_plan: string | null;
  status: string;
  details: PlanDetails | null;
  created_at: string;
}

const CITY_COVER: Record<string, string> = {
  シドニー: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1530276371031-2511efff9d5a.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTMwMjc2MzcxMDMxLTI1MTFlZmZmOWQ1YS5hdmlmIiwiaWF0IjoxNzc5MTc4MjM4LCJleHAiOjE4MTA3MTQyMzh9.7YZmpSpH8gMXHh3huHJabFDu4gshODOwZnCBvNEYn2U',
  メルボルン: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1514395462725-fb4566210144.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTE0Mzk1NDYyNzI1LWZiNDU2NjIxMDE0NC5hdmlmIiwiaWF0IjoxNzc5MTc3NjY1LCJleHAiOjE4MTA3MTM2NjV9.7yvlYrUzHDAAD_AQACsL6DpgLVJvvZTdUgZzNBvibLA',
  ブリスベン: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1589976567749-2f011d95ffec.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTg5OTc2NTY3NzQ5LTJmMDExZDk1ZmZlYy5hdmlmIiwiaWF0IjoxNzc5MTc4NDA3LCJleHAiOjE4MTA3MTQ0MDd9.Sf2jZikB9GAEzeWI6Yx0iaGH7KSRWeiSuEejGIyPA1s',
  ゴールドコースト: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1591701729564-3b5325d5a4bd.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTkxNzAxNzI5NTY0LTNiNTMyNWQ1YTRiZC5hdmlmIiwiaWF0IjoxNzc5MTc4NDI2LCJleHAiOjE4MTA3MTQ0MjZ9.dmCHZgfLr6uBg7RayDNFjybtBDTRiwXRfH6vrV0x7Is',
  ケアンズ: 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1598948485421-33a1655d3c18.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTk4OTQ4NDg1NDIxLTMzYTE2NTVkM2MxOC5hdmlmIiwiaWF0IjoxNzc5MTc4NDcxLCJleHAiOjE4MTA3MTQ0NzF9.GBddv1v8S2u_AxdDKHfUuqF7HqXNJgQfXoCa60THTLY',
};
const FALLBACK_COVER = 'https://gewdrphkuzpymfpwyndc.supabase.co/storage/v1/object/sign/city-images/photo-1530276371031-2511efff9d5a.avif?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV85YWQ2M2ZhNC0wZDU4LTRlODgtYWI1Zi01NDQzZDFkMWQ4OTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjaXR5LWltYWdlcy9waG90by0xNTMwMjc2MzcxMDMxLTI1MTFlZmZmOWQ1YS5hdmlmIiwiaWF0IjoxNzc5MTc4MjM4LCJleHAiOjE4MTA3MTQyMzh9.7YZmpSpH8gMXHh3huHJabFDu4gshODOwZnCBvNEYn2U';

const PURPOSE_LABEL: Record<string, string> = { study: '語学留学', workingholiday: 'ワーホリ', both: '留学＋ワーホリ' };
const PRE_LABELS: Record<string, string> = { visa: 'ビザ申請', school: '学校選び', accommodation: '住まい', insurance: '保険', flights: '航空券', local_preparation: '現地準備', job_search: '仕事探し', english_study: '英語学習' };
const PRE_ICONS: Record<string, string> = { visa: '📄', school: '🎓', accommodation: '🏠', insurance: '🛡️', flights: '✈️', local_preparation: '📱', job_search: '💼', english_study: '📚' };
const ITEM_TYPE_ICONS: Record<string, string> = { school: '🎓', city: '📍', other: '📌' };

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string; bg: string; text: string }> = {
  none:  { label: '未着手', dot: 'bg-gray-300',    bg: 'bg-gray-100',   text: 'text-gray-500'  },
  doing: { label: '準備中', dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700' },
  done:  { label: '完了',   dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700'},
};
const STATUS_ORDER: TaskStatus[] = ['none', 'doing', 'done'];

const DAY_COLORS = ['bg-primary', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];

// 各日のスポットカテゴリマッピング（0=到着日, 1=2日目... ）
const DAY_SPOT_CATS: (CitySpot['category'] | null)[] = [null, 'tourist', 'daily', null, 'food', 'tourist', 'nature'];

// キーワードからスポットカテゴリを推定（yearly_plan 用）
function guessSpotCat(text: string): CitySpot['category'] | null {
  if (/スーパー|食材|買い物|生活/.test(text))       return 'daily';
  if (/カフェ|ランチ|レストラン|食事|食べ/.test(text)) return 'food';
  if (/観光|スポット|ランドマーク|見どころ/.test(text)) return 'tourist';
  if (/ビーチ|公園|自然|アウトドア/.test(text))       return 'nature';
  if (/旅行|小旅行|週末|day trip/.test(text))         return 'weekend';
  return null;
}

const PURPOSE_LABEL_MAP: Record<string, string> = {
  study: '語学留学', workingholiday: 'ワーホリ', both: '留学＋ワーホリ',
};

function RefPlanPickerModal({
  currentPlanId,
  addedIds,
  onAdd,
  onClose,
}: {
  currentPlanId: string;
  addedIds: Set<string>;
  onAdd: (plan: RefPlanItem) => void;
  onClose: () => void;
}) {
  const [publicPlans, setPublicPlans] = useState<RefPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('plans')
      .select('id, title, destination_city, destination_country, purpose, details')
      .eq('status', 'public')
      .neq('id', currentPlanId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setPublicPlans((data ?? []).map(p => ({
          id: p.id,
          title: p.title,
          destination_city: p.destination_city,
          destination_country: p.destination_country,
          duration_label: (p.details as { duration_label?: string } | null)?.duration_label ?? null,
          purpose: p.purpose,
        })));
        setLoading(false);
      });
  }, [currentPlanId]);

  const filtered = publicPlans.filter(p =>
    !search ||
    p.title.includes(search) ||
    (p.destination_city ?? '').includes(search) ||
    (p.destination_country ?? '').includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-primary">参考プランを追加</h2>
          <p className="text-[11px] text-muted mt-0.5">他のユーザーの公開プランを参考として追加できます</p>
        </div>
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="都市名・タイトルで検索"
              className="w-full border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-10 flex justify-center">
              <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted">{search ? '検索結果がありません' : 'まだ公開プランがありません'}</p>
            </div>
          ) : (
            filtered.map(p => {
              const isAdded = addedIds.has(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-border/40 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{p.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {(p.destination_city ?? p.destination_country) && (
                        <span className="text-[10px] text-muted">📍 {p.destination_city ?? p.destination_country}</span>
                      )}
                      {p.duration_label && <span className="text-[10px] text-muted">· {p.duration_label}</span>}
                      {p.purpose && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                          {PURPOSE_LABEL_MAP[p.purpose] ?? p.purpose}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => !isAdded && onAdd(p)}
                    disabled={isAdded}
                    className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      isAdded
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
                        : 'bg-primary text-white border-primary hover:opacity-80'
                    }`}
                  >
                    {isAdded ? '✓ 追加済み' : '追加'}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-border text-sm text-muted hover:bg-gray-50 transition-colors">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function SchoolDetailModal({ school, onClose }: { school: SchoolItem; onClose: () => void }) {
  const photos = school.google_photos?.length ? school.google_photos : (school.images ?? []);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white text-sm hover:bg-black/60 transition-colors"
        >
          ✕
        </button>
        {photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photos[0]} alt={school.name} className="w-full h-52 object-cover flex-shrink-0" />
        ) : (
          <div className="h-24 bg-gray-100 flex items-center justify-center text-5xl flex-shrink-0">🎓</div>
        )}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-bold text-primary leading-snug">{school.name}</h2>
                {school.is_partner && (
                  <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full flex-shrink-0">提携校</span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">{school.city} · {school.type}</p>
            </div>
            {school.fee_per_week != null && (
              <div className="flex-shrink-0 text-right">
                <p className="text-base font-bold text-primary">¥{school.fee_per_week.toLocaleString()}</p>
                <p className="text-[10px] text-muted">/週</p>
              </div>
            )}
          </div>
          {school.rating != null && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-amber-500 font-bold text-sm">★ {Number(school.rating).toFixed(1)}</span>
              {school.review_count != null && (
                <span className="text-xs text-muted">({Number(school.review_count).toLocaleString()}件)</span>
              )}
            </div>
          )}
          {school.description && (
            <p className="text-sm text-muted leading-relaxed mt-3">{school.description}</p>
          )}
          {school.google_reviews && school.google_reviews.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">レビュー</p>
              <div className="flex flex-col gap-2">
                {school.google_reviews.slice(0, 3).map((review, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-amber-500 text-xs">{'★'.repeat(review.rating)}</span>
                      <span className="text-[10px] text-muted">{review.author}</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed line-clamp-3">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {photos.length > 1 && (
            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {photos.slice(1).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="flex-shrink-0 w-24 h-16 object-cover rounded-xl" />
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 px-5 py-4 border-t border-border flex gap-2">
          {school.website ? (
            <a
              href={school.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-primary text-white text-sm font-semibold py-3 rounded-xl text-center hover:opacity-80 transition-opacity"
            >
              公式サイトを見る →
            </a>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={onClose}
            className="flex-shrink-0 px-5 py-3 rounded-xl border border-border text-sm text-muted hover:bg-gray-50 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function SchoolSavedCard({ school, onTap, onRemove }: { school: SchoolItem; onTap: () => void; onRemove: () => void }) {
  const photo = school.google_photos?.[0] ?? school.images?.[0];
  return (
    <div className="flex-shrink-0 w-56 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <button onClick={onTap} className="w-full text-left block">
        <div className="relative h-32 bg-gray-100">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={school.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🎓</div>
          )}
          {school.is_partner && (
            <span className="absolute top-2 left-2 text-[9px] bg-primary text-white px-2 py-0.5 rounded-full">提携校</span>
          )}
          {school.rating != null && (
            <span className="absolute top-2 right-2 text-[11px] font-semibold bg-white/90 px-2 py-0.5 rounded-full text-amber-500">
              ★ {Number(school.rating).toFixed(1)}
            </span>
          )}
        </div>
        <div className="p-3 pb-2">
          <p className="text-xs font-bold text-primary leading-snug line-clamp-2">{school.name}</p>
          <p className="text-[10px] text-muted mt-0.5">{school.city} · {school.type}</p>
          {school.fee_per_week != null && (
            <p className="text-sm font-bold text-primary mt-1">
              ¥{school.fee_per_week.toLocaleString()}<span className="text-[10px] font-normal text-muted">/週</span>
            </p>
          )}
        </div>
      </button>
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={onTap}
          className="flex-1 bg-primary/10 text-primary text-[11px] font-semibold py-1.5 rounded-xl text-center hover:bg-primary hover:text-white transition-all"
        >
          詳しく見る →
        </button>
        <button
          onClick={onRemove}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border border-border text-muted hover:border-red-300 hover:text-red-400 transition-all text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function SpotCards({ spots }: { spots: CitySpot[] }) {
  if (spots.length === 0) return null;
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {spots.slice(0, 4).map(spot => (
        <a
          key={spot.id}
          href={spot.mapsUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 group rounded-xl border border-border bg-white hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden w-36"
        >
          {spot.photoName ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/api/place-photo?name=${encodeURIComponent(spot.photoName)}`}
              alt={spot.name}
              className="w-full h-20 object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-20 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-2xl">
              {spot.category === 'food' ? '🍽️' : spot.category === 'daily' ? '🛒' : spot.category === 'nature' ? '🌿' : spot.category === 'weekend' ? '🚗' : '📍'}
            </div>
          )}
          <div className="px-2 py-1.5">
            <p className="text-[11px] font-semibold text-primary leading-tight line-clamp-2">{spot.name}</p>
            {spot.rating != null && (
              <p className="text-[10px] text-amber-500 font-medium mt-0.5">★ {spot.rating.toFixed(1)}</p>
            )}
            <p className="text-[9px] text-primary/50 mt-0.5 font-medium group-hover:text-primary transition-colors">地図で見る →</p>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function PlanDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // タイトル編集
  const [titleEditing, setTitleEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // タイムラインステータス
  const [timelineStatus, setTimelineStatus] = useState<Record<string, TaskStatus>>({});

  // カスタマイズ
  const [notes, setNotes] = useState<string[]>([]);
  const [savedItems, setSavedItems] = useState<{ label: string; type: 'school' | 'city' | 'other' }[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemType, setNewItemType] = useState<'school' | 'city' | 'other'>('other');

  // 学校データ + 詳細モーダル
  const [allSchools, setAllSchools] = useState<SchoolItem[]>([]);
  const [focusedSchool, setFocusedSchool] = useState<SchoolItem | null>(null);

  // 参考プラン
  const [refPlans, setRefPlans] = useState<RefPlanItem[]>([]);
  const [showRefPicker, setShowRefPicker] = useState(false);

  // カバー画像
  const [coverUploading, setCoverUploading] = useState(false);

  // 費用内訳
  const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
    { label: '航空券', amount: null },
    { label: '語学学校', amount: null },
    { label: '宿泊費', amount: null },
    { label: '生活費', amount: null },
    { label: '海外保険', amount: null },
    { label: 'ビザ申請費', amount: null },
    { label: 'その他', amount: null },
  ];
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(DEFAULT_BUDGET_ITEMS);
  const [budgetNotes, setBudgetNotes] = useState('');
  const [budgetSaving, setBudgetSaving] = useState(false);

  // エージェントモーダル
  const [showAgentModal, setShowAgentModal] = useState(false);

  // 再提案
  const [showRegenForm, setShowRegenForm] = useState(false);
  const [additionalRequest, setAdditionalRequest] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // トースト
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!id) return;
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
    supabase.from('plans').select('*').eq('id', id).single().then(({ data }) => {
      const p = data as Plan;
      setPlan(p);
      setNotes(p?.details?.notes ?? []);
      setSavedItems(p?.details?.saved_items ?? []);
      setRefPlans(p?.details?.ref_plans ?? []);
      setTimelineStatus(p?.details?.timeline_status ?? {});
      if (p?.details?.budget_breakdown) {
        setBudgetItems(p.details.budget_breakdown.items ?? DEFAULT_BUDGET_ITEMS);
        setBudgetNotes(p.details.budget_breakdown.notes ?? '');
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    fetch('/api/schools').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAllSchools(data);
    }).catch(() => {/* ignore */});
  }, []);

  useEffect(() => {
    if (titleEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [titleEditing]);

  const persistDetails = async (partial: Partial<PlanDetails>) => {
    const current = plan?.details ?? {};
    const merged = { ...current, ...partial };
    await supabase.from('plans').update({ details: merged }).eq('id', id);
    setPlan(prev => prev ? { ...prev, details: merged } : prev);
  };

  const handleToggleStatus = async () => {
    if (!plan) return;
    const newStatus = plan.status === 'public' ? 'private' : 'public';
    await supabase.from('plans').update({ status: newStatus }).eq('id', id);
    setPlan(prev => prev ? { ...prev, status: newStatus } : prev);
    fireToast(newStatus === 'public' ? '🌏 プランを公開しました' : '🔒 プランを非公開にしました');
  };

  const handleSaveBudget = async () => {
    setBudgetSaving(true);
    await persistDetails({ budget_breakdown: { items: budgetItems, notes: budgetNotes } });
    setBudgetSaving(false);
    fireToast('費用を保存しました');
  };

  const handleCoverUpload = async (file: File) => {
    if (!plan || coverUploading) return;
    setCoverUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('planId', plan.id);
    const res = await fetch('/api/upload/plan-cover', { method: 'POST', body: form });
    const json = await res.json() as { url?: string; error?: string };
    if (json.url) {
      await persistDetails({ cover_image_url: json.url });
      fireToast('カバー画像を更新しました');
    } else {
      fireToast(json.error ?? 'アップロードに失敗しました');
    }
    setCoverUploading(false);
  };

  const updateTitle = async () => {
    const t = editedTitle.trim();
    if (!t || t === plan?.title) { setTitleEditing(false); return; }
    await supabase.from('plans').update({ title: t }).eq('id', id);
    setPlan(prev => prev ? { ...prev, title: t } : prev);
    setTitleEditing(false);
    fireToast('タイトルを更新しました');
  };

  const cycleTaskStatus = async (key: string) => {
    const current = timelineStatus[key] ?? 'none';
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
    const updated = { ...timelineStatus, [key]: next };
    setTimelineStatus(updated);
    await persistDetails({ timeline_status: updated });
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const updated = [...notes, newNote.trim()];
    setNotes(updated);
    setNewNote('');
    await persistDetails({ notes: updated });
  };

  const removeNote = async (idx: number) => {
    const updated = notes.filter((_, i) => i !== idx);
    setNotes(updated);
    await persistDetails({ notes: updated });
  };

  const addSavedItem = async () => {
    if (!newItemLabel.trim()) return;
    const updated = [...savedItems, { label: newItemLabel.trim(), type: newItemType }];
    setSavedItems(updated);
    setNewItemLabel('');
    await persistDetails({ saved_items: updated });
  };

  const removeSavedItem = async (idx: number) => {
    const updated = savedItems.filter((_, i) => i !== idx);
    setSavedItems(updated);
    await persistDetails({ saved_items: updated });
  };

  const handleAddRefPlan = async (refPlan: RefPlanItem) => {
    if (refPlans.some(r => r.id === refPlan.id)) return;
    const updated = [...refPlans, refPlan];
    setRefPlans(updated);
    await persistDetails({ ref_plans: updated });
  };

  const handleRemoveRefPlan = async (refId: string) => {
    const updated = refPlans.filter(r => r.id !== refId);
    setRefPlans(updated);
    await persistDetails({ ref_plans: updated });
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/regenerate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: id, notes, savedItems, additionalRequest }),
      });
      const data = await res.json() as { plan?: Plan; error?: string };
      if (data.plan) {
        setPlan(data.plan);
        setNotes(data.plan.details?.notes ?? []);
        setSavedItems(data.plan.details?.saved_items ?? []);
        setTimelineStatus(data.plan.details?.timeline_status ?? {});
        setShowRegenForm(false);
        setAdditionalRequest('');
        fireToast('プランを再提案しました！');
      } else {
        fireToast('再提案に失敗しました。もう一度お試しください。');
      }
    } catch {
      fireToast('エラーが発生しました。');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-muted">プランが見つかりませんでした</p>
        <Link href="/plans" className="text-primary text-sm underline">一覧に戻る</Link>
      </div>
    );
  }

  const isOwner = !!currentUser && currentUser.id === plan.user_id;
  const cover = plan.details?.cover_image_url || (plan.destination_city && CITY_COVER[plan.destination_city]) || FALLBACK_COVER;
  const duration = plan.details?.duration_label ?? (plan.duration_weeks ? `${plan.duration_weeks}週間` : null);
  const budgetMin = plan.budget_jpy ? Math.round(plan.budget_jpy / 10000) : null;
  const budgetMax = plan.budget_max_jpy ? Math.round(plan.budget_max_jpy / 10000) : null;
  const budgetLabel = budgetMin ? `${budgetMin}${budgetMax && budgetMax !== budgetMin ? `〜${budgetMax}` : ''}万円` : null;
  const preDeparture = plan.details?.pre_departure ?? {};
  const timeline = plan.details?.timeline ?? [];
  const firstWeek = plan.details?.first_week ?? [];
  const yearlyPlan = plan.details?.yearly_plan ?? [];
  const citySpots = plan.details?.city_spots ?? [];
  const featureSections = Object.entries(preDeparture).map(([key, val]) => ({ key, icon: PRE_ICONS[key] ?? '📌', label: PRE_LABELS[key] ?? key, content: val }));

  // タイムライン進捗集計
  const allTasks = timeline.flatMap((item, pi) => item.tasks.map((_, ti) => `${pi}-${ti}`));
  const doneTasks = allTasks.filter(k => timelineStatus[k] === 'done').length;
  const doingTasks = allTasks.filter(k => timelineStatus[k] === 'doing').length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto bg-white relative">
      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* トップバー */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-between gap-2">
        <Link href="/plans" className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors flex-shrink-0">
          <span className="text-lg leading-none">‹</span>
          <span>プラン一覧</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* 公開/非公開トグル（オーナーのみ） */}
          {isOwner && plan && (
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                plan.status === 'public'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>{plan.status === 'public' ? '🌏' : '🔒'}</span>
              <span className="hidden sm:inline">{plan.status === 'public' ? '公開中' : '非公開'}</span>
            </button>
          )}
          {/* モバイル用カバー変更（オーナーのみ） */}
          {isOwner && (
            <label className={`lg:hidden flex items-center justify-center w-8 h-8 rounded-full border border-border text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer ${coverUploading ? 'opacity-50 pointer-events-none' : ''}`} title="カバー画像を変更">
              {coverUploading ? '⏳' : '🖼️'}
              <input type="file" accept="image/*,.heic,.heif" className="hidden" disabled={coverUploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ''; }} />
            </label>
          )}
          <button
            onClick={() => setShowAgentModal(true)}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-all"
          >
            <span>🎓</span>
            <span>エージェントに相談</span>
          </button>
          <button
            onClick={() => setShowRegenForm(v => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/5 transition-all"
          >
            <span>✨</span>
            <span className="hidden sm:inline">微調整する</span>
            <span className="sm:hidden">調整</span>
          </button>
        </div>
      </div>

      <div className="flex min-h-0">
        {/* 左：メインコンテンツ */}
        <div className="flex-1 min-w-0 px-6 sm:px-10 py-8">

          {/* タイトル（インライン編集） */}
          <div className="flex items-start gap-2 mb-4">
            {titleEditing ? (
              <div className="flex-1 flex gap-2 items-center">
                <input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') updateTitle(); if (e.key === 'Escape') setTitleEditing(false); }}
                  className="flex-1 text-xl sm:text-2xl font-bold text-primary border-b-2 border-primary outline-none bg-transparent"
                />
                <button onClick={updateTitle} className="text-sm font-semibold text-white bg-primary px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity flex-shrink-0">保存</button>
                <button onClick={() => setTitleEditing(false)} className="text-sm text-muted px-2 hover:text-primary flex-shrink-0">✕</button>
              </div>
            ) : (
              <>
                <h1 className="flex-1 text-2xl sm:text-3xl font-bold text-primary leading-snug">{plan.title}</h1>
                {isOwner && (
                  <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                    <button
                      onClick={() => { setEditedTitle(plan.title); setTitleEditing(true); }}
                      className="text-muted hover:text-primary transition-colors text-sm"
                      title="タイトルを編集"
                    >✏️</button>
                    {/* モバイル用カバー変更ボタン */}
                    <label className={`lg:hidden text-muted hover:text-primary transition-colors text-sm cursor-pointer ${coverUploading ? 'opacity-50 pointer-events-none' : ''}`} title="カバー画像を変更">
                      {coverUploading ? '⏳' : '🖼️'}
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        className="hidden"
                        disabled={coverUploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ''; }}
                      />
                    </label>
                  </div>
                )}
              </>
            )}
          </div>

          {/* タグ行 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(plan.destination_city || plan.destination_country) && (
              <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">📍 {plan.destination_city ?? plan.destination_country}</span>
            )}
            {duration && <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">🗓 {duration}</span>}
            {plan.purpose && <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">🎯 {PURPOSE_LABEL[plan.purpose] ?? plan.purpose}</span>}
            {budgetLabel && <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">💰 {budgetLabel}</span>}
          </div>

          {/* AI おすすめカード */}
          {(plan.reason || plan.initial_plan) && (
            <div className="bg-white border border-border rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mascot.png" alt="Abro" className="w-8 h-8 rounded-full object-contain bg-white flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {plan.reason && <p className="text-sm text-primary leading-relaxed">{plan.reason}</p>}
                  {plan.initial_plan && <p className="text-sm text-muted leading-relaxed mt-2">{plan.initial_plan}</p>}
                </div>
              </div>
            </div>
          )}

          {/* クイックアクション */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[{ label: '詳しく相談する' }, { label: 'ビザを確認する' }, { label: '費用を試算する' }].map(a => (
              <Link key={a.label} href="/chat" className="text-sm border border-border rounded-full px-4 py-2 text-primary hover:border-primary/40 hover:bg-gray-50 transition-all">
                {a.label}
              </Link>
            ))}
          </div>

          {/* チャットリンク */}
          <div className="flex flex-col gap-2 mb-8">
            <Link href="/chat" className="flex items-center gap-3 border border-border rounded-2xl px-4 py-3 hover:border-primary/40 hover:bg-gray-50 transition-all group">
              <span className="text-muted text-sm flex-1">このプランについて質問する...</span>
              <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm group-hover:opacity-80 transition-opacity">→</span>
            </Link>
            <Link
              href={`/chat?ref=${plan.id}`}
              className="flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold py-3 rounded-2xl hover:opacity-80 transition-opacity"
            >
              <span>✨</span>
              <span>このプランを参考に自分のプランを作る</span>
            </Link>
          </div>

          {/* ━━ 到着後1週間プラン ━━ */}
          {firstWeek.length > 0 && (
            <div className="mb-8">
              <h2 className="text-base font-bold text-primary mb-1">到着後1週間プラン</h2>
              <p className="text-xs text-muted mb-4">渡航直後のリアルな1日1日をシミュレート</p>
              <div className="flex flex-col gap-3">
                {firstWeek.map((item, i) => {
                  const cat = DAY_SPOT_CATS[i] ?? null;
                  const daySpots = cat ? citySpots.filter(s => s.category === cat) : [];
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${DAY_COLORS[i % DAY_COLORS.length]}`}>
                          {i + 1}
                        </div>
                        {i < firstWeek.length - 1 && <div className="w-px flex-1 bg-border mt-1.5" />}
                      </div>
                      <div className="pb-3 pt-0.5 flex-1 min-w-0">
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">{item.day}</span>
                        <p className="text-sm font-bold text-primary leading-snug mt-0.5">{item.highlight}</p>
                        <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                          <span className="text-amber-500 text-xs flex-shrink-0 mt-0.5">💡</span>
                          <p className="text-xs text-amber-800 leading-relaxed">{item.tips}</p>
                        </div>
                        {item.eats && item.eats.length > 0 && (
                          <div className="mt-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] font-semibold text-orange-600 mb-1.5">🍽 食事のおすすめ</p>
                            <div className="flex flex-col gap-1">
                              {item.eats.map((eat, ei) => (
                                <p key={ei} className="text-xs text-orange-800 leading-relaxed">{eat}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        <SpotCards spots={daySpots} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ━━ 月別ライフプラン ━━ */}
          {yearlyPlan.length > 0 && (
            <div className="mb-8">
              <h2 className="text-base font-bold text-primary mb-1">月別ライフプラン</h2>
              <p className="text-xs text-muted mb-4">あなただけの{duration}の過ごし方</p>
              <div className="flex flex-col gap-3">
                {yearlyPlan.map((item, i) => {
                  const cat = guessSpotCat(item.title + item.detail);
                  const monthSpots = cat ? citySpots.filter(s => s.category === cat) : [];
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                        </div>
                        {i < yearlyPlan.length - 1 && <div className="w-px flex-1 bg-border mt-1.5" />}
                      </div>
                      <div className="pb-3 pt-0.5 flex-1 min-w-0">
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">{item.month}</span>
                        <p className="text-sm font-bold text-primary mt-0.5 leading-snug">{item.title}</p>
                        <p className="text-xs text-muted leading-relaxed mt-1">{item.detail}</p>
                        {item.trip && (
                          <div className="mt-2 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] font-semibold text-sky-600 mb-1.5">✈️ 旅行提案：{item.trip.area}</p>
                            <div className="flex flex-col gap-1">
                              {item.trip.stay && <p className="text-xs text-sky-800 leading-relaxed">🏨 {item.trip.stay}</p>}
                              {item.trip.spots && <p className="text-xs text-sky-800 leading-relaxed">📍 {item.trip.spots}</p>}
                              {item.trip.shops && <p className="text-xs text-sky-800 leading-relaxed">🛍 {item.trip.shops}</p>}
                            </div>
                          </div>
                        )}
                        <SpotCards spots={monthSpots} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ━━ 費用管理 ━━ */}
          <div className="mb-8">
            <h2 className="text-base font-bold text-primary mb-1">費用管理</h2>
            <p className="text-xs text-muted mb-4">AI予算の目安を参考に、実際の費用を入力してください</p>
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              {/* AI予算目安バー */}
              {(budgetMin || budgetMax) && (
                <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center gap-2">
                  <span className="text-xs text-muted">💡 AI予算目安</span>
                  <span className="text-sm font-bold text-primary">{budgetMin}〜{budgetMax}万円</span>
                  <button
                    onClick={() => {
                      const avgBudgetPerItem = Math.round(((plan?.budget_jpy ?? 0) + (plan?.budget_max_jpy ?? 0)) / 2 / 7 / 10000) * 10000;
                      setBudgetItems(prev => prev.map(item => ({
                        ...item,
                        amount: item.amount ?? avgBudgetPerItem,
                      })));
                    }}
                    className="ml-auto text-[10px] text-primary border border-primary/30 rounded-full px-2 py-0.5 hover:bg-primary/5 transition-colors"
                  >
                    目安を入力
                  </button>
                </div>
              )}
              {/* 費用項目 */}
              <div className="divide-y divide-border">
                {budgetItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs text-muted w-24 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <span className="text-xs text-muted">¥</span>
                      <input
                        type="number"
                        value={item.amount ?? ''}
                        onChange={e => setBudgetItems(prev => prev.map((it, idx) =>
                          idx === i ? { ...it, amount: e.target.value ? parseInt(e.target.value) : null } : it
                        ))}
                        placeholder="0"
                        className="flex-1 text-sm text-primary outline-none text-right placeholder:text-gray-300"
                        disabled={!isOwner}
                      />
                    </div>
                    {item.amount != null && (
                      <span className="text-xs text-muted flex-shrink-0">
                        ({Math.round(item.amount / 10000)}万円)
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {/* 合計 */}
              {(() => {
                const total = budgetItems.reduce((s, it) => s + (it.amount ?? 0), 0);
                return total > 0 ? (
                  <div className="px-4 py-3 bg-primary/5 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">合計</span>
                    <span className="text-base font-bold text-primary">¥{total.toLocaleString()} <span className="text-xs font-normal text-muted">（約{Math.round(total/10000)}万円）</span></span>
                  </div>
                ) : null;
              })()}
              {/* メモ */}
              <div className="px-4 py-3 border-t border-border">
                <input
                  value={budgetNotes}
                  onChange={e => setBudgetNotes(e.target.value)}
                  placeholder="費用メモ（例：学校は奨学金を申請予定）"
                  className="w-full text-xs text-muted outline-none placeholder:text-gray-300"
                  disabled={!isOwner}
                />
              </div>
              {/* 保存ボタン */}
              {isOwner && (
                <div className="px-4 py-3 border-t border-border">
                  <button
                    onClick={handleSaveBudget}
                    disabled={budgetSaving}
                    className="w-full bg-primary/10 text-primary text-xs font-semibold py-2 rounded-xl hover:bg-primary hover:text-white transition-all disabled:opacity-40"
                  >
                    {budgetSaving ? '保存中...' : '費用を保存する'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ━━ 準備タイムライン ━━ */}
          {timeline.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-primary">準備タイムライン</h2>
                  {allTasks.length > 0 && (
                    <p className="text-xs text-muted mt-0.5">
                      {doneTasks}/{allTasks.length} 完了
                      {doingTasks > 0 && <span className="ml-2 text-amber-600">{doingTasks}件進行中</span>}
                    </p>
                  )}
                </div>
                {allTasks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-primary">{progress}%</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4">
                {timeline.map((item, pi) => (
                  <div key={pi} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                        item.tasks.every((_, ti) => timelineStatus[`${pi}-${ti}`] === 'done')
                          ? 'bg-emerald-400' : item.tasks.some((_, ti) => timelineStatus[`${pi}-${ti}`] === 'doing')
                          ? 'bg-amber-400' : 'bg-primary'
                      }`} />
                      {pi < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <p className="text-sm font-bold text-primary">{item.period}</p>
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        {item.tasks.map((task, ti) => {
                          const key = `${pi}-${ti}`;
                          const status = timelineStatus[key] ?? 'none';
                          const cfg = STATUS_CONFIG[status];
                          return (
                            <button
                              key={ti}
                              onClick={() => cycleTaskStatus(key)}
                              className={`flex items-center gap-2 text-left rounded-xl px-3 py-2 border transition-all hover:shadow-sm ${cfg.bg} ${status === 'done' ? 'border-emerald-200' : status === 'doing' ? 'border-amber-200' : 'border-gray-200'}`}
                            >
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                              <span className={`text-xs flex-1 leading-snug ${status === 'done' ? 'line-through text-gray-400' : 'text-primary'}`}>{task}</span>
                              <span className={`text-[9px] font-semibold flex-shrink-0 ${cfg.text}`}>{cfg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted mt-2">タップでステータスを切り替え（未着手 → 準備中 → 完了）</p>
            </div>
          )}

          {/* ━━ 非オーナー向け：参考にして作成ボタン ━━ */}
          {!isOwner && (
            <div className="mb-8 bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
              <p className="text-sm font-semibold text-primary mb-1">このプランが気に入りましたか？</p>
              <p className="text-xs text-muted mb-4">このプランを参考に、あなただけのプランをAIと一緒に作れます</p>
              <Link
                href={`/chat?ref=${plan.id}`}
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity"
              >
                <span>✨</span><span>このプランを参考に作成する</span>
              </Link>
            </div>
          )}

          {/* ━━ カスタマイズ（オーナーのみ）━━ */}
          {isOwner && <div className="mb-8">
            <h2 className="text-base font-bold text-primary mb-4">メモ・カスタマイズ</h2>

            {/* 微調整フォーム */}
            {showRegenForm && (
              <div className="mb-4 border border-primary/25 rounded-2xl p-4 bg-primary/5">
                <p className="text-xs font-semibold text-primary mb-1">✨ プランを微調整する</p>
                <p className="text-xs text-muted mb-3">変えたい点を具体的に書くと、AIがプラン全体を最適化して再生成します</p>
                <textarea
                  value={additionalRequest}
                  onChange={e => setAdditionalRequest(e.target.value)}
                  placeholder="例：&#10;・費用をもっと抑えたい（予算100万円以内）&#10;・シェアハウスに住みたい&#10;・語学学校は最低12週間希望&#10;・1週間プランをアウトドア中心にして"
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary/40 resize-none h-28 bg-white"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-80 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {isRegenerating
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>生成中...</span></>
                      : '✨ この内容でプランを更新する'
                    }
                  </button>
                  <button onClick={() => setShowRegenForm(false)} className="text-sm text-muted px-4 hover:text-primary">閉じる</button>
                </div>
              </div>
            )}

            {/* メモ */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">メモ</p>
              {notes.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {notes.map((note, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 border border-border rounded-xl px-3 py-2">
                      <span className="flex-1 text-sm text-primary leading-snug">{note}</span>
                      <button onClick={() => removeNote(i)} className="text-muted hover:text-red-400 transition-colors text-sm flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNote(); } }}
                  placeholder="メモを追加（例：ビーチ近くがいい）"
                  className="flex-1 text-sm border border-border rounded-xl px-3 py-2 outline-none focus:border-primary/40 transition-colors"
                />
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="bg-primary text-white text-sm font-bold px-3.5 py-2 rounded-xl disabled:opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
                >
                  ＋
                </button>
              </div>
            </div>

            {/* 参考プラン */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">参考プラン</p>
                <button
                  onClick={() => setShowRefPicker(true)}
                  className="text-[11px] text-primary border border-primary/30 rounded-full px-2.5 py-1 hover:bg-primary/5 transition-colors"
                >
                  ＋ 追加
                </button>
              </div>
              {refPlans.length === 0 ? (
                <button
                  onClick={() => setShowRefPicker(true)}
                  className="w-full border border-dashed border-border rounded-2xl px-4 py-4 text-center hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <p className="text-xs text-muted">他のユーザーのプランを参考として追加</p>
                  <p className="text-[10px] text-muted/70 mt-0.5">インスピレーションから選択できます</p>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {refPlans.map(ref => (
                    <div key={ref.id} className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
                      <span className="text-lg flex-shrink-0">✨</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">{ref.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {(ref.destination_city ?? ref.destination_country) && (
                            <span className="text-[10px] text-muted">📍 {ref.destination_city ?? ref.destination_country}</span>
                          )}
                          {ref.duration_label && <span className="text-[10px] text-muted">· {ref.duration_label}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/plans/${ref.id}`}
                          className="text-[10px] text-primary border border-primary/30 rounded-full px-2 py-1 hover:bg-primary hover:text-white transition-all"
                        >
                          見る →
                        </Link>
                        <button onClick={() => handleRemoveRefPlan(ref.id)} className="text-muted hover:text-red-400 transition-colors text-sm">✕</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setShowRefPicker(true)} className="text-[11px] text-primary text-center py-1.5 hover:opacity-70 transition-opacity">
                    ＋ さらに追加する
                  </button>
                </div>
              )}
            </div>

            {/* 保存済みカード */}
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">保存済みカード</p>
              {savedItems.length > 0 && (() => {
                const schoolCards = savedItems
                  .map((item, i) => ({ item, i, school: item.type === 'school' ? allSchools.find(s => s.name === item.label) ?? null : null }))
                  .filter(x => x.school !== null);
                const otherItems = savedItems
                  .map((item, i) => ({ item, i }))
                  .filter(({ item }) => item.type !== 'school' || !allSchools.find(s => s.name === item.label));
                return (
                  <div className="mb-2 flex flex-col gap-2">
                    {schoolCards.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {schoolCards.map(({ school, i }) => (
                          <SchoolSavedCard
                            key={i}
                            school={school!}
                            onTap={() => setFocusedSchool(school)}
                            onRemove={() => removeSavedItem(i)}
                          />
                        ))}
                      </div>
                    )}
                    {otherItems.map(({ item, i }) => (
                      <div key={i} className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2">
                        <span className="text-base flex-shrink-0">{ITEM_TYPE_ICONS[item.type]}</span>
                        <span className="flex-1 text-sm text-primary leading-snug">{item.label}</span>
                        <button onClick={() => removeSavedItem(i)} className="text-muted hover:text-red-400 transition-colors text-sm flex-shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="flex gap-2">
                <select
                  value={newItemType}
                  onChange={e => setNewItemType(e.target.value as typeof newItemType)}
                  className="text-sm border border-border rounded-xl px-2 py-2 outline-none focus:border-primary/40 bg-white flex-shrink-0"
                >
                  <option value="school">🎓 学校</option>
                  <option value="city">📍 都市</option>
                  <option value="other">📌 その他</option>
                </select>
                <input
                  value={newItemLabel}
                  onChange={e => setNewItemLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSavedItem(); } }}
                  placeholder="学校・都市・スポット名を追加"
                  className="flex-1 text-sm border border-border rounded-xl px-3 py-2 outline-none focus:border-primary/40 transition-colors"
                />
                <button
                  onClick={addSavedItem}
                  disabled={!newItemLabel.trim()}
                  className="bg-primary text-white text-sm font-bold px-3.5 py-2 rounded-xl disabled:opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
                >
                  ＋
                </button>
              </div>
            </div>
          </div>
          }  {/* isOwner end */}
        </div>

        {/* 右：渡航前準備 + 都市画像 */}
        <div className="hidden lg:flex w-80 xl:w-96 flex-shrink-0 border-l border-border flex-col">
          {/* 都市画像（オーナーはクリックで変更可） */}
          <div className="relative h-44 flex-shrink-0 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={plan.destination_city ?? 'プラン'} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
            {plan.destination_city && <div className="absolute bottom-3 left-4 text-white font-bold text-base">{plan.destination_city}</div>}
            {isOwner && (
              <label className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-all ${coverUploading ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/30'}`}>
                <div className={`flex flex-col items-center gap-1 transition-opacity ${coverUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <span className="text-2xl">{coverUploading ? '⏳' : '📷'}</span>
                  <span className="text-white text-xs font-semibold">{coverUploading ? 'アップロード中...' : 'カバーを変更'}</span>
                </div>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  disabled={coverUploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ''; }}
                />
              </label>
            )}
          </div>

          {/* 渡航前準備カードグリッド */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">渡航前準備</p>
            {featureSections.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {featureSections.map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                    className={`text-left rounded-xl border p-3 transition-all hover:shadow-sm ${expandedSection === key ? 'border-primary/50 bg-primary/5' : 'border-border bg-white hover:border-primary/30'}`}
                  >
                    <span className="text-xl block mb-1">{icon}</span>
                    <span className="text-xs font-semibold text-primary block">{label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">渡航前準備の情報がありません</p>
            )}

            {expandedSection && preDeparture[expandedSection] && (
              <div className="mt-3 border border-primary/20 rounded-xl p-3 bg-white">
                <p className="text-xs font-bold text-primary mb-1.5 flex items-center gap-1.5">
                  <span>{PRE_ICONS[expandedSection] ?? '📌'}</span>
                  <span>{PRE_LABELS[expandedSection] ?? expandedSection}</span>
                </p>
                <p className="text-xs text-muted leading-relaxed">{preDeparture[expandedSection]}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 参考プランピッカー */}
      {showRefPicker && (
        <RefPlanPickerModal
          currentPlanId={plan.id}
          addedIds={new Set(refPlans.map(r => r.id))}
          onAdd={handleAddRefPlan}
          onClose={() => setShowRefPicker(false)}
        />
      )}

      {/* 学校詳細モーダル */}
      {focusedSchool && (
        <SchoolDetailModal school={focusedSchool} onClose={() => setFocusedSchool(null)} />
      )}

      {/* エージェント相談モーダル */}
      <AgentContactModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        planId={plan.id}
        context={[
          plan.title,
          (plan.destination_city || plan.destination_country) ? `渡航先：${plan.destination_city ?? plan.destination_country}` : null,
          duration ? `期間：${duration}` : null,
          plan.purpose ? `目的：${PURPOSE_LABEL[plan.purpose] ?? plan.purpose}` : null,
          budgetLabel ? `予算：${budgetLabel}` : null,
          plan.initial_plan ? `プラン：${plan.initial_plan}` : null,
        ].filter(Boolean).join('　')}
      />

      {/* モバイル：渡航前準備 */}
      {featureSections.length > 0 && (
        <div className="lg:hidden px-6 pb-8">
          <h2 className="text-base font-bold text-primary mb-3">渡航前準備</h2>
          <div className="grid grid-cols-2 gap-2">
            {featureSections.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                className={`text-left rounded-xl border p-3 transition-all ${expandedSection === key ? 'border-primary/50 bg-primary/5' : 'border-border bg-white'}`}
              >
                <span className="text-xl block mb-1">{icon}</span>
                <span className="text-xs font-semibold text-primary block">{label}</span>
              </button>
            ))}
          </div>
          {expandedSection && preDeparture[expandedSection] && (
            <div className="mt-3 border border-primary/20 rounded-xl p-3 bg-white">
              <p className="text-xs font-bold text-primary mb-1.5">{PRE_LABELS[expandedSection] ?? expandedSection}</p>
              <p className="text-xs text-muted leading-relaxed">{preDeparture[expandedSection]}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
