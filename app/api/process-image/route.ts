import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

/**
 * 画像処理 API エンドポイント
 * 画像ファイルをBase64に変換してクライアント側でOCR処理するために返す
 * 
 * POST /api/process-image
 * Body: { imagePath?: string } または FormData with file
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let base64Image: string | null = null;
    let fileName = '';

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

      console.log('Reading image from path:', imagePath);

      // ファイルが存在するか確認
      if (!fs.existsSync(imagePath)) {
        return NextResponse.json(
          { error: `Image file not found: ${imagePath}` },
          { status: 404 }
        );
      }

      // ファイルを読み込んでBase64に変換
      const imageBuffer = fs.readFileSync(imagePath);
      base64Image = imageBuffer.toString('base64');
      fileName = imagePath.split('\\').pop() || 'image';
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
      base64Image = Buffer.from(buffer).toString('base64');
      fileName = file.name;
    } else {
      return NextResponse.json(
        { error: 'Content-Type must be application/json or multipart/form-data' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      base64Image: base64Image,
      fileName: fileName,
      timestamp: new Date().toISOString(),
      message: 'Image converted to Base64. Client-side OCR processing required.',
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
      message: 'Image processing API is ready',
      supportedFormats: ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'bmp', 'jxr'],
      ocrEngine: 'Tesseract.js (Client-side)',
      languages: ['jpn', 'eng'],
      note: 'Send POST request with imagePath or file to /api/process-image',
    });
  }

  return NextResponse.json(
    { error: 'Use POST method for image processing' },
    { status: 405 }
  );
}
