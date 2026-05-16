'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/chat',        icon: '💬', label: 'チャット' },
  { href: '/plans',       icon: '🧳', label: 'プラン' },
  { href: '/explore',     icon: '🌏', label: '探す' },
  { href: '/saved',       icon: '❤️', label: '保存済み' },
  { href: '/qa',          icon: '👥', label: '先輩Q&A' },
  { href: '/bookings',    icon: '🗒️', label: '予約' },
  { href: '/creator',     icon: '💰', label: 'クリエイター' },
];

const BOTTOM_ITEMS = [
  { href: '/emergency',   icon: '🆘', label: '緊急' },
  { href: '/profile',     icon: '👤', label: 'マイページ' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-white border-r border-border flex flex-col items-center py-4 gap-1 z-40">
      {/* ロゴ */}
      <Link href="/chat" className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-3 hover:opacity-80 transition-opacity">
        <span className="text-white text-sm font-bold">Ab</span>
      </Link>

      {/* メインナビ */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors hover:bg-gray-100 relative group ${
                active ? 'bg-gray-100' : ''
              }`}
            >
              {item.icon}
              {/* ツールチップ */}
              <span className="absolute left-14 bg-primary text-white text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ボトムナビ */}
      <div className="flex flex-col items-center gap-1">
        {BOTTOM_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const isEmergency = item.href === '/emergency';
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors hover:bg-gray-100 relative group ${
                active ? 'bg-gray-100' : ''
              } ${isEmergency ? 'hover:bg-red-50' : ''}`}
            >
              {item.icon}
              <span className="absolute left-14 bg-primary text-white text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
