'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface QaThread {
  id: string;
  category: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  answer_count: number;
  is_resolved: boolean;
  created_at: string;
  questioner_id: string;
  questioner_nickname?: string | null;
  questioner_avatar?: string | null;
  questioner_phase?: string | null;
}

const CATEGORIES: Record<string, string> = {
  visa: 'ビザ', life: '生活', school: '学校',
  work: '仕事', money: '費用', housing: '住まい',
  accident: 'トラブル', other: 'その他',
};
const CATEGORY_EMOJI: Record<string, string> = {
  visa: '📄', life: '🌏', school: '🎓',
  work: '💼', money: '💰', housing: '🏠',
  accident: '🚨', other: '💬',
};
const PHASE_LABELS: Record<string, string> = {
  considering: '検討中', preparing: '準備中',
  abroad: '渡航中', returned: '帰国済',
};
const PHASE_COLORS: Record<string, string> = {
  considering: 'bg-gray-100 text-gray-600',
  preparing: 'bg-blue-100 text-blue-700',
  abroad: 'bg-green-100 text-green-700',
  returned: 'bg-purple-100 text-purple-700',
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

function AskModal({ onClose, onPosted }: { onClose: () => void; onPosted: (id: string) => void }) {
  const [category, setCategory] = useState<string>('visa');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const router = useRouter();

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data } = await supabase.from('qa_threads').insert({
      questioner_id: user.id,
      category,
      title: title.trim(),
      content: content.trim(),
      is_anonymous: isAnonymous,
    }).select('id').single();

    setPosting(false);
    if (data) onPosted(data.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-primary">質問を投稿する</h2>
          <p className="text-[11px] text-muted mt-0.5">渡航経験者や先輩からリアルな回答をもらいましょう</p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted mb-2">カテゴリ</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <button key={key} onClick={() => setCategory(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    category === key ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-border hover:border-primary/50'
                  }`}>
                  <span>{CATEGORY_EMOJI[key]}</span><span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">タイトル（質問を一言で） *</p>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
              placeholder="例：シドニーでの語学学校選びのポイントは？"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary" />
          </div>
          <div>
            <p className="text-xs text-muted mb-1">詳細 *</p>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} maxLength={1000}
              placeholder="背景や状況も教えてもらえると、より具体的な回答がもらえます。"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary resize-none" />
            <p className="text-[10px] text-muted text-right mt-0.5">{content.length}/1000</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setIsAnonymous(v => !v)}
              className={`w-10 h-6 rounded-full relative transition-colors ${isAnonymous ? 'bg-primary' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isAnonymous ? 'left-5' : 'left-1'} shadow-sm`} />
            </div>
            <span className="text-xs text-muted">匿名で投稿する</span>
          </label>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:bg-gray-50 transition-colors">キャンセル</button>
          <button onClick={handlePost} disabled={!title.trim() || !content.trim() || posting}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:opacity-80 transition-opacity">
            {posting ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<QaThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAsk, setShowAsk] = useState(false);
  const router = useRouter();

  const fetchThreads = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('qa_threads').select('*').order('created_at', { ascending: false }).limit(50);
    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(t => t.questioner_id))];
    const { data: usersData } = await supabase.from('users').select('id, nickname, avatar_url, phase').in('id', userIds);
    const userMap = new Map((usersData ?? []).map(u => [u.id, u]));

    setThreads(data.map(t => ({
      ...t,
      questioner_nickname: userMap.get(t.questioner_id)?.nickname ?? null,
      questioner_avatar: userMap.get(t.questioner_id)?.avatar_url ?? null,
      questioner_phase: userMap.get(t.questioner_id)?.phase ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchThreads();
  }, []);

  const filtered = activeCategory === 'all' ? threads : threads.filter(t => t.category === activeCategory);

  // カテゴリ別件数
  const counts = Object.fromEntries(Object.keys(CATEGORIES).map(k => [k, threads.filter(t => t.category === k).length]));

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* カテゴリタブ */}
        <div className="flex-shrink-0 bg-white border-b border-border">
          <div className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                activeCategory === 'all' ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-gray-100'
              }`}>
              すべて
            </button>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <button key={key} onClick={() => setActiveCategory(key)}
                className={`flex-shrink-0 flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                  activeCategory === key ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-gray-100'
                }`}>
                <span className="text-xs">{CATEGORY_EMOJI[key]}</span>
                <span>{label}</span>
                {counts[key] > 0 && <span className={`text-[10px] ${activeCategory === key ? 'text-white/70' : 'text-muted'}`}>{counts[key]}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3">
            {/* 質問投稿ボックス */}
            <button onClick={() => user ? setShowAsk(true) : router.push('/login')}
              className="bg-white border border-border rounded-2xl p-4 text-left hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {user?.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : <span className="text-sm">👤</span>}
                </div>
                <span className="text-muted text-sm flex-1">留学・ワーホリのことを先輩に相談しましょう...</span>
                <span className="flex-shrink-0 text-xs bg-primary text-white px-3 py-1 rounded-full font-medium">質問する</span>
              </div>
            </button>

            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <span className="text-4xl">💬</span>
                <p className="text-sm text-muted">まだ質問がありません</p>
                <button onClick={() => setShowAsk(true)} className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-80 transition-opacity">
                  最初の質問をする
                </button>
              </div>
            ) : (
              filtered.map(thread => {
                const phase = thread.questioner_phase;
                const displayName = thread.is_anonymous ? '匿名ユーザー' : (thread.questioner_nickname ?? '名前未設定');
                return (
                  <Link key={thread.id} href={`/qa/${thread.id}`}
                    className="block bg-white border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="flex-shrink-0 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-0.5">
                        {CATEGORY_EMOJI[thread.category]} {CATEGORIES[thread.category]}
                      </span>
                      {thread.is_resolved && (
                        <span className="flex-shrink-0 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mt-0.5">✓ 解決済み</span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-primary leading-snug mb-2 line-clamp-2">{thread.title}</h3>
                    <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">{thread.content}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
                        {!thread.is_anonymous && thread.questioner_avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thread.questioner_avatar} alt="" className="w-full h-full object-cover" />
                        ) : <span className="text-xs">👤</span>}
                      </div>
                      <span className="text-xs text-muted">{displayName}</span>
                      {phase && !thread.is_anonymous && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PHASE_COLORS[phase] ?? 'bg-gray-100 text-gray-600'}`}>
                          {PHASE_LABELS[phase]}
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] text-muted">
                          <span>💬</span><span>{thread.answer_count}</span>
                        </span>
                        <span className="text-[10px] text-muted">{timeAgo(thread.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 右パネル */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white flex-shrink-0">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">よく聞かれること</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[
            { emoji: '📄', q: 'ワーホリビザの申請タイミングは？', cat: 'visa' },
            { emoji: '💰', q: '出発前にいくら貯めればいい？', cat: 'money' },
            { emoji: '🏠', q: '渡航前に住居を決めるべき？', cat: 'housing' },
            { emoji: '🎓', q: '語学学校は現地でも探せる？', cat: 'school' },
            { emoji: '💼', q: '英語が話せなくてもバイトできる？', cat: 'work' },
          ].map(item => (
            <button key={item.q} onClick={() => setActiveCategory(item.cat)}
              className="bg-white border border-border rounded-xl px-4 py-3 text-left hover:border-primary/30 transition-colors flex items-center gap-2">
              <span className="text-base flex-shrink-0">{item.emoji}</span>
              <p className="text-xs text-primary font-medium leading-snug">{item.q}</p>
            </button>
          ))}
          <button onClick={() => user ? setShowAsk(true) : router.push('/login')}
            className="mt-2 w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-80 transition-opacity">
            ✏️ 質問する
          </button>
        </div>
      </div>

      {showAsk && (
        <AskModal
          onClose={() => setShowAsk(false)}
          onPosted={(id) => { setShowAsk(false); router.push(`/qa/${id}`); }}
        />
      )}
    </div>
  );
}
