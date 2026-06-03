import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const planId = formData.get('planId') as string | null;

  if (!file || !planId) return NextResponse.json({ error: 'Missing file or planId' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
  if (!allowed.includes(ext)) return NextResponse.json({ error: '対応形式: JPG, PNG, WebP' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const path = `${user.id}/${planId}.${ext}`;

  const { error } = await supabase.storage
    .from('plan-covers')
    .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from('plan-covers').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
