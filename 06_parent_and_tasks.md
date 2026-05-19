# Prompt 05:親アカウント連携 + タスク管理

## 前提
- `docs/PROJECT.md` 必読
- Prompt 01〜04 完了済み

---

## ゴール
1. 留学生の親が、子の留学計画・費用・進捗を見守れる
2. 出発までのタスクを時系列で自動生成・管理できる
3. 重要マイルストーンで親に通知

---

## やること

### 1. データモデル

`supabase/migrations/0005_parents_and_tasks.sql`:

```sql
-- 親子連携
CREATE TABLE public.parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('view', 'comment')) DEFAULT 'view',
  status TEXT CHECK (status IN ('pending', 'active', 'revoked')) DEFAULT 'pending',
  invitation_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  UNIQUE(child_user_id, parent_user_id)
);

-- タスク
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  priority INTEGER DEFAULT 0,
  is_milestone BOOLEAN DEFAULT FALSE,
  auto_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 親へのコメント(permission='comment' の場合のみ)
CREATE TABLE public.parent_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_link_id UUID NOT NULL REFERENCES public.parent_links(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('plan', 'plan_item', 'cost_item', 'task')) NOT NULL,
  target_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_comments ENABLE ROW LEVEL SECURITY;

-- 親リンクは双方が閲覧可能
CREATE POLICY "Parent link participants" ON public.parent_links
  FOR SELECT USING (auth.uid() IN (child_user_id, parent_user_id));

-- タスクは本人と承認済み親が閲覧可能
CREATE POLICY "Tasks readable by self and parent" ON public.tasks
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT parent_user_id FROM public.parent_links
      WHERE child_user_id = tasks.user_id AND status = 'active'
    )
  );

CREATE POLICY "Tasks editable by self" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);
```

### 2. 親招待フロー

#### 子側:
1. Me タブ → 「親を招待する」
2. 招待コード生成(短い英数字、有効期限7日)
3. LINE 共有 or QR コード表示
4. 親が承認するまで `status='pending'`

#### 親側:
1. アプリインストール、自分のアカウント作成
2. 「招待コードを入力」フローで子と紐づけ
3. 双方の承認で `status='active'`

#### 親モード
- 親が子の画面を見るときは「親モード」UI に切替
- 上部に「{child_name}さんのプラン」ラベル
- 編集はできない(`permission='comment'` ならコメントは可能)

### 3. タスク自動生成

新規プラン作成時に、AI が時系列タスクを自動生成:

```typescript
// supabase/functions/generate-tasks/index.ts

// プランの開始日から逆算してタスク生成
const tasks = [
  { offset: -180, title: 'エージェント決定', category: 'agent' },
  { offset: -150, title: '学校仮申込み', category: 'school' },
  { offset: -90, title: 'ビザ申請開始', category: 'visa' },
  { offset: -75, title: '航空券予約', category: 'flight' },
  { offset: -60, title: '海外保険加入', category: 'insurance' },
  { offset: -45, title: '滞在先決定', category: 'accommodation' },
  { offset: -30, title: '現地通貨両替', category: 'money' },
  { offset: -21, title: 'SIM 準備', category: 'phone' },
  { offset: -14, title: '荷物パッキング開始', category: 'packing' },
  { offset: -7, title: '最終確認', category: 'final' },
  { offset: -1, title: '出発前日チェック', category: 'final', is_milestone: true },
];
```

これを `due_date = plan.start_date + offset days` で計算してタスク作成。

### 4. タスク管理 UI

`app/(tabs)/plan.tsx` 内の「タスク」タブとして実装。

```
┌──────────────────────────────────┐
│ 📋 出発までのタスク              │
│ ────────────────────────────────│
│ ⭐ 残り 87 日                    │
│ ────────────────────────────────│
│ ▼ 今月やること(3件)             │
│ ☐ 学校仮申込み      11/20      │
│ ☐ パスポート確認    11/25      │
│ ☑ エージェント決定  11/05      │
│                                  │
│ ▼ 来月以降                       │
│ ☐ ビザ申請開始     12/15      │
│ ☐ 航空券予約       12/30      │
│ ...                              │
└──────────────────────────────────┘
```

- カウントダウン表示
- マイルストーンは ⭐ 付き
- スワイプで完了/削除
- タップで詳細編集

### 5. 親への通知

#### マイルストーン達成時
- 「○○さんが学校申込みを完了しました」
- 親のアプリにプッシュ通知
- LINE Messaging API 経由でも送信(連携済みなら)

#### コメント機能(permission='comment')
親が特定の項目(プラン要素・費用項目・タスク)にコメント可能。
子側に通知が届く。

### 6. 親同士コミュニティ(将来準備)

今は枠だけ。Phase 2 で実装。
データモデル `parent_communities` を別途追加予定。

### 7. 子の意思決定サポート AI(将来準備)

「親と意見が割れた」ユースケース用の専用チャットモード。
今は AI チャットで「親モード」フラグだけ追加。

---

## 成果物チェックリスト

- [ ] 親招待フローが完結する
- [ ] 親が子のプラン・費用を閲覧できる
- [ ] タスクが自動生成される
- [ ] タスク完了でマイルストーン時に親通知
- [ ] 親コメント機能(`permission='comment'`)が動く
- [ ] `docs/CHANGELOG.md` 更新
