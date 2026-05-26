export interface CitySpot {
  id: string;
  name: string;
  rating?: number;
  address?: string;
  mapsUrl?: string;
  photoName?: string; // Google Places photo resource name (proxied via /api/place-photo)
  category: 'tourist' | 'food' | 'daily' | 'nature' | 'weekend';
}

interface ApiPlace {
  id?: string;
  displayName?: { text: string };
  rating?: number;
  formattedAddress?: string;
  googleMapsUri?: string;
  photos?: { name: string }[];
}

const BASE = 'https://places.googleapis.com/v1';

async function textSearch(query: string, key: string, max = 5): Promise<ApiPlace[]> {
  try {
    const res = await fetch(`${BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.rating,places.formattedAddress,places.googleMapsUri,places.photos',
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: max, languageCode: 'ja' }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { places?: ApiPlace[] };
    return data.places ?? [];
  } catch {
    return [];
  }
}

function toSpot(p: ApiPlace, category: CitySpot['category'], idx: number): CitySpot {
  return {
    id: p.id ?? `${category}-${idx}`,
    name: p.displayName?.text ?? '',
    rating: p.rating,
    address: p.formattedAddress?.split(',').slice(0, 2).join(','),
    mapsUrl: p.googleMapsUri,
    photoName: p.photos?.[0]?.name,
    category,
  };
}

export const CITY_EN: Record<string, string> = {
  シドニー: 'Sydney',
  メルボルン: 'Melbourne',
  ブリスベン: 'Brisbane',
  ゴールドコースト: 'Gold Coast',
  ケアンズ: 'Cairns',
  パース: 'Perth',
};

export function detectCityEn(text: string): string | null {
  for (const [ja, en] of Object.entries(CITY_EN)) {
    if (text.includes(ja)) return en;
  }
  return null;
}

export async function fetchCitySpots(cityEn: string): Promise<CitySpot[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return [];

  const searches: { q: string; cat: CitySpot['category'] }[] = [
    { q: `must-see tourist attractions sightseeing ${cityEn} Australia`, cat: 'tourist' },
    { q: `popular local cafe restaurant ${cityEn} Australia`,             cat: 'food'    },
    { q: `supermarket grocery store ${cityEn} Australia`,                 cat: 'daily'   },
    { q: `beach park nature outdoor ${cityEn} Australia`,                 cat: 'nature'  },
    { q: `best day trip weekend from ${cityEn} Australia`,                cat: 'weekend' },
  ];

  const settled = await Promise.allSettled(
    searches.map(({ q, cat }) =>
      textSearch(q, key, 5).then(places => places.map((p, i) => toSpot(p, cat, i)))
    )
  );

  return settled
    .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
    .filter(s => s.name.length > 0);
}

export function spotsToPromptText(spots: CitySpot[], cityJa: string): string {
  const byCat = (cat: CitySpot['category']) =>
    spots
      .filter(s => s.category === cat)
      .slice(0, 5)
      .map(s => `${s.name}${s.rating ? `(★${s.rating.toFixed(1)})` : ''}`)
      .join('、');

  return `
【${cityJa}の実際のスポット情報 — first_week・yearly_plan に必ず組み込んでください】
● 観光スポット: ${byCat('tourist')}
● カフェ・レストラン: ${byCat('food')}
● スーパー・生活: ${byCat('daily')}
● 自然・公園・ビーチ: ${byCat('nature')}
● 週末の小旅行先: ${byCat('weekend')}

→ 上記の実際の場所名を各日・各月の highlight/detail に自然に盛り込んでください。
  例：「${spots.find(s => s.category === 'tourist')?.name ?? 'ランドマーク'}に立ち寄ってみよう！」など具体的に。`;
}
