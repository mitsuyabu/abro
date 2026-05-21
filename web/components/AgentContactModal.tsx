'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
  planId?: string;
}

export function AgentContactModal({ isOpen, onClose, context, planId }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('users')
        .select('first_name, last_name, username')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.first_name || data?.last_name) {
            setName([data.first_name, data.last_name].filter(Boolean).join(' '));
          } else if (data?.username) {
            setName(data.username);
          }
          if (user.email) setEmail(user.email);
        });
    });
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError('お名前とメールアドレスを入力してください');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/agent-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, planId, context, message }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setError(null);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md mx-0 sm:mx-4 shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-primary/90 to-primary px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🎓</span>
                <h2 className="text-white font-bold text-lg">エージェントに相談する</h2>
              </div>
              <p className="text-white/80 text-xs leading-relaxed">
                専門カウンセラーが留学・ワーホリを無料でサポートします
              </p>
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white text-xl leading-none mt-0.5">✕</button>
          </div>
        </div>

        <div className="px-6 py-5">
          {submitted ? (
            /* 送信完了 */
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">✅</div>
              <h3 className="text-base font-bold text-primary">申し込みを受け付けました！</h3>
              <p className="text-sm text-muted leading-relaxed">
                担当カウンセラーより<strong>{email}</strong>宛に<br />
                1〜2営業日以内にご連絡いたします。
              </p>
              <button onClick={handleClose} className="mt-2 bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity">
                閉じる
              </button>
            </div>
          ) : (
            /* フォーム */
            <div className="flex flex-col gap-4">
              {context && (
                <div className="bg-gray-50 border border-border rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-muted mb-0.5">相談内容</p>
                  <p className="text-xs text-primary leading-relaxed">{context}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-primary block mb-1">お名前 <span className="text-red-400">*</span></label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="山田 太郎"
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-primary block mb-1">メールアドレス <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-primary block mb-1">電話番号（任意）</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="090-0000-0000"
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-primary block mb-1">メッセージ（任意）</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="気になっていること・不安なことを自由に書いてください"
                    rows={3}
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-80 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>送信中...</span></>
                  : '無料カウンセリングを申し込む'
                }
              </button>

              <p className="text-[11px] text-muted text-center leading-relaxed">
                申し込み後、提携エージェントのカウンセラーより<br />
                ご連絡いたします（完全無料・しつこい勧誘なし）
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
