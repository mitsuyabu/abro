import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Abro',
  description: 'AI-powered study abroad & working holiday platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-background h-screen overflow-hidden">
        <div className="flex h-full">
          <Sidebar />
          <main className="ml-52 flex-1 h-full overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
