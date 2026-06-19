/**
 * OCR処理 - Tesseract.js を使用
 * 画像からテキストを抽出してプレイヤーIDを識別
 */

import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

/**
 * ファイルパスから画像を読み込んでOCR処理
 * @param imagePath 画像ファイルのパス
 * @returns 抽出されたプレイヤーIDの配列
 */
export async function extractPlayerIdsFromImagePath(
  imagePath: string
): Promise<string[]> {
  try {
    // ファイルが存在するか確認
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // ファイルを読み込み
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // OCR処理
    return await extractPlayerIdsFromBase64(base64Image);
  } catch (error) {
    console.error('Error reading image file:', error);
    throw error;
  }
}

/**
 * Base64エンコードされた画像からプレイヤーIDを抽出
 * @param base64Image Base64エンコードされた画像データ
 * @returns 抽出されたプレイヤーIDの配列
 */
export async function extractPlayerIdsFromBase64(
  base64Image: string
): Promise<string[]> {
  try {
    // Tesseract.jsでOCR処理（日本語対応）
    const result = await Tesseract.recognize(
      `data:image/png;base64,${base64Image}`,
      'jpn+eng', // 日本語と英語
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      }
    );

    const extractedText = result.data.text;
    console.log('Extracted text:', extractedText);

    // テキストからプレイヤーIDを抽出
    const playerIds = parsePlayerIdsFromText(extractedText);
    return playerIds;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

/**
 * R6 SiegeのスクリーンショットのテキストからプレイヤーIDを抽出
 * R6 Siegeスコアボードではプレイヤー名が表示される
 * 
 * @param text OCRで抽出されたテキスト
 * @returns プレイヤーIDの配列
 */
export function parsePlayerIdsFromText(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // プレイヤーID（ユーザー名）の候補を抽出
  // R6 Siegeのスコアボードから読み込まれる名前のパターン
  const lines = text.split('\n').map((line) => line.trim());

  const playerIds: string[] = [];
  const seen = new Set<string>(); // 重複排除用

  for (const line of lines) {
    // 空白行はスキップ
    if (!line) continue;

    // スコアボードのプレイヤー名候補を抽出
    // - 短すぎる文字列や記号のみは除外
    // - ゲーム内の特殊情報（キルスコア、デス数など）は除外
    if (line.length > 2 && line.length < 50) {
      // スコア情報を含む行をフィルタ（数字が3つ以上連続なら除外）
      if (/\d{3,}/.test(line)) {
        // スコアボード行として処理：プレイヤー名部分を抽出
        // 例: "Player1  5  3  +2" -> "Player1"
        const namePart = line.replace(/\s+\d+\s+\d+.*$/, '').trim();
        if (namePart && namePart.length > 2 && namePart.length < 40) {
          if (!seen.has(namePart.toLowerCase())) {
            playerIds.push(namePart);
            seen.add(namePart.toLowerCase());
          }
        }
      } else if (!/[\(\)\[\]\{\}]/.test(line)) {
        // 括弧なしの行（UIテキストではない可能性が高い）
        if (!seen.has(line.toLowerCase())) {
          playerIds.push(line);
          seen.add(line.toLowerCase());
        }
      }
    }
  }

  return playerIds;
}

/**
 * 画像ファイルをBase64に変換
 * @param filePath ファイルパス
 * @returns Base64エンコード文字列
 */
export function imageToBase64(filePath: string): string {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
}
