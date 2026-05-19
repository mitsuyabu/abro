import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/chat';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Vercel本番環境ではx-forwarded-hostを使う
      const forwardedHost = request.headers.get('x-forwarded-host');
      const redirectBase = forwardedHost
        ? `https://${forwardedHost}`
        : origin;
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const redirectBase = forwardedHost ? `https://${forwardedHost}` : origin;
  return NextResponse.redirect(`${redirectBase}/login?error=auth`);
}
