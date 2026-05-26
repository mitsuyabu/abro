import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GENERATE_PROMPT = `あなたはAbroの留学・ワーホリプランナーAIです。
以下の会話をもとに、ユーザーに最適な渡航プランを作成してください。

以下のJSON形式で返してください（コードブロック不要、JSONのみ）：

{
  "title": "渡航先＋期間＋目的＋ユーザーの個性を組み合わせたユニークなタイトル（例：「シドニーで1年ワーホリ！英語ゼロからカフェスタッフを目指す旅」「ゴールドコースト3ヶ月語学留学〜ビーチ好きの初海外挑戦〜」など。都市名・期間・目的・会話から読み取れる特徴を必ず含め、同じタイトルにならないよう工夫すること）",
  "destination_country": "国名（日本語）",
  "destination_city": "都市名（日本語）",
  "duration_weeks": 整数（週数）,
  "duration_label": "1年間" など表示用,
  "purpose": "study" | "workingholiday" | "both",
  "budget_min_jpy": 整数,
  "budget_max_jpy": 整数,
  "initial_plan": "語学学校12週間 + アルバイト + セカンドビザ検討 など",
  "reason": "おすすめ理由を2〜3文で（ユーザーの会話内容に触れて個別化すること）",
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
  ],
  "first_week": [
    {"day": "到着日", "highlight": "ホームステイ先へ移動・チェックイン", "tips": "時差ボケに注意。荷物を整理して早めに就寝。"},
    {"day": "2日目", "highlight": "語学学校のオリエンテーション", "tips": "クラスメートに積極的に話しかけよう！"},
    {"day": "3日目", "highlight": "街を散策・スーパーに行ってみよう", "tips": "地元のスーパーでオーストラリアの食材を探そう。"},
    {"day": "4日目", "highlight": "通学ルートと交通機関を把握", "tips": "Opalカード（シドニー）などのICカードを使いこなそう。"},
    {"day": "5日目", "highlight": "クラスメートとランチに挑戦", "tips": "「一緒にランチどう？」の一言が友達づくりの第一歩。"},
    {"day": "6日目（週末）", "highlight": "近くの観光スポットへ", "tips": "疲れが溜まりやすい時期。無理せず楽しもう。"},
    {"day": "7日目（週末）", "highlight": "1週間を振り返り・次週の計画", "tips": "不安なことを書き出して解消策を考えよう。"}
  ],
  "yearly_plan": [
    {"month": "1ヶ月目", "title": "語学学校スタート・生活に慣れる", "detail": "ホームステイで基本的な生活リズムを確立。語学学校でレベルチェック。まず毎日通うことを目標に。"},
    {"month": "2ヶ月目", "title": "友達づくりと英語力の伸びを実感", "detail": "クラスの雰囲気に慣れ、週末は友達と観光。英語で注文・会話できる場面が増えてくる。"},
    {"month": "Nヶ月目", "title": "...", "detail": "..."}
  ]
}

注意：
- first_weekは常に7日分生成すること（渡航先の文化・生活に沿った具体的な内容で）
- yearly_planはduration_weeksから換算した期間（例：26週=6ヶ月分、52週=12ヶ月分）を生成すること
- 会話から読み取れない情報は、一般的な留学・ワーホリの知識で補完してください
- オーストラリアに関しては特に詳しく、現実的な情報を提供してください`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages } = await req.json() as { messages: { role: string; content: string }[] };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 3500,
      temperature: 0.8,
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
          first_week: plan.first_week ?? [],
          yearly_plan: plan.yearly_plan ?? [],
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
