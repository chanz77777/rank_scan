import { NextRequest, NextResponse } from 'next/server';
import { parsePlayerIdsFromText } from '@/app/lib/imageProcessor';

/**
 * 画像処理 API エンドポイント
 * スクリーンショットからプレイヤーIDを抽出
 * 
 * POST /api/process-image
 * Body: { imagePath?: string, useFile?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imagePath } = body;

    // Note: 本実装では以下の方法で画像処理を実装：
    // 1. fs（ファイルシステム）でローカルファイルを読み込み
    // 2. Base64 に変換
    // 3. Claude Vision API または Tesseract.js で OCR
    // 4. テキストから プレイヤーID を抽出

    // 現在のモック実装
    if (imagePath) {
      console.log('Processing image:', imagePath);
      
      // テンプレート実装：
      // const fs = require('fs');
      // const path = require('path');
      // 
      // try {
      //   const fileContent = fs.readFileSync(imagePath);
      //   const base64 = fileContent.toString('base64');
      //   
      //   // Claude Vision API を呼び出し
      //   const response = await fetch('https://api.anthropic.com/v1/messages', {
      //     method: 'POST',
      //     headers: {
      //       'x-api-key': process.env.ANTHROPIC_API_KEY,
      //       'content-type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       model: 'claude-3-5-sonnet-20241022',
      //       max_tokens: 1024,
      //       messages: [{
      //         role: 'user',
      //         content: [
      //           {
      //             type: 'image',
      //             source: {
      //               type: 'base64',
      //               media_type: 'image/jpeg',
      //               data: base64,
      //             },
      //           },
      //           {
      //             type: 'text',
      //             text: `このR6 Siegeのゲームスクリーンショットから
      //                   プレイヤー名/IDを全て抽出してください。
      //                   JSONで返してください。
      //                   例: {"playerIds": ["Player1", "Player2"]}`
      //           }
      //         ],
      //       }],
      //     }),
      //   });
      //   
      //   const data = await response.json();
      //   const extractedText = data.content[0].text;
      //   const parsed = JSON.parse(extractedText);
      //   
      //   return NextResponse.json({
      //     playerIds: parsed.playerIds,
      //     confidence: 0.95,
      //   });
      // } catch (error) {
      //   console.error('File read error:', error);
      // }
    }

    // フォールバック：デモ用の固定プレイヤーID
    return NextResponse.json({
      playerIds: ['TokyoDisneyland', 'SamplePlayer2', 'SamplePlayer3'],
      confidence: 0.8,
      message: 'Using demo data. For real image processing, configure Claude API.',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

/**
 * GET エンドポイント（テスト用）
 * /api/process-image?testMode=true
 */
export async function GET(request: NextRequest) {
  const testMode = request.nextUrl.searchParams.get('testMode') === 'true';

  if (testMode) {
    return NextResponse.json({
      status: 'ready',
      message: 'Image processing API is ready',
      supportedFormats: ['jpeg', 'jpg', 'png', 'webp', 'jxr'],
      note: 'Send POST request with image to /api/process-image',
    });
  }

  return NextResponse.json(
    { error: 'Use POST method for image processing' },
    { status: 405 }
  );
}
