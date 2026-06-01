import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { origin, destination, departureDate, adults = 1 } = await request.json() as {
    origin: string;
    destination: string;
    departureDate: string;
    adults?: number;
  };

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, flights: [] });
  }

  const params = new URLSearchParams({
    engine: 'google_flights',
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departureDate,
    currency: 'JPY',
    hl: 'ja',
    adults: String(adults),
    type: '2', // one-way
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search?${params}`);
  if (!res.ok) {
    console.error('[SerpAPI]', res.status, await res.text());
    return NextResponse.json({ configured: true, error: 'search_failed', flights: [] });
  }

  const data = await res.json() as { best_flights?: unknown[]; other_flights?: unknown[] };
  const flights = [
    ...(data.best_flights ?? []),
    ...(data.other_flights ?? []),
  ].slice(0, 8);

  return NextResponse.json({ configured: true, flights });
}
