'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

type Section = 'profile' | 'travel' | 'account' | 'notifications';

// ─── 定数 ────────────────────────────────────────────────────
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

const PURPOSE_OPTIONS = [
  { value: 'study',          label: '語学留学',    emoji: '📚' },
  { value: 'workingholiday', label: 'ワーホリ',    emoji: '💼' },
  { value: 'both',           label: '両方',        emoji: '🌏' },
];

const ENGLISH_OPTIONS = [
  { value: 'beginner',          label: '初級',    desc: 'ほぼ話せない' },
  { value: 'elementary',        label: '基礎',    desc: '簡単な会話はできる' },
  { value: 'intermediate',      label: '中級',    desc: '日常会話ができる' },
  { value: 'upper_intermediate', label: '中上級', desc: 'ビジネス会話ができる' },
  { value: 'advanced',          label: '上級',    desc: 'ネイティブに近い' },
];

const ACCOMMODATION_OPTIONS = [
  { value: 'homestay',    label: 'ホームステイ' },
  { value: 'share_house', label: 'シェアハウス' },
  { value: 'dormitory',   label: '寮・スクール寮' },
  { value: 'apartment',   label: 'アパート' },
  { value: 'flexible',    label: 'こだわらない' },
];

// ─── 型 ──────────────────────────────────────────────────────
interface ProfileForm {
  first_name: string; last_name: string; username: string;
  location: string; bio: string; phase: string;
  instagram_url: string; tiktok_url: string; youtube_url: string;
}
interface AccountForm { phone: string; birthday: string; }
interface TravelForm {
  purpose: string;
  budget_jpy: string;
  travel_timing: string;
  duration: string;
  english_level: string;
  preferred_countries: string;
  preferred_cities: string;
  wants_school: boolean | null;
  wants_work: boolean | null;
  accommodation_preference: string;
  support_level: number;
  concerns: string;
  personality_lifestyle: string;
  career_connection: string;
}

const TRAVEL_DEFAULT: TravelForm = {
  purpose: '', budget_jpy: '', travel_timing: '', duration: '',
  english_level: '', preferred_countries: '', preferred_cities: '',
  wants_school: null, wants_work: null, accommodation_preference: '',
  support_level: 0, concerns: '', personality_lifestyle: '', career_connection: '',
};

// ─── メインページ ─────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('profile');
  const [authUser, setAuthUser]   = useState<User | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  const [profile, setProfile] = useState<ProfileForm>({
    first_name: '', last_name: '', username: '', location: '',
    bio: '', phase: 'considering',
    instagram_url: '', tiktok_url: '', youtube_url: '',
  });
  const [account, setAccount] = useState<AccountForm>({ phone: '', birthday: '' });
  const [travel, setTravel]   = useState<TravelForm>(TRAVEL_DEFAULT);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setAuthUser(u);
      if (u) {
        const [{ data: row }, { data: tp }] = await Promise.all([
          supabase.from('users').select('*').eq('id', u.id).single(),
          supabase.from('travel_profiles').select('*').eq('user_id', u.id).single(),
        ]);
        if (row) {
          setProfile({
            first_name: row.first_name ?? '', last_name: row.last_name ?? '',
            username: row.username ?? '', location: row.location ?? '',
            bio: row.bio ?? '', phase: row.phase ?? 'considering',
            instagram_url: row.instagram_url ?? '', tiktok_url: row.tiktok_url ?? '',
            youtube_url: row.youtube_url ?? '',
          });
          setAccount({ phone: row.phone ?? '', birthday: row.birthday ?? '' });
        }
        if (tp) {
          setTravel({
            purpose: tp.purpose ?? '',
            budget_jpy: tp.budget_jpy ? String(tp.budget_jpy) : '',
            travel_timing: tp.travel_timing ?? '',
            duration: tp.duration ?? '',
            english_level: tp.english_level ?? '',
            preferred_countries: (tp.preferred_countries ?? []).join('、'),
            preferred_cities: (tp.preferred_cities ?? []).join('、'),
            wants_school: tp.wants_school ?? null,
            wants_work: tp.wants_work ?? null,
            accommodation_preference: tp.accommodation_preference ?? '',
            support_level: tp.support_level ?? 0,
            concerns: tp.concerns ?? '',
            personality_lifestyle: tp.personality_lifestyle ?? '',
            career_connection: tp.career_connection ?? '',
          });
        }
      }
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const fireToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = async () => {
    if (!authUser) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('users').upsert({
      id: authUser.id, email: authUser.email!,
      first_name: profile.first_name || null, last_name: profile.last_name || null,
      username: profile.username || null, location: profile.location || null,
      bio: profile.bio || null, phase: profile.phase,
      instagram_url: profile.instagram_url || null,
      tiktok_url: profile.tiktok_url || null,
      youtube_url: profile.youtube_url || null,
    });
    setSaving(false);
    fireToast(error ? '保存に失敗しました' : '保存しました', !error);
  };

  const saveAccount = async () => {
    if (!authUser) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('users').upsert({
      id: authUser.id, email: authUser.email!,
      phone: account.phone || null, birthday: account.birthday || null,
    });
    setSaving(false);
    fireToast(error ? '保存に失敗しました' : '保存しました', !error);
  };

  const saveTravel = async () => {
    if (!authUser) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('travel_profiles').upsert({
      user_id: authUser.id,
      purpose: travel.purpose || null,
      budget_jpy: travel.budget_jpy ? parseInt(travel.budget_jpy.replace(/,/g, '')) : null,
      travel_timing: travel.travel_timing || null,
      duration: travel.duration || null,
      english_level: travel.english_level || null,
      preferred_countries: travel.preferred_countries
        ? travel.preferred_countries.split(/[、,，\s]+/).filter(Boolean) : [],
      preferred_cities: travel.preferred_cities
        ? travel.preferred_cities.split(/[、,，\s]+/).filter(Boolean) : [],
      wants_school: travel.wants_school,
      wants_work: travel.wants_work,
      accommodation_preference: travel.accommodation_preference || null,
      support_level: travel.support_level || null,
      concerns: travel.concerns || null,
      personality_lifestyle: travel.personality_lifestyle || null,
      career_connection: travel.career_connection || null,
    }, { onConflict: 'user_id' });
    setSaving(false);
    fireToast(error ? '保存に失敗しました' : '保存しました', !error);
  };

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    authUser?.user_metadata?.name || authUser?.email || 'ゲスト';
  const phase = PHASE_OPTIONS.find(p => p.value === profile.phase) ?? PHASE_OPTIONS[0];
  const avatarUrl = authUser?.user_metadata?.avatar_url;

  const NAV: { id: Section; label: string; icon: string }[] = [
    { id: 'profile',       label: 'プロフィール編集', icon: '👤' },
    { id: 'travel',        label: '渡航管理',         icon: '✈️' },
    { id: 'account',       label: 'アカウント設定',   icon: '⚙️' },
    { id: 'notifications', label: '通知設定',         icon: '🔔' },
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
                {profile.username && <p className="text-xs text-muted truncate">@{profile.username}</p>}
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PHASE_COLOR[profile.phase]}`}>
              {phase.emoji} {phase.label}
            </span>
          </div>
          <nav className="p-3 flex flex-col gap-0.5">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border-l-2 flex items-center gap-2 ${
                  section === item.id
                    ? 'border-primary text-primary bg-gray-50'
                    : 'border-transparent text-muted hover:text-primary hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border-l-2 border-transparent text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-2 mt-2"
            >
              <span>↩</span>
              ログアウト
            </button>
          </nav>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-2xl mx-auto px-8 py-8">

            {/* ─── プロフィール編集 ─── */}
            {section === 'profile' && (
              <>
                <h1 className="text-xl font-bold text-primary mb-6">プロフィール編集</h1>
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
                <div className="bg-white border border-border rounded-2xl p-5 mb-5">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">基本情報</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="名（First name）">
                      <input value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} placeholder="Taro" className={INPUT} />
                    </Field>
                    <Field label="姓（Last name）">
                      <input value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} placeholder="Yamada" className={INPUT} />
                    </Field>
                  </div>
                  <Field label="ユーザーネーム" className="mb-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">@</span>
                      <input value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, '') }))} placeholder="username" className={`${INPUT} pl-8`} />
                    </div>
                  </Field>
                  <Field label="場所">
                    <input value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} placeholder="東京, 日本" className={INPUT} />
                  </Field>
                </div>
                <div className="bg-white border border-border rounded-2xl p-5 mb-5">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">自己紹介</p>
                  <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="留学・ワーホリへの想いを書いてみましょう" rows={4} className={`${INPUT} resize-none`} />
                </div>
                <div className="bg-white border border-border rounded-2xl p-5 mb-5">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">現在のステータス</p>
                  <div className="grid grid-cols-2 gap-3">
                    {PHASE_OPTIONS.map(p => (
                      <button key={p.value} onClick={() => setProfile(pf => ({ ...pf, phase: p.value }))}
                        className={`border-2 rounded-2xl p-4 text-left transition-all ${profile.phase === p.value ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/30'}`}>
                        <span className="text-xl block mb-1">{p.emoji}</span>
                        <p className="text-sm font-semibold text-primary">{p.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-border rounded-2xl p-5 mb-6">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">SNSリンク</p>
                  <div className="flex flex-col gap-4">
                    <Field label="Instagram"><input value={profile.instagram_url} onChange={e => setProfile(p => ({ ...p, instagram_url: e.target.value }))} placeholder="https://instagram.com/username" className={INPUT} /></Field>
                    <Field label="TikTok"><input value={profile.tiktok_url} onChange={e => setProfile(p => ({ ...p, tiktok_url: e.target.value }))} placeholder="https://tiktok.com/@username" className={INPUT} /></Field>
                    <Field label="YouTube"><input value={profile.youtube_url} onChange={e => setProfile(p => ({ ...p, youtube_url: e.target.value }))} placeholder="https://youtube.com/@username" className={INPUT} /></Field>
                  </div>
                </div>
                <SaveButton saving={saving} onClick={saveProfile} />
              </>
            )}

            {/* ─── 渡航管理 ─── */}
            {section === 'travel' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <h1 className="text-xl font-bold text-primary">渡航管理</h1>
                  <span className="text-xs text-muted bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">チャットで自動更新</span>
                </div>

                {/* 目的 */}
                <Card title="目的" className="mb-5">
                  <div className="grid grid-cols-3 gap-3">
                    {PURPOSE_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => setTravel(t => ({ ...t, purpose: t.purpose === o.value ? '' : o.value }))}
                        className={`border-2 rounded-2xl p-3 text-center transition-all ${travel.purpose === o.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                        <span className="text-2xl block mb-1">{o.emoji}</span>
                        <p className="text-xs font-semibold text-primary">{o.label}</p>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* 予算・時期・期間 */}
                <Card title="予算・時期・期間" className="mb-5">
                  <div className="flex flex-col gap-4">
                    <Field label="予算（円）">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">¥</span>
                        <input type="number" value={travel.budget_jpy} onChange={e => setTravel(t => ({ ...t, budget_jpy: e.target.value }))} placeholder="1500000" className={`${INPUT} pl-8`} />
                      </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="渡航時期">
                        <input value={travel.travel_timing} onChange={e => setTravel(t => ({ ...t, travel_timing: e.target.value }))} placeholder="2025年秋" className={INPUT} />
                      </Field>
                      <Field label="期間">
                        <input value={travel.duration} onChange={e => setTravel(t => ({ ...t, duration: e.target.value }))} placeholder="1年" className={INPUT} />
                      </Field>
                    </div>
                  </div>
                </Card>

                {/* 英語力 */}
                <Card title="英語力" className="mb-5">
                  <div className="flex flex-col gap-2">
                    {ENGLISH_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => setTravel(t => ({ ...t, english_level: t.english_level === o.value ? '' : o.value }))}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${travel.english_level === o.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                        <span className="text-sm font-semibold text-primary">{o.label}</span>
                        <span className="text-xs text-muted">{o.desc}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* 希望地域 */}
                <Card title="希望国・都市" className="mb-5">
                  <div className="flex flex-col gap-4">
                    <Field label="希望国（複数の場合は読点区切り）">
                      <input value={travel.preferred_countries} onChange={e => setTravel(t => ({ ...t, preferred_countries: e.target.value }))} placeholder="オーストラリア、カナダ" className={INPUT} />
                    </Field>
                    <Field label="希望都市（複数の場合は読点区切り）">
                      <input value={travel.preferred_cities} onChange={e => setTravel(t => ({ ...t, preferred_cities: e.target.value }))} placeholder="シドニー、メルボルン" className={INPUT} />
                    </Field>
                  </div>
                </Card>

                {/* 渡航スタイル */}
                <Card title="渡航スタイル" className="mb-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-muted mb-2">学校に通うか</p>
                      <TriToggle value={travel.wants_school} onChange={v => setTravel(t => ({ ...t, wants_school: v }))} labels={['通う', '通わない']} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted mb-2">働きたいか</p>
                      <TriToggle value={travel.wants_work} onChange={v => setTravel(t => ({ ...t, wants_work: v }))} labels={['働く', '働かない']} />
                    </div>
                  </div>
                  <Field label="住まいの希望">
                    <div className="flex flex-wrap gap-2">
                      {ACCOMMODATION_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => setTravel(t => ({ ...t, accommodation_preference: t.accommodation_preference === o.value ? '' : o.value }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${travel.accommodation_preference === o.value ? 'border-primary bg-primary text-white' : 'border-border text-muted hover:border-primary/40'}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </Card>

                {/* サポートの必要度 */}
                <Card title="サポートの必要度" className="mb-5">
                  <p className="text-xs text-muted mb-3">1＝自分でできる　5＝フルサポート希望</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setTravel(t => ({ ...t, support_level: t.support_level === n ? 0 : n }))}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${travel.support_level === n ? 'border-primary bg-primary text-white' : 'border-border text-muted hover:border-primary/40'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* テキスト系 */}
                <Card title="不安要素・性格・キャリア" className="mb-6">
                  <div className="flex flex-col gap-4">
                    <Field label="不安に感じていること">
                      <textarea value={travel.concerns} onChange={e => setTravel(t => ({ ...t, concerns: e.target.value }))} placeholder="英語力が不安、お金の管理が心配　など" rows={3} className={`${INPUT} resize-none`} />
                    </Field>
                    <Field label="性格・ライフスタイル">
                      <textarea value={travel.personality_lifestyle} onChange={e => setTravel(t => ({ ...t, personality_lifestyle: e.target.value }))} placeholder="社交的、アウトドア好き、一人行動が得意　など" rows={3} className={`${INPUT} resize-none`} />
                    </Field>
                    <Field label="キャリアとの接続">
                      <textarea value={travel.career_connection} onChange={e => setTravel(t => ({ ...t, career_connection: e.target.value }))} placeholder="帰国後にマーケティング職に就きたい　など" rows={3} className={`${INPUT} resize-none`} />
                    </Field>
                  </div>
                </Card>

                <SaveButton saving={saving} onClick={saveTravel} />
              </>
            )}

            {/* ─── アカウント設定 ─── */}
            {section === 'account' && (
              <>
                <h1 className="text-xl font-bold text-primary mb-6">アカウント設定</h1>
                <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
                  <div className="px-5 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-primary mb-0.5">メールアドレス</p>
                        <p className="text-sm text-muted">{authUser?.email}</p>
                      </div>
                      <span className="text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full">確認済み</span>
                    </div>
                  </div>
                  <div className="px-5 py-4 border-b border-border">
                    <p className="text-sm font-semibold text-primary mb-2">電話番号</p>
                    <input type="tel" value={account.phone} onChange={e => setAccount(a => ({ ...a, phone: e.target.value }))} placeholder="+81 90-0000-0000" className={INPUT} />
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-primary mb-2">誕生日</p>
                    <input type="date" value={account.birthday} onChange={e => setAccount(a => ({ ...a, birthday: e.target.value }))} className={INPUT} />
                  </div>
                </div>
                <SaveButton saving={saving} onClick={saveAccount} />
                <div className="mt-5 bg-white border border-border rounded-2xl overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-4 text-left text-sm text-muted hover:text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3"
                  >
                    <span className="text-base">↩</span>
                    ログアウト
                  </button>
                </div>
                <div className="mt-3 bg-white border border-red-100 rounded-2xl overflow-hidden">
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
                    { label: 'プッシュ通知',        desc: 'チャットや予約の更新を通知します' },
                    { label: 'メール通知',           desc: '重要なお知らせをメールで受け取ります' },
                    { label: 'コミュニティ通知',     desc: '先輩からの返信やいいねを通知します' },
                    { label: 'プランの更新通知',     desc: '保存したプランに変更があった際に通知します' },
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

      {toast && (
        <div className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 whitespace-nowrap ${toast.ok ? 'bg-black' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

// ─── 小コンポーネント ─────────────────────────────────────────
const INPUT = 'w-full border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted outline-none focus:border-primary/50 transition-colors bg-white';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-muted block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-border rounded-2xl p-5 ${className}`}>
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">{title}</p>
      {children}
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-full hover:opacity-80 transition-opacity disabled:opacity-50">
      {saving ? '保存中...' : '保存する'}
    </button>
  );
}

function TriToggle({ value, onChange, labels }: { value: boolean | null; onChange: (v: boolean | null) => void; labels: [string, string] }) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map((v, i) => (
        <button key={String(v)} onClick={() => onChange(value === v ? null : v)}
          className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${value === v ? 'border-primary bg-primary text-white' : 'border-border text-muted hover:border-primary/40'}`}>
          {labels[i]}
        </button>
      ))}
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
      <button onClick={() => setEnabled(v => !v)}
        className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${enabled ? 'bg-primary' : 'bg-gray-200'}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
