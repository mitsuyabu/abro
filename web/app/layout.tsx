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
          {/* モバイル: ml-0 pb-16（下部ナビ分）/ タブレット: ml-16 / デスクトップ: ml-52 */}
          <main className="flex-1 h-full overflow-hidden pb-16 md:pb-0 md:ml-16 lg:ml-52">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
