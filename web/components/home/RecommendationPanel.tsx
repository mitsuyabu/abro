const DESTINATIONS = [
  { flag: '🇦🇺', city: 'シドニー',     country: 'オーストラリア', type: 'ワーホリ',  image: '/シドニー.png' },
  { flag: '🇨🇦', city: 'トロント',     country: 'カナダ',         type: 'ワーホリ',  image: '/トロント.png' },
  { flag: '🇬🇧', city: 'ロンドン',     country: 'イギリス',       type: '語学留学',  image: '/ロンドン.png' },
  { flag: '🇳🇿', city: 'オークランド', country: 'NZ',             type: 'ワーホリ',  image: '/オークランド.png' },
  { flag: '🇵🇭', city: 'セブ島',       country: 'フィリピン',     type: '語学留学',  image: '/セブ.png' },
  { flag: '🇲🇹', city: 'マルタ',       country: 'マルタ共和国',   type: '語学留学',  image: '/マルタ.png' },
];

const QUICK_TIPS = [
  { emoji: '💰', title: '費用の目安', body: 'オーストラリアのワーホリは年間200〜300万円が一般的' },
  { emoji: '📄', title: 'ビザ申請', body: 'ワーホリビザは18〜30歳が対象。早めの申請がおすすめ' },
  { emoji: '🎓', title: '学校選び', body: 'エリア・学費・口コミで比較。エージェントに相談も◎' },
];

export function RecommendationPanel() {
  return (
    <div className="px-4 py-5 flex flex-col gap-6">
      {/* 人気の渡航先 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-primary">人気の渡航先</h2>
          <button className="text-xs text-muted hover:text-primary transition-colors">すべて見る</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DESTINATIONS.map((d) => (
            <button
              key={d.city}
              className="relative rounded-2xl overflow-hidden text-left group hover:shadow-md transition-all hover:scale-[1.02]"
              style={{ aspectRatio: '247 / 164' }}
            >
              {/* 写真 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image} alt={d.city} className="absolute inset-0 w-full h-full object-cover" />
              {/* 国旗 */}
              <span className="absolute top-2 left-2.5 text-xl drop-shadow">{d.flag}</span>
              {/* 下部テキストオーバーレイ */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
                <p className="text-white text-xs font-bold leading-tight">{d.city}</p>
                <p className="text-white/80 text-[10px]">{d.type}</p>
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
