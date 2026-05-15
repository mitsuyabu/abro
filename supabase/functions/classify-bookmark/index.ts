import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { bookmark_id, title, description, content_text, source_type, categories } = body;

    const contentParts = [
      title ? `タイトル: ${title}` : null,
      description ? `説明: ${description}` : null,
      content_text ? `本文: ${content_text.slice(0, 500)}` : null,
      `タイプ: ${source_type}`,
    ].filter(Boolean).join('\n');

    const categoryList = (categories as { key: string; label: string }[])
      .map((c) => `- ${c.key}: ${c.label}`)
      .join('\n');

    const prompt = `あなたは留学・ワーホリ準備中のユーザーの情報を整理するアシスタントです。
以下のコンテンツを、最も適したカテゴリに分類してください。

コンテンツ:
${contentParts}

カテゴリ一覧:
${categoryList}

回答は必ず以下の JSON 形式のみで返してください(説明不要):
{
  "category": "カテゴリキー",
  "confidence": 0.0〜1.0の数値,
  "tags": ["タグ1", "タグ2"],
  "summary": "30字以内の日本語要約"
}`;

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = text.match(/\{[\s\S]+\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const result = JSON.parse(jsonMatch[0]);

    // DB を更新
    if (bookmark_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('bookmarks').update({
        category: result.category ?? 'others',
        ai_classified: true,
        ai_confidence: result.confidence ?? null,
        tags: result.tags ?? [],
        description: result.summary ?? null,
      }).eq('id', bookmark_id);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), category: 'others', confidence: 0 }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
