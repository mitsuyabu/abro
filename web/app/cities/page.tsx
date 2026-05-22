'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type CityClimate = {
  city_id: string;
  city: string;
  city_en: string;
  temp_avg_c: number | null;
  temp_summer_c: number | null;
  temp_winter_c: number | null;
  rainfall_mm: number | null;
  sunshine_hours: number | null;
  climate_type: string | null;
  koppen: string | null;
  score_heat: number | null;
  score_cold: number | null;
  score_rain: number | null;
  score_sunshine: number | null;
  score_comfort: number | null;
  summary: string | null;
};

type CitySafety = {
  city: string;
  safety_index: number | null;
  crime_index: number | null;
  safety_daytime: number | null;
  safety_nighttime: number | null;
};

const CITY_COVER: Record<string, string> = {
  sydney:       '/images/cities/sydney.jpg',
  melbourne:    '/images/cities/melbourne.jpg',
  brisbane:     '/images/cities/brisbane.jpg',
  'gold-coast': '/images/cities/gold-coast.jpg',
  cairns:       '/images/cities/cairns.jpg',
  perth:        '/images/cities/perth.jpg',
};

const SCORE_LABELS = [
  { key: 'score_heat',     label: '暑さ',       icon: '☀️' },
  { key: 'score_cold',     label: '寒さ',       icon: '❄️' },
  { key: 'score_rain',     label: '雨の多さ',   icon: '🌧️' },
  { key: 'score_sunshine', label: '日照の多さ', icon: '🌤️' },
  { key: 'score_comfort',  label: '過ごしやすさ', icon: '😊' },
] as const;

function Stars({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-muted">未取得</span>;
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-base leading-none ${i <= score ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
    </span>
  );
}

type Tab = 'cards' | 'compare';

export default function CitiesPage() {
  const [cities, setCities] = useState<CityClimate[]>([]);
  const [safetyMap, setSafetyMap] = useState<Record<string, CitySafety>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('cards');
  const [selected, setSelected] = useState<Set<string>>(new Set(['sydney', 'melbourne', 'brisbane']));

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('city_climate').select('*').order('city_id'),
      supabase.from('city_safety').select('city, safety_index, crime_index, safety_daytime, safety_nighttime').order('city'),
    ]).then(([climateRes, safetyRes]) => {
      setCities((climateRes.data ?? []) as CityClimate[]);
      const map: Record<string, CitySafety> = {};
      for (const s of (safetyRes.data ?? []) as CitySafety[]) {
        map[s.city] = s;
      }
      setSafetyMap(map);
      setLoading(false);
    });
  }, []);

  const toggleCity = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else { next.add(id); }
      return next;
    });
  };

  const compareCities = cities.filter(c => selected.has(c.city_id));

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* ヘッダー */}
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-3 flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-base font-bold text-primary">都市を比べる</h1>
          <p className="text-xs text-muted">オーストラリア6都市の気候・治安データ</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs">
          {(['cards', 'compare'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === t ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
            >
              {t === 'cards' ? 'カード' : '比較表'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        {/* カードビュー */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map(c => {
              const safety = safetyMap[c.city];
              const cover = CITY_COVER[c.city_id];
              return (
                <div key={c.city_id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* カバー画像 */}
                  <div className="relative h-36 bg-gray-100 overflow-hidden">
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={c.city_en} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-3">
                      <p className="text-white font-bold text-base leading-tight">{c.city}</p>
                      <p className="text-white/80 text-xs">{c.climate_type}</p>
                    </div>
                    {c.koppen && (
                      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md">
                        {c.koppen}
                      </div>
                    )}
                  </div>

                  {/* 数値サマリー */}
                  <div className="grid grid-cols-3 border-b border-border text-center text-xs divide-x divide-border">
                    <div className="py-2">
                      <p className="text-muted leading-none mb-0.5">年間平均</p>
                      <p className="font-bold text-primary">{c.temp_avg_c != null ? `${c.temp_avg_c}℃` : '—'}</p>
                    </div>
                    <div className="py-2">
                      <p className="text-muted leading-none mb-0.5">降水量</p>
                      <p className="font-bold text-primary">{c.rainfall_mm != null ? `${c.rainfall_mm}mm` : '—'}</p>
                    </div>
                    <div className="py-2">
                      <p className="text-muted leading-none mb-0.5">日照</p>
                      <p className="font-bold text-primary">{c.sunshine_hours != null ? `${c.sunshine_hours}h` : '—'}</p>
                    </div>
                  </div>

                  {/* 気候スコア */}
                  <div className="px-4 py-3 flex flex-col gap-1.5">
                    {SCORE_LABELS.map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-sm w-4 text-center leading-none">{icon}</span>
                        <span className="text-xs text-muted w-16 shrink-0">{label}</span>
                        <Stars score={c[key as keyof CityClimate] as number | null} />
                      </div>
                    ))}
                  </div>

                  {/* 治安 */}
                  {safety && (
                    <div className="px-4 pb-3 flex items-center gap-3 text-xs text-muted border-t border-border pt-2.5">
                      <span>🛡️ 安全指数</span>
                      <span className={`font-bold ${(safety.safety_index ?? 0) >= 60 ? 'text-green-600' : (safety.safety_index ?? 0) >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {safety.safety_index?.toFixed(1)}
                      </span>
                      <span className="ml-auto">夜間: {safety.safety_nighttime?.toFixed(0)}</span>
                    </div>
                  )}

                  {/* サマリー */}
                  {c.summary && (
                    <div className="px-4 pb-4 pt-1">
                      <p className="text-[11px] text-muted leading-relaxed line-clamp-3">{c.summary}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 比較表ビュー */}
        {activeTab === 'compare' && (
          <div className="flex flex-col gap-4">
            {/* 都市セレクター */}
            <div className="flex flex-wrap gap-2">
              {cities.map(c => (
                <button
                  key={c.city_id}
                  onClick={() => toggleCity(c.city_id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selected.has(c.city_id)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-muted border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {c.city}
                </button>
              ))}
            </div>

            {/* 気候スコア比較 */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-primary">気候スコア比較</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50">
                      <th className="text-left px-4 py-2.5 text-xs text-muted font-medium w-28">項目</th>
                      {compareCities.map(c => (
                        <th key={c.city_id} className="text-center px-3 py-2.5 text-xs font-semibold text-primary min-w-24">{c.city}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SCORE_LABELS.map(({ key, label, icon }) => (
                      <tr key={key} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">
                          <span className="mr-1">{icon}</span>{label}
                        </td>
                        {compareCities.map(c => {
                          const score = c[key as keyof CityClimate] as number | null;
                          const isMax = score != null && compareCities.every(o => (o[key as keyof CityClimate] as number | null ?? 0) <= score);
                          return (
                            <td key={c.city_id} className="text-center px-3 py-2.5">
                              <span className={`inline-flex flex-col items-center gap-0.5 ${isMax && compareCities.length > 1 ? 'opacity-100' : 'opacity-70'}`}>
                                <Stars score={score} />
                                {isMax && compareCities.length > 1 && (
                                  <span className="text-[9px] text-amber-500 font-bold">TOP</span>
                                )}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* 気温行 */}
                    <tr className="border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">🌡️ 年間平均</td>
                      {compareCities.map(c => (
                        <td key={c.city_id} className="text-center px-3 py-2.5 text-xs font-medium">
                          {c.temp_avg_c != null ? `${c.temp_avg_c}℃` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">🔥 夏の最高</td>
                      {compareCities.map(c => (
                        <td key={c.city_id} className="text-center px-3 py-2.5 text-xs font-medium text-red-500">
                          {c.temp_summer_c != null ? `${c.temp_summer_c}℃` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">🧊 冬の最低</td>
                      {compareCities.map(c => (
                        <td key={c.city_id} className="text-center px-3 py-2.5 text-xs font-medium text-blue-500">
                          {c.temp_winter_c != null ? `${c.temp_winter_c}℃` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">🌧️ 年間降水量</td>
                      {compareCities.map(c => (
                        <td key={c.city_id} className="text-center px-3 py-2.5 text-xs font-medium">
                          {c.rainfall_mm != null ? `${c.rainfall_mm}mm` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">☀️ 年間日照</td>
                      {compareCities.map(c => (
                        <td key={c.city_id} className="text-center px-3 py-2.5 text-xs font-medium">
                          {c.sunshine_hours != null ? `${c.sunshine_hours}h` : '—'}
                        </td>
                      ))}
                    </tr>

                    {/* 治安行 */}
                    <tr className="border-b border-border hover:bg-gray-50 transition-colors bg-blue-50/30">
                      <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">🛡️ 安全指数</td>
                      {compareCities.map(c => {
                        const s = safetyMap[c.city];
                        const val = s?.safety_index;
                        return (
                          <td key={c.city_id} className="text-center px-3 py-2.5 text-xs font-bold">
                            <span className={val != null ? (val >= 60 ? 'text-green-600' : val >= 50 ? 'text-amber-600' : 'text-red-500') : 'text-muted'}>
                              {val != null ? val.toFixed(1) : '—'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors bg-blue-50/30">
                      <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">🌙 夜間の安全</td>
                      {compareCities.map(c => {
                        const s = safetyMap[c.city];
                        const val = s?.safety_nighttime;
                        return (
                          <td key={c.city_id} className="text-center px-3 py-2.5 text-xs font-medium">
                            <span className={val != null ? (val >= 50 ? 'text-green-600' : val >= 40 ? 'text-amber-600' : 'text-red-500') : 'text-muted'}>
                              {val != null ? val.toFixed(1) : '—'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* サマリーカード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {compareCities.map(c => (
                <div key={c.city_id} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                  <p className="font-bold text-sm text-primary mb-1">{c.city} <span className="text-xs font-normal text-muted">({c.climate_type})</span></p>
                  <p className="text-[11px] text-muted leading-relaxed">{c.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* データソース注記 */}
        <p className="text-[10px] text-muted text-center mt-6 pb-4">
          気候データ: Wikipedia（2026年5月取得）/ 治安データ: Numbeo（2026年4〜5月取得）
        </p>
      </div>
    </div>
  );
}
