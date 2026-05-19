# Prompt 01:プロジェクトセットアップと認証

## 前提
- 必ず `docs/PROJECT.md` を読んでから着手すること
- このプロンプトは Abro の最初のステップ:プロジェクト初期化と認証基盤

---

## やること

### 1. プロジェクト初期化
以下のコマンドでプロジェクトをセットアップしてください:

```bash
npx create-expo-app abro --template
cd abro
```

テンプレートは TypeScript ベースの最小構成を選択。
そのあと以下のパッケージを追加:

```bash
# 認証・DB
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

# ルーティング
npx expo install expo-router expo-linking expo-constants expo-status-bar

# UI
npx expo install nativewind tailwindcss
npm install -D tailwindcss@3.3.2

# 状態管理
npm install zustand @tanstack/react-query

# フォーム
npm install react-hook-form zod @hookform/resolvers

# その他
npx expo install expo-image expo-haptics expo-secure-store
npm install date-fns
```

### 2. ディレクトリ構造の作成

`PROJECT.md` の「5. ディレクトリ構造」セクションの通りに作成。

### 3. Supabase プロジェクトの初期化

- Supabase CLI をインストール
- `supabase init` でローカルプロジェクト作成
- `supabase/migrations/` を使ってマイグレーションファイルで管理

### 4. 環境変数

`.env.local` に以下を準備(値は後で入れる):
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

### 5. Supabase クライアント設定

`lib/supabase.ts` を作成:
- AsyncStorage を使ったセッション永続化
- 型定義は自動生成(`supabase gen types typescript` を使う前提)

### 6. 認証フローの実装

#### 必要な画面
- `app/(auth)/welcome.tsx` — ウェルカム画面(Abro ロゴ + 説明)
- `app/(auth)/signup.tsx` — サインアップ
- `app/(auth)/signin.tsx` — サインイン
- `app/(auth)/verify.tsx` — メール確認

#### 認証方法
- メール/パスワード(必須)
- Google ログイン(`expo-auth-session` 使用)
- Apple ログイン(iOS 必須、`expo-apple-authentication`)
- LINE ログイン(将来:Phase 2 で。今は枠だけ用意)

#### ユーザー登録フロー
1. メール/パスワード or OAuth でサインアップ
2. オンボーディング画面で以下を聞く:
   - ニックネーム
   - 現在のフェーズ(検討/準備/渡航中/帰国)
   - 興味のある国・地域(複数選択)
   - 留学・ワーホリの目的(複数選択)
3. ホーム画面へ

### 7. データベースマイグレーション

`supabase/migrations/0001_init_auth.sql` を作成:

```sql
-- users テーブル(Supabase auth.users への拡張)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  phase TEXT CHECK (phase IN ('considering', 'preparing', 'abroad', 'returned')) DEFAULT 'considering',
  interested_countries TEXT[] DEFAULT '{}',
  purposes TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 自分のレコードのみ閲覧・編集可能
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 新規ユーザー作成時に public.users にも自動挿入
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 8. グローバル状態管理

`stores/auth.ts` を Zustand で作成:
- 現在のユーザー
- ローディング状態
- サインアウト関数
- セッション復元ロジック

### 9. ルーティングガード

`app/_layout.tsx` で以下を実装:
- 未認証ユーザーは `(auth)/welcome` へリダイレクト
- 認証済みユーザーは `(tabs)` へ
- オンボーディング未完了なら `onboarding` へ

### 10. デザインシステムの基礎

`components/ui/` に以下を作成:
- `Button.tsx` — 3バリアント(primary/secondary/ghost)
- `Input.tsx` — テキスト入力
- `Card.tsx` — カード
- `Avatar.tsx` — アバター
- `Chip.tsx` — チップ(Mindtrip風の丸いボタン)

カラーパレットは `tailwind.config.js` に定義(後で全体テーマで上書き可能に):
- primary: #1A1A1A (黒)
- accent: #FF4D4D (Mindtripの赤に近い)
- background: #F8F8F8
- card: #FFFFFF
- muted: #A0A0A0

### 11. UI テスト
最低限の動作確認:
- サインアップできる
- サインインできる
- サインアウトできる
- 認証状態でルーティングが正しく分かれる

---

## 成果物

完了したら以下を確認:
- [ ] `npm start` でアプリが起動する
- [ ] iOS シミュレータ / Android エミュレータで表示確認
- [ ] サインアップ → オンボーディング → ホーム のフローが通る
- [ ] Supabase ダッシュボードで `public.users` にレコードが入る
- [ ] `docs/CHANGELOG.md` に「Phase 1 / Prompt 01 完了」と記録

完了報告には以下を含めてください:
- 実装したファイル一覧
- 動作確認した内容
- 次のプロンプト(02)に渡したい注意点
