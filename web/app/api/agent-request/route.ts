import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { name, email, phone, planId, context, message } = await req.json() as {
      name: string;
      email: string;
      phone?: string;
      planId?: string;
      context?: string;
      message?: string;
    };

    if (!name?.trim() || !email?.trim()) {
      return Response.json({ error: 'お名前とメールアドレスは必須です' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('agent_consultation_requests')
      .insert({
        user_id: user?.id ?? null,
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        plan_id: planId ?? null,
        context: context ?? null,
        message: message?.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[agent-request]', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ id: data.id });
  } catch (e) {
    console.error('[agent-request]', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
