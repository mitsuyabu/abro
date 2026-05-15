export interface TaskTemplate {
  offsetDays: number; // 出発日からの日数(負=前)
  title: string;
  category: string;
  isMilestone: boolean;
  description?: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  { offsetDays: -180, title: 'エージェント決定', category: 'agent', isMilestone: false, description: '留学エージェントを比較・決定する' },
  { offsetDays: -150, title: '学校仮申込み', category: 'school', isMilestone: false, description: '志望する語学学校に仮申込みを行う' },
  { offsetDays: -120, title: 'パスポート確認・更新', category: 'document', isMilestone: false, description: 'パスポートの有効期限を確認し、必要なら更新する' },
  { offsetDays: -90, title: 'ビザ申請開始', category: 'visa', isMilestone: true, description: '必要書類を揃えてビザ申請を開始する' },
  { offsetDays: -75, title: '航空券予約', category: 'flight', isMilestone: false, description: '往復航空券を予約する' },
  { offsetDays: -60, title: '海外保険加入', category: 'insurance', isMilestone: false, description: '海外旅行保険・留学保険に加入する' },
  { offsetDays: -45, title: '滞在先決定', category: 'accommodation', isMilestone: true, description: 'ホームステイ・シェアハウス等の滞在先を確定する' },
  { offsetDays: -30, title: '現地通貨両替', category: 'money', isMilestone: false, description: '現地通貨・トラベルカードを準備する' },
  { offsetDays: -21, title: 'SIM・WiFi 準備', category: 'phone', isMilestone: false, description: '現地用 SIM カードまたは WiFi ルーターを手配する' },
  { offsetDays: -14, title: '荷物パッキング開始', category: 'packing', isMilestone: false, description: '持ち物リストを作成してパッキングを始める' },
  { offsetDays: -7, title: '各種手続き最終確認', category: 'final', isMilestone: false, description: 'ビザ・保険・航空券・宿泊先を最終確認する' },
  { offsetDays: -1, title: '出発前日チェック', category: 'final', isMilestone: true, description: 'パスポート・航空券・現金・荷物を最終チェック' },
];

export const CATEGORY_ICONS: Record<string, string> = {
  agent: '🤝',
  school: '🎓',
  document: '📋',
  visa: '📄',
  flight: '✈️',
  insurance: '🛡️',
  accommodation: '🏠',
  money: '💴',
  phone: '📱',
  packing: '🧳',
  final: '✅',
  other: '📌',
};
