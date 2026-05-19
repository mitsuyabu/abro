'use client';

import { createClient } from '@/utils/supabase/client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      setAuthError(error.message);
      setLoading(false);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setAuthError('ログインURLの取得に失敗しました。Supabaseの設定を確認してください。');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Abro" className="h-10 w-auto object-contain" />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-border p-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">ようこそ</h1>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              留学・ワーホリの第一歩を<br />一緒に始めましょう。
            </p>
          </div>

          {(error || authError) && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl text-center">
              {authError ?? 'ログインに失敗しました。もう一度お試しください。'}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-border hover:border-primary/30 hover:shadow-sm text-primary font-medium py-3 px-4 rounded-2xl transition-all disabled:opacity-60"
          >
            {/* Google icon */}
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
              <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
              <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/>
              <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
            </svg>
            {loading ? '処理中...' : 'Googleでログイン'}
          </button>

          <p className="text-[11px] text-muted text-center leading-relaxed">
            ログインすることで
            <a href="/terms" className="underline">利用規約</a>および
            <a href="/privacy" className="underline">プライバシーポリシー</a>
            に同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
