/**
 * 画像処理モジュール
 * R6 Siege のゲームスクリーンショットからプレイヤーIDを抽出
 */

/**
 * ゲームスクリーンショットからプレイヤーIDを抽出
 * 
 * 注意: 本実装ではClaudeのVision APIを使用してテキスト抽出します
 * 代替案：Tesseract.js (ブラウザ内OCR) または Node.js tesseract
 */

interface ExtractionResult {
  playerIds: string[];
  confidence: number;
  rawText: string;
}

/**
 * Claude Vision API を使用してスクリーンショットをOCR処理
 * @param imageUrl - 画像ファイルのPath またはBase64
 * @returns プレイヤーID配列
 */
export async function extractPlayerIdsFromImage(
  imageUrl: string
): Promise<ExtractionResult> {
  try {
    // Note: 実装時には以下のような方式を使用：
    // 1. ローカルファイル → Base64に変換
    // 2. Claude API に送信
    // 3. テキスト抽出＆パーサー
    
    // モック実装（実際にはAPI呼び出しが必要）
    console.log('Processing image:', imageUrl);
    
    // 実装例：
    // const response = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'x-api-key': process.env.ANTHROPIC_API_KEY,
    //     'content-type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'claude-3-5-sonnet-20241022',
    //     max_tokens: 1024,
    //     messages: [{
    //       role: 'user',
    //       content: [
    //         {
    //           type: 'image',
    //           source: {
    //             type: 'base64',
    //             media_type: 'image/jpeg',
    //             data: imageBase64,
    //           },
    //         },
    //         {
    //           type: 'text',
    //           text: `このR6 SiegeのスクリーンショットからプレイヤーIDを全て抽出してください。
    //                   JSON形式で返してください。
    //                   例: {"playerIds": ["PlayerName1", "PlayerName2"], "confidence": 0.95}`
    //         }
    //       ],
    //     }],
    //   }),
    // });

    return {
      playerIds: [],
      confidence: 0,
      rawText: 'Image processing not yet implemented',
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * テキストからプレイヤーIDを抽出するシンプルなパーサー
 * (Leaderboard形式のテキストを想定)
 */
export function parsePlayerIdsFromText(text: string): string[] {
  // R6 Siege のスコアボード形式を想定
  // 例: "1. PlayerName1 - 850 Points"
  // または単なるプレイヤー名リスト
  
  const lines = text.split('\n');
  const playerIds: string[] = [];

  lines.forEach((line) => {
    // 数字とドット、プレイヤー名のパターンを抽出
    const match = line.match(/(?:\d+\.\s+)?([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      playerIds.push(match[1]);
    }
  });

  return [...new Set(playerIds)]; // 重複を削除
}

/**
 * 画像ファイルをBase64に変換
 * (ブラウザ側から呼び出し)
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
