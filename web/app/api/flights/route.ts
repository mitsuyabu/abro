import { NextResponse } from 'next/server';

// Amadeus アクセストークンをサーバー側でキャッシュ
let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.access_token;
  }
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });
  if (!res.ok) return null;
  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = { access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1000 };
  return cachedToken.access_token;
}

export async function POST(request: Request) {
  const { origin, destination, departureDate, adults = 1 } = await request.json() as {
    origin: string;
    destination: string;
    departureDate: string;
    adults?: number;
  };

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ configured: false, offers: [] });
  }

  const params = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    adults: String(adults),
    max: '6',
    currencyCode: 'JPY',
  });

  const res = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[Amadeus]', res.status, err);
    return NextResponse.json({ configured: true, error: 'search_failed', offers: [] });
  }

  const data = await res.json() as { data?: unknown[]; dictionaries?: unknown };
  return NextResponse.json({ configured: true, offers: data.data ?? [], dictionaries: data.dictionaries ?? {} });
}
