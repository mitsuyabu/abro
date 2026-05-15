# CHANGELOG

## Phase 1 / Prompt 07 完了 — 2026-05-15 🎉 Phase 1 MVP 完了

### 実装内容

#### DB マイグレーション
- `supabase/migrations/0006_agents.sql`
  - `agents` テーブル(エージェント会社 + RLS)
  - `agent_counselors` テーブル(カウンセラー + オンライン状態 + RLS)
  - `agent_reviews` テーブル(1ユーザー1カウンセラー1レビュー制約 + RLS)
  - `plan_collaborators` テーブル(プラン共同編集招待 + RLS)
  - `plan_changes` テーブル(プラン編集提案履歴 + RLS)
  - `users.is_agent` カラム追加
- `supabase/migrations/0006b_agents_seed.sql`
  - デモ用エージェント 3 社 + カウンセラー 4 名のサンプルデータ

#### 型
- `types/index.ts` — `Agent`, `AgentCounselor`, `AgentReview`, `PlanCollaborator` 追加

#### 画面
- `app/agents/index.tsx` — エージェント一覧(検索 + 国フィルタ + オンライン中カウンセラー横スクロール)
- `app/agents/[id].tsx` — エージェント詳細(会社情報 + カウンセラー一覧 + レビュー)
- `app/agents/counselor/[id].tsx` — カウンセラー詳細(プロフィール + 即時チャット + レビュー投稿)
- `app/(tabs)/explore.tsx` — 探すタブをエージェント一覧に刷新

#### 既存画面の変更
- `app/(tabs)/chats.tsx` — 「🎓 エージェント相談」チップを有効化 → `/agents` へ遷移
- `app/plan/[id].tsx` — 「エージェントに相談・招待する」ボタン追加

### 機能詳細
- **即時チャット**: オンラインのカウンセラーは「💬 今すぐ話す」で `chats.type='agent'` チャットを作成
- **レビュー**: 1カウンセラーにつき1ユーザー1レビュー(DB の UNIQUE 制約)
- **AI ファーストタッチ**: 将来フェーズ(Phase 2)で実装予定
- **プラン共同編集 UI**: DB・RLS 設計済み、UI は Phase 2 で実装

### 既知の制限・将来対応
- Realtime メッセージング(カウンセラー↔ユーザー間のリアルタイム同期)は Phase 2
- AI ファーストタッチ(初回 AI 応答 → カウンセラー引継ぎ)は Phase 2
- プッシュ通知(新着メッセージ、マイルストーン達成)は Phase 2
- エージェント側 UI(担当プラン一覧・着信チャット)は Phase 4
- 面談予約システムは Phase 2

---

## Phase 1 / Prompt 06 完了 — 2026-05-15

### 実装内容

#### DB マイグレーション
- `supabase/migrations/0005_parents_and_tasks.sql`
  - `parent_links` テーブル(親子連携 + 招待コード + RLS)
  - `tasks` テーブル(タスク管理 + 親も閲覧可能な RLS)
  - `parent_comments` テーブル(permission='comment' の親のみ書き込み可能)

#### 型 / 定数
- `types/index.ts` — `ParentLink`, `ParentLinkStatus`, `ParentLinkPermission`, `Task` 追加
- `lib/task/defaults.ts` — 12件のタスクテンプレート(出発日からのオフセット日数付き)

#### 状態管理 / フック
- `stores/task.ts` — Zustand タスクストア
- `hooks/useTasks.ts` — fetchTasks / generateTasksForPlan / toggleComplete / deleteTask / addTask
- `hooks/useParentLink.ts` — generateInviteCode / acceptInviteCode / revokeLink / fetchMyLinks

#### コンポーネント
- `components/task/TaskItem.tsx` — チェックボタン + 期限 + マイルストーン ⭐ + 削除
- `components/parent/InviteParentModal.tsx` — 子側(コード生成+LINE共有) / 親側(コード入力) の2フロー

#### 画面の変更
- `app/(tabs)/plan.tsx` — フル実装: プラン一覧 + タスク自動生成 + 進捗バー + カウントダウン + 今月/来月/完了済みグループ
- `app/(tabs)/me.tsx` — 親子連携セクション追加(連携状況表示 + 設定ボタン)

### タスク自動生成の仕様
- プランが作成されると `fetchTasks` + `generateTasksForPlan` を自動実行
- 既存タスクがある場合は生成しない(重複防止)
- `start_date` がある場合: オフセット日数で `due_date` を計算
- `start_date` がない場合: `due_date = null` で生成(後から追加可能)
- タスクは「今月やること / 来月以降 / 完了済み」に自動グループ化

### 招待フローの仕様
- 子側: 6文字英数字コードを生成 → Share.share() で送信
- 親側: コード入力 → 照合 → 即時 `status: 'active'` (自動承認)
- 招待コードを再生成すると古いコードは削除される

### 既知の制限・将来対応
- マイルストーン達成時のプッシュ通知は将来フェーズ
- 親が子のプランを閲覧する専用画面は将来フェーズ(RLS は設定済み)
- LINE Messaging API 通知は将来フェーズ
- タスク期限のリマインダーは将来フェーズ

### 次のプロンプト(07: エージェントルーム)への申し送り
- `parent_links` の `status: 'active'` を確認することで親子連携状態を判定
- タスク生成は `generateTasksForPlan(planId, startDate)` を呼ぶだけ

---

## Phase 1 / Prompt 05 完了 — 2026-05-15

### 実装内容

#### DB マイグレーション
- `supabase/migrations/0004_bookmarks.sql`
  - `CREATE EXTENSION IF NOT EXISTS vector;` を先頭で有効化
  - `bookmarks` テーブル(embedding VECTOR(1536) 含む + RLS)
  - `bookmark_categories` テーブル(ユーザーごとのカスタムカテゴリ + RLS)
  - `updated_at` 自動更新トリガー
  - 新規ユーザー作成時にデフォルト 12 カテゴリを自動挿入するトリガー
  - ※ `ivfflat` インデックスはデータが溜まってから手動追加(コメントアウト済み)

#### 型 / 定数
- `types/index.ts` — `BookmarkSourceType`, `Bookmark`, `BookmarkCategory` 追加
- `lib/bookmark/defaults.ts` — `DEFAULT_CATEGORIES`, `getCategoryIcon`, `getCategoryLabel`, `SOURCE_TYPE_ICONS`

#### 状態管理 / フック
- `stores/bookmark.ts` — Zustand ブックマークストア
- `hooks/useBookmarks.ts` — fetchBookmarks / createFromUrl / createFromNote / createFromImage / updateCategory / deleteBookmark / ensureCategories(既存ユーザー対応)

#### Supabase Edge Functions
- `supabase/functions/extract-url/index.ts`
  - YouTube/TikTok: oEmbed API でタイトル・サムネイル取得
  - 一般URL: OGP タグ (og:title / og:description / og:image) 取得
  - タイムアウト 8 秒
- `supabase/functions/classify-bookmark/index.ts`
  - claude-haiku-4-5-20251001 で AI 分類
  - カテゴリ・信頼度(0-1)・タグ・サマリを返す
  - SUPABASE_SERVICE_ROLE_KEY で bookmarks テーブルを直接更新
  - ANTHROPIC_API_KEY 未設定時は 200 で `category: 'others'` を返す(フォールバック)

#### コンポーネント
- `components/bookmark/AddBookmarkModal.tsx` — URL/画像/メモの 3 種入力方法モーダル
- `components/bookmark/BookmarkCard.tsx` — グリッドカード(サムネイル or カラー背景 + AI 分類ステータス)
- `components/bookmark/CategoryTabs.tsx` — 横スクロールカテゴリフィルタ(件数バッジ付き)

#### 画面
- `app/(tabs)/saved.tsx` — カテゴリ別グリッド表示 + AI 提案カード + 保存ステータス Toast
- `app/bookmark/[id].tsx` — 詳細画面(サムネイル / AI サマリ / タグ / カテゴリ変更 / URL 開く / 削除)

#### 既存画面の変更
- `app/(tabs)/chats.tsx` — 「📌 情報を保存」チップを有効化 → saved タブへ遷移

### AI 分類の仕様
- URL 保存 → extract-url で OGP 取得 → classify-bookmark でカテゴリ判定 → DB 更新
- 分類は非同期(保存後バックグラウンドで実行)、保存直後は `ai_classified: false`
- 信頼度 < 0.6 の場合は UI で「⚠️ 仮分類」と表示
- ユーザーはカテゴリを手動変更可能

### 既知の制限・将来対応
- 画像 OCR (Claude Vision) は将来フェーズ(現在は alt/note テキストのみ)
- PDF 対応(expo-document-picker + Storage)は将来フェーズ
- ベクトル検索(embedding 生成)は将来フェーズ — カラムとインデックス枠は用意済み
- iOS 共有エクステンションは Phase 2
- 地図ビュー(react-native-maps)は将来フェーズ
- Edge Functions デプロイ手順: `npx supabase functions deploy extract-url classify-bookmark`
- 「classify-bookmark」は `SUPABASE_SERVICE_ROLE_KEY` も Secrets に追加が必要

### 次のプロンプト(06: 親子タスク)への申し送り
- `bookmark_categories` はユーザーごとに 12 カテゴリが自動生成済み
- 既存ユーザーは `ensureCategories()` で初回アクセス時に自動補完

---

## Phase 1 / Prompt 04 完了 — 2026-05-15

### 実装内容

#### DB マイグレーション
- `supabase/migrations/0003_cost_simulations.sql`
  - `cost_simulations` テーブル(プラン単位のシミュレーション + RLS)
  - `cost_items` テーブル(費用項目 + カテゴリ制約 + RLS)
  - `updated_at` 自動更新トリガー

#### 型 / 定数
- `types/index.ts` — `CostFrequency`, `CostCategory`, `CostSimulation`, `CostItem` 追加
- `lib/cost/defaults.ts` — `COST_CATEGORIES`, `FREQUENCY_LABELS`, `PLAN_ITEM_TYPE_TO_CATEGORY`
- `lib/cost/calculate.ts` — `calculateTotalJpy`, `itemTotalJpy`, `formatJpy`, `buildShareText`

#### 状態管理 / フック
- `stores/cost.ts` — Zustand コストストア(simulation/items/isSheetVisible)
- `hooks/useCostSimulation.ts` — createSimulation / fetchSimulation / fetchOrCreateByPlan / addItem / updateItem / deleteItem

#### コンポーネント
- `components/cost/CostSimulatorSheet.tsx` — ハーフモーダルシート(Animated.View スライドアップ + 合計 + 項目リスト + 共有)
- `components/cost/CostItemRow.tsx` — タップ展開で金額・頻度・期間を編集、Alert で削除確認
- `components/cost/AddItemModal.tsx` — 新規項目追加モーダル(カテゴリ選択 + 金額 + 頻度 + 期間)

#### 画面の変更
- `app/(tabs)/chats.tsx` — 「💰 費用シミュレート」チップを有効化(available: true)、cost_simulation モードでチャット画面へ
- `app/chat/[id].tsx`
  - `mode=cost_simulation` 対応: 自動でシミュ作成 → シートをオープン
  - ヘッダーに「💰 費用」ボタン追加(シミュ存在時)
  - 入力欄上にミニバー(シート非表示 + 項目あり時に合計を常時表示)
  - プラン取得後に `fetchOrCreateByPlan` で既存シミュを自動ロード
- `app/plan/[id].tsx`
  - 「💰 費用をシミュレートする」ボタンを追加
  - `CostSimulatorSheet` をプラン情報(渡航先・期間)付きで表示

### 共有機能
- React Native 標準 `Share.share()` を使用(iOS/Android/Web 対応)
- 「📤 共有する」「👨‍👩‍👧 親に送る」ボタン(両方とも Share.share を起動)
- 共有テキストに内訳・合計・Abro リンクを含む

### 既知の制限
- 為替対応は将来フェーズ(データモデルは `exchange_rates JSONB` で準備済み)
- 親アカウント連携未実装(「親に送る」は現状 Share.share と同じ挙動)
- AI → cost_items 自動反映トリガーは次フェーズに延期(plan_items 採用時の手動追加で代替)
- `@gorhom/bottom-sheet` は Reanimated 4 互換性リスクのため採用せず、`Animated.View` + Modal で代替実装

### 次のプロンプト(05: AI ブックマーク)への申し送り
- `cost_simulations.plan_id` で plan と 1:1 紐付け
- `fetchOrCreateByPlan(planId)` で Plan 画面 / Chat 画面から透過的に呼び出し可能

---

## Phase 1 / Prompt 03 完了 — 2026-05-15

### 実装内容

#### DB マイグレーション
- `supabase/migrations/0002_chats_and_plans.sql`
  - `chats` テーブル(チャットセッション + RLS)
  - `messages` テーブル(チャットメッセージ + RLS)
  - `plans` テーブル(留学プラン + RLS)
  - `plan_items` テーブル(プラン要素 + RLS)

#### Supabase Edge Function
- `supabase/functions/ai-chat/index.ts` — Claude API ストリーミング + DB保存
- `supabase/functions/ai-chat/system_prompt.ts` — ユーザーコンテキスト付きシステムプロンプト
- モデル: `claude-haiku-4-5-20251001`(コスト効率重視)
- SSE(Server-Sent Events)でリアルタイムストリーミング

#### 状態管理 / フック
- `stores/chat.ts` — Zustand chat store(メッセージ、ストリーミング状態)
- `hooks/useChat.ts` — fetchChats / fetchMessages / sendMessage

#### 画面
- `app/(tabs)/chats.tsx` — Mindtrip 風ホーム(アクションチップ + 固定入力欄 + チャット履歴)
- `app/chat/[id].tsx` — チャット画面(SSE ストリーミング + プランアイテム採用)
- `app/plan/[id].tsx` — プラン詳細(要素一覧 + 費用合計 + 削除)

#### コンポーネント
- `components/chat/MessageBubble.tsx` — ユーザー/AI メッセージ気泡
- `components/chat/TypingIndicator.tsx` — 3点リーダーアニメーション
- `components/chat/PlanItemCard.tsx` — プラン要素カード(採用ボタン付き)

### Edge Function のデプロイ手順(次のステップ)

1. Supabase ダッシュボード → SQL Editor で `0002_chats_and_plans.sql` を実行
2. [console.anthropic.com](https://console.anthropic.com) で API キーを取得
3. Supabase ダッシュボード → Edge Functions → Secrets に `ANTHROPIC_API_KEY` を追加
4. Supabase CLI でデプロイ:
   ```bash
   npx supabase functions deploy ai-chat
   ```

### 次のプロンプト(04: 費用シミュレーター)への申し送り

- `plans` テーブルに `budget_jpy` カラムあり
- `plan_items` に `cost_jpy` カラムあり → 合計算出済み
- ホーム画面の「費用シミュレート」チップは `available: false` で枠だけ用意済み
- Edge Function の `SUPABASE_URL` / `SUPABASE_ANON_KEY` は自動注入される

---

## Phase 1 / Prompt 02 完了 — 2026-05-15

### 実装内容

#### プロジェクト初期化
- Expo SDK 54 + React 19 + TypeScript でプロジェクト作成
- Expo Router v6(ファイルベースルーティング)採用
- NativeWind v4 + Tailwind CSS v3 でスタイリング

#### 追加パッケージ
- `@supabase/supabase-js` — Supabase クライアント
- `@react-native-async-storage/async-storage` — セッション永続化
- `react-native-url-polyfill` — URL polyfill
- `expo-secure-store` — セキュアストレージ
- `zustand` — グローバル状態管理
- `@tanstack/react-query` — サーバー状態管理
- `react-hook-form` + `zod` + `@hookform/resolvers` — フォームバリデーション
- `date-fns` — 日付操作
- `nativewind` — Tailwind for React Native

#### ディレクトリ構造
```
app/(auth)/     — 認証フロー
app/(tabs)/     — メイン5タブ
components/ui/  — デザインシステム
lib/            — Supabase クライアント、AI、i18n
stores/         — Zustand stores
types/          — TypeScript 型定義
supabase/migrations/ — DB マイグレーション
```

#### 設定ファイル
- `babel.config.js` — NativeWind プリセット
- `metro.config.js` — withNativeWind
- `tailwind.config.js` — Abro カラーパレット
- `global.css` — Tailwind ディレクティブ
- `.env.local` — 環境変数(値は空、要設定)

#### Supabase
- `lib/supabase.ts` — AsyncStorage セッション永続化クライアント
- `supabase/migrations/0001_init_auth.sql` — users テーブル + RLS + トリガー

#### 認証フロー
- `app/(auth)/welcome.tsx` — ウェルカム画面
- `app/(auth)/signup.tsx` — サインアップ(メール/パスワード)
- `app/(auth)/signin.tsx` — サインイン
- `app/(auth)/verify.tsx` — メール確認待ち
- `app/(auth)/onboarding.tsx` — 3ステップオンボーディング(ニックネーム/フェーズ&国/目的)

#### 状態管理
- `stores/auth.ts` — Zustand 認証ストア(session/user/isOnboarded/signOut/fetchUser)

#### デザインシステム
- `components/ui/Button.tsx` — primary / secondary / ghost の3バリアント
- `components/ui/Input.tsx` — ラベル・エラー表示付き
- `components/ui/Card.tsx` — 汎用カード
- `components/ui/Avatar.tsx` — 画像 or イニシャルフォールバック
- `components/ui/Chip.tsx` — Mindtrip 風選択チップ

#### ルーティング
- `app/_layout.tsx` — 認証ガード(未認証→welcome、未オンボード→onboarding、認証済→tabs)
- `app/(tabs)/_layout.tsx` — 5タブ(チャット/プラン/探す/保存/マイページ)
- タブ各画面: スケルトン実装済み

### 次のプロンプト(03: AI チャット + プラン作成)への申し送り

- `.env.local` の `EXPO_PUBLIC_SUPABASE_URL` と `EXPO_PUBLIC_SUPABASE_ANON_KEY` を設定してから Supabase 接続
- Supabase ダッシュボードで `supabase/migrations/0001_init_auth.sql` を手動実行(または `supabase db push`)
- カラーパレットは `tailwind.config.js` に定義済み(`primary`, `accent`, `background`, `card`, `muted`, `border`)
- `useAuthStore` から `user`(User 型)と `session` を取得できる
- AI チャット画面は `app/(tabs)/chats.tsx` を起点に実装
- チャットセッション用の DB テーブルは Prompt 03 で追加予定
