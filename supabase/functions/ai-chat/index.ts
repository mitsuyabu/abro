import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';
import { buildSystemPrompt } from './system_prompt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    // 認証ユーザー取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { chat_id, message, create_new } = await req.json() as {
      chat_id?: string;
      message: string;
      create_new?: boolean;
    };

    // ユーザープロフィール取得
    const { data: profile } = await supabase
      .from('users')
      .select('nickname, phase, interested_countries, purposes')
      .eq('id', user.id)
      .single();

    // チャット作成 or 既存チャット取得
    let currentChatId = chat_id;
    if (create_new || !currentChatId) {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ user_id: user.id, title: message.slice(0, 40), type: 'ai' })
        .select()
        .single();

      if (chatError || !newChat) throw new Error('チャット作成に失敗しました');
      currentChatId = newChat.id;
    }

    // ユーザーメッセージを保存
    await supabase.from('messages').insert({
      chat_id: currentChatId,
      role: 'user',
      content: message,
    });

    // チャット履歴を取得(最新20件)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('chat_id', currentChatId)
      .order('created_at', { ascending: true })
      .limit(20);

    const chatMessages = (history ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Claude API ストリーミング呼び出し
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    const systemPrompt = buildSystemPrompt({
      nickname: profile?.nickname ?? null,
      phase: profile?.phase ?? 'considering',
      interested_countries: profile?.interested_countries ?? [],
      purposes: profile?.purposes ?? [],
    });

    const stream = await anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: chatMessages,
    });

    // SSE ストリームを返す
    const encoder = new TextEncoder();
    let fullText = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        // chat_id を最初に送る
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'chat_id', chat_id: currentChatId })}\n\n`,
        ));

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            fullText += text;
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'delta', text })}\n\n`,
            ));
          }
        }

        // 完了したら DB に保存
        let structuredContent = null;
        const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            structuredContent = JSON.parse(jsonMatch[1]);
          } catch {
            // JSON パース失敗は無視
          }
        }

        await supabase.from('messages').insert({
          chat_id: currentChatId,
          role: 'assistant',
          content: fullText,
          structured_content: structuredContent,
        });

        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'done', structured_content: structuredContent })}\n\n`,
        ));
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'すみません、つながりにくいようです。少し待ってもう一度お試しください。' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
