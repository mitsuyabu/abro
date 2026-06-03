'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface Plan {
  id: string;
  title: string;
  destination_country: string | null;
  destination_city: string | null;
  duration_weeks: number | null;
  budget_jpy: number | null;
  budget_max_jpy: number | null;
  purpose: string | null;
  status: 'draft' | 'private' | 'shared' | 'public';
  details: { duration_label?: string } | null;
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

function getCover(city: string | null): string {
  return (city && CITY_COVER[city]) || FALLBACK_COVER;
}

const PURPOSE_LABEL: Record<string, string> = {
  study: '語学留学',
  workingholiday: 'ワーホリ',
  both: '留学＋ワーホリ',
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase
        .from('plans')
        .select('id, title, destination_country, destination_city, duration_weeks, budget_jpy, budget_max_jpy, purpose, status, details, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setPlans((data as Plan[]) ?? []);
          setLoading(false);
        });
    });
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">あなたのプラン</h1>
          <Link
            href="/chat"
            className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
          >
            <span>＋</span>
            <span>新規プラン</span>
          </Link>
        </div>

        {/* タブ */}
        <div className="flex border-b border-border mb-6">
          <button className="pb-2 px-1 mr-6 text-sm font-semibold text-primary border-b-2 border-primary">プラン</button>
          <button className="pb-2 px-1 text-sm text-muted hover:text-primary transition-colors">共有済み</button>
        </div>

        {/* フィルター */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-6 rounded-full bg-gray-200 flex-shrink-0 relative cursor-not-allowed opacity-50">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm" />
            </div>
            <span className="text-sm text-muted">予約済みのみ</span>
          </div>
          <select className="text-sm text-muted border border-border rounded-lg px-3 py-1.5 bg-white">
            <option>すべて</option>
            <option>下書き</option>
            <option>非公開</option>
            <option>公開中</option>
          </select>
        </div>

        {/* グリッド */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
              <span className="text-3xl">🧳</span>
            </div>
            <h2 className="text-lg font-semibold text-primary">まだプランがありません</h2>
            <p className="text-muted text-sm text-center">
              AI に相談して最初のプランを作りましょう！
            </p>
            <Link
              href="/chat"
              className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity"
            >
              ✨ プランを作成する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const duration = plan.details?.duration_label ?? (plan.duration_weeks ? `${plan.duration_weeks}週間` : null);
              const cover = getCover(plan.destination_city);
              const subtitle = [
                plan.destination_city ?? plan.destination_country,
                duration,
                plan.purpose ? PURPOSE_LABEL[plan.purpose] : null,
              ].filter(Boolean).join(' · ');

              return (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover}
                      alt={plan.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-base leading-snug line-clamp-2">{plan.title}</h3>
                      {subtitle && (
                        <p className="text-white/80 text-xs mt-1">{subtitle}</p>
                      )}
                      <p className="text-white/50 text-[10px] mt-0.5">
                        {new Date(plan.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
