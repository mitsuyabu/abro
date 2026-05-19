# Prompt 02:AI チャットとプラン作成

## 前提
- `docs/PROJECT.md` を必ず読むこと
- Prompt 01 が完了していること
- このプロンプトは Abro の心臓部:AI チャットでユーザーが留学プランを作る機能

---

## ゴール

Mindtrip 風のホーム画面で、ユーザーが AI と会話しながら留学プランを構築できる。
プランはチャット内に動的に組み立てられ、Supabase に保存される。

---

## やること

### 1. ホーム画面(Chats タブ)

参考画像:Mindtrip のホーム画面と同じ構成

```
┌─────────────────────────────────────────┐
│ ☰  Abro              [+]               │ ← ヘッダー
│                                          │
│           [Abro ロゴイラスト]            │
│                                          │
│       こんにちは、{nickname}さん。       │
│         今日はどんな相談?                │
│                                          │
│  ┌────────────┐  ┌────────────────┐     │
│  │ ✨ プランを │  │ 💰 費用シミュ  │     │
│  │   作る     │  │   レート       │     │
│  └────────────┘  └────────────────┘     │
│  ┌────────────┐  ┌────────────────┐     │
│  │ 📌 情報を  │  │ 👥 先輩に質問  │     │
│  │   保存     │  │                │     │
│  └────────────┘  └────────────────┘     │
│  ┌────────────────────────────────┐     │
│  │ 🎓 エージェント相談            │     │
│  └────────────────────────────────┘     │
│                                          │
│  [何でも聞いてください...]    🎤  ➤     │
├─────────────────────────────────────────┤
│ Chats   Plan   Explore   Saved   Me     │
└─────────────────────────────────────────┘
```

- アクションチップは横並び2つずつ
- 入力欄は画面下に固定
- 「Ask anything...」入力欄をタップ or チップタップで個別チャットへ遷移

### 2. チャット画面(`app/chat/[id].tsx`)

#### UI
- 上部:戻るボタン + チャット名(自動生成) + 「プランに保存」ボタン
- 中央:メッセージリスト(ユーザー / AI / システム)
- 下部:メッセージ入力欄

#### AI レスポンスの特殊レンダリング
AI は単なるテキストではなく、構造化された応答を返す:
- プラン要素のカード(学校、宿、航空券など)
- 比較表
- 地図プレビュー
- 「これを採用しますか?」のアクションボタン

→ `components/chat/MessageRenderer.tsx` で type に応じて出し分ける。

### 3. データモデル

`supabase/migrations/0002_chats_and_plans.sql`:

```sql
-- チャットセッション
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  type TEXT CHECK (type IN ('ai', 'agent', 'community')) DEFAULT 'ai',
  plan_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- メッセージ
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  structured_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- プラン
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination_country TEXT,
  destination_city TEXT,
  start_date DATE,
  end_date DATE,
  duration_weeks INTEGER,
  purpose TEXT,
  budget_jpy INTEGER,
  status TEXT CHECK (status IN ('draft', 'private', 'shared', 'public')) DEFAULT 'draft',
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- プラン要素(学校、宿、航空券、保険など)
CREATE TABLE public.plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('school', 'accommodation', 'flight', 'insurance', 'visa', 'activity', 'other')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cost_jpy INTEGER,
  start_date DATE,
  end_date DATE,
  metadata JSONB,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のチャット・メッセージ・プランのみアクセス可能
CREATE POLICY "Users own chats" ON public.chats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own messages" ON public.messages
  FOR ALL USING (chat_id IN (SELECT id FROM public.chats WHERE user_id = auth.uid()));

CREATE POLICY "Users own plans" ON public.plans
  FOR ALL USING (auth.uid() = user_id OR status = 'public');

CREATE POLICY "Users own plan items" ON public.plan_items
  FOR ALL USING (plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid() OR status = 'public'));
```

### 4. AI 呼び出し(Edge Function)

`supabase/functions/ai-chat/index.ts` を作成:

#### 機能
- ユーザーからメッセージを受け取る
- 過去のチャット履歴とユーザープロフィールを取得
- Claude API を呼び出す(ストリーミング対応)
- 応答を `messages` テーブルに保存
- 構造化応答(プラン要素)があれば `plan_items` に追加

#### システムプロンプト(`supabase/functions/ai-chat/system_prompt.ts`)

```typescript
export const SYSTEM_PROMPT = `
あなたは Abro の AI 留学アドバイザーです。
ユーザーが留学・ワーホリ計画を立てるのを助けるのが役割です。

## あなたの振る舞い
- 親しみやすく、専門的に
- ユーザーの予算・期間・目的を最優先に
- 複数の選択肢を提示し、押し付けない
- わからないことは「わからない」と言う(ハルシネーション禁止)
- ビザ情報や法的判断はエージェントへの相談を勧める

## ユーザー情報
{user_context}

## 構造化応答
プラン要素を提案する際は、必ず以下の JSON 形式で返す:

\`\`\`json
{
  "type": "plan_item",
  "item_type": "school" | "accommodation" | "flight" | "insurance" | "visa" | "activity",
  "title": "...",
  "description": "...",
  "cost_jpy": 0,
  "metadata": { ... }
}
\`\`\`

通常の会話は自然な文章で返してOK。
`;
```

#### Claude API 呼び出し例

```typescript
import Anthropic from "npm:@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const stream = await anthropic.messages.stream({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  system: systemPrompt,
  messages: chatHistory,
});

// SSE で返す
```

### 5. フロントエンド側のチャットロジック

`hooks/useChat.ts`:
- `sendMessage(content: string)`:
  1. ユーザーメッセージを楽観的に追加
  2. Edge Function を呼ぶ(ストリーミング)
  3. AI 応答をリアルタイムに描画
  4. 完了したら DB から再フェッチして整合性確保

`stores/chat.ts`:
- 現在のチャット
- メッセージ一覧
- ストリーミング中フラグ

### 6. プラン作成フロー

1. ユーザーが「プランを作る」チップをタップ
2. 新規チャット作成 + AI が冒頭メッセージ:「どんな留学を考えていますか?目的・期間・予算を教えてください」
3. ユーザーが回答 → AI が深掘り質問を繰り返す
4. ある段階で AI が「プランをまとめましょうか?」と提案
5. ユーザーが承諾すると `plans` テーブルにレコード作成
6. 以降の AI 応答で `plan_items` がどんどん追加される
7. チャット画面上部に「📋 プランを見る」ボタン出現
8. タップで `app/plan/[id].tsx` に遷移

### 7. プラン詳細画面(`app/plan/[id].tsx`)

- タイトル、目的地、期間、目的の編集
- プラン要素のタイムライン表示(出発前・現地・帰国後)
- 各要素の編集・削除・並び替え
- 「チャットに戻る」ボタン
- 「費用シミュレートを開く」ボタン(プロンプト 03 で実装)
- 「公開する」ボタン(将来用、今は枠だけ)

### 8. アクションチップの動作

| チップ | 動作 |
|---|---|
| プランを作る | 新規チャット作成、上記フロー開始 |
| 費用シミュレート | プロンプト 03 で実装(今はモーダル枠だけ) |
| 情報を保存 | プロンプト 04 で実装(今はモーダル枠だけ) |
| 先輩に質問 | プロンプト 11 で実装(今は「準備中」表示) |
| エージェント相談 | プロンプト 06 で実装(今は「準備中」表示) |

---

## デザイン指針

- Mindtrip の超ミニマルさを踏襲
- フォントは細め、余白を多く
- AI メッセージは左寄せ、ユーザーは右寄せ
- AI のプラン要素カードはカード形式で目立たせる
- ストリーミング中はタイピングインジケータ(3点リーダー)

---

## エラーハンドリング

- AI API が落ちた場合:「すみません、つながりにくいようです。少し待ってもう一度試してください」
- ネット切れ:ローカルにメッセージをキャッシュし再送
- レート制限:ユーザーに表示

---

## 成果物チェックリスト

- [ ] ホーム画面が Mindtrip 風で表示される
- [ ] 「プランを作る」チップで新規チャット作成 → AI が応答する
- [ ] チャットがストリーミングで表示される
- [ ] プランが `plans` / `plan_items` に保存される
- [ ] プラン詳細画面で要素が時系列表示される
- [ ] サインアウト/再ログイン後もチャット履歴が残る
- [ ] エラー時にユーザーフレンドリーなメッセージが出る
- [ ] `docs/CHANGELOG.md` 更新

完了報告には:
- 実装ファイル一覧
- AI のシステムプロンプトの最終形
- 既知の制限・課題
- 次のプロンプト(03)に必要な前提
