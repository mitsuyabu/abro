'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname.startsWith('/auth');

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden pb-16 md:pb-0 md:ml-16 lg:ml-52">
        {children}
      </main>
    </div>
  );
}
