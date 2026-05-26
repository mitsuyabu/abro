export const dynamic = 'force-dynamic';

// Google Places photo をプロキシ（API キーをクライアントに渡さない）
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const photoName = searchParams.get('name'); // e.g. "places/ChIJ.../photos/AUacShh..."
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!photoName || !key) {
    return new Response(null, { status: 404 });
  }

  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=600&key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return new Response(null, { status: 404 });

    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
