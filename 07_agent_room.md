# Prompt 06:エージェントルーム

## 前提
- `docs/PROJECT.md` 必読
- Prompt 01〜05 完了済み
- Phase 1 の最後の機能

---

## ゴール
- エージェント会社を一覧で見られる
- 各社のカウンセラーに即時チャット相談 or 予約面談
- エージェントがユーザーのプランを共同編集できる

---

## やること

### 1. データモデル

`supabase/migrations/0006_agents.sql`:

```sql
-- エージェント会社
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  specialties TEXT[] DEFAULT '{}',
  countries TEXT[] DEFAULT '{}',
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  plan TEXT CHECK (plan IN ('basic', 'premium', 'enterprise')) DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- カウンセラー
CREATE TABLE public.agent_counselors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{ja}',
  years_experience INTEGER,
  is_online BOOLEAN DEFAULT FALSE,
  available_hours JSONB,
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- レビュー
CREATE TABLE public.agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES public.agent_counselors(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- プラン共同編集の招待
CREATE TABLE public.plan_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  collaborator_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('agent', 'friend', 'parent')) NOT NULL,
  permission TEXT CHECK (permission IN ('view', 'suggest', 'edit')) DEFAULT 'suggest',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(plan_id, collaborator_user_id)
);

-- プラン編集履歴
CREATE TABLE public.plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  change_type TEXT CHECK (change_type IN ('add', 'edit', 'delete', 'suggest')) NOT NULL,
  target_type TEXT,
  target_id UUID,
  before_data JSONB,
  after_data JSONB,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS は標準的なポリシー(略、実装時に書く)
```

### 2. エージェント一覧画面

`app/agents/index.tsx`:

```
┌──────────────────────────────────┐
│ 🎓 エージェントを探す            │
│ ────────────────────────────────│
│ [国別▼] [専門▼] [料金▼]         │ ← フィルタ
│ ────────────────────────────────│
│ 🟢 オンライン中(8人)           │
│ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │ A社  │ │ B社  │ │ C社  │    │
│ │田中  │ │鈴木  │ │佐藤  │    │
│ │★4.8  │ │★4.6  │ │★4.9  │    │
│ │[話す]│ │[話す]│ │[話す]│    │
│ └──────┘ └──────┘ └──────┘    │
│                                  │
│ 全てのエージェント                │
│ ┌──────────────────────────────┐│
│ │A留学エージェンシー  ★4.7    ││
│ │ワーホリ専門、豪・カナダ      ││
│ │カウンセラー 5人             ││
│ └──────────────────────────────┘│
│ ...                              │
└──────────────────────────────────┘
```

### 3. エージェント詳細画面

`app/agents/[id].tsx`:
- 会社情報
- カウンセラー一覧(オンライン状態付き)
- レビュー一覧
- 「相談する」ボタン

### 4. カウンセラー詳細画面

`app/agents/counselor/[id].tsx`:
- プロフィール
- 専門分野・対応言語
- レビュー
- 「いま話す」/「予約する」

### 5. 即時チャット

カウンセラーがオンラインなら直接チャット開始。
`chats.type = 'agent'` で新規チャット作成。

#### Realtime メッセージング
- Supabase Realtime を使用
- `messages` テーブルの INSERT を購読
- 新規メッセージは Push 通知も

### 6. プラン共同編集

#### 招待フロー
1. ユーザーが「プランにエージェントを招待」
2. エージェントを選択(または既にチャット中のカウンセラー)
3. 招待が `plan_collaborators` に追加
4. エージェント側に通知

#### 編集モード
プラン詳細画面に「共同編集モード」スイッチ。
- 変更があると `plan_changes` に記録
- ユーザーは「✓承認 / ✕却下」を選べる
- 承認されれば実際のプランに反映

#### Realtime 同期
プラン編集中は両者がリアルタイムに同じ画面を見られる。
カーソル位置の共有まではしない(複雑度を抑える)。

### 7. エージェント側 UI(同じアプリ内、ロール切替)

ユーザー登録時に「エージェントとして登録」のチェック。
チェックすると `users` テーブルに `is_agent = true` 追加(マイグレーション必要)。

エージェントモードの画面:
- 担当ユーザーのプラン一覧
- 着信チャット
- 自分のプロフィール編集

これは Phase 1 では最小機能で OK。Phase 4 で本格的な SaaS 化。

### 8. AI ファーストタッチ

ユーザーが「エージェント相談」をタップ:
1. 最初の数往復は AI が応答(雑談 + 情報収集)
2. 「○○のような相談ですね。これは△△社の田中さんが詳しいです。話してみますか?」
3. ユーザー承諾でカウンセラーに引継ぎ
4. カウンセラーには AI の要約が事前共有される

### 9. レビュー機能

チャット終了後にレビュー依頼:
- 5段階評価 + コメント
- 後で `agents.rating` / `agent_counselors.rating` を集計

### 10. 不正レビュー対策

- 1ユーザー1カウンセラー1レビュー
- 一定の会話時間以上のユーザーのみレビュー可能
- AI で異常な投稿を検出(将来)

---

## 成果物チェックリスト

- [ ] エージェント・カウンセラーの一覧表示
- [ ] フィルタが機能する
- [ ] オンライン中カウンセラーと即時チャット
- [ ] プラン共同編集の招待・承認フロー
- [ ] プラン変更履歴が記録される
- [ ] レビュー投稿・表示
- [ ] `docs/CHANGELOG.md` 更新

🎉 これで **Phase 1 MVP 完了** 🎉
