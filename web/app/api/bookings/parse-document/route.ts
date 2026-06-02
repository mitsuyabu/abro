import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const PARSE_PROMPT = `この画像またはPDFは旅行・留学に関する書類です。
以下の情報を読み取り、必ずJSONのみで返してください（説明文は不要）。

{
  "type": "flight" | "accommodation" | "school" | "insurance" | "activity" | "transfer" | "other",
  "title": "書類の内容を表す短いタイトル（例：成田→シドニー QF26、EF English School 12週コース、World Nomads 海外保険 1年）",
  "provider": "航空会社・宿泊施設・学校・保険会社などのサービス名",
  "amount": 数値（金額。不明な場合はnull）,
  "currency": "通貨コード（JPY / AUD / USD / CAD / GBP / NZD など）",
  "date": "YYYY-MM-DD形式（出発日・チェックイン日・開始日。不明ならnull）",
  "notes": "便名・予約番号・期間・その他の重要情報を簡潔に（最大100文字）"
}

typeの判定基準：
- flight: 航空券・搭乗券
- accommodation: ホテル・ホームステイ・シェアハウス・宿泊施設
- school: 語学学校・大学・コース
- insurance: 海外旅行保険・留学保険
- activity: 観光・アクティビティ・ツアー
- transfer: 送金・両替・Wise・銀行
- other: ビザ・その他`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'application/pdf';

    // Claude API に送信するコンテンツを構築
    const contentBlock = mimeType === 'application/pdf'
      ? {
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
        }
      : {
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: mimeType, data: base64 },
        };

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: PARSE_PROMPT },
          ],
        },
      ],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: '解析に失敗しました' }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      type: string;
      title: string;
      provider: string;
      amount: number | null;
      currency: string;
      date: string | null;
      notes: string | null;
    };

    return NextResponse.json({ ok: true, data: parsed });
  } catch (e) {
    console.error('[parse-document]', e);
    return NextResponse.json({ error: '解析中にエラーが発生しました' }, { status: 500 });
  }
}
