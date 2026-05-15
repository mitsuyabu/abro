export const DEFAULT_CATEGORIES = [
  { key: 'schools', label: '学校候補', icon: '🎓', is_default: true, order_index: 0 },
  { key: 'living_area', label: '生活エリア候補', icon: '🏘️', is_default: true, order_index: 1 },
  { key: 'jobs', label: '仕事探し候補', icon: '💼', is_default: true, order_index: 2 },
  { key: 'leisure', label: '観光・休日候補', icon: '🌅', is_default: true, order_index: 3 },
  { key: 'visa', label: 'ビザ・手続き', icon: '📄', is_default: true, order_index: 4 },
  { key: 'study', label: '英語学習', icon: '📚', is_default: true, order_index: 5 },
  { key: 'safety', label: '不安解消メモ', icon: '🛡️', is_default: true, order_index: 6 },
  { key: 'finance', label: 'お金・銀行', icon: '💳', is_default: true, order_index: 7 },
  { key: 'health', label: '健康・医療', icon: '🏥', is_default: true, order_index: 8 },
  { key: 'food', label: '食・グルメ', icon: '🍴', is_default: true, order_index: 9 },
  { key: 'transport', label: '交通', icon: '🚇', is_default: true, order_index: 10 },
  { key: 'others', label: 'その他', icon: '📌', is_default: true, order_index: 11 },
] as const;

export type DefaultCategoryKey = typeof DEFAULT_CATEGORIES[number]['key'];

export function getCategoryIcon(key: string): string {
  return DEFAULT_CATEGORIES.find((c) => c.key === key)?.icon ?? '📌';
}

export function getCategoryLabel(key: string): string {
  return DEFAULT_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export const SOURCE_TYPE_ICONS: Record<string, string> = {
  url: '🔗',
  video: '▶️',
  image: '📷',
  pdf: '📄',
  note: '📝',
  map_pin: '📍',
};
