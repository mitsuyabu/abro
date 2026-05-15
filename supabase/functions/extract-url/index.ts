import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await extractMetadata(url);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractMetadata(url: string) {
  // YouTube
  if (/youtube\.com|youtu\.be/.test(url)) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title,
          description: data.author_name ? `by ${data.author_name}` : null,
          thumbnail_url: data.thumbnail_url,
          source_type: 'video',
        };
      }
    } catch { /* fallthrough */ }
  }

  // TikTok
  if (/tiktok\.com/.test(url)) {
    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title,
          description: data.author_name ? `by ${data.author_name}` : null,
          thumbnail_url: data.thumbnail_url,
          source_type: 'video',
        };
      }
    } catch { /* fallthrough */ }
  }

  // 一般 URL: OGP タグを取得
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AbroBot/1.0)' },
      // タイムアウト
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    return {
      title: extractOgp(html, 'og:title') ?? extractTag(html, 'title'),
      description: extractOgp(html, 'og:description'),
      thumbnail_url: extractOgp(html, 'og:image'),
      source_type: 'url',
    };
  } catch {
    return { source_type: 'url' };
  }
}

function extractOgp(html: string, property: string): string | null {
  const match = html.match(
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ) ?? html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
  );
  return match?.[1] ?? null;
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
  return match?.[1]?.trim() ?? null;
}
