'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Community {
  id: string;
  name: string;
  description: string | null;
  cover_emoji: string;
  member_count: number;
  post_count: number;
  created_by: string | null;
  is_official: boolean;
}

interface Post {
  id: string;
  content: string;
  like_count: number;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  user_nickname?: string | null;
  user_avatar?: string | null;
  liked_by_me?: boolean;
}

interface Member {
  user_id: string;
  role: string;
  joined_at: string;
  nickname?: string | null;
  avatar_url?: string | null;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'members'>('posts');
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const fetchData = async () => {
    if (!id) return;
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();

    const [{ data: communityData }, { data: postsData }, { data: membersData }] = await Promise.all([
      supabase.from('communities').select('*').eq('id', id).single(),
      supabase.from('community_posts').select('*').eq('community_id', id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50),
      supabase.from('community_members').select('user_id, role, joined_at').eq('community_id', id).order('joined_at', { ascending: true }).limit(100),
    ]);

    setCommunity(communityData as Community);

    // メンバー情報を users テーブルから補完
    if (membersData && membersData.length > 0) {
      const userIds = membersData.map(m => m.user_id);
      const { data: usersData } = await supabase.from('users').select('id, nickname, avatar_url').in('id', userIds);
      const userMap = new Map((usersData ?? []).map(u => [u.id, u]));
      setMembers(membersData.map(m => ({
        ...m,
        nickname: userMap.get(m.user_id)?.nickname ?? null,
        avatar_url: userMap.get(m.user_id)?.avatar_url ?? null,
      })));
      setIsMember(u ? membersData.some(m => m.user_id === u.id) : false);
    } else {
      setMembers([]);
      setIsMember(false);
    }

    // 投稿の投稿者情報を補完
    if (postsData && postsData.length > 0) {
      const postUserIds = [...new Set((postsData as Post[]).map(p => p.user_id))];
      const { data: postUsersData } = await supabase.from('users').select('id, nickname, avatar_url').in('id', postUserIds);
      const postUserMap = new Map((postUsersData ?? []).map(u => [u.id, u]));

      // いいね情報
      let likedSet = new Set<string>();
      if (u) {
        const { data: likesData } = await supabase
          .from('community_post_likes')
          .select('post_id')
          .eq('user_id', u.id)
          .in('post_id', (postsData as Post[]).map(p => p.id));
        likedSet = new Set((likesData ?? []).map(l => l.post_id));
      }

      setPosts((postsData as Post[]).map(p => ({
        ...p,
        user_nickname: postUserMap.get(p.user_id)?.nickname ?? null,
        user_avatar: postUserMap.get(p.user_id)?.avatar_url ?? null,
        liked_by_me: likedSet.has(p.id),
      })));
    } else {
      setPosts([]);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleJoinToggle = async () => {
    if (!user) { router.push('/login'); return; }
    const supabase = createClient();
    if (isMember) {
      await supabase.from('community_members').delete().eq('community_id', id).eq('user_id', user.id);
      setIsMember(false);
      setCommunity(prev => prev ? { ...prev, member_count: Math.max(0, prev.member_count - 1) } : prev);
    } else {
      await supabase.from('community_members').insert({ community_id: id, user_id: user.id });
      setIsMember(true);
      setCommunity(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : prev);
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() || !user || posting) return;
    setPosting(true);
    const supabase = createClient();
    await supabase.from('community_posts').insert({
      community_id: id,
      user_id: user.id,
      content: postContent.trim(),
    });
    setPostContent('');
    await fetchData();
    setPosting(false);
  };

  const handleLike = async (post: Post) => {
    if (!user) { router.push('/login'); return; }
    const supabase = createClient();
    if (post.liked_by_me) {
      await supabase.from('community_post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('community_post_likes').insert({ post_id: post.id, user_id: user.id });
    }
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.liked_by_me ? p.like_count - 1 : p.like_count + 1 }
      : p
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-muted">コミュニティが見つかりません</p>
        <Link href="/explore" className="text-primary text-sm hover:opacity-70">← 探すに戻る</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/explore" className="text-muted hover:text-primary transition-colors text-sm flex-shrink-0">←</Link>
          <span className="text-2xl flex-shrink-0">{community.cover_emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-primary truncate">{community.name}</h1>
              {community.is_official && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">公式</span>}
            </div>
            <p className="text-[10px] text-muted">{community.member_count.toLocaleString()} メンバー</p>
          </div>
          <button
            onClick={handleJoinToggle}
            className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
              isMember
                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                : 'bg-primary text-white border-primary hover:opacity-80'
            }`}
          >
            {isMember ? '参加中' : '参加する'}
          </button>
        </div>
        {community.description && (
          <p className="px-4 pb-3 text-xs text-muted leading-relaxed">{community.description}</p>
        )}
        <div className="flex border-t border-border">
          {(['posts', 'members'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-primary'
              }`}
            >
              {t === 'posts' ? `投稿 ${community.post_count > 0 ? `(${community.post_count})` : ''}` : `メンバー (${community.member_count})`}
            </button>
          ))}
        </div>
      </div>

      {/* 投稿タブ */}
      {tab === 'posts' && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3">
              {!isMember && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xs text-muted mb-2">参加するとメンバーの投稿を見て書き込めます</p>
                  <button onClick={handleJoinToggle} className="text-xs font-semibold text-primary border border-primary rounded-full px-4 py-1.5 hover:bg-primary hover:text-white transition-all">
                    参加する
                  </button>
                </div>
              )}
              {isMember && posts.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                  <span className="text-4xl">{community.cover_emoji}</span>
                  <p className="text-sm text-muted">まだ投稿がありません</p>
                  <p className="text-xs text-muted">最初の投稿をしてみましょう！</p>
                </div>
              )}
              {isMember && posts.map(post => (
                <article key={post.id} className="bg-white border border-border rounded-2xl p-4">
                  {post.is_pinned && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-[10px] text-primary font-semibold">📌 ピン留め</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
                      {post.user_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.user_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">👤</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary">{post.user_nickname ?? '匿名ユーザー'}</p>
                      <p className="text-[10px] text-muted">{timeAgo(post.created_at)}</p>
                    </div>
                    {post.user_id !== user?.id && (
                      <Link
                        href={`/messages?to=${post.user_id}`}
                        className="ml-auto text-[10px] text-muted border border-border rounded-full px-2.5 py-1 hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                      >
                        DM
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/50">
                    <button
                      onClick={() => handleLike(post)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${post.liked_by_me ? 'text-red-500' : 'text-muted hover:text-primary'}`}
                    >
                      <span className="text-sm">{post.liked_by_me ? '❤️' : '🤍'}</span>
                      <span>{post.like_count}</span>
                    </button>
                    {post.user_id === user?.id && (
                      <button
                        onClick={async () => {
                          const supabase = createClient();
                          await supabase.from('community_posts').delete().eq('id', post.id);
                          setPosts(prev => prev.filter(p => p.id !== post.id));
                        }}
                        className="ml-auto text-[10px] text-muted hover:text-red-400 transition-colors"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 投稿入力 */}
          {isMember && (
            <div className="flex-shrink-0 border-t border-border bg-white px-4 py-3">
              <div className="max-w-2xl mx-auto flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="コミュニティに投稿する..."
                  rows={1}
                  maxLength={500}
                  className="flex-1 border border-border rounded-2xl px-3 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-primary resize-none leading-relaxed"
                  style={{ minHeight: '42px', maxHeight: '120px' }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                  }}
                />
                <button
                  onClick={handlePost}
                  disabled={!postContent.trim() || posting}
                  className="flex-shrink-0 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-2xl disabled:opacity-40 hover:opacity-80 transition-opacity"
                >
                  {posting ? '...' : '投稿'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* メンバータブ */}
      {tab === 'members' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-2">
            {members.map(member => (
              <div key={member.user_id} className="flex items-center gap-3 bg-white border border-border rounded-2xl px-4 py-3">
                <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base">👤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-primary truncate">{member.nickname ?? '名前未設定'}</p>
                    {member.role !== 'member' && (
                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {member.role === 'owner' ? 'オーナー' : '管理者'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted">{new Date(member.joined_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })} 参加</p>
                </div>
                {member.user_id !== user?.id && (
                  <Link
                    href={`/messages?to=${member.user_id}`}
                    className="flex-shrink-0 text-xs text-muted border border-border rounded-full px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
                  >
                    DM
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
