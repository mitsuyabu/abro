import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORY_LABELS: Record<string, string> = {
  visa: 'ビザ・入国', life: '現地生活', school: '語学学校',
  work: 'アルバイト・仕事', money: '費用・お金', housing: '住まい',
  accident: 'トラブル・緊急', other: 'その他',
};

export async function POST(request: Request) {
  const { title, content, category } = await request.json() as {
    title: string; content: string; category: string;
  };

  const catLabel = CATEGORY_LABELS[category] ?? 'その他';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 600,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: `あなたはAbroの先輩留学・ワーホリアドバイザーです。
留学・ワーキングホリデーに関する質問に、経験者として具体的・実践的に答えてください。

回答スタイル：
- 親しみやすく、でも信頼できる先輩感
- 具体的な数字・方法・サービス名を含める
- 注意点や落とし穴も率直に伝える
- 300〜400文字程度にまとめる
- カテゴリ「${catLabel}」に関する専門知識を活かす`,
      },
      {
        role: 'user',
        content: `【質問カテゴリ】${catLabel}\n【タイトル】${title}\n【質問内容】${content}`,
      },
    ],
  });

  const answer = completion.choices[0]?.message?.content ?? '';
  return NextResponse.json({ answer });
}
