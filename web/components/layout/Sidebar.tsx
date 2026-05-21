'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

const NAV_ITEMS = [
  { href: '/chat',        icon: '/icon-chat.png',        label: 'チャット', badge: 2 },
  { href: '/plans',       icon: '/icon-plan.png',        label: 'プラン' },
  { href: '/explore',     icon: '/icon-explore.png',     label: '探す' },
  { href: '/saved',       icon: '/icon-saved.png',       label: '保存済み' },
  { href: '/qa',          icon: '/icon-qa.png',          label: '先輩Q&A' },
  { href: '/inspiration', icon: '/icon-inspiration.png', label: 'インスピレーション' },
  { href: '/bookings',    icon: '/icon-bookings.png',    label: '予約' },
  { href: '/creator',     icon: '/icon-creator.png',     label: 'クリエイター' },
];

const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* デスクトップ・タブレット：左サイドバー */}
      <aside className="hidden md:flex md:flex-col flex-shrink-0 w-16 lg:w-52 h-full bg-white border-r border-border z-40">
        {/* ヘッダー：ロゴ */}
        <div className="flex-shrink-0 h-12 border-b border-border flex items-center justify-center lg:justify-start px-3 lg:px-5">
          <Link href="/chat" className="hover:opacity-80 transition-opacity overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png?v=2" alt="Abro" className="h-8 lg:h-9 w-auto object-contain object-left" />
          </Link>
        </div>

        {/* メインナビ */}
        <nav className="flex flex-col gap-0.5 px-2 lg:px-3 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border-l-2 ${
                  active
                    ? 'border-primary text-primary bg-gray-100'
                    : 'border-transparent text-gray-500 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.icon} alt={item.label} className="w-7 h-7 lg:w-8 lg:h-8 object-contain flex-shrink-0" style={{ mixBlendMode: 'multiply' }} />
                <span className="hidden lg:block flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="hidden lg:block text-xs bg-primary text-white font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {/* 作成ボタン */}
          <div className="mt-3 flex justify-center lg:justify-start">
            <Link
              href="/creator"
              title="作成する"
              className="flex items-center justify-center w-10 h-10 rounded-xl border-2 border-gray-300 text-gray-500 text-xl hover:border-primary hover:text-primary transition-colors"
            >
              +
            </Link>
          </div>
        </nav>

        {/* 緊急ボタン */}
        <div className="px-2 lg:px-3 pb-2">
          <Link
            href="/emergency"
            title="緊急サポート"
            className={`flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname.startsWith('/emergency')
                ? 'bg-red-50 text-red-600'
                : 'text-red-500 hover:bg-red-50'
            }`}
          >
            <span className="text-base leading-none">🆘</span>
            <span className="hidden lg:block">緊急サポート</span>
          </Link>
        </div>

        {/* フッター：ユーザー */}
        <div className="border-t border-border px-2 lg:px-3 py-3">
          {/* ユーザーアバター＋名前 */}
          <div className="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2.5 rounded-xl">
            {user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-sm leading-none">👤</span>
              </div>
            )}
            <span className="hidden lg:block text-sm font-medium text-primary flex-1 truncate">
              {user?.user_metadata?.name ?? user?.email ?? 'ゲスト'}
            </span>
          </div>

          {/* ログアウトボタン */}
          <button
            onClick={handleLogout}
            title="ログアウト"
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-xl text-sm text-muted hover:text-red-500 hover:bg-red-50 transition-colors mt-1"
          >
            <span className="text-base leading-none">↩</span>
            <span className="hidden lg:block">ログアウト</span>
          </button>

          {/* コピーライト（デスクトップのみ） */}
          <div className="hidden lg:block mt-2 px-3">
            <p className="text-[10px] text-muted leading-relaxed">
              会社概要 · お問い合わせ · ヘルプ
            </p>
            <p className="text-[10px] text-muted">
              利用規約 · プライバシー
            </p>
            <p className="text-[10px] text-muted mt-0.5">© 2026 Abro, Inc.</p>
          </div>
        </div>
      </aside>

      {/* モバイル：下部ナビバー */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around z-40 px-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                active ? 'text-primary' : 'text-gray-400'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt={item.label}
                className="w-6 h-6 object-contain"
                style={{ mixBlendMode: 'multiply', opacity: active ? 1 : 0.5 }}
              />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
