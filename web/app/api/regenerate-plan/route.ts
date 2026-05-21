import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `あなたはAbroの留学・ワーホリプランナーAIです。
既存のプランをユーザーの追加メモ・保存済みカード・リクエストをもとに更新してください。

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
}`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { planId, notes, savedItems, additionalRequest } = await req.json() as {
      planId: string;
      notes: string[];
      savedItems: { label: string; type: string }[];
      additionalRequest: string;
    };

    // 既存プランを取得
    const { data: plan, error: fetchErr } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !plan) return Response.json({ error: 'Plan not found' }, { status: 404 });

    // コンテキスト構築
    const currentSummary = [
      `現在のプラン: ${plan.title}`,
      plan.destination_city ? `渡航先: ${plan.destination_city}（${plan.destination_country}）` : '',
      plan.details?.duration_label ? `期間: ${plan.details.duration_label}` : '',
      plan.purpose ? `目的: ${plan.purpose}` : '',
      plan.budget_jpy ? `予算: ${Math.round(plan.budget_jpy / 10000)}〜${Math.round((plan.budget_max_jpy ?? plan.budget_jpy) / 10000)}万円` : '',
      plan.initial_plan ? `プラン内容: ${plan.initial_plan}` : '',
    ].filter(Boolean).join('\n');

    const notesText = notes?.length
      ? `\nユーザーのメモ:\n${notes.map(n => `- ${n}`).join('\n')}`
      : '';

    const itemsText = savedItems?.length
      ? `\n保存済みカード:\n${savedItems.map(i => `- [${i.type}] ${i.label}`).join('\n')}`
      : '';

    const additionalText = additionalRequest?.trim()
      ? `\n追加リクエスト: ${additionalRequest}`
      : '';

    const userMessage = `以下の情報をもとに、現在のプランを改善・更新してください。
メモや保存済みカードの内容を必ず反映してください。

${currentSummary}${notesText}${itemsText}${additionalText}

更新版のプランをJSON形式で返してください。`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const updated = JSON.parse(raw);

    // DBを更新（notes と saved_items は保持）
    const newDetails = {
      duration_label: updated.duration_label ?? plan.details?.duration_label,
      pre_departure: updated.pre_departure ?? plan.details?.pre_departure,
      timeline: updated.timeline ?? plan.details?.timeline,
      notes: notes ?? plan.details?.notes ?? [],
      saved_items: savedItems ?? plan.details?.saved_items ?? [],
    };

    const { data: updatedPlan, error: updateErr } = await supabase
      .from('plans')
      .update({
        title: updated.title ?? plan.title,
        destination_country: updated.destination_country ?? plan.destination_country,
        destination_city: updated.destination_city ?? plan.destination_city,
        duration_weeks: updated.duration_weeks ?? plan.duration_weeks,
        purpose: updated.purpose ?? plan.purpose,
        budget_jpy: updated.budget_min_jpy ?? plan.budget_jpy,
        budget_max_jpy: updated.budget_max_jpy ?? plan.budget_max_jpy,
        reason: updated.reason ?? plan.reason,
        initial_plan: updated.initial_plan ?? plan.initial_plan,
        details: newDetails,
      })
      .eq('id', planId)
      .select('*')
      .single();

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

    return Response.json({ plan: updatedPlan });
  } catch (e) {
    console.error('[regenerate-plan]', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
