import { NextRequest, NextResponse } from 'next/server';

/**
 * Gemini OCR API エンドポイント
 * POST /api/ocr
 * Body: { image: string, mimeType?: string, apiKey?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { image, mimeType = 'image/png', apiKey: userApiKey } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // APIキーの取得優先度: 1. ユーザー入力 2. 環境変数
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing. Please provide it in the UI or set GEMINI_API_KEY environment variable.' },
        { status: 400 }
      );
    }

    // Google Gemini API にリクエストを送信
    // gemini-2.5-flash を使用
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are an expert OCR engine for Rainbow Six Siege.
Identify and extract all player Uplay IDs from the scoreboard image.
The scoreboard contains up to 10 players (normally 5 allies and 5 enemies).
Output ONLY the list of player IDs, one per line.
Do not output any introductory or concluding text. Do not output markdown code blocks.
Make sure to extract them as accurately as possible. Ignore background UI elements, only extract player names.`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error Response:', errorData);
      return NextResponse.json(
        { 
          error: 'Gemini API returned an error', 
          details: errorData.error?.message || JSON.stringify(errorData) 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Gemini raw output:', generatedText);

    return NextResponse.json({
      text: generatedText,
      engine: 'Gemini 2.5 Flash',
    });
  } catch (error) {
    console.error('OCR API Internal Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process Gemini OCR', details: errorMessage },
      { status: 500 }
    );
  }
}
