import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORY_PROMPT: Record<string, string> = {
  '学校': `語学学校・教育機関のガイドを作成してください。
生成するセクション（sections）の例：
- 学校の特徴・雰囲気
- カリキュラム・コース内容
- 料金・コスト感
- アクセス・ロケーション
- 日本人スタッフ・サポート体制
- 体験談・おすすめポイント`,

  '店舗': `カフェ・レストラン・お店のガイドを作成してください。
生成するセクション（sections）の例：
- お店の雰囲気・特徴
- おすすめメニュー・商品
- 価格帯・支払い方法
- 混雑時間・予約の可否
- アクセス・営業時間
- 日本語対応・ローカル情報`,

  '場所': `観光スポット・エリアのガイドを作成してください。
生成するセクション（sections）の例：
- スポットの概要・見どころ
- ベストシーズン・時間帯
- アクセス方法・移動手段
- 周辺エリア情報
- 費用・チケット情報
- 注意点・ローカルTips`,

  '体験': `アクティビティ・体験のガイドを作成してください。
生成するセクション（sections）の例：
- 体験の概要・内容
- 参加方法・予約方法
- 費用・所要時間
- 持ち物・服装
- 体験談・感想
- おすすめポイント・注意事項`,
};

export async function POST(request: Request) {
  const { category, location, title, userNotes } = await request.json() as {
    category: string;
    location: string;
    title: string;
    userNotes?: string;
  };

  const categoryGuide = CATEGORY_PROMPT[category] ?? CATEGORY_PROMPT['場所'];

  const prompt = `あなたは留学・ワーホリ経験者としてガイドを作成するアシスタントです。
以下の情報をもとに、インスピレーションページに掲載するガイドの下書きを生成してください。

【ガイド情報】
カテゴリ：${category}
場所：${location}
タイトル：${title}
${userNotes ? `作者のメモ：${userNotes}` : ''}

${categoryGuide}

以下のJSON形式で返してください（コードブロック不要）：
{
  "overview": "読者を引き込む導入文（150〜200文字）。体験談・リアルな情報を含める",
  "sections": [
    { "id": "1", "title": "セクション名", "content": "内容（100〜150文字）" },
    { "id": "2", "title": "セクション名", "content": "内容（100〜150文字）" },
    { "id": "3", "title": "セクション名", "content": "内容（100〜150文字）" }
  ],
  "items": [
    { "id": "1", "name": "アイテム名（学校名・店名・スポット名など）", "description": "説明（60〜80文字）", "tip": "おすすめポイント（30〜50文字）" },
    { "id": "2", "name": "アイテム名", "description": "説明", "tip": "ポイント" },
    { "id": "3", "name": "アイテム名", "description": "説明", "tip": "ポイント" }
  ]
}

注意：
- 日本語で生成する
- 実体験に基づいたリアルな情報を心がける
- items は ${category === '体験' ? '体験・アクティビティ' : category === '学校' ? '語学学校・コース' : category === '店舗' ? 'カフェ・店舗' : 'おすすめスポット'}の具体例を3〜5件
- 場所（${location}）に関連した具体的な情報を含める`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1500,
    temperature: 0.8,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: '生成に失敗しました' }, { status: 422 });

  const data = JSON.parse(jsonMatch[0]);
  return NextResponse.json(data);
}
