const COUNTRIES = [
  { flag: '🇦🇺', name: 'オーストラリア', city: 'シドニー', type: '語学留学・ワーホリ' },
  { flag: '🇨🇦', name: 'カナダ',         city: 'バンクーバー', type: '語学留学・ワーホリ' },
  { flag: '🇬🇧', name: 'イギリス',       city: 'ロンドン', type: '語学留学・大学進学' },
  { flag: '🇳🇿', name: 'ニュージーランド', city: 'オークランド', type: 'ワーホリ' },
  { flag: '🇮🇪', name: 'アイルランド',   city: 'ダブリン', type: 'ワーホリ・語学留学' },
  { flag: '🇺🇸', name: 'アメリカ',       city: 'ニューヨーク', type: '大学・語学留学' },
];

const QUICK_TIPS = [
  { emoji: '💰', title: '費用の目安', body: 'オーストラリアのワーホリは年間200〜300万円が一般的' },
  { emoji: '📄', title: 'ビザ申請', body: 'ワーホリビザは18〜30歳が対象。早めの申請がおすすめ' },
  { emoji: '🎓', title: '学校選び', body: 'エリア・学費・口コミで比較。エージェントに相談も◎' },
];

export function RecommendationPanel() {
  return (
    <div className="h-full overflow-y-auto px-5 py-6 flex flex-col gap-6">
      {/* おすすめ渡航先 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-primary">人気の渡航先</h2>
          <button className="text-xs text-muted hover:text-primary transition-colors">すべて見る</button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {COUNTRIES.slice(0, 4).map((c) => (
            <button
              key={c.name}
              className="flex items-center gap-3 bg-white border border-border rounded-xl px-4 py-3 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <span className="text-2xl">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">{c.name}</p>
                <p className="text-xs text-muted truncate">{c.city} · {c.type}</p>
              </div>
              <span className="text-muted text-sm opacity-0 group-hover:opacity-100 transition-opacity">›</span>
            </button>
          ))}
        </div>
      </section>

      {/* 始め方 */}
      <section>
        <h2 className="text-sm font-semibold text-primary mb-3">まず何をする？</h2>
        <div className="flex flex-col gap-2">
          {[
            { icon: '✨', label: 'プランを作る',      desc: 'AI が目的・予算から留学プランを提案' },
            { icon: '💰', label: '費用シミュレート',   desc: '渡航先・期間を入れると費用を自動計算' },
            { icon: '👥', label: '先輩に聞く',        desc: '経験者の失敗談・アドバイスをチェック' },
            { icon: '🎓', label: 'エージェント相談',  desc: '認定エージェントと無料オンライン相談' },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-start gap-3 bg-white border border-border rounded-xl px-4 py-3 text-left hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <span className="text-xl mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-primary">{item.label}</p>
                <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 豆知識 */}
      <section>
        <h2 className="text-sm font-semibold text-primary mb-3">💡 留学豆知識</h2>
        <div className="flex flex-col gap-2">
          {QUICK_TIPS.map((tip) => (
            <div key={tip.title} className="bg-white border border-border rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-primary mb-0.5">{tip.emoji} {tip.title}</p>
              <p className="text-xs text-muted leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
