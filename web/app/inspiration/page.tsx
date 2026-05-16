const FEATURED_GUIDES = [
  { id: '1', title: 'オーストラリアワーホリ完全ガイド 2025年版', author: 'Yuki@帰国済', country: 'オーストラリア', places: 24, emoji: '🇦🇺', color: 'from-blue-400 to-cyan-300' },
  { id: '2', title: 'カナダで月15万円生活する方法', author: 'Hana@バンクーバー', country: 'カナダ', places: 18, emoji: '🇨🇦', color: 'from-red-400 to-orange-300' },
  { id: '3', title: 'ロンドン語学学校おすすめ10校', author: 'Taro@帰国済', country: 'イギリス', places: 10, emoji: '🇬🇧', color: 'from-blue-600 to-indigo-400' },
  { id: '4', title: 'NZワーホリ農業体験ガイド', author: 'Saki@渡航中', country: 'ニュージーランド', places: 15, emoji: '🇳🇿', color: 'from-green-400 to-teal-300' },
  { id: '5', title: 'アイルランドで英語×プログラミング留学', author: 'Ken@準備中', country: 'アイルランド', places: 9, emoji: '🇮🇪', color: 'from-emerald-400 to-green-300' },
];

export default function InspirationPage() {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <h1 className="text-2xl font-bold text-primary mb-2">インスピレーション</h1>
          <p className="text-muted text-sm mb-6">先輩たちのリアルな体験談・ガイドを参考にしよう</p>

          {/* 検索 */}
          <div className="relative mb-8">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
            <input
              type="text"
              placeholder="国名・キーワードで検索"
              className="w-full bg-white border border-border rounded-2xl pl-10 pr-4 py-3 text-sm text-primary placeholder:text-muted outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* 注目ガイド */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-primary mb-4">注目のガイド</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURED_GUIDES.map((guide) => (
                <button
                  key={guide.id}
                  className="bg-white border border-border rounded-2xl overflow-hidden text-left hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  {/* カバー */}
                  <div className={`h-40 bg-gradient-to-br ${guide.color} flex items-center justify-center relative`}>
                    <span className="text-6xl">{guide.emoji}</span>
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-primary px-2 py-0.5 rounded-full">
                      {guide.places} 件
                    </span>
                  </div>
                  {/* テキスト */}
                  <div className="p-4 gap-1.5 flex flex-col">
                    <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-2">{guide.title}</h3>
                    <p className="text-xs text-muted">📍 {guide.country}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">👤</div>
                      <span className="text-xs text-muted">{guide.author}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* カテゴリ別 */}
          <section>
            <h2 className="text-lg font-bold text-primary mb-4">カテゴリで探す</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { emoji: '💰', label: '費用・節約', count: 48 },
                { emoji: '📄', label: 'ビザ手続き', count: 32 },
                { emoji: '🏠', label: '住まい探し', count: 27 },
                { emoji: '💼', label: '仕事・バイト', count: 61 },
                { emoji: '🎓', label: '学校選び', count: 39 },
                { emoji: '🏥', label: '医療・保険', count: 18 },
                { emoji: '😅', label: '失敗談', count: 54 },
                { emoji: '✈️', label: '渡航準備', count: 43 },
              ].map((cat) => (
                <button key={cat.label} className="bg-white border border-border rounded-2xl p-4 text-left hover:border-primary/30 hover:shadow-sm transition-all">
                  <span className="text-2xl block mb-2">{cat.emoji}</span>
                  <p className="text-sm font-medium text-primary">{cat.label}</p>
                  <p className="text-xs text-muted">{cat.count}件</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 右パネル */}
      <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">あなたへ</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted">人気の渡航先</p>
          {['🇦🇺 オーストラリア', '🇨🇦 カナダ', '🇬🇧 イギリス', '🇳🇿 ニュージーランド', '🇮🇪 アイルランド'].map((c) => (
            <button key={c} className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-primary text-left hover:border-primary/30 transition-colors">
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
