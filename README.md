# Abro - Claude Code 指示プロンプト集

このフォルダには Abro を Claude Code で実装するための指示プロンプトが入っています。

---

## ファイル構成

### 必読ファイル(常に参照)

| ファイル | 内容 | 用途 |
|---|---|---|
| **00_SERVICE_OVERVIEW.md** | サービスの「魂」 | **最重要・常に参照** |
| **01_PROJECT.md** | 技術憲法 | **常に参照** |

### 機能別プロンプト(Phase 1 MVP)

| ファイル | 内容 | 用途 |
|---|---|---|
| `02_setup_and_auth.md` | プロジェクト初期化+認証 | 最初に実行 |
| `03_ai_chat_and_plan.md` | AI チャット+プラン作成 | コア機能① |
| `04_cost_simulator.md` | 費用シミュレーター | コア機能② |
| `05_ai_bookmark.md` | AI 自動分類ブックマーク | コア機能③(差別化) |
| `06_parent_and_tasks.md` | 親アカウント+タスク管理 | コア機能④ |
| `07_agent_room.md` | エージェントルーム | Phase 1 仕上げ |

### Phase 2 以降

| ファイル | 内容 | 用途 |
|---|---|---|
| `08-18_phase2_phase3_phase4_outline.md` | Phase 2/3/4 の概要 | 認識合わせ用 |

---

## ファイルの読む順序(重要)

Claude Code が機能を実装する前に、**必ず以下の順で読む**ようにしてください。

```
1. 00_SERVICE_OVERVIEW.md  ← サービスの魂、誰のために何を作るか
                              ↓
2. 01_PROJECT.md           ← 技術スタック、ディレクトリ構造、原則
                              ↓
3. 該当の機能プロンプト    ← 例:02_setup_and_auth.md
```

**この順序が肝心です。**
SERVICE_OVERVIEW を飛ばすと、Claude Code が「何を作るか」は理解しても「なぜそう作るか」を見失い、細部の判断(コピー、UI、エラーメッセージ、データモデル)がブレます。

---

## Claude Code での使い方

### ステップ 1:プロジェクト準備

```bash
# プロジェクトディレクトリ作成
mkdir abro && cd abro
git init

# このフォルダ内のファイル群を docs/ にコピー
mkdir -p docs/prompts

# 必読ファイルは docs/ 直下に配置(常時参照用)
cp /path/to/abro_prompts/00_SERVICE_OVERVIEW.md docs/SERVICE_OVERVIEW.md
cp /path/to/abro_prompts/01_PROJECT.md docs/PROJECT.md

# 機能別プロンプトは docs/prompts/ に
cp /path/to/abro_prompts/0[2-7]_*.md docs/prompts/
cp /path/to/abro_prompts/08-18_*.md docs/prompts/
```

### ステップ 2:Claude Code 起動

```bash
claude
```

### ステップ 3:最初の指示

Claude Code に以下を伝えます:

```
このプロジェクトは Abro という留学・ワーホリ向けの AI プラットフォームです。

まず以下のファイルを順に読んで、サービスの全体像を理解してください:

1. docs/SERVICE_OVERVIEW.md(サービスの魂、ユーザー像、世界観)
2. docs/PROJECT.md(技術スタック、ディレクトリ構造、原則)
3. docs/prompts/02_setup_and_auth.md(最初に実装する機能)

読み終わったら、不明点を質問してから実装を始めてください。
段階的にコミットし、完了したら docs/CHANGELOG.md に記録してください。
```

### ステップ 4:各プロンプトを順に実行

Prompt 02 完了 → Prompt 03 → … と進めます。
各完了報告を受けてから次に進む形が安全です。

例:
```
Prompt 02 完了確認しました。
次は docs/prompts/03_ai_chat_and_plan.md を実装してください。

実装前に、必要なら docs/SERVICE_OVERVIEW.md と docs/PROJECT.md を再確認してください。
特にトーン&マナーと AI のシステムプロンプト設計に影響します。
```

---

## 重要な原則

### 1. SERVICE_OVERVIEW は常に参照

Claude Code が以下のような判断をするとき、必ず SERVICE_OVERVIEW を参照させてください:

- **コピー(文言)を書くとき** → トーン&マナーセクション
- **UI 判断に迷うとき** → コアバリュー、Mindtrip 哲学
- **エラーメッセージを書くとき** → 「ユーザーの不安を煽らない」原則
- **AI のシステムプロンプトを書くとき** → ペルソナ、プロダクト哲学
- **データモデル設計に迷うとき** → 長期蓄積・プライバシー原則

### 2. PROJECT.md は技術判断の基準

- ライブラリ選定
- ディレクトリ構造
- セキュリティ・RLS
- ファイル命名規則

### 3. 段階的に進める

全部一気に実装すると Claude Code でも破綻します。
1 プロンプトずつ、動作確認しながら進めてください。

### 4. 環境変数の管理

以下の API キーは早めに取得しておいてください:
- Supabase URL / Anon Key
- Anthropic API Key(Claude)
- OpenAI API Key(Embeddings)
- Google Maps API Key(将来)
- LINE Messaging API(将来)

`.env.local` で管理、リポジトリにはコミットしない。

### 5. テスト

各プロンプトに「成果物チェックリスト」があります。
**全項目クリアしてから次に進む**こと。

### 6. CHANGELOG

完了後は必ず `docs/CHANGELOG.md` に記録:

```md
## Prompt 02 - 2026/MM/DD
- プロジェクト初期化完了
- Supabase 認証フロー実装
- 既知の問題:Apple ログインは Sandbox のみ確認
- 次:Prompt 03
```

---

## 細かい判断に迷ったときの指針

Claude Code が「これどうしますか?」と聞いてきた場合、まずどのファイルを見るべきかを示します。

| 迷う場面 | 参照すべきファイル | セクション |
|---|---|---|
| ライブラリ選定 | `PROJECT.md` | 4. 技術スタック |
| 画面遷移・UI 設計 | `SERVICE_OVERVIEW.md` | 5-6. コアバリュー、プロダクト哲学 |
| コピーの文言 | `SERVICE_OVERVIEW.md` | 9. トーン&マナー |
| エラーメッセージ | `SERVICE_OVERVIEW.md` | 9. トーン&マナー、12. プロダクト哲学 |
| データモデル | `PROJECT.md` + 機能プロンプト | RLS 必須、長期蓄積前提 |
| AI システムプロンプト | `SERVICE_OVERVIEW.md` | 4. ペルソナ、9. トーン&マナー、12. 哲学 |
| 機能スコープ判断 | `SERVICE_OVERVIEW.md` | 10. やらないこと |
| 用語統一 | `SERVICE_OVERVIEW.md` | 13. 用語集 |

---

## ロードマップ

```
Phase 1 MVP (0-6ヶ月)         ← Prompt 02-07
   - 認証、AI チャット、費用シミュ、ブックマーク
   - 親アカウント、エージェントルーム
   ↓
Phase 2 コミュニティ (6-12ヶ月) ← Prompt 08-12(後で詳細化)
   - SNS 4層、マッチング、コミュニティ
   - 掲示板、先輩 Q&A
   ↓
Phase 3 収益化 (1年〜)         ← Prompt 13-16(後で詳細化)
   - 予約・アフィリエイト、クリエイター報酬
   - 家計簿、緊急サポート
   ↓
Phase 4 B2B (1.5年〜)         ← Prompt 17-18(後で詳細化)
   - 学校向け SaaS、エージェント SaaS 拡張
```

---

## サポート

実装中に迷ったときは、Claude(私)に再度相談してください:
- 「Prompt 03 の途中でこういうエラーが出た」
- 「データモデルをこう変えたいけど影響範囲は?」
- 「Phase 2 のプロンプトを詳細化して」
- 「SERVICE_OVERVIEW に追加すべき要素がある」

---

頑張ってください 🚀
