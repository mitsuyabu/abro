import type { CostCategory, CostFrequency } from '@/types';

export const COST_CATEGORIES: {
  key: CostCategory;
  label: string;
  icon: string;
  defaultFrequency: CostFrequency;
}[] = [
  { key: 'visa', label: 'ビザ申請料', icon: '📄', defaultFrequency: 'once' },
  { key: 'tuition', label: '学費', icon: '🎓', defaultFrequency: 'weekly' },
  { key: 'flight', label: '航空券', icon: '✈️', defaultFrequency: 'once' },
  { key: 'accommodation', label: '滞在費', icon: '🏠', defaultFrequency: 'monthly' },
  { key: 'food', label: '食費', icon: '🍽️', defaultFrequency: 'monthly' },
  { key: 'transport', label: '交通費', icon: '🚇', defaultFrequency: 'monthly' },
  { key: 'insurance', label: '海外保険', icon: '🛡️', defaultFrequency: 'once' },
  { key: 'phone', label: '通信費', icon: '📱', defaultFrequency: 'monthly' },
  { key: 'pocket_money', label: 'お小遣い', icon: '💵', defaultFrequency: 'monthly' },
  { key: 'reserve', label: '予備費(推奨10-15%)', icon: '💰', defaultFrequency: 'once' },
  { key: 'other', label: 'その他', icon: '📌', defaultFrequency: 'once' },
];

export const FREQUENCY_LABELS: Record<CostFrequency, string> = {
  once: '一回',
  monthly: '月',
  weekly: '週',
  daily: '日',
};

export const PLAN_ITEM_TYPE_TO_CATEGORY: Record<string, CostCategory> = {
  school: 'tuition',
  accommodation: 'accommodation',
  flight: 'flight',
  insurance: 'insurance',
  visa: 'visa',
  activity: 'other',
  other: 'other',
};

export function getCategoryMeta(key: CostCategory) {
  return COST_CATEGORIES.find((c) => c.key === key) ?? { key, label: key, icon: '📌', defaultFrequency: 'once' as const };
}
