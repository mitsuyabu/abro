'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

const JPY_PER_AUD = 95;

const CITIES = ['シドニー', 'メルボルン', 'ブリスベン', 'ゴールドコースト', 'ケアンズ', 'パース'] as const;
type City = (typeof CITIES)[number];

type AccType = 'homestay' | 'sharehouse' | 'apartment';

interface CityData {
  homestay:   number;
  sharehouse: number;
  apartment:  number;
  food:       number;
  transport:  number;
}

const CITY_COSTS: Record<City, CityData> = {
  シドニー:         { homestay: 300, sharehouse: 220, apartment: 600, food: 150, transport: 50 },
  メルボルン:       { homestay: 275, sharehouse: 200, apartment: 520, food: 140, transport: 45 },
  ブリスベン:       { homestay: 260, sharehouse: 180, apartment: 450, food: 130, transport: 42 },
  ゴールドコースト: { homestay: 255, sharehouse: 175, apartment: 425, food: 125, transport: 35 },
  ケアンズ:         { homestay: 240, sharehouse: 165, apartment: 380, food: 120, transport: 30 },
  パース:           { homestay: 250, sharehouse: 170, apartment: 410, food: 125, transport: 38 },
};

const SCHOOL_FEE  = 280;  // AUD/week
const INSURANCE   = 30;   // AUD/week
const MISC        = 50;   // AUD/week
const FLIGHTS_AUD = 1400;
const VISA_AUD    = 635;

// 月別クイック選択
const MONTH_PRESETS = [
  { label: '1ヶ月', weeks: 4  },
  { label: '2ヶ月', weeks: 8  },
  { label: '3ヶ月', weeks: 12 },
  { label: '4ヶ月', weeks: 18 },
  { label: '6ヶ月', weeks: 26 },
  { label: '9ヶ月', weeks: 38 },
  { label: '1年',   weeks: 52 },
] as const;

// 東京の生活費目安（週あたり JPY）Numbeo 2025-2026
const TOKYO_COSTS = {
  sharehouse: { rent: 14000, food: 10000, transport: 3500, misc: 5000 },
  apartment:  { rent: 26000, food: 10000, transport: 3500, misc: 5000 },
} as const;
type TokyoType = keyof typeof TOKYO_COSTS;

const ACC_SHORT: Record<AccType, string> = { homestay: 'ホームステイ', sharehouse: 'シェア', apartment: 'APT' };
const ACC_FULL:  Record<AccType, string> = { homestay: 'ホームステイ', sharehouse: 'シェアハウス', apartment: 'アパート' };
const ACC_SUB:   Record<AccType, string> = { homestay: '食事込み', sharehouse: '自炊', apartment: '自炊' };
const ACC_BAR:   Record<AccType, string> = { homestay: 'bg-amber-400', sharehouse: 'bg-primary', apartment: 'bg-emerald-500' };
const ACC_CARD:  Record<AccType, string> = {
  homestay:   'bg-amber-50 border-amber-200',
  sharehouse: 'bg-primary/5 border-primary/20',
  apartment:  'bg-emerald-50 border-emerald-200',
};
const ACC_TEXT: Record<AccType, string> = {
  homestay:   'text-amber-700',
  sharehouse: 'text-primary',
  apartment:  'text-emerald-700',
};
const ACC_BTN_ON: Record<AccType, string> = {
  homestay:   'bg-amber-400 text-white',
  sharehouse: 'bg-primary text-white',
  apartment:  'bg-emerald-500 text-white',
};

interface Phase { type: AccType; weeks: number }

export interface ChatSync {
  city?:        string | null;
  totalWeeks?:  number | null;
  schoolWeeks?: number | null;
}

function normalizeCity(name: string | null | undefined): City | null {
  if (!name) return null;
  const tbl: Record<string, City> = {
    'シドニー': 'シドニー', 'sydney': 'シドニー',
    'メルボルン': 'メルボルン', 'melbourne': 'メルボルン',
    'ブリスベン': 'ブリスベン', 'brisbane': 'ブリスベン',
    'ゴールドコースト': 'ゴールドコースト', 'gold coast': 'ゴールドコースト',
    'ケアンズ': 'ケアンズ', 'cairns': 'ケアンズ',
    'パース': 'パース', 'perth': 'パース',
  };
  return tbl[name] ?? tbl[name.toLowerCase()] ?? null;
}

function getEffectiveWeeks(phases: Phase[], total: number): number[] {
  if (phases.length === 0) return [];
  const nonLastSum = phases.slice(0, -1).reduce((s, p) => s + p.weeks, 0);
  const lastWeeks  = Math.max(0, total - nonLastSum);
  return [...phases.slice(0, -1).map(p => p.weeks), lastWeeks];
}

function calcCosts(city: City, total: number, schoolWks: number, phases: Phase[], effWks: number[]) {
  const c = CITY_COSTS[city];
  let rent = 0, food = 0;
  for (let i = 0; i < phases.length; i++) {
    const t = phases[i].type;
    rent += c[t] * effWks[i];
    food += t === 'homestay' ? 0 : c.food * effWks[i];
  }
  const fixed  = (c.transport + INSURANCE + MISC) * total;
  const school = schoolWks * SCHOOL_FEE;
  const grand  = FLIGHTS_AUD + VISA_AUD + school + rent + food + fixed;
  return {
    flights: FLIGHTS_AUD, visa: VISA_AUD, school,
    rent, food,
    transport: c.transport * total,
    insurance: INSURANCE * total,
    misc:      MISC * total,
    weeklyAvg: total > 0 ? (rent + food + fixed) / total : 0,
    grand,
  };
}

export function CostSimulator({ onClose, chatSync }: { onClose: () => void; chatSync?: ChatSync }) {
  const [city, setCity]     = useState<City>('ブリスベン');
  const [total, setTotal]   = useState(24);
  const [school, setSchool] = useState(8);
  const [phases, setPhases] = useState<Phase[]>([
    { type: 'homestay',   weeks: 4 },
    { type: 'sharehouse', weeks: 0 },
  ]);
  const [flashField, setFlashField] = useState<string | null>(null);
  const [flashTotal, setFlashTotal] = useState(false);
  const [tokyoType, setTokyoType]   = useState<TokyoType>('sharehouse');

  const flash = (field: string) => {
    setFlashField(field);
    setTimeout(() => setFlashField(null), 1500);
  };

  useEffect(() => {
    if (!chatSync?.city) return;
    const n = normalizeCity(chatSync.city);
    if (n) { setCity(n); flash('city'); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSync?.city]);

  useEffect(() => {
    const w = chatSync?.totalWeeks;
    if (!w || w < 4) return;
    setTotal(Math.min(52, w));
    flash('total');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSync?.totalWeeks]);

  useEffect(() => {
    const s = chatSync?.schoolWeeks;
    if (s === null || s === undefined) return;
    setSchool(s);
    flash('school');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSync?.schoolWeeks]);

  const effWks = useMemo(() => getEffectiveWeeks(phases, total), [phases, total]);
  const costs  = useMemo(() => calcCosts(city, total, school, phases, effWks), [city, total, school, phases, effWks]);

  // 合計変化でトップカードをフラッシュ
  const prevGrandRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevGrandRef.current !== null && prevGrandRef.current !== costs.grand) {
      setFlashTotal(true);
      const t = setTimeout(() => setFlashTotal(false), 700);
      return () => clearTimeout(t);
    }
    prevGrandRef.current = costs.grand;
  }, [costs.grand]);

  // 東京比較
  const tokyoWeekly = Object.values(TOKYO_COSTS[tokyoType]).reduce((a, b) => a + b, 0);
  const tokyoGrand  = tokyoWeekly * total;
  const australiaJPY = Math.round(costs.grand * JPY_PER_AUD);
  const diff        = australiaJPY - tokyoGrand;

  const addPhase = () => {
    if (phases.length >= 4) return;
    setPhases(prev => {
      const last = prev[prev.length - 1];
      return [...prev.slice(0, -1), { type: 'apartment', weeks: 4 }, last];
    });
  };

  const removePhase = (i: number) => {
    setPhases(prev => prev.filter((_, idx) => idx !== i));
  };

  const setPhaseType  = (i: number, t: AccType) =>
    setPhases(prev => prev.map((p, idx) => idx === i ? { ...p, type: t } : p));

  const setPhaseWeeks = (i: number, delta: number) => {
    setPhases(prev => {
      const otherSum = prev.slice(0, -1).reduce((s, p, idx) => idx === i ? s : s + p.weeks, 0);
      const max = Math.max(1, total - otherSum - 1);
      const next = Math.max(1, Math.min(prev[i].weeks + delta, max));
      return prev.map((p, idx) => idx === i ? { ...p, weeks: next } : p);
    });
  };

  const jpy    = (v: number) => `¥${Math.round(v * JPY_PER_AUD).toLocaleString()}`;
  const jpyRaw = (v: number) => `¥${Math.round(v).toLocaleString()}`;
  const aud    = (v: number) => `A$${Math.round(v).toLocaleString()}`;
  const months = (w: number) => `約${Math.round(w / 4.3)}ヶ月`;
  const hasChatSync = !!(chatSync?.city || chatSync?.totalWeeks || chatSync?.schoolWeeks);

  const rows = [
    { label: '✈️ 航空券（片道目安）', value: costs.flights },
    { label: '📄 ビザ申請費',         value: costs.visa },
    ...(costs.school > 0 ? [{ label: '🎓 語学学校費', value: costs.school }] : []),
    { label: '🏠 家賃・滞在費',        value: costs.rent },
    ...(costs.food > 0 ? [{ label: '🍽️ 食費', value: costs.food }] : []),
    { label: '🚌 交通費',             value: costs.transport },
    { label: '🛡️ 海外保険',          value: costs.insurance },
    { label: '📱 通信・娯楽',         value: costs.misc },
  ];

  const flashCls = 'ring-2 ring-primary/30 bg-primary/[0.03] rounded-xl p-1.5 -mx-1.5';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>💰</span>
          <span className="text-sm font-bold text-primary">費用シミュレーター</span>
          {hasChatSync && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              🔗 チャット連動中
            </span>
          )}
        </div>
        <button onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-muted hover:text-primary transition-all text-sm">✕</button>
      </div>

      {/* ── リアルタイム合計（常時表示） ── */}
      <div className={`flex-shrink-0 px-4 py-3 border-b border-border transition-colors duration-300 ${
        flashTotal ? 'bg-primary/10' : 'bg-gradient-to-br from-primary/[0.06] to-transparent'
      }`}>
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-0.5">合計費用（目安）</div>
            <div className="text-2xl font-bold text-primary tabular-nums leading-none">{jpy(costs.grand)}</div>
            <div className="text-[11px] text-muted mt-0.5">{aud(costs.grand)}</div>
          </div>
          <div className="text-right text-[10px] text-muted leading-relaxed">
            <div className="font-medium">{city}・{total}週</div>
            {school > 0 && <div>語学 {school}週含む</div>}
          </div>
        </div>
        <div className="flex rounded-full overflow-hidden h-2 gap-px">
          {[
            { value: costs.flights + costs.visa, color: 'bg-orange-300' },
            { value: costs.school,               color: 'bg-amber-400'  },
            { value: costs.rent,                 color: 'bg-primary'    },
            { value: costs.food,                 color: 'bg-emerald-400'},
            { value: costs.transport + costs.insurance + costs.misc, color: 'bg-slate-300' },
          ].filter(s => s.value > 0).map((seg, i) => (
            <div key={i} style={{ width: `${(seg.value / costs.grand) * 100}%` }}
              className={`transition-all duration-500 ${seg.color}`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0 mt-1.5">
          {[
            { label: '渡航・ビザ', value: costs.flights + costs.visa, color: 'bg-orange-300' },
            { label: '学校',       value: costs.school,               color: 'bg-amber-400'  },
            { label: '家賃',       value: costs.rent,                 color: 'bg-primary'    },
            { label: '食費',       value: costs.food,                 color: 'bg-emerald-400'},
            { label: '生活費',     value: costs.transport + costs.insurance + costs.misc, color: 'bg-slate-300' },
          ].filter(s => s.value > 0).map((seg, i) => (
            <div key={i} className="flex items-center gap-1 text-[9px] text-muted">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${seg.color}`} />
              <span>{seg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-4 space-y-4 border-b border-border/40">

          {/* 都市 */}
          <div className={`transition-all duration-300 ${flashField === 'city' ? flashCls : ''}`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">🏙️ 都市</label>
              {flashField === 'city' && (
                <span className="text-[10px] text-primary font-medium animate-pulse">AIが更新 ✦</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {CITIES.map(c => (
                <button key={c} onClick={() => setCity(c)}
                  className={`py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    city === c ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 滞在期間 */}
          <div className={`transition-all duration-300 ${flashField === 'total' ? flashCls : ''}`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">📅 滞在期間</label>
              <div className="flex items-center gap-1.5">
                {flashField === 'total' && (
                  <span className="text-[10px] text-primary font-medium animate-pulse">AIが更新 ✦</span>
                )}
                <span className="text-sm font-bold text-primary">
                  {total}週
                  <span className="text-[11px] font-normal text-muted ml-1">（{months(total)}）</span>
                </span>
              </div>
            </div>
            {/* 月クイック選択 */}
            <div className="flex gap-1 mb-2 overflow-x-auto pb-0.5 scrollbar-hide">
              {MONTH_PRESETS.map(p => (
                <button key={p.weeks} onClick={() => setTotal(p.weeks)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                    total === p.weeks
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-primary border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            <input type="range" min={4} max={52} step={2} value={total}
              onChange={e => setTotal(Number(e.target.value))}
              className="w-full accent-primary h-1.5 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-muted mt-0.5">
              <span>1ヶ月</span><span>半年</span><span>1年</span>
            </div>
          </div>

          {/* 語学学校 */}
          <div className={`transition-all duration-300 ${flashField === 'school' ? flashCls : ''}`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-muted uppercase tracking-wide">🎓 語学学校</label>
              {flashField === 'school' && (
                <span className="text-[10px] text-primary font-medium animate-pulse">AIが更新 ✦</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[0, 4, 8, 12, 16, 24].map(w => (
                <button key={w} onClick={() => setSchool(w)}
                  className={`py-1 px-2.5 rounded-full text-xs font-medium transition-all border ${
                    school === w ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}>
                  {w === 0 ? 'なし' : `${w}週`}
                </button>
              ))}
            </div>
          </div>

          {/* 滞在プラン（フェーズ） */}
          <div>
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wide block mb-2">🏠 滞在プラン</label>
            <div className="flex rounded-full overflow-hidden h-2.5 mb-2 gap-px">
              {phases.map((phase, i) => {
                const pct = total > 0 ? (effWks[i] / total) * 100 : 0;
                return (
                  <div key={i} style={{ width: `${pct}%` }}
                    className={`transition-all duration-500 ${ACC_BAR[phase.type]}`} />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-3">
              {phases.map((phase, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] text-muted">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ACC_BAR[phase.type]}`} />
                  <span>{ACC_FULL[phase.type]}・{effWks[i]}週</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {phases.map((phase, i) => {
                const isLast = i === phases.length - 1;
                const canRemove = !isLast || phases.length > 1;
                return (
                  <div key={i} className={`border rounded-xl p-2.5 transition-colors ${ACC_CARD[phase.type]}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${ACC_TEXT[phase.type]}`}>
                        フェーズ {i + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {isLast ? (
                          <span className={`text-[11px] font-semibold ${ACC_TEXT[phase.type]}`}>
                            残り {effWks[i]}週間
                          </span>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => setPhaseWeeks(i, -1)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold hover:bg-white/50 transition-all ${ACC_TEXT[phase.type]}`}>
                              −
                            </button>
                            <span className={`text-xs font-bold w-8 text-center ${ACC_TEXT[phase.type]}`}>
                              {phase.weeks}週
                            </span>
                            <button onClick={() => setPhaseWeeks(i, +1)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold hover:bg-white/50 transition-all ${ACC_TEXT[phase.type]}`}>
                              +
                            </button>
                          </div>
                        )}
                        {canRemove && (
                          <button onClick={() => removePhase(i)}
                            className="text-muted/50 hover:text-red-400 transition-colors text-xs leading-none ml-0.5">✕</button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {(['homestay', 'sharehouse', 'apartment'] as AccType[]).map(t => (
                        <button key={t} onClick={() => setPhaseType(i, t)}
                          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                            phase.type === t ? ACC_BTN_ON[t] : 'bg-white/70 text-muted hover:bg-white'
                          }`}>
                          <div className="text-[10px] font-semibold">{ACC_SHORT[t]}</div>
                          <div className={`text-[9px] ${phase.type === t ? 'text-white/70' : 'text-muted/60'}`}>{ACC_SUB[t]}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {phases.length < 4 && (
              <button onClick={addPhase}
                className="mt-2 text-[11px] text-primary/50 hover:text-primary flex items-center gap-1 transition-colors">
                <span className="text-base leading-none font-light">+</span>
                <span>フェーズを追加</span>
              </button>
            )}
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
                <div className="text-2xl font-bold text-primary">{jpy(costs.grand)}</div>
                <div className="text-xs text-muted">{aud(costs.grand)}</div>
              </div>
            </div>
          </div>

          {/* 週平均生活費 */}
          <div className="mt-3 bg-primary/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-primary">週あたり生活費（平均）</div>
              <div className="text-[10px] text-muted">航空券・ビザ・学校を除く</div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-primary">{jpy(costs.weeklyAvg)}</div>
              <div className="text-[10px] text-muted">{aud(costs.weeklyAvg)}/週</div>
            </div>
          </div>

          {/* 🗾 東京との比較 */}
          <div className="mt-4 border border-border/60 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-border/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <span>🗾</span>
                <span>東京で同じ期間暮らしたら？</span>
              </div>
              <div className="flex gap-1">
                {(['sharehouse', 'apartment'] as TokyoType[]).map(t => (
                  <button key={t} onClick={() => setTokyoType(t)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${
                      tokyoType === t ? 'bg-primary text-white border-primary' : 'bg-white text-muted border-border hover:border-primary/40'
                    }`}>
                    {t === 'sharehouse' ? 'シェアハウス' : '1Kアパート'}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-3 space-y-2">
              {/* 東京 */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <div>
                  <div className="text-[11px] font-medium text-muted">東京（{total}週・生活費のみ）</div>
                  <div className="text-[10px] text-muted/60">家賃・食費・交通費など</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">{jpyRaw(tokyoGrand)}</div>
                  <div className="text-[10px] text-muted">{jpyRaw(tokyoWeekly)}/週</div>
                </div>
              </div>

              {/* オーストラリア */}
              <div className="flex items-center justify-between bg-primary/5 rounded-xl px-3 py-2">
                <div>
                  <div className="text-[11px] font-medium text-primary">オーストラリア（合計）</div>
                  <div className="text-[10px] text-muted/60">航空券・ビザ・学校含む</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">{jpyRaw(australiaJPY)}</div>
                </div>
              </div>

              {/* 差額 */}
              <div className={`rounded-xl px-3 py-2 text-center ${diff > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <span className="text-[11px] text-muted">海外留学は東京より</span>
                <span className={`text-[11px] font-bold ml-1 ${diff > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {diff > 0 ? `+${jpyRaw(diff)} 多くかかる見込み` : `${jpyRaw(Math.abs(diff))} 節約できる`}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted mt-3 leading-relaxed">
            ※ 為替・時期・生活スタイルにより変動します。東京データはNumbero 2025参考値。詳細はエージェントへの無料相談をご利用ください。
          </p>
        </div>
      </div>
    </div>
  );
}
