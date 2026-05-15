# CHANGELOG

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
