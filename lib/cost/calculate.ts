import type { CostItem, CostFrequency } from '@/types';

export function itemTotalJpy(item: Pick<CostItem, 'amount_jpy' | 'frequency' | 'duration'>): number {
  return item.amount_jpy * (item.frequency === 'once' ? 1 : item.duration);
}

export function calculateTotalJpy(items: CostItem[]): number {
  return items.reduce((sum, item) => sum + itemTotalJpy(item), 0);
}

export function calculateMonthlyBurnRate(items: CostItem[]): number {
  return items
    .filter((item) => item.frequency !== 'once')
    .reduce((sum, item) => sum + normalizeToMonthly(item), 0);
}

function normalizeToMonthly(item: CostItem): number {
  switch (item.frequency as CostFrequency) {
    case 'monthly': return item.amount_jpy;
    case 'weekly': return item.amount_jpy * 4.3;
    case 'daily': return item.amount_jpy * 30;
    default: return 0;
  }
}

export function formatJpy(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

export function buildShareText(
  items: CostItem[],
  total: number,
  destination?: string,
  durationMonths?: number,
): string {
  const destLine = destination ? `🌏 ${destination}${durationMonths ? `・${durationMonths}ヶ月` : ''}` : '';
  const itemLines = items.map((item) => {
    const meta = item.frequency === 'once'
      ? ''
      : `/${item.frequency === 'monthly' ? '月' : item.frequency === 'weekly' ? '週' : '日'}×${item.duration}`;
    return `  ${item.label} ${formatJpy(itemTotalJpy(item))}${meta}`;
  }).join('\n');

  return [
    '【Abro】私の留学費用見積もり',
    destLine,
    `💰 合計：${formatJpy(total)}`,
    '',
    '内訳：',
    itemLines,
    '',
    'Abro で留学プランを立てよう → https://abro.app',
  ].filter((l) => l !== undefined && !(l === '' && !destLine)).join('\n');
}
