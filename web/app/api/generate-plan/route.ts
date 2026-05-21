import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GENERATE_PROMPT = `あなたはAbroの留学・ワーホリプランナーAIです。
以下の会話をもとに、ユーザーに最適な渡航プランを作成してください。

以下のJSON形式で返してください（コードブロック不要、JSONのみ）：

{
  "title": "あなたにおすすめの○○プラン",
  "destination_country": "国名（日本語）",
  "destination_city": "都市名（日本語）",
  "duration_weeks": 整数（週数）,
  "duration_label": "1年間" など表示用,
  "purpose": "study" | "workingholiday" | "both",
  "budget_min_jpy": 整数,
  "budget_max_jpy": 整数,
  "initial_plan": "語学学校12週間 + アルバイト + セカンドビザ検討 など",
  "reason": "おすすめ理由を2〜3文で",
  "pre_departure": {
    "visa": "ビザ申請の手順・注意点",
    "school": "おすすめ学校タイプ・探し方",
    "accommodation": "滞在方法のアドバイス",
    "insurance": "海外旅行保険・ワーホリ保険について",
    "flights": "航空券の探し方・タイミング",
    "local_preparation": "現地生活準備（銀行・SIM・etc）",
    "job_search": "仕事探し・バイトの始め方",
    "english_study": "渡航前英語学習プラン"
  },
  "timeline": [
    {"period": "渡航6ヶ月前", "tasks": ["ビザ申請", "資金準備"]},
    {"period": "渡航3ヶ月前", "tasks": ["学校選び", "航空券購入"]},
    {"period": "渡航1ヶ月前", "tasks": ["保険加入", "荷物準備"]},
    {"period": "渡航後1週間", "tasks": ["現地SIM", "銀行口座開設"]},
    {"period": "渡航後1ヶ月", "tasks": ["学校スタート", "仕事探し開始"]}
  ]
}

会話から読み取れない情報は、一般的な留学・ワーホリの知識で補完してください。
オーストラリアに関しては特に詳しく、現実的な情報を提供してください。`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages } = await req.json() as { messages: { role: string; content: string }[] };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: GENERATE_PROMPT },
        {
          role: 'user',
          content: `以下の会話をもとにプランを作成してください:\n\n${
            messages.map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`).join('\n\n')
          }`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const plan = JSON.parse(raw);

    // DBに保存
    const { data: saved, error } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        title: plan.title ?? '渡航プラン',
        destination_country: plan.destination_country ?? null,
        destination_city: plan.destination_city ?? null,
        duration_weeks: plan.duration_weeks ?? null,
        purpose: plan.purpose ?? null,
        budget_jpy: plan.budget_min_jpy ?? null,
        budget_max_jpy: plan.budget_max_jpy ?? null,
        reason: plan.reason ?? null,
        initial_plan: plan.initial_plan ?? null,
        details: {
          duration_label: plan.duration_label,
          pre_departure: plan.pre_departure,
          timeline: plan.timeline,
        },
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[generate-plan] DB error', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ id: saved.id, plan });
  } catch (e) {
    console.error('[generate-plan]', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
