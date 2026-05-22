'use client';

import { useState } from 'react';

const CATEGORIES = ['すべて', 'ビザ', '費用', '仕事', '住まい', '生活', '学校'];

const DUMMY_QA = [
  {
    id: '1',
    category: 'ビザ',
    question: 'オーストラリアのワーキングホリデービザの申請費用はいくらですか？',
    answer: '2024年現在、オーストラリアのワーキングホリデービザ（サブクラス417）の申請費用は635AUD（約6万円）です。オンラインで申請でき、通常1〜3週間で承認されます。',
    author: 'Yuki@シドニー',
    phase: '渡航中',
    likes: 42,
    answers: 3,
    time: '2日前',
  },
  {
    id: '2',
    category: '費用',
    question: 'カナダ・バンクーバーの月々の生活費はどのくらいかかりますか？',
    answer: 'バンクーバーでの月の生活費は、シェアハウス利用で大体15〜20万円が目安です。家賃8〜10万、食費3〜4万、交通費1万、その他2〜3万円ほどです。',
    author: 'Hana@バンクーバー',
    phase: '渡航中',
    likes: 87,
    answers: 12,
    time: '5日前',
  },
  {
    id: '3',
    category: '仕事',
    question: 'ワーホリで日本食レストランに採用されやすいコツはありますか？',
    answer: '日本食レストランへの採用のコツは、①日本語が話せるスタッフとして強みをアピール、②寿司・和食の調理経験をアピール、③清潔感のある服装で直接持参が有効です。',
    author: 'Taro@帰国済',
    phase: '帰国済',
    likes: 156,
    answers: 8,
    time: '1週間前',
  },
  {
    id: '4',
    category: '住まい',
    question: 'ロンドンでのフラットシェア探しにおすすめのサイトはどこですか？',
    answer: 'ロンドンのフラットシェア探しは SpareRoom.co.uk が最もポピュラーです。日本人コミュニティでは Facebook グループ「ロンドン日本人」も役立ちます。',
    author: 'Saki@ロンドン',
    phase: '渡航中',
    likes: 31,
    answers: 5,
    time: '3日前',
  },
];

const PHASE_COLORS: Record<string, string> = {
  '渡航中': 'bg-green-100 text-green-700',
  '準備中': 'bg-blue-100 text-blue-700',
  '帰国済': 'bg-purple-100 text-purple-700',
  '検討中': 'bg-gray-100 text-gray-600',
};

export default function QaPage() {
  const [activeCategory, setActiveCategory] = useState('すべて');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const filtered = activeCategory === 'すべて'
    ? DUMMY_QA
    : DUMMY_QA.filter((q) => q.category === activeCategory);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        {/* トップバー */}
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto">
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

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
          {/* 質問を投稿 */}
          <button className="bg-white border border-border rounded-2xl p-4 text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm">👤</div>
              <span className="text-muted text-sm flex-1">みんなに質問してみましょう...</span>
              <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-medium">質問する</span>
            </div>
          </button>

          {filtered.map((qa) => (
            <article
              key={qa.id}
              className="bg-white border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-colors"
            >
              <button
                className="w-full p-5 text-left"
                onClick={() => setExpandedId(expandedId === qa.id ? null : qa.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                    {qa.category}
                  </span>
                  <h3 className="text-sm font-semibold text-primary leading-snug">{qa.question}</h3>
                </div>
                <div className="flex items-center gap-3 ml-0">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">👤</div>
                  <span className="text-xs text-muted">{qa.author}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${PHASE_COLORS[qa.phase] ?? 'bg-gray-100 text-gray-600'}`}>
                    {qa.phase}
                  </span>
                  <span className="text-xs text-muted ml-auto">{qa.time}</span>
                </div>
              </button>

              {expandedId === qa.id && (
                <div className="border-t border-border bg-background px-5 py-4">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">Ab</span>
                    </div>
                    <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                      <p className="text-xs text-muted mb-1.5 font-medium">AIの回答</p>
                      <p className="text-sm text-primary leading-relaxed">{qa.answer}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="px-5 py-3 border-t border-border flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors">
                  <span className="text-base">👍</span>
                  <span className="text-xs">{qa.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors">
                  <span className="text-base">💬</span>
                  <span className="text-xs">{qa.answers}件の回答</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors ml-auto">
                  <span className="text-base">🔖</span>
                  <span className="text-xs">保存</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* 右パネル（lg以上のみ表示） */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">人気の質問</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs text-muted font-semibold mb-1">よく聞かれること</p>
          {[
            { emoji: '📄', q: 'ビザ申請のタイミングは？' },
            { emoji: '💰', q: '出発前にいくら貯めればいい？' },
            { emoji: '🏠', q: '渡航前に住居を決めるべき？' },
            { emoji: '📱', q: '海外SIMはどこがおすすめ？' },
            { emoji: '🏥', q: '海外保険は必須ですか？' },
          ].map((item) => (
            <button
              key={item.q}
              className="bg-white border border-border rounded-xl px-4 py-3 text-left hover:border-primary/30 transition-colors flex items-center gap-2"
            >
              <span>{item.emoji}</span>
              <p className="text-xs text-primary font-medium leading-snug">{item.q}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
