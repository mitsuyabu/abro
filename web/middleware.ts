import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isPublicPath =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth');

  if (isPublicPath) return NextResponse.next();

  // Supabaseのセッションクッキーが存在するか確認（チャンク形式 .0 .1 にも対応）
  const hasSession = request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.avif$|.*\\.svg$|.*\\.ico$).*)',
  ],
};
