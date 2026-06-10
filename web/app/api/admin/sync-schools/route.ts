import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const CITY_QUERIES: { city: string; query: string }[] = [
  { city: 'シドニー',         query: 'English language school Sydney Australia' },
  { city: 'メルボルン',       query: 'English language school Melbourne Australia' },
  { city: 'ブリスベン',       query: 'English language school Brisbane Australia' },
  { city: 'ゴールドコースト', query: 'English language school Gold Coast Australia' },
  { city: 'アデレード',       query: 'English language school Adelaide Australia' },
  { city: 'パース',           query: 'English language school Perth Australia' },
  { city: 'ケアンズ',         query: 'English language school Cairns Australia' },
  { city: 'オークランド',     query: 'English language school Auckland New Zealand' },
  { city: 'ロンドン',         query: 'English language school London UK' },
  { city: 'トロント',         query: 'English language school Toronto Canada' },
  { city: 'バンクーバー',     query: 'English language school Vancouver Canada' },
  { city: 'セブ',             query: 'English language school Cebu Philippines' },
];

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  editorialSummary?: { text: string };
  reviews?: Array<{
    name: string;
    rating: number;
    text?: { text: string };
    relativePublishTimeDescription?: string;
    authorAttribution?: { displayName: string; photoUri?: string };
  }>;
  photos?: Array<{ name: string }>;
}

async function searchPlaces(query: string, apiKey: string): Promise<PlaceResult[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.userRatingCount',
        'places.websiteUri',
        'places.editorialSummary',
        'places.reviews',
        'places.photos',
      ].join(','),
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 5, languageCode: 'ja' }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Places API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.places ?? [];
}

function getPhotoUrl(photoName: string, apiKey: string, maxWidth = 600): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not set' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const results: { city: string; inserted: number; errors: string[] }[] = [];

  for (const { city, query } of CITY_QUERIES) {
    const cityResult = { city, inserted: 0, errors: [] as string[] };

    try {
      const places = await searchPlaces(query, apiKey);

      for (const place of places) {
        if (!place.displayName?.text || !place.id) continue;

        const reviews = (place.reviews ?? []).map((r) => ({
          author: r.authorAttribution?.displayName ?? '匿名',
          author_photo: r.authorAttribution?.photoUri ?? null,
          rating: r.rating,
          text: r.text?.text ?? '',
          time: r.relativePublishTimeDescription ?? '',
        }));

        const photos = (place.photos ?? []).slice(0, 5).map((p) =>
          getPhotoUrl(p.name, apiKey),
        );

        const record = {
          name: place.displayName.text,
          city,
          country: cityToCountry(city),
          type: '語学学校',
          description: place.editorialSummary?.text ?? null,
          website: place.websiteUri ?? null,
          is_partner: false,
          google_place_id: place.id,
          rating: place.rating ?? null,
          review_count: place.userRatingCount ?? 0,
          google_reviews: reviews,
          google_photos: photos,
          latitude: place.location?.latitude ?? null,
          longitude: place.location?.longitude ?? null,
        };

        const { error } = await supabase
          .from('schools')
          .upsert(record, { onConflict: 'google_place_id' });

        if (error) {
          cityResult.errors.push(`${place.displayName.text}: ${error.message}`);
        } else {
          cityResult.inserted++;
        }
      }
    } catch (e) {
      cityResult.errors.push(String(e));
    }

    results.push(cityResult);
  }

  return NextResponse.json({ ok: true, results });
}

function cityToCountry(city: string): string {
  const map: Record<string, string> = {
    'シドニー': 'オーストラリア',
    'メルボルン': 'オーストラリア',
    'ブリスベン': 'オーストラリア',
    'ゴールドコースト': 'オーストラリア',
    'アデレード': 'オーストラリア',
    'パース': 'オーストラリア',
    'ケアンズ': 'オーストラリア',
    'オークランド': 'ニュージーランド',
    'ロンドン': 'イギリス',
    'トロント': 'カナダ',
    'バンクーバー': 'カナダ',
    'セブ': 'フィリピン',
  };
  return map[city] ?? '';
}
