'use client';

import { useState } from 'react';
import { RecommendationPanel } from '@/components/home/RecommendationPanel';

export interface CountryItem {
  name: string;
  flag: string;
  image: string;
  mapQuery: string;
}

export interface CityItem {
  name: string;
  country: string;
  flag: string;
  image: string;
  mapQuery: string;
}

export interface SidebarContext {
  countries: CountryItem[];
  cities: CityItem[];
  showAgents: boolean;
}

export const COUNTRY_DATA: CountryItem[] = [
  { name: 'オーストラリア', flag: '🇦🇺', image: '/シドニー.png', mapQuery: 'Australia' },
  { name: 'カナダ', flag: '🇨🇦', image: '/トロント.png', mapQuery: 'Canada' },
  { name: 'イギリス', flag: '🇬🇧', image: '/ロンドン.png', mapQuery: 'United Kingdom' },
  { name: 'ニュージーランド', flag: '🇳🇿', image: '/オークランド.png', mapQuery: 'New Zealand' },
  { name: 'フィリピン', flag: '🇵🇭', image: '/セブ.png', mapQuery: 'Philippines' },
  { name: 'マルタ', flag: '🇲🇹', image: '/マルタ.png', mapQuery: 'Malta' },
  { name: 'アメリカ', flag: '🇺🇸', image: '/シドニー.png', mapQuery: 'United States' },
  { name: 'アイルランド', flag: '🇮🇪', image: '/ロンドン.png', mapQuery: 'Ireland' },
];

export const CITY_DATA: CityItem[] = [
  { name: 'シドニー', country: 'オーストラリア', flag: '🇦🇺', image: '/シドニー.png', mapQuery: 'Sydney, Australia' },
  { name: 'メルボルン', country: 'オーストラリア', flag: '🇦🇺', image: '/シドニー.png', mapQuery: 'Melbourne, Australia' },
  { name: 'ブリスベン', country: 'オーストラリア', flag: '🇦🇺', image: '/シドニー.png', mapQuery: 'Brisbane, Australia' },
  { name: 'パース', country: 'オーストラリア', flag: '🇦🇺', image: '/シドニー.png', mapQuery: 'Perth, Australia' },
  { name: 'ゴールドコースト', country: 'オーストラリア', flag: '🇦🇺', image: '/シドニー.png', mapQuery: 'Gold Coast, Australia' },
  { name: 'ケアンズ', country: 'オーストラリア', flag: '🇦🇺', image: '/シドニー.png', mapQuery: 'Cairns, Australia' },
  { name: 'トロント', country: 'カナダ', flag: '🇨🇦', image: '/トロント.png', mapQuery: 'Toronto, Canada' },
  { name: 'バンクーバー', country: 'カナダ', flag: '🇨🇦', image: '/トロント.png', mapQuery: 'Vancouver, Canada' },
  { name: 'ロンドン', country: 'イギリス', flag: '🇬🇧', image: '/ロンドン.png', mapQuery: 'London, UK' },
  { name: 'エジンバラ', country: 'イギリス', flag: '🇬🇧', image: '/ロンドン.png', mapQuery: 'Edinburgh, UK' },
  { name: 'オークランド', country: 'ニュージーランド', flag: '🇳🇿', image: '/オークランド.png', mapQuery: 'Auckland, New Zealand' },
  { name: 'セブ', country: 'フィリピン', flag: '🇵🇭', image: '/セブ.png', mapQuery: 'Cebu, Philippines' },
  { name: 'マニラ', country: 'フィリピン', flag: '🇵🇭', image: '/セブ.png', mapQuery: 'Manila, Philippines' },
  { name: 'マルタ', country: 'マルタ', flag: '🇲🇹', image: '/マルタ.png', mapQuery: 'Valletta, Malta' },
];

const AGENTS = [
  { id: 1, name: 'スタディ留学センター', specialty: '語学留学・大学進学サポート', rating: 4.8, reviews: 1240, badge: '実績No.1' },
  { id: 2, name: 'ワーホリプロ', specialty: 'ワーキングホリデー専門', rating: 4.7, reviews: 892, badge: '専門特化' },
  { id: 3, name: 'グローバルEdge', specialty: 'コスパ重視・初心者向け', rating: 4.6, reviews: 567, badge: '初心者向け' },
];

const AVATAR_STYLE: React.CSSProperties = {
  backgroundImage: 'url(/logo.png)',
  backgroundSize: '96px auto',
  backgroundPosition: 'left center',
  backgroundRepeat: 'no-repeat',
  filter: 'invert(1)',
};

interface Props {
  context: SidebarContext;
}

export function DynamicSidebar({ context }: Props) {
  const [focusedCity, setFocusedCity] = useState<CityItem | null>(null);
  const { countries, cities, showAgents } = context;
  const hasContext = countries.length > 0 || cities.length > 0 || showAgents;

  if (!hasContext) return <RecommendationPanel />;

  if (focusedCity) {
    return (
      <div className="flex flex-col h-full">
        <button
          onClick={() => setFocusedCity(null)}
          className="flex items-center gap-1 px-4 py-3 text-sm text-muted hover:text-primary transition-colors"
        >
          ← 戻る
        </button>
        <iframe
          src={`https://www.google.com/maps?q=${encodeURIComponent(focusedCity.mapQuery)}&output=embed`}
          className="w-full flex-shrink-0"
          style={{ height: '260px', border: 'none' }}
          loading="lazy"
          title={focusedCity.name}
        />
        <div className="p-4 border-t border-border">
          <div className="text-lg font-bold text-primary">{focusedCity.flag} {focusedCity.name}</div>
          <div className="text-sm text-muted">{focusedCity.country}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {showAgents && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">おすすめエージェント</p>
          <div className="flex flex-col gap-2">
            {AGENTS.map(agent => (
              <div key={agent.id} className="bg-white border border-border rounded-xl p-3 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-primary">{agent.name}</div>
                    <div className="text-xs text-muted mt-0.5">{agent.specialty}</div>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">{agent.badge}</span>
                </div>
                <div className="text-xs text-amber-500 mt-1.5">
                  ★ {agent.rating} <span className="text-muted">({agent.reviews.toLocaleString()}件)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cities.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">候補の都市</p>
          <div className="grid grid-cols-2 gap-2">
            {cities.slice(0, 6).map(city => (
              <button
                key={city.name}
                onClick={() => setFocusedCity(city)}
                className="relative overflow-hidden rounded-xl group"
                style={{ aspectRatio: '247 / 164' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={city.image} alt={city.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-2 text-left">
                  <div className="text-white text-xs font-bold leading-tight">{city.flag} {city.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {countries.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">候補の国</p>
          <div className="grid grid-cols-2 gap-2">
            {countries.slice(0, 4).map(country => (
              <div key={country.name} className="relative overflow-hidden rounded-xl group cursor-pointer" style={{ aspectRatio: '247 / 164' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={country.image} alt={country.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-2">
                  <div className="text-white text-xs font-bold leading-tight">{country.flag} {country.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { AVATAR_STYLE };
