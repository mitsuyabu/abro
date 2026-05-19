# Prompt 03:費用シミュレーター

## 前提
- `docs/PROJECT.md` を読むこと
- Prompt 01, 02 が完了していること
- ホーム画面の「💰 費用シミュレート」チップから起動できるようにする

---

## ゴール

ユーザーが AI と会話しながら、横/下に表示される費用シミュレーターでリアルタイムに留学費用を計算・調整できる。
**常時表示ではなく、文脈起動型**(チップ or AI が促したときだけ表示)。

---

## やること

### 1. データモデル

`supabase/migrations/0003_cost_simulations.sql`:

```sql
-- 費用シミュレーション(プラン単位)
CREATE TABLE public.cost_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'JPY',
  exchange_rates JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 費用項目
CREATE TABLE public.cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES public.cost_simulations(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN (
    'visa', 'tuition', 'flight', 'accommodation',
    'food', 'transport', 'insurance', 'phone',
    'pocket_money', 'reserve', 'other'
  )) NOT NULL,
  label TEXT NOT NULL,
  amount_jpy INTEGER NOT NULL DEFAULT 0,
  frequency TEXT CHECK (frequency IN ('once', 'monthly', 'weekly', 'daily')) DEFAULT 'once',
  duration INTEGER DEFAULT 1,
  note TEXT,
  is_estimated BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.cost_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own simulations" ON public.cost_simulations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own cost items" ON public.cost_items
  FOR ALL USING (
    simulation_id IN (
      SELECT id FROM public.cost_simulations WHERE user_id = auth.uid()
    )
  );
```

### 2. デフォルトカテゴリ

`lib/cost/defaults.ts`:

```typescript
export const COST_CATEGORIES = [
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
];
```

### 3. シミュレーター UI コンポーネント

#### モバイル(縦画面):ハーフモーダル
`components/cost/CostSimulatorSheet.tsx`:
- `@gorhom/bottom-sheet` を使用
- スナップポイント:`[20%, 50%, 90%]`
- ヘッダー:タイトル + 合計金額 + 閉じるボタン
- ボディ:カテゴリ別の項目リスト(編集可能)
- フッター:「LINEで共有」「保存」「親に送る」ボタン

```bash
npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

#### 表示構造
```
┌──────────────────────────────────┐
│ 💰 費用シミュレート         [×]  │
│ ────────────────────────────────│
│ 合計:¥1,250,000(6ヶ月想定)   │
│ ────────────────────────────────│
│ 📄 ビザ申請料           ¥12,000 │
│ 🎓 学費(週)×24週     ¥450,000 │
│ ✈️ 航空券(往復)       ¥95,000 │
│ 🏠 シェアハウス(月)×6 ¥360,000 │
│ 🍽️ 食費(月)×6        ¥180,000 │
│ ...                              │
│ ────────────────────────────────│
│ [+ 項目を追加]                   │
│ ────────────────────────────────│
│ [LINEで共有] [保存] [親に送る]  │
└──────────────────────────────────┘
```

#### 個別項目の編集 UI
- 金額入力(数字キーボード、3桁区切り表示)
- 頻度切替(一回 / 月 / 週 / 日)
- 期間(月数 or 週数)
- メモ
- ✕で削除

### 4. AI との連動

#### 文脈起動のトリガー
1. ホーム画面で「💰 費用シミュレート」チップタップ
   → 現在編集中のプランがあればそれに紐づけ、なければ新規シミュ作成
2. チャットでユーザーが「予算」「いくら」「費用」などのキーワード入力
   → AI が「シミュレートしますか?」とサジェスト
3. AI がプラン要素(学費・航空券など)を提案した直後
   → AI 応答に「📊 シミュレートする」ボタンを埋め込み

#### AI からの自動更新
プラン要素が追加・変更されると、対応する `cost_items` を自動更新:
- `plan_items.item_type = 'school'` の追加 → `cost_items.category = 'tuition'` を更新
- `plan_items.cost_jpy` の変更 → `cost_items.amount_jpy` に反映

これは Supabase の Trigger で実装(`supabase/migrations/0003b_cost_triggers.sql`):

```sql
CREATE OR REPLACE FUNCTION sync_plan_to_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- plan_items.item_type を category にマッピングして cost_items を upsert
  -- 詳細は実装時に決定
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_plan_item_change
  AFTER INSERT OR UPDATE ON public.plan_items
  FOR EACH ROW EXECUTE FUNCTION sync_plan_to_cost();
```

### 5. 合計計算ロジック

`lib/cost/calculate.ts`:

```typescript
export function calculateTotalJpy(items: CostItem[]): number {
  return items.reduce((sum, item) => {
    return sum + item.amount_jpy * item.duration;
  }, 0);
}

export function calculateMonthlyBurnRate(items: CostItem[], months: number): number {
  // 一回払いを除いた月次の支出
  return items
    .filter(item => item.frequency !== 'once')
    .reduce((sum, item) => {
      // weekly → monthly などの正規化
      return sum + normalizeToMonthly(item);
    }, 0);
}
```

### 6. 共有機能

#### LINE 共有
`expo-sharing` または Web Share API でテキスト共有:

```
【Abro】私の留学プラン費用見積もり
🌏 メルボルン・6ヶ月
💰 合計:¥1,250,000

内訳:
🎓 学費 ¥450,000
🏠 滞在費 ¥360,000
🍽️ 食費 ¥180,000
✈️ 航空券 ¥95,000
...

プランを見る → https://abro.app/p/{plan_id}
```

#### 親に送る
親アカウント連携済みの場合は内部通知。
未連携なら LINE 共有を促す。

### 7. ホーム画面チップの実装

```tsx
// Chats タブのホーム
<View className="flex-row gap-3">
  <Chip
    icon="💰"
    label="費用シミュレート"
    onPress={() => router.push('/chat/new?mode=cost_simulation')}
  />
  ...
</View>
```

チャット画面で `mode=cost_simulation` のとき:
- AI が冒頭で費用に関する質問を始める
- 自動でシミュレーターシートを開く
- 既存プランがあれば紐付け、なければ新規作成

### 8. プラン詳細画面との統合

`app/plan/[id].tsx` の上部に「💰 費用を見る」ボタンを追加。
タップでシミュレーターシートを開く。

### 9. 為替対応(将来準備)

今は日本円のみだが、データモデルは多通貨対応に。
`exchange_rates` JSONB に当時のレートを保存:
```json
{ "USD": 150.5, "AUD": 98.2, "CAD": 110.3, "GBP": 190.1 }
```

将来のフェーズで現地通貨表示を追加する。

---

## UI/UX 重要事項

### 文脈起動の徹底
- ホーム画面に常時シミュレーターは出さない
- プラン詳細画面でも「開く」ボタン経由
- チャット中も自動展開せず、ユーザーの意思で開く

### モバイル最適化
- ハーフモーダルで親指の届く位置に操作系を集中
- 数字入力時に画面を遮らないよう自動スクロール
- スワイプで畳むと画面下に「💰 ¥1,250,000」のミニバーが残る

### 親への配慮
- 「親に送る」ボタンは目立つ位置に
- 共有テキストは丁寧な日本語で
- 金額は親が見て安心する/危機感を持つ両方に対応した内訳付き

---

## 成果物チェックリスト

- [ ] 「費用シミュレート」チップから新規シミュ作成できる
- [ ] チャットで AI 提案 → シミュレーターに自動反映される
- [ ] 項目を手動で追加・編集・削除できる
- [ ] 合計金額がリアルタイムに更新される
- [ ] LINE 共有テキストが生成される
- [ ] プラン詳細画面から開ける
- [ ] サインアウト/再ログイン後もデータが残る
- [ ] `docs/CHANGELOG.md` 更新

完了報告には:
- 実装ファイル一覧
- AI とのインテグレーションの最終仕様
- 既知の制限(為替、税金、地域差異など)
