'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  best_answer_id: string | null;
  created_at: string;
  questioner_id: string;
  questioner_nickname?: string | null;
  questioner_avatar?: string | null;
  questioner_phase?: string | null;
}

interface QaAnswer {
  id: string;
  thread_id: string;
  answerer_id: string;
  content: string;
  vote_count: number;
  is_best: boolean;
  created_at: string;
  answerer_nickname?: string | null;
  answerer_avatar?: string | null;
  answerer_phase?: string | null;
  voted_by_me?: boolean;
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

export default function QaThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [thread, setThread] = useState<QaThread | null>(null);
  const [answers, setAnswers] = useState<QaAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiShown, setAiShown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchData = async () => {
    if (!id) return;
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);

    const [{ data: threadData }, { data: answersData }] = await Promise.all([
      supabase.from('qa_threads').select('*').eq('id', id).single(),
      supabase.from('qa_answers').select('*').eq('thread_id', id).order('is_best', { ascending: false }).order('vote_count', { ascending: false }).order('created_at', { ascending: true }),
    ]);

    if (threadData) {
      const { data: tUser } = await supabase.from('users').select('id, nickname, avatar_url, phase').eq('id', threadData.questioner_id).single();
      setThread({ ...threadData, questioner_nickname: tUser?.nickname, questioner_avatar: tUser?.avatar_url, questioner_phase: tUser?.phase });
    }

    if (answersData && answersData.length > 0) {
      const aUserIds = [...new Set(answersData.map(a => a.answerer_id))];
      const { data: aUsersData } = await supabase.from('users').select('id, nickname, avatar_url, phase').in('id', aUserIds);
      const userMap = new Map((aUsersData ?? []).map(u => [u.id, u]));

      let votedSet = new Set<string>();
      if (u) {
        const { data: votesData } = await supabase.from('qa_votes').select('answer_id').eq('user_id', u.id).in('answer_id', answersData.map(a => a.id));
        votedSet = new Set((votesData ?? []).map(v => v.answer_id));
      }

      setAnswers(answersData.map(a => ({
        ...a,
        answerer_nickname: userMap.get(a.answerer_id)?.nickname ?? null,
        answerer_avatar: userMap.get(a.answerer_id)?.avatar_url ?? null,
        answerer_phase: userMap.get(a.answerer_id)?.phase ?? null,
        voted_by_me: votedSet.has(a.id),
      })));
    } else {
      setAnswers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAskAI = async () => {
    if (!thread || aiLoading) return;
    setAiShown(true);
    setAiLoading(true);
    const res = await fetch('/api/qa/ai-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: thread.title, content: thread.content, category: thread.category }),
    });
    const data = await res.json() as { answer?: string };
    setAiAnswer(data.answer ?? '回答の生成に失敗しました。');
    setAiLoading(false);
  };

  const handlePostAnswer = async () => {
    if (!answerText.trim() || !user || posting) return;
    setPosting(true);
    const supabase = createClient();
    await supabase.from('qa_answers').insert({ thread_id: id, answerer_id: user.id, content: answerText.trim() });
    setAnswerText('');
    await fetchData();
    setPosting(false);
  };

  const handleVote = async (answer: QaAnswer) => {
    if (!user) { router.push('/login'); return; }
    const supabase = createClient();
    if (answer.voted_by_me) {
      await supabase.from('qa_votes').delete().eq('answer_id', answer.id).eq('user_id', user.id);
    } else {
      await supabase.from('qa_votes').insert({ answer_id: answer.id, user_id: user.id });
    }
    setAnswers(prev => prev.map(a => a.id === answer.id
      ? { ...a, voted_by_me: !a.voted_by_me, vote_count: a.voted_by_me ? a.vote_count - 1 : a.vote_count + 1 }
      : a
    ));
  };

  const handleBestAnswer = async (answerId: string) => {
    if (!thread || thread.questioner_id !== user?.id) return;
    const supabase = createClient();
    await supabase.from('qa_threads').update({ best_answer_id: answerId, is_resolved: true }).eq('id', id);
    await supabase.from('qa_answers').update({ is_best: true }).eq('id', answerId);
    await supabase.from('qa_answers').update({ is_best: false }).eq('thread_id', id).neq('id', answerId);
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-muted">質問が見つかりません</p>
        <Link href="/qa" className="text-primary text-sm hover:opacity-70">← Q&Aに戻る</Link>
      </div>
    );
  }

  const isQuestioner = user?.id === thread.questioner_id;
  const displayName = thread.is_anonymous ? '匿名ユーザー' : (thread.questioner_nickname ?? '名前未設定');
  const phase = thread.questioner_phase;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-border px-4 py-3 flex items-center gap-2">
        <Link href="/qa" className="text-muted hover:text-primary transition-colors text-sm flex-shrink-0">←</Link>
        <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
          {CATEGORY_EMOJI[thread.category]} {CATEGORIES[thread.category]}
        </span>
        {thread.is_resolved && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">✓ 解決済み</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4">
          {/* 質問カード */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <h1 className="text-base font-bold text-primary leading-snug mb-3">{thread.title}</h1>
            <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap mb-4">{thread.content}</p>
            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
                {!thread.is_anonymous && thread.questioner_avatar
                  ? <img src={thread.questioner_avatar} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                  : <span className="text-xs">👤</span>}
              </div>
              <span className="text-xs text-muted">{displayName}</span>
              {phase && !thread.is_anonymous && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PHASE_COLORS[phase] ?? 'bg-gray-100 text-gray-600'}`}>
                  {PHASE_LABELS[phase]}
                </span>
              )}
              <span className="text-[10px] text-muted ml-auto">{timeAgo(thread.created_at)}</span>
            </div>
          </div>

          {/* AI回答カード */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-2 border-b border-primary/10">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">Ab</span>
              </div>
              <p className="text-xs font-semibold text-primary">Abro AI の回答</p>
              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full ml-auto">AI生成</span>
            </div>
            <div className="px-5 py-4">
              {!aiShown ? (
                <button onClick={handleAskAI}
                  className="w-full py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors">
                  ✨ AI に回答を聞く
                </button>
              ) : aiLoading ? (
                <div className="flex items-center gap-2 py-2">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                  <span className="text-xs text-muted">AIが回答を生成中...</span>
                </div>
              ) : (
                <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
              )}
            </div>
          </div>

          {/* 回答一覧 */}
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
              先輩からの回答 {answers.length > 0 ? `(${answers.length}件)` : ''}
            </p>
            {answers.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl px-5 py-8 text-center">
                <p className="text-sm text-muted">まだ回答がありません</p>
                <p className="text-xs text-muted mt-1">最初の回答者になりましょう！</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {answers.map(answer => (
                  <div key={answer.id}
                    className={`bg-white border rounded-2xl p-4 ${answer.is_best ? 'border-emerald-300 bg-emerald-50/30' : 'border-border'}`}>
                    {answer.is_best && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">⭐ ベストアンサー</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
                        {answer.answerer_avatar
                          ? <img src={answer.answerer_avatar} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                          : <span className="text-xs">👤</span>}
                      </div>
                      <span className="text-xs font-semibold text-primary">{answer.answerer_nickname ?? '名前未設定'}</span>
                      {answer.answerer_phase && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PHASE_COLORS[answer.answerer_phase] ?? 'bg-gray-100 text-gray-600'}`}>
                          {PHASE_LABELS[answer.answerer_phase]}
                        </span>
                      )}
                      <span className="text-[10px] text-muted ml-auto">{timeAgo(answer.created_at)}</span>
                    </div>
                    <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{answer.content}</p>
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/50">
                      <button onClick={() => handleVote(answer)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${answer.voted_by_me ? 'text-primary font-semibold' : 'text-muted hover:text-primary'}`}>
                        <span>{answer.voted_by_me ? '👍' : '👍'}</span>
                        <span>参考になった {answer.vote_count > 0 && `(${answer.vote_count})`}</span>
                      </button>
                      {isQuestioner && !thread.is_resolved && (
                        <button onClick={() => handleBestAnswer(answer.id)}
                          className="ml-auto text-[10px] text-emerald-600 border border-emerald-300 rounded-full px-2.5 py-1 hover:bg-emerald-50 transition-colors">
                          ⭐ ベストアンサーに選ぶ
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 回答入力 */}
      {user ? (
        <div className="flex-shrink-0 border-t border-border bg-white px-4 py-3">
          <div className="max-w-2xl mx-auto flex gap-2 items-end">
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center self-end">
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                : <span className="text-sm">👤</span>}
            </div>
            <textarea
              ref={textareaRef}
              value={answerText}
              onChange={e => setAnswerText(e.target.value)}
              placeholder="あなたの経験や知識を回答してみましょう..."
              rows={1}
              maxLength={1000}
              className="flex-1 border border-border rounded-2xl px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary resize-none leading-relaxed"
              style={{ minHeight: '42px', maxHeight: '120px' }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
            <button onClick={handlePostAnswer} disabled={!answerText.trim() || posting}
              className="flex-shrink-0 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-2xl disabled:opacity-40 hover:opacity-80 transition-opacity">
              {posting ? '...' : '回答'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-border bg-white px-4 py-3 text-center">
          <Link href="/login" className="text-sm text-primary font-semibold">ログインして回答する →</Link>
        </div>
      )}
    </div>
  );
}
