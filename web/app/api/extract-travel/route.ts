import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EXTRACT_PROMPT = `あなたは会話から留学・ワーホリの渡航情報を抽出するAIです。
以下の会話を読み、ユーザーが明示的または暗示的に述べた渡航情報をJSONで返してください。

抽出するフィールド:
- purpose: 目的 ("study"=語学留学のみ / "workingholiday"=ワーホリのみ / "both"=両方 / null=不明)
- budget_jpy: 予算（整数、円。「150万」→1500000。不明はnull）
- travel_timing: 渡航時期（文字列。例: "2025年秋", "来年春"。不明はnull）
- duration: 期間（文字列。例: "1年", "3ヶ月"。不明はnull）
- english_level: 英語力 ("beginner"=初級 / "elementary"=基礎 / "intermediate"=中級 / "upper_intermediate"=中上級 / "advanced"=上級 / null=不明)
- preferred_countries: 希望国の配列（例: ["オーストラリア","カナダ"]。なければ[]）
- preferred_cities: 希望都市の配列（例: ["シドニー","メルボルン"]。なければ[]）
- wants_school: 学校に通いたいか (true/false/null)
- wants_work: 働きたいか (true/false/null)
- accommodation_preference: 住まいの希望 ("homestay"=ホームステイ / "share_house"=シェアハウス / "dormitory"=寮 / "apartment"=アパート / "flexible"=こだわらない / null=不明)
- support_level: サポートの必要度 (1=自分でできる 〜 5=フルサポート希望 / null=不明)
- concerns: 不安要素（文字列。複数あれば「、」で繋ぐ。なければnull）
- personality_lifestyle: 性格・ライフスタイル（文字列。なければnull）
- career_connection: キャリアとの接続（文字列。なければnull）

ルール:
- 会話で明確に言及されたフィールドのみ値を設定してください
- 言及されていないフィールドは必ずnull（配列はnull、ただし明確に「なし」なら[]）
- 推測・補完は禁止
- 出力はJSONのみ（コードブロック不要）
`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const { messages } = await req.json() as { messages: { role: string; content: string }[] };
    if (!messages?.length) return new Response('OK');

    // 直近10件のみ対象
    const recent = messages.slice(-10);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: `以下の会話から渡航情報を抽出してください:\n\n${recent.map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`).join('\n\n')}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const extracted = JSON.parse(raw) as Record<string, unknown>;

    // null のフィールドを除いて更新対象だけ残す
    const updates: Record<string, unknown> = { user_id: user.id };
    const fields = [
      'purpose', 'budget_jpy', 'travel_timing', 'duration', 'english_level',
      'preferred_countries', 'preferred_cities', 'wants_school', 'wants_work',
      'accommodation_preference', 'support_level', 'concerns',
      'personality_lifestyle', 'career_connection',
    ];
    let hasUpdate = false;
    for (const field of fields) {
      const val = extracted[field];
      if (val !== null && val !== undefined) {
        // 空配列はスキップ
        if (Array.isArray(val) && val.length === 0) continue;
        updates[field] = val;
        hasUpdate = true;
      }
    }

    if (!hasUpdate) return new Response('OK');

    await supabase.from('travel_profiles').upsert(updates, { onConflict: 'user_id' });

    return new Response('OK');
  } catch (e) {
    console.error('[extract-travel]', e);
    return new Response('OK'); // エラーでもチャットを止めない
  }
}
