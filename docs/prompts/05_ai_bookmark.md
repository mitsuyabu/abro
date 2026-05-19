# Prompt 04:AI 自動分類ブックマーク

## 前提
- `docs/PROJECT.md` 必読
- Prompt 01〜03 完了済み
- これは Abro の最大の差別化機能の一つ

---

## ゴール

ユーザーが Google マップのピン、YouTube・TikTok 動画、ブログ記事、PDF、スクショなどを投げ込むと、AI が自動でカテゴリ分類し、「自分専用の留学準備ボード」として整理してくれる。

---

## やること

### 1. データモデル

`supabase/migrations/0004_bookmarks.sql`:

```sql
-- ブックマーク
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN (
    'url', 'image', 'pdf', 'note', 'map_pin', 'video'
  )) NOT NULL,
  source_url TEXT,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  content_text TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  location JSONB,
  metadata JSONB,
  ai_classified BOOLEAN DEFAULT FALSE,
  ai_confidence REAL,
  embedding VECTOR(1536),
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX bookmarks_user_idx ON public.bookmarks(user_id);
CREATE INDEX bookmarks_category_idx ON public.bookmarks(user_id, category);
CREATE INDEX bookmarks_embedding_idx ON public.bookmarks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- カスタムカテゴリ(ユーザーが独自に作成可能)
CREATE TABLE public.bookmark_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(user_id, key)
);

-- RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own categories" ON public.bookmark_categories
  FOR ALL USING (auth.uid() = user_id);

-- pgvector 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. デフォルトカテゴリ

新規ユーザー作成時に以下を `bookmark_categories` に挿入:

```typescript
export const DEFAULT_CATEGORIES = [
  { key: 'schools', label: '学校候補', icon: '🎓' },
  { key: 'living_area', label: '生活エリア候補', icon: '🏘️' },
  { key: 'jobs', label: '仕事探し候補', icon: '💼' },
  { key: 'leisure', label: '観光・休日候補', icon: '🌅' },
  { key: 'visa', label: 'ビザ・手続き', icon: '📄' },
  { key: 'study', label: '英語学習', icon: '📚' },
  { key: 'safety', label: '不安解消メモ', icon: '🛡️' },
  { key: 'finance', label: 'お金・銀行', icon: '💳' },
  { key: 'health', label: '健康・医療', icon: '🏥' },
  { key: 'food', label: '食・グルメ', icon: '🍴' },
  { key: 'transport', label: '交通', icon: '🚇' },
  { key: 'others', label: 'その他', icon: '📌' },
];
```

### 3. 入力 UI

#### ホーム画面の「📌 情報を保存」チップから起動
モーダルで開き、以下の入力方法を提供:

```
┌─────────────────────────────────┐
│ 📌 情報を保存           [×]    │
├─────────────────────────────────┤
│ どの形で保存しますか?           │
│                                  │
│ [🔗 URLを貼る]                  │
│ [📷 画像を撮る/選ぶ]            │
│ [📄 PDFを選ぶ]                  │
│ [📝 メモを書く]                 │
│ [📍 地図から場所を選ぶ]         │
│                                  │
└─────────────────────────────────┘
```

#### iOS の共有エクステンション(Phase 2)
今は枠だけ作成。後で実装。

#### Web からの貼り付け対応
- YouTube URL → タイトル/サムネイル取得
- TikTok URL → タイトル/サムネイル取得
- Instagram URL → サムネイル取得(できれば)
- 一般 URL → OGP(Open Graph)から抽出

### 4. URL からメタ情報抽出 Edge Function

`supabase/functions/extract-url/index.ts`:

```typescript
// URL を受け取り、OGP / oembed からメタ情報を取得
// YouTube/TikTok は専用 API も併用
// 戻り値: { title, description, thumbnail_url, content_text, source_type }
```

### 5. AI 自動分類 Edge Function

`supabase/functions/classify-bookmark/index.ts`:

#### 入力
- ブックマークの内容(タイトル、説明、本文テキスト、画像)
- ユーザーのカテゴリ一覧
- ユーザーのプラン情報(渡航先など)

#### 処理
1. Claude API に以下を渡す:
```
ユーザーはオーストラリア・メルボルンへのワーホリを計画中。
カテゴリ一覧:[学校候補, 生活エリア候補, 仕事探し候補, ...]

以下のコンテンツを最適なカテゴリに分類してください。

タイトル:メルボルン市内の語学学校 ELC 公式サイト
説明:ELC Melbourne is a leading English language school...

回答形式(JSON):
{
  "category": "schools",
  "confidence": 0.95,
  "tags": ["melbourne", "language_school", "ELC"],
  "summary": "メルボルンの語学学校 ELC の公式サイト"
}
```

2. OpenAI Embeddings API で `embedding` も生成
3. `bookmarks` テーブルを更新

### 6. Saved タブ(`app/(tabs)/saved.tsx`)

#### レイアウト

```
┌──────────────────────────────────┐
│ 📌 保存した情報           [+]    │
│ ────────────────────────────────│
│ [全て][学校][エリア][仕事][...]  │ ← カテゴリタブ(横スクロール)
│ ────────────────────────────────│
│ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │サムネ│ │サムネ│ │サムネ│    │
│ │ELC   │ │家賃  │ │ビザ  │    │
│ │学校  │ │情報  │ │HP    │    │
│ └──────┘ └──────┘ └──────┘    │
│                                  │
│ ▼ AI からの提案                 │
│ ┌──────────────────────────────┐│
│ │あなたの「学校候補」が3つあり ││
│ │ます。比較表を作りますか?     ││
│ │ [比較する] [後で]            ││
│ └──────────────────────────────┘│
└──────────────────────────────────┘
```

#### 機能
- カテゴリ別タブ表示(横スクロール)
- グリッド表示 / リスト表示 切替
- 並び替え(追加日 / 名前)
- 検索(タイトル・タグ・本文全文検索)
- ベクトル検索(意味的に近いブックマークを検索)
- 個別カードタップで詳細画面

### 7. 個別カード詳細画面

`app/bookmark/[id].tsx`:
- 大きなサムネイル / 画像
- タイトル、説明、AI が生成したサマリ
- 元 URL を開くボタン
- カテゴリ変更
- タグ編集
- プランに紐付け
- 削除
- 関連ブックマーク(ベクトル検索)

### 8. プランへの統合

ブックマークをプランに紐づけられる。
プラン詳細画面に「関連ブックマーク」セクションを追加。

例:プランで「学校:ELC Melbourne」を追加 → 該当ブックマークが自動でリンク。

### 9. AI からの提案機能

Saved タブ下部に AI が定期的に提案カードを表示:
- 「学校候補が3つあります。比較表を作りますか?」
- 「カフェのブックマークが10件以上。プランに『カフェ巡り』を追加しますか?」
- 「ビザ関連のブックマークが古いです。最新情報を確認しますか?」

→ これは別の Edge Function `suggest-bookmark-actions` で生成。

### 10. 出発後の地図ビュー

`app/(tabs)/saved.tsx` に「地図で見る」ボタン。
位置情報(`location` JSONB)を持つブックマークを地図上に表示。

→ `react-native-maps` を使用。

```bash
npx expo install react-native-maps
```

### 11. 通知

ブックマークが分類された直後に Toast 通知:
- 「『生活エリア候補』に追加しました」
- カテゴリの絵文字付き

---

## エッジケース

### AI が分類に迷う場合
- `ai_confidence < 0.6` のとき:カテゴリは設定するが、UI で「⚠️ 仮分類」と表示
- ユーザーが手動でカテゴリ変更可能

### URL が取得できない場合
- 入力されたまま保存
- 後でユーザーがタイトル・説明を編集可能

### 画像 OCR
- 画像内のテキストを抽出して `content_text` に保存
- これも分類に使用
- `expo-image-manipulator` + Claude Vision API

### PDF
- `expo-document-picker` で取得
- Supabase Storage にアップロード
- バックグラウンドで PDF テキスト抽出
- 抽出テキストを `content_text` に保存

---

## 成果物チェックリスト

- [ ] URL 貼り付けでブックマーク作成・自動分類できる
- [ ] 画像・PDF・メモも保存できる
- [ ] Saved タブでカテゴリ別に表示される
- [ ] カテゴリを手動で変更できる
- [ ] AI 提案カードが表示される
- [ ] プラン紐付けができる
- [ ] 地図ビューが動く
- [ ] ベクトル検索で類似ブックマーク表示
- [ ] `docs/CHANGELOG.md` 更新

完了報告には:
- 実装ファイル一覧
- 分類精度の所感
- pgvector のパフォーマンス
- 次のプロンプト(05)に向けた注意点
