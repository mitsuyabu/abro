'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname.startsWith('/auth');

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-h-0 overflow-hidden pb-16 md:pb-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
