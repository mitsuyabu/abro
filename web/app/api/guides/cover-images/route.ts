import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PexelsPhoto {
  id: number;
  photographer: string;
  src: { large2x: string; large: string; medium: string };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

// タイトル・場所・カテゴリから英語検索キーワードを生成
async function buildSearchQuery(title: string, location: string, category: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 30,
    messages: [{
      role: 'user',
      content: `Convert to 3-5 English keywords for a photo search. Only output the keywords separated by spaces, nothing else.
Title: ${title}
Location: ${location}
Category: ${category}

Examples:
- "シドニー語学学校ガイド" + シドニー + 学校 → "Sydney language school students classroom"
- "バンクーバーのおすすめカフェ" + バンクーバー + 店舗 → "Vancouver cafe coffee shop"
- "ゴールドコースト観光スポット" + ゴールドコースト + 場所 → "Gold Coast beach Australia travel"
- "ワーホリ農場バイト体験" + ケアンズ + 体験 → "Australia farm working holiday experience"`,
    }],
  });
  return completion.choices[0]?.message?.content?.trim() ?? `${location} travel`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? '';
  const location = searchParams.get('location') ?? '';
  const category = searchParams.get('category') ?? '';

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, photos: [] });
  }

  // AI でキーワードを生成
  const query = await buildSearchQuery(title, location, category);

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
    { headers: { Authorization: apiKey } }
  );

  if (!res.ok) {
    return NextResponse.json({ configured: true, error: 'search_failed', photos: [] });
  }

  const data = await res.json() as PexelsResponse;
  const photos = (data.photos ?? []).map(p => ({
    id: p.id,
    url: p.src.large2x,
    photographer: p.photographer,
    alt: p.alt,
  }));

  return NextResponse.json({ configured: true, photos, query });
}
