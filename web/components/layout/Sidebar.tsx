'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="fixed left-0 top-0 h-full w-52 bg-white border-r border-border flex flex-col z-40">
      {/* ロゴ */}
      <Link
        href="/chat"
        className="flex items-center gap-2.5 px-5 py-5 hover:opacity-80 transition-opacity"
      >
        <span className="text-primary text-lg leading-none">✦</span>
        <span className="text-lg font-bold text-primary tracking-tight">Abro.</span>
      </Link>

      {/* メインナビ */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border-l-2 ${
                active
                  ? 'border-primary text-primary bg-gray-100'
                  : 'border-transparent text-gray-500 hover:text-primary hover:bg-gray-50'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.icon} alt={item.label} className="w-8 h-8 object-contain flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="text-xs bg-primary text-white font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}

        {/* 新しいチャットボタン */}
        <div className="mt-3 px-0">
          <button
            onClick={() => router.push('/chat')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-primary text-sm font-semibold py-2.5 rounded-full transition-colors"
          >
            新しいチャット
          </button>
        </div>
      </nav>

      {/* 緊急ボタン */}
      <div className="px-3 pb-2">
        <Link
          href="/emergency"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname.startsWith('/emergency')
              ? 'bg-red-50 text-red-600'
              : 'text-red-500 hover:bg-red-50'
          }`}
        >
          <span className="text-base w-5 text-center leading-none">🆘</span>
          <span>緊急サポート</span>
        </Link>
      </div>

      {/* フッター：ユーザー */}
      <div className="border-t border-border px-3 py-3">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-gray-50 group ${
            pathname.startsWith('/profile') ? 'bg-gray-100' : ''
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-sm leading-none">👤</span>
          </div>
          <span className="text-sm font-medium text-primary flex-1 truncate">マイページ</span>
          <button
            onClick={(e) => e.preventDefault()}
            className="opacity-0 group-hover:opacity-100 text-muted hover:text-primary transition-all text-lg leading-none px-1"
            aria-label="メニュー"
          >
            ···
          </button>
        </Link>

        {/* コピーライト */}
        <div className="mt-2 px-3">
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
  );
}
