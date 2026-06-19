import { NextRequest, NextResponse } from 'next/server';
import { extractPlayerIdsFromImagePath, extractPlayerIdsFromBase64 } from '@/app/lib/ocrProcessor';

/**
 * 画像処理 API エンドポイント
 * スクリーンショットからプレイヤーIDを抽出（Tesseract.js使用）
 * 
 * POST /api/process-image
 * Body: { imagePath?: string } または FormData with file
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let playerIds: string[] = [];

    if (contentType.includes('application/json')) {
      // JSONボディから画像パスを取得
      const body = await request.json();
      const { imagePath } = body;

      if (!imagePath) {
        return NextResponse.json(
          { error: 'imagePath is required' },
          { status: 400 }
        );
      }

      console.log('Processing image from path:', imagePath);

      // ファイルパスからOCR処理
      playerIds = await extractPlayerIdsFromImagePath(imagePath);
    } else if (contentType.includes('multipart/form-data')) {
      // FormDataから画像ファイルを取得
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'file is required' },
          { status: 400 }
        );
      }

      console.log('Processing uploaded image:', file.name);

      // ファイルをBase64に変換
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      // Base64からOCR処理
      playerIds = await extractPlayerIdsFromBase64(base64);
    } else {
      return NextResponse.json(
        { error: 'Content-Type must be application/json or multipart/form-data' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      playerIds: playerIds,
      count: playerIds.length,
      timestamp: new Date().toISOString(),
      message: `Extracted ${playerIds.length} player IDs from image`,
    });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process image', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET エンドポイント（ヘルスチェック）
 * /api/process-image?testMode=true
 */
export async function GET(request: NextRequest) {
  const testMode = request.nextUrl.searchParams.get('testMode') === 'true';

  if (testMode) {
    return NextResponse.json({
      status: 'ready',
      message: 'Image processing API with Tesseract.js is ready',
      supportedFormats: ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'jxr'],
      ocrEngine: 'Tesseract.js',
      languages: ['jpn', 'eng'],
      note: 'Send POST request with imagePath or file to /api/process-image',
    });
  }

  return NextResponse.json(
    { error: 'Use POST method for image processing' },
    { status: 405 }
  );
}
