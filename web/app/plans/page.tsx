'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Plan {
  id: string;
  title: string;
  destination_country: string | null;
  destination_city: string | null;
  duration_weeks: number | null;
  budget_jpy: number | null;
  budget_max_jpy: number | null;
  reason: string | null;
  initial_plan: string | null;
  status: 'draft' | 'private' | 'shared' | 'public';
  details: {
    duration_label?: string;
    pre_departure?: Record<string, string>;
    timeline?: { period: string; tasks: string[] }[];
  } | null;
  created_at: string;
}

const STATUS_META = {
  draft:   { label: '下書き', color: 'bg-gray-100 text-gray-600' },
  private: { label: '非公開', color: 'bg-blue-100 text-blue-700' },
  shared:  { label: '共有中', color: 'bg-green-100 text-green-700' },
  public:  { label: '公開中', color: 'bg-purple-100 text-purple-700' },
};

const PRE_DEPARTURE_LABELS: Record<string, string> = {
  visa: 'ビザ申請',
  school: '学校選び',
  accommodation: '宿泊・住まい',
  insurance: '保険',
  flights: '航空券',
  local_preparation: '現地準備',
  job_search: '仕事探し',
  english_study: '英語学習',
};

function PlanDetailPanel({ plan }: { plan: Plan }) {
  const duration = plan.details?.duration_label ?? (plan.duration_weeks ? `${plan.duration_weeks}週間` : null);
  const budgetMin = plan.budget_jpy ? Math.round(plan.budget_jpy / 10000) : null;
  const budgetMax = plan.budget_max_jpy ? Math.round(plan.budget_max_jpy / 10000) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* 基本情報 */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <h2 className="text-base font-bold text-primary mb-3">{plan.title}</h2>
        <div className="flex flex-col gap-1.5 text-sm text-muted">
          {plan.destination_country && <span>📍 {plan.destination_country}{plan.destination_city ? ` / ${plan.destination_city}` : ''}</span>}
          {duration && <span>🗓 {duration}</span>}
          {budgetMin && <span>💰 {budgetMin}{budgetMax && budgetMax !== budgetMin ? `〜${budgetMax}` : ''}万円</span>}
        </div>
        {plan.reason && (
          <div className="mt-3 bg-primary/5 rounded-xl px-3 py-2">
            <p className="text-xs text-primary leading-relaxed">{plan.reason}</p>
          </div>
        )}
        {plan.initial_plan && (
          <p className="mt-2 text-xs text-muted leading-relaxed">{plan.initial_plan}</p>
        )}
      </div>

      {/* 渡航前準備 */}
      {plan.details?.pre_departure && (
        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-primary mb-3">渡航前準備</h3>
          <div className="flex flex-col gap-3">
            {Object.entries(plan.details.pre_departure).map(([key, val]) => (
              <div key={key}>
                <p className="text-xs font-bold text-primary mb-0.5">{PRE_DEPARTURE_LABELS[key] ?? key}</p>
                <p className="text-xs text-muted leading-relaxed">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* タイムライン */}
      {plan.details?.timeline && plan.details.timeline.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-primary mb-3">準備タイムライン</h3>
          <div className="flex flex-col gap-3">
            {plan.details.timeline.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                  {i < (plan.details?.timeline?.length ?? 0) - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-xs font-bold text-primary">{item.period}</p>
                  <ul className="mt-0.5 flex flex-col gap-0.5">
                    {item.tasks.map((task, j) => (
                      <li key={j} className="text-xs text-muted">・{task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('plans')
      .select('id, title, destination_country, destination_city, duration_weeks, budget_jpy, budget_max_jpy, reason, initial_plan, status, details, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPlans((data as Plan[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-full">
      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary">あなたのプラン</h1>
            <a
              href="/chat"
              className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
            >
              <span>✨</span>
              <span>AIでプランを作る</span>
            </a>
          </div>

          {/* プランリスト */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white border border-border rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-200 to-green-200 flex items-center justify-center">
                <span className="text-3xl">🧳</span>
              </div>
              <h2 className="text-lg font-semibold text-primary">まだプランがありません</h2>
              <p className="text-muted text-sm text-center">作成したプランがここに表示されます。<br />AI に相談して最初のプランを作りましょう！</p>
              <a
                href="/chat"
                className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity"
              >
                プランを作成する
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {plans.map((plan) => {
                const s = STATUS_META[plan.status] ?? STATUS_META.draft;
                const duration = plan.details?.duration_label ?? (plan.duration_weeks ? `${plan.duration_weeks}週間` : null);
                const budgetMin = plan.budget_jpy ? Math.round(plan.budget_jpy / 10000) : null;
                const budgetMax = plan.budget_max_jpy ? Math.round(plan.budget_max_jpy / 10000) : null;
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(isSelected ? null : plan)}
                    className={`bg-white border rounded-2xl p-5 text-left hover:shadow-sm transition-all group ${isSelected ? 'border-primary/50 shadow-sm' : 'border-border hover:border-primary/30'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 gap-1.5 flex flex-col">
                        <h3 className="text-base font-semibold text-primary truncate">{plan.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {plan.destination_country && (
                            <span className="text-xs text-muted">📍 {plan.destination_country}{plan.destination_city ? ` / ${plan.destination_city}` : ''}</span>
                          )}
                          {duration && <><span className="text-muted text-xs">·</span><span className="text-xs text-muted">🗓 {duration}</span></>}
                          {budgetMin && <><span className="text-muted text-xs">·</span><span className="text-xs text-muted">💰 {budgetMin}{budgetMax && budgetMax !== budgetMin ? `〜${budgetMax}` : ''}万円</span></>}
                        </div>
                        <p className="text-xs text-muted">{new Date(plan.created_at).toLocaleDateString('ja-JP')}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 右パネル */}
      <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">
            {selectedPlan ? 'プラン詳細' : 'プランのヒント'}
          </span>
        </div>
        <div className="p-5">
          {selectedPlan ? (
            <PlanDetailPanel plan={selectedPlan} />
          ) : (
            <div className="flex flex-col gap-3">
              {[
                { emoji: '🤖', title: 'AI に提案してもらう', body: 'チャットで目的・期間・予算を伝えると AI が自動でプランを組み立てます' },
                { emoji: '👨‍👩‍👧', title: '親と共有する', body: '親子連携機能で保護者にプランを安全に共有できます' },
                { emoji: '🎓', title: 'エージェントを招待', body: 'プランにエージェントを招待して一緒に編集・相談できます' },
              ].map((tip) => (
                <div key={tip.title} className="bg-white border border-border rounded-xl p-4">
                  <p className="text-sm font-semibold text-primary mb-1">{tip.emoji} {tip.title}</p>
                  <p className="text-xs text-muted leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
