'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

type Section = 'profile' | 'account' | 'notifications';

const PHASE_OPTIONS = [
  { value: 'considering', label: '検討中',   emoji: '🤔' },
  { value: 'preparing',   label: '準備中',   emoji: '📚' },
  { value: 'abroad',      label: '渡航中',   emoji: '🌏' },
  { value: 'returned',    label: '帰国済み', emoji: '🏡' },
];

const PHASE_COLOR: Record<string, string> = {
  considering: 'bg-gray-100 text-gray-600',
  preparing:   'bg-blue-100 text-blue-700',
  abroad:      'bg-green-100 text-green-700',
  returned:    'bg-purple-100 text-purple-700',
};

interface ProfileForm {
  first_name: string;
  last_name: string;
  username: string;
  location: string;
  bio: string;
  phase: string;
  instagram_url: string;
  tiktok_url: string;
  youtube_url: string;
}

interface AccountForm {
  phone: string;
  birthday: string;
}

export default function ProfilePage() {
  const [section, setSection] = useState<Section>('profile');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [profile, setProfile] = useState<ProfileForm>({
    first_name: '', last_name: '', username: '', location: '',
    bio: '', phase: 'considering',
    instagram_url: '', tiktok_url: '', youtube_url: '',
  });

  const [account, setAccount] = useState<AccountForm>({
    phone: '', birthday: '',
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setAuthUser(u);
      if (u) {
        const { data: row } = await supabase
          .from('users')
          .select('*')
          .eq('id', u.id)
          .single();
        if (row) {
          setProfile({
            first_name:    row.first_name    ?? '',
            last_name:     row.last_name     ?? '',
            username:      row.username      ?? '',
            location:      row.location      ?? '',
            bio:           row.bio           ?? '',
            phase:         row.phase         ?? 'considering',
            instagram_url: row.instagram_url ?? '',
            tiktok_url:    row.tiktok_url    ?? '',
            youtube_url:   row.youtube_url   ?? '',
          });
          setAccount({
            phone:    row.phone    ?? '',
            birthday: row.birthday ?? '',
          });
        }
      }
      setLoading(false);
    });
  }, []);

  const fireToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = async () => {
    if (!authUser) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('users').upsert({
      id:            authUser.id,
      email:         authUser.email!,
      first_name:    profile.first_name  || null,
      last_name:     profile.last_name   || null,
      username:      profile.username    || null,
      location:      profile.location    || null,
      bio:           profile.bio         || null,
      phase:         profile.phase,
      instagram_url: profile.instagram_url || null,
      tiktok_url:    profile.tiktok_url    || null,
      youtube_url:   profile.youtube_url   || null,
    });
    setSaving(false);
    fireToast(error ? '保存に失敗しました' : '保存しました', !error);
  };

  const saveAccount = async () => {
    if (!authUser) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('users').upsert({
      id:       authUser.id,
      email:    authUser.email!,
      phone:    account.phone    || null,
      birthday: account.birthday || null,
    });
    setSaving(false);
    fireToast(error ? '保存に失敗しました' : '保存しました', !error);
  };

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    authUser?.user_metadata?.name ||
    authUser?.email ||
    'ゲスト';

  const phase = PHASE_OPTIONS.find(p => p.value === profile.phase) ?? PHASE_OPTIONS[0];
  const avatarUrl = authUser?.user_metadata?.avatar_url;

  const NAV: { id: Section; label: string }[] = [
    { id: 'profile',       label: 'プロフィール編集' },
    { id: 'account',       label: 'アカウント設定' },
    { id: 'notifications', label: '通知設定' },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* 左サイドナビ */}
        <div className="w-64 flex-shrink-0 border-r border-border bg-white overflow-y-auto">
          {/* ユーザー概要 */}
          <div className="px-6 py-6 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary truncate">{displayName}</p>
                {profile.username && (
                  <p className="text-xs text-muted truncate">@{profile.username}</p>
                )}
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PHASE_COLOR[profile.phase]}`}>
              {phase.emoji} {phase.label}
            </span>
          </div>

          {/* ナビ項目 */}
          <nav className="p-3 flex flex-col gap-0.5">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border-l-2 ${
                  section === item.id
                    ? 'border-primary text-primary bg-gray-50'
                    : 'border-transparent text-muted hover:text-primary hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-2xl mx-auto px-8 py-8">

            {/* ─── プロフィール編集 ─── */}
            {section === 'profile' && (
              <>
                <h1 className="text-xl font-bold text-primary mb-6">プロフィール編集</h1>

                {/* アバター */}
                <div className="bg-white border border-border rounded-2xl p-5 mb-5 flex items-center gap-4">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-3xl flex-shrink-0">👤</div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-primary">{profile.username ? `@${profile.username}` : displayName}</p>
                    <p className="text-xs text-muted mt-0.5">プロフィール写真はGoogleアカウントから自動取得されます</p>
                  </div>
                </div>

                {/* 名前 */}
                <div className="bg-white border border-border rounded-2xl p-5 mb-5">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">基本情報</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="名（First name）">
                      <input
                        value={profile.first_name}
                        onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                        placeholder="Taro"
                        className={INPUT}
                      />
                    </Field>
                    <Field label="姓（Last name）">
                      <input
                        value={profile.last_name}
                        onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                        placeholder="Yamada"
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <Field label="ユーザーネーム" className="mb-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">@</span>
                      <input
                        value={profile.username}
                        onChange={e => setProfile(p => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, '') }))}
                        placeholder="username"
                        className={`${INPUT} pl-8`}
                      />
                    </div>
                  </Field>
                  <Field label="場所">
                    <input
                      value={profile.location}
                      onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                      placeholder="東京, 日本"
                      className={INPUT}
                    />
                  </Field>
                </div>

                {/* 自己紹介 */}
                <div className="bg-white border border-border rounded-2xl p-5 mb-5">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">自己紹介</p>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="留学・ワーホリへの想いを書いてみましょう"
                    rows={4}
                    className={`${INPUT} resize-none`}
                  />
                </div>

                {/* ステータス */}
                <div className="bg-white border border-border rounded-2xl p-5 mb-5">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">現在のステータス</p>
                  <div className="grid grid-cols-2 gap-3">
                    {PHASE_OPTIONS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setProfile(pf => ({ ...pf, phase: p.value }))}
                        className={`border-2 rounded-2xl p-4 text-left transition-all ${
                          profile.phase === p.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-white hover:border-primary/30'
                        }`}
                      >
                        <span className="text-xl block mb-1">{p.emoji}</span>
                        <p className="text-sm font-semibold text-primary">{p.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SNSリンク */}
                <div className="bg-white border border-border rounded-2xl p-5 mb-6">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">SNSリンク</p>
                  <div className="flex flex-col gap-4">
                    <Field label="Instagram">
                      <input
                        value={profile.instagram_url}
                        onChange={e => setProfile(p => ({ ...p, instagram_url: e.target.value }))}
                        placeholder="https://instagram.com/username"
                        className={INPUT}
                      />
                    </Field>
                    <Field label="TikTok">
                      <input
                        value={profile.tiktok_url}
                        onChange={e => setProfile(p => ({ ...p, tiktok_url: e.target.value }))}
                        placeholder="https://tiktok.com/@username"
                        className={INPUT}
                      />
                    </Field>
                    <Field label="YouTube">
                      <input
                        value={profile.youtube_url}
                        onChange={e => setProfile(p => ({ ...p, youtube_url: e.target.value }))}
                        placeholder="https://youtube.com/@username"
                        className={INPUT}
                      />
                    </Field>
                  </div>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-full hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存する'}
                </button>
              </>
            )}

            {/* ─── アカウント設定 ─── */}
            {section === 'account' && (
              <>
                <h1 className="text-xl font-bold text-primary mb-6">アカウント設定</h1>

                <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
                  {/* メール */}
                  <div className="px-5 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-primary mb-0.5">メールアドレス</p>
                        <p className="text-sm text-muted">{authUser?.email}</p>
                      </div>
                      <span className="text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full">確認済み</span>
                    </div>
                  </div>

                  {/* 電話番号 */}
                  <div className="px-5 py-4 border-b border-border">
                    <p className="text-sm font-semibold text-primary mb-2">電話番号</p>
                    <input
                      type="tel"
                      value={account.phone}
                      onChange={e => setAccount(a => ({ ...a, phone: e.target.value }))}
                      placeholder="+81 90-0000-0000"
                      className={INPUT}
                    />
                  </div>

                  {/* 誕生日 */}
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-primary mb-2">誕生日</p>
                    <input
                      type="date"
                      value={account.birthday}
                      onChange={e => setAccount(a => ({ ...a, birthday: e.target.value }))}
                      className={INPUT}
                    />
                  </div>
                </div>

                <button
                  onClick={saveAccount}
                  disabled={saving}
                  className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-full hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存する'}
                </button>

                {/* 危険ゾーン */}
                <div className="mt-8 bg-white border border-red-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-red-100">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">危険な操作</p>
                  </div>
                  <button className="w-full px-5 py-4 text-left text-sm text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center justify-between">
                    <span>アカウントを削除する</span>
                    <span className="text-xs text-red-400">›</span>
                  </button>
                </div>
              </>
            )}

            {/* ─── 通知設定 ─── */}
            {section === 'notifications' && (
              <>
                <h1 className="text-xl font-bold text-primary mb-6">通知設定</h1>
                <div className="bg-white border border-border rounded-2xl overflow-hidden">
                  {[
                    { label: 'プッシュ通知',       desc: 'チャットや予約の更新を通知します' },
                    { label: 'メール通知',          desc: '重要なお知らせをメールで受け取ります' },
                    { label: 'コミュニティ通知',    desc: '先輩からの返信やいいねを通知します' },
                    { label: 'プランの更新通知',    desc: '保存したプランに変更があった際に通知します' },
                    { label: 'マーケティングメール', desc: 'Abroからのお得な情報をお届けします' },
                  ].map((item, i) => (
                    <NotificationRow key={item.label} item={item} isLast={i === 4} />
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 whitespace-nowrap ${
          toast.ok ? 'bg-black' : 'bg-red-500'
        }`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

// ─── 小コンポーネント ────────────────────────────────────────
const INPUT = 'w-full border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted outline-none focus:border-primary/50 transition-colors bg-white';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-muted block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function NotificationRow({ item, isLast }: { item: { label: string; desc: string }; isLast: boolean }) {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className={`px-5 py-4 flex items-center justify-between gap-4 ${!isLast ? 'border-b border-border' : ''}`}>
      <div>
        <p className="text-sm font-semibold text-primary">{item.label}</p>
        <p className="text-xs text-muted mt-0.5">{item.desc}</p>
      </div>
      <button
        onClick={() => setEnabled(v => !v)}
        className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-primary' : 'bg-gray-200'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
