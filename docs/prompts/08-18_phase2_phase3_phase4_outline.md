# Prompt 07-15:Phase 2 / 3 / 4 概要

> Phase 1 (Prompt 01〜06) が完了した時点で、各機能の詳細プロンプトを別途生成します。
> ここでは Claude Code が全体像を把握できるよう、Phase 2 以降の機能概要・データモデル・ファイル構造の方針だけ示します。

---

## Phase 2:コミュニティ拡張(6-12ヶ月)

### Prompt 07:SNS 機能(4 層レイヤー)

#### ゴール
検討層・準備層・渡航中層・帰国層がフェーズを超えて繋がれる SNS。

#### データモデル(主要部分)
```sql
-- 投稿
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content TEXT,
  media_urls TEXT[],
  location JSONB,
  visibility TEXT, -- 'public', 'phase_only', 'community_only'
  created_at TIMESTAMPTZ
);

-- フォロー
CREATE TABLE follows (
  follower_id UUID,
  following_id UUID,
  created_at TIMESTAMPTZ,
  PRIMARY KEY (follower_id, following_id)
);

-- いいね・コメント
CREATE TABLE post_likes (...);
CREATE TABLE post_comments (...);

-- DM
CREATE TABLE dm_threads (...);
CREATE TABLE dm_messages (...);
```

#### 主要画面
- `app/(tabs)/explore.tsx` のタイムライン
- `app/post/[id].tsx` 投稿詳細
- `app/profile/[id].tsx` プロフィール
- `app/dm/[id].tsx` DM

#### フェーズ別の出し分け
- ユーザーには「いま」のフェーズバッジ
- 検討層には渡航中層の投稿が優先表示
- 帰国層は「先輩」として目立つ

---

### Prompt 08:友達マッチング

#### ゴール
同じ時期・都市・興味の留学生をマッチング。

#### データモデル
```sql
CREATE TABLE match_profiles (
  user_id UUID PRIMARY KEY,
  arrival_date DATE,
  arrival_city TEXT,
  interests TEXT[],
  age_range INT4RANGE,
  gender_preference TEXT,
  status TEXT -- 'looking', 'matched', 'paused'
);

CREATE TABLE matches (
  user_a UUID,
  user_b UUID,
  score REAL,
  status TEXT, -- 'suggested', 'liked_a', 'liked_b', 'matched', 'declined'
  matched_at TIMESTAMPTZ
);
```

#### マッチング軸
- 渡航時期(±3日)
- 到着都市
- 同じ学校
- 同じ趣味
- 親同士マッチング(別テーブル)

#### スコアリング
- 時期一致度・興味一致度・年代一致度を重み付け
- 上位 N 件を毎日通知

---

### Prompt 09:コミュニティ機能

#### ゴール
ユーザーがグループを作って継続的に交流できる。

#### データモデル
```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  type TEXT, -- 'city', 'school', 'purpose', 'custom'
  is_official BOOLEAN,
  cover_url TEXT,
  member_count INT,
  created_at TIMESTAMPTZ
);

CREATE TABLE community_members (
  community_id UUID,
  user_id UUID,
  role TEXT, -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ
);

CREATE TABLE community_posts (...);
CREATE TABLE community_albums (...);
CREATE TABLE community_shared_plans (...);
```

#### 機能
- 公式コミュニティ(都市別・学校別)
- 自発コミュニティ(マッチング・掲示板からの派生)
- 同窓ネットワーク(帰国後も残る)
- AI モデレーター(質問の重複検出・有用回答ピン留め)

---

### Prompt 10:掲示板(バイト・シェアメイト)

#### ゴール
現地のアルバイト・シェアメイト募集を、出発前のユーザーから検索可能に。

#### データモデル
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category TEXT, -- 'job', 'roommate', 'item', 'travel_companion', 'review'
  title TEXT,
  description TEXT,
  location JSONB,
  city TEXT,
  country TEXT,
  price JSONB, -- {amount, currency, frequency}
  images TEXT[],
  expires_at TIMESTAMPTZ,
  status TEXT, -- 'active', 'closed', 'expired'
  metadata JSONB,
  created_at TIMESTAMPTZ
);

CREATE TABLE listing_inquiries (
  listing_id UUID,
  inquirer_id UUID,
  message TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
);
```

#### 機能
- カテゴリ・地域・予算でフィルタ
- アプリ内チャット直結
- AI による募集文生成補助(英語/日本語)
- 本人確認バッジ
- AI レコメンド(プランから興味推測)

---

### Prompt 11:先輩 Q&A・失敗談ライブラリ

#### データモデル
```sql
CREATE TABLE qa_threads (
  id UUID PRIMARY KEY,
  questioner_id UUID,
  category TEXT,
  title TEXT,
  content TEXT,
  is_anonymous BOOLEAN,
  view_count INT,
  created_at TIMESTAMPTZ
);

CREATE TABLE qa_answers (...);
CREATE TABLE qa_votes (...);
```

#### 機能
- 質問投稿
- 先輩(渡航中層・帰国層)が回答
- AI が類似質問を集約・要約
- 失敗談カテゴリ(やらかし談)

---

## Phase 3:アクション・収益化深化(1年〜)

### Prompt 12:予約・アフィリエイト統合

#### 連携先
- 学校予約 API or アフィリエイト
- Skyscanner / Amadeus(航空券)
- GetYourGuide / Viator(体験)
- 海外保険会社の API
- Wise / Revolut(送金)

#### データモデル
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  user_id UUID,
  plan_id UUID,
  provider TEXT,
  type TEXT,
  external_id TEXT,
  amount_jpy INT,
  commission_jpy INT,
  status TEXT,
  metadata JSONB,
  booked_at TIMESTAMPTZ
);

CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY,
  user_id UUID,
  creator_id UUID,
  plan_id UUID,
  provider TEXT,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);
```

---

### Prompt 13:クリエイター報酬

#### データモデル
```sql
CREATE TABLE creator_profiles (
  user_id UUID PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  payout_method JSONB,
  total_earned_jpy INT,
  pending_payout_jpy INT
);

CREATE TABLE creator_earnings (
  id UUID PRIMARY KEY,
  creator_id UUID,
  source_type TEXT, -- 'affiliate', 'agent_kickback', 'plan_sale'
  source_id UUID,
  amount_jpy INT,
  status TEXT, -- 'pending', 'paid', 'cancelled'
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);
```

#### 収益フロー
1. プランにアフィリエイトリンク埋め込み
2. 他ユーザーが予約 → `creator_earnings` 計上
3. 月次で集計、Stripe Connect で支払い

---

### Prompt 14:家計簿自動連携

#### 連携先
- Wise API(留学生に人気)
- Revolut API
- 各国の主要銀行(将来)

#### データモデル
```sql
CREATE TABLE financial_accounts (...);
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  account_id UUID,
  amount_local NUMERIC,
  currency TEXT,
  amount_jpy NUMERIC,
  category TEXT,
  merchant TEXT,
  date DATE,
  ai_categorized BOOLEAN
);
```

#### 機能
- 自動取引取得
- AI カテゴリ分類
- 月次レポート
- 当初シミュとの差分表示
- 親への通知(任意)

---

### Prompt 15:緊急サポート

#### データモデル
```sql
CREATE TABLE emergency_contacts (...);
CREATE TABLE emergency_logs (...);
```

#### 機能
- 24時間 AI 一次対応
- カテゴリ(医療・盗難・トラブル・心の不調)
- AI が緊急度判定 → 人間サポートにエスカレーション(Premium)
- 親への自動通知(本人設定次第)
- 大使館・警察・病院の連絡先表示

---

## Phase 4:B2B 拡張(1.5年〜)

### Prompt 16:学校向け SaaS

#### ゴール
Mindtrip の Hotels / Destinations と同じく、学校サイトに埋め込めるAI チャットを提供。

#### 機能
- 学校サイトにコードスニペット1行で導入
- 学校独自のFAQ・カリキュラム・寮情報をインデックス
- 入学相談を AI が一次対応
- 興味あるユーザーを Abro 本体に誘導

#### データモデル
```sql
CREATE TABLE b2b_clients (...);
CREATE TABLE b2b_widgets (...);
CREATE TABLE b2b_widget_sessions (...);
```

---

### Prompt 17:エージェント向け SaaS 拡張

#### 機能
- CRM(顧客一覧、フェーズ、進捗)
- AI 夜間自動応答
- 共同編集ツール(Phase 1 から発展)
- 成約レポート・分析
- カスタム連携(CRM、予約エンジン)

---

## 実装ルール

各機能の詳細プロンプトは、Phase 1 完了後に以下のテンプレートで生成:

1. **前提**:必要なPhase の依存
2. **ゴール**:何が動いたら完成か
3. **データモデル**:SQL マイグレーション
4. **画面/コンポーネント一覧**
5. **API/Edge Function 一覧**
6. **AI プロンプト(必要なら)**
7. **エッジケース**
8. **成果物チェックリスト**

---

## 次のステップ

Phase 1(Prompt 01〜06)が完了したら、私(ユーザー)に報告してください。
そのフィードバックを元に Prompt 07 以降を詳細化します。
