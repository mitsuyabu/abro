'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface PlanDetails {
  duration_label?: string;
  pre_departure?: Record<string, string>;
  timeline?: { period: string; tasks: string[] }[];
  notes?: string[];
  saved_items?: { label: string; type: 'school' | 'city' | 'other' }[];
}

interface Plan {
  id: string;
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

export default function PlanDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // カスタマイズ
  const [notes, setNotes] = useState<string[]>([]);
  const [savedItems, setSavedItems] = useState<{ label: string; type: 'school' | 'city' | 'other' }[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemType, setNewItemType] = useState<'school' | 'city' | 'other'>('other');

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
    supabase.from('plans').select('*').eq('id', id).single().then(({ data }) => {
      const p = data as Plan;
      setPlan(p);
      setNotes(p?.details?.notes ?? []);
      setSavedItems(p?.details?.saved_items ?? []);
      setLoading(false);
    });
  }, [id]);

  const persistDetails = async (partial: Partial<PlanDetails>) => {
    const current = plan?.details ?? {};
    const merged = { ...current, ...partial };
    await supabase.from('plans').update({ details: merged }).eq('id', id);
    setPlan(prev => prev ? { ...prev, details: merged } : prev);
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

  const cover = (plan.destination_city && CITY_COVER[plan.destination_city]) || FALLBACK_COVER;
  const duration = plan.details?.duration_label ?? (plan.duration_weeks ? `${plan.duration_weeks}週間` : null);
  const budgetMin = plan.budget_jpy ? Math.round(plan.budget_jpy / 10000) : null;
  const budgetMax = plan.budget_max_jpy ? Math.round(plan.budget_max_jpy / 10000) : null;
  const budgetLabel = budgetMin ? `${budgetMin}${budgetMax && budgetMax !== budgetMin ? `〜${budgetMax}` : ''}万円` : null;
  const preDeparture = plan.details?.pre_departure ?? {};
  const timeline = plan.details?.timeline ?? [];
  const featureSections = Object.entries(preDeparture).map(([key, val]) => ({ key, icon: PRE_ICONS[key] ?? '📌', label: PRE_LABELS[key] ?? key, content: val }));

  return (
    <div className="h-full overflow-y-auto bg-white relative">
      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* トップバー */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-between">
        <Link href="/plans" className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors">
          <span className="text-lg leading-none">‹</span>
          <span>プラン一覧</span>
        </Link>
        <button
          onClick={() => setShowRegenForm(v => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/5 transition-all"
        >
          <span>✨</span>
          <span>再提案する</span>
        </button>
      </div>

      <div className="flex min-h-0">
        {/* 左：メインコンテンツ */}
        <div className="flex-1 min-w-0 px-6 sm:px-10 py-8">
          {/* タイトル */}
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-4 leading-snug">{plan.title}</h1>

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
          <Link href="/chat" className="flex items-center gap-3 border border-border rounded-2xl px-4 py-3 mb-8 hover:border-primary/40 hover:bg-gray-50 transition-all group">
            <span className="text-muted text-sm flex-1">このプランについて質問する...</span>
            <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm group-hover:opacity-80 transition-opacity">→</span>
          </Link>

          {/* ━━ カスタマイズ ━━ */}
          <div className="mb-8">
            <h2 className="text-base font-bold text-primary mb-4">メモ・カスタマイズ</h2>

            {/* 再提案フォーム */}
            {showRegenForm && (
              <div className="mb-4 border border-primary/25 rounded-2xl p-4 bg-primary/5">
                <p className="text-xs font-semibold text-primary mb-2">追加のリクエスト（任意）</p>
                <p className="text-xs text-muted mb-2">下のメモ・保存済みカードも再提案に反映されます</p>
                <textarea
                  value={additionalRequest}
                  onChange={e => setAdditionalRequest(e.target.value)}
                  placeholder="例：費用をもっと抑えたい、シェアハウスに住みたい、語学学校は12週間以上希望"
                  className="w-full text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary/40 resize-none h-20 bg-white"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-80 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {isRegenerating
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>生成中...</span></>
                      : '✨ この内容で再提案する'
                    }
                  </button>
                  <button onClick={() => setShowRegenForm(false)} className="text-sm text-muted px-4 hover:text-primary">キャンセル</button>
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

            {/* 保存済みカード */}
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">保存済みカード</p>
              {savedItems.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {savedItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2">
                      <span className="text-base flex-shrink-0">{ITEM_TYPE_ICONS[item.type]}</span>
                      <span className="flex-1 text-sm text-primary leading-snug">{item.label}</span>
                      <button onClick={() => removeSavedItem(i)} className="text-muted hover:text-red-400 transition-colors text-sm flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              )}
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

          {/* タイムライン */}
          {timeline.length > 0 && (
            <div className="mb-8">
              <h2 className="text-base font-bold text-primary mb-4">準備タイムライン</h2>
              <div className="flex flex-col gap-4">
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-bold text-primary">{item.period}</p>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {item.tasks.map((task, j) => <li key={j} className="text-sm text-muted">・{task}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右：渡航前準備 + 都市画像 */}
        <div className="hidden lg:flex w-80 xl:w-96 flex-shrink-0 border-l border-border flex-col">
          {/* 都市画像 */}
          <div className="relative h-44 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={plan.destination_city ?? 'プラン'} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
            {plan.destination_city && <div className="absolute bottom-3 left-4 text-white font-bold text-base">{plan.destination_city}</div>}
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
