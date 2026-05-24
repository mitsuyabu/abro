'use client';

import { useState, useMemo } from 'react';

const JPY_PER_AUD = 95;

const CITIES = ['シドニー', 'メルボルン', 'ブリスベン', 'ゴールドコースト', 'ケアンズ', 'パース'] as const;
type City = (typeof CITIES)[number];

const CITY_COSTS: Record<City, { homestay: number; sharehouse: number; apartment: number; food: number; transport: number }> = {
  シドニー:         { homestay: 300, sharehouse: 220, apartment: 600, food: 150, transport: 50 },
  メルボルン:       { homestay: 275, sharehouse: 200, apartment: 520, food: 140, transport: 45 },
  ブリスベン:       { homestay: 260, sharehouse: 180, apartment: 450, food: 130, transport: 42 },
  ゴールドコースト: { homestay: 255, sharehouse: 175, apartment: 425, food: 125, transport: 35 },
  ケアンズ:         { homestay: 240, sharehouse: 165, apartment: 380, food: 120, transport: 30 },
  パース:           { homestay: 250, sharehouse: 170, apartment: 410, food: 125, transport: 38 },
};

const SCHOOL_FEE_PER_WEEK = 280;
const INSURANCE_PER_WEEK  = 30;
const MISC_PER_WEEK       = 50;
const FLIGHTS_AUD         = 1400;
const VISA_AUD            = 635;

type AccType = 'homestay' | 'sharehouse' | 'apartment';

function calcCosts(city: City, totalWeeks: number, schoolWeeks: number, acc: AccType) {
  const c = CITY_COSTS[city];
  const weeklyRent  = c[acc];
  const weeklyFood  = acc === 'homestay' ? 0 : c.food;
  const weeklyLiving = weeklyRent + weeklyFood + c.transport + INSURANCE_PER_WEEK + MISC_PER_WEEK;
  const school       = schoolWeeks * SCHOOL_FEE_PER_WEEK;

  return {
    flights:    FLIGHTS_AUD,
    visa:       VISA_AUD,
    school,
    rent:       weeklyRent * totalWeeks,
    food:       weeklyFood * totalWeeks,
    transport:  c.transport * totalWeeks,
    insurance:  INSURANCE_PER_WEEK * totalWeeks,
    misc:       MISC_PER_WEEK * totalWeeks,
    weeklyTotal: weeklyLiving,
    grandTotal:  FLIGHTS_AUD + VISA_AUD + school + weeklyLiving * totalWeeks,
  };
}

export function CostSimulator({ onClose }: { onClose: () => void }) {
  const [city, setCity]   = useState<City>('ブリスベン');
  const [weeks, setWeeks] = useState(24);
  const [school, setSchool] = useState(8);
  const [acc, setAcc]     = useState<AccType>('sharehouse');

  const costs = useMemo(() => calcCosts(city, weeks, school, acc), [city, weeks, school, acc]);

  const jpy = (v: number) => `¥${Math.round(v * JPY_PER_AUD).toLocaleString()}`;
  const aud = (v: number) => `A$${Math.round(v).toLocaleString()}`;
  const months = Math.round(weeks / 4.3);

  const rows: { label: string; value: number }[] = [
    { label: '✈️ 航空券（片道目安）',    value: costs.flights },
    { label: '📄 ビザ申請費',           value: costs.visa },
    ...(costs.school > 0 ? [{ label: '🎓 語学学校費', value: costs.school }] : []),
    { label: '🏠 家賃・滞在費',          value: costs.rent },
    ...(costs.food > 0 ? [{ label: '🍽️ 食費', value: costs.food }] : []),
    { label: '🚌 交通費',               value: costs.transport },
    { label: '🛡️ 海外保険',             value: costs.insurance },
    { label: '📱 その他（通信・娯楽）', value: costs.misc },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-base">💰</span>
          <span className="text-sm font-bold text-primary">費用シミュレーター</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-muted hover:text-primary transition-all text-sm"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* コントロール */}
        <div className="px-4 pt-4 pb-3 space-y-4 border-b border-border/40">
          {/* 都市 */}
          <div>
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wide block mb-1.5">🏙️ 都市</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-medium transition-all border ${
                    city === c
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-primary border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 滞在期間 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">📅 滞在期間</label>
              <span className="text-sm font-bold text-primary">
                {weeks}週間
                <span className="text-[11px] font-normal text-muted ml-1">（約{months}ヶ月）</span>
              </span>
            </div>
            <input
              type="range" min={4} max={52} step={2} value={weeks}
              onChange={e => setWeeks(Number(e.target.value))}
              className="w-full accent-primary h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted mt-0.5">
              <span>1ヶ月</span><span>半年</span><span>1年</span>
            </div>
          </div>

          {/* 語学学校 */}
          <div>
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wide block mb-1.5">🎓 語学学校</label>
            <div className="flex flex-wrap gap-1.5">
              {[0, 4, 8, 12, 16, 24].map(w => (
                <button
                  key={w}
                  onClick={() => setSchool(w)}
                  className={`py-1 px-2.5 rounded-full text-xs font-medium transition-all border ${
                    school === w
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-primary border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {w === 0 ? 'なし' : `${w}週`}
                </button>
              ))}
            </div>
          </div>

          {/* 滞在先 */}
          <div>
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wide block mb-1.5">🏠 滞在先</label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                ['homestay',  'ホームステイ', '食事込み'],
                ['sharehouse','シェアハウス', '自炊'],
                ['apartment', 'アパート',     '自炊'],
              ] as const).map(([val, label, sub]) => (
                <button
                  key={val}
                  onClick={() => setAcc(val)}
                  className={`py-2 px-2 rounded-lg text-left transition-all border ${
                    acc === val
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-primary border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className="text-[11px] font-semibold">{label}</div>
                  <div className={`text-[10px] mt-0.5 ${acc === val ? 'text-white/70' : 'text-muted'}`}>{sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 費用内訳 */}
        <div className="px-4 pt-4 pb-6">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-3">費用内訳（目安）</div>

          <div className="space-y-2.5">
            {rows.map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-primary/70 flex-1 mr-2">{row.label}</span>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-semibold text-primary">{jpy(row.value)}</div>
                  <div className="text-[10px] text-muted">{aud(row.value)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 合計 */}
          <div className="mt-4 pt-4 border-t-2 border-primary/10">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold text-muted">合計（目安）</div>
                <div className="text-[10px] text-muted/70 mt-0.5">1 AUD ≈ ¥{JPY_PER_AUD}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{jpy(costs.grandTotal)}</div>
                <div className="text-xs text-muted">{aud(costs.grandTotal)}</div>
              </div>
            </div>
          </div>

          {/* 週あたり生活費 */}
          <div className="mt-3 bg-primary/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-primary">週あたりの生活費</div>
              <div className="text-[10px] text-muted">（学校・ビザ・航空券を除く）</div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-primary">{jpy(costs.weeklyTotal)}</div>
              <div className="text-[10px] text-muted">{aud(costs.weeklyTotal)}/週</div>
            </div>
          </div>

          {/* 注記 */}
          <p className="text-[10px] text-muted mt-3 leading-relaxed">
            ※ 為替・時期・生活スタイルにより変動します。詳細はエージェントへの無料相談をご利用ください。
          </p>
        </div>
      </div>
    </div>
  );
}
