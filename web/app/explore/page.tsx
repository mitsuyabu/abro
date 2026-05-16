'use client';

import { useState } from 'react';

const CATEGORIES = ['すべて', '投稿', 'コミュニティ', '掲示板'];

const DUMMY_POSTS = [
  { id: '1', user: 'Yuki@シドニー', phase: '渡航中', avatar: '🌏', content: 'シドニーのCBDにあるカフェでバリスタとして働き始めました！英語が伸びるのを実感してます☕️', likes: 42, comments: 8, time: '2時間前' },
  { id: '2', user: 'Hana@バンクーバー', phase: '準備中', avatar: '🍁', content: 'ビザ申請が通りました！11月からバンクーバーワーホリ出発予定🇨🇦 不安と期待が混ざった気持ち…', likes: 87, comments: 23, time: '5時間前' },
  { id: '3', user: 'Taro@帰国済', phase: '帰国済', avatar: '🎓', content: '1年間のオーストラリアワーホリを終えて帰国しました。英語力はTOEIC 650→830に！費用の詳細を投稿します', likes: 156, comments: 41, time: '1日前' },
];

const PHASE_COLORS: Record<string, string> = {
  '渡航中': 'bg-green-100 text-green-700',
  '準備中': 'bg-blue-100 text-blue-700',
  '帰国済': 'bg-purple-100 text-purple-700',
  '検討中': 'bg-gray-100 text-gray-600',
};

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('すべて');

  return (
    <div className="flex h-full">
      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {/* トップバー */}
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-8 py-3 flex items-center gap-2 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                  activeCategory === cat ? 'bg-primary text-white' : 'text-muted hover:text-primary hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-8 py-6 flex flex-col gap-4">
          {/* 投稿作成 */}
          <button className="bg-white border border-border rounded-2xl p-4 text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm">👤</div>
              <span className="text-muted text-sm flex-1">今日の留学生活をシェアしよう...</span>
              <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-medium">投稿</span>
            </div>
          </button>

          {/* 投稿リスト */}
          {DUMMY_POSTS.map((post) => (
            <article key={post.id} className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                  {post.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{post.user}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${PHASE_COLORS[post.phase] ?? 'bg-gray-100 text-gray-600'}`}>
                      {post.phase}
                    </span>
                  </div>
                  <span className="text-xs text-muted">{post.time}</span>
                </div>
              </div>
              <p className="text-sm text-primary leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-5 pt-1">
                <button className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors">
                  <span className="text-base">👍</span>
                  <span className="text-xs">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors">
                  <span className="text-base">💬</span>
                  <span className="text-xs">{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors ml-auto">
                  <span className="text-base">↗️</span>
                  <span className="text-xs">シェア</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* 右パネル */}
      <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">コミュニティ</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[
            { flag: '🇦🇺', name: 'オーストラリア組', members: 1240 },
            { flag: '🇨🇦', name: 'カナダ組',         members: 890 },
            { flag: '🇬🇧', name: 'イギリス組',       members: 654 },
            { flag: '💰', name: '費用・節約術',       members: 2103 },
            { flag: '🏠', name: 'シェアハウス探し',   members: 789 },
          ].map((c) => (
            <button key={c.name} className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3 text-left hover:border-primary/30 transition-colors">
              <span className="text-xl">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">{c.name}</p>
                <p className="text-xs text-muted">{c.members.toLocaleString()} メンバー</p>
              </div>
              <span className="text-xs text-primary font-medium border border-primary rounded-full px-2 py-0.5">参加</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
