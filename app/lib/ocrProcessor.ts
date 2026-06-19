/**
 * OCR処理 - Tesseract.js をクライアント側で実行
 * 画像からテキストを抽出してプレイヤーIDを識別
 */

import fs from 'fs';
import path from 'path';

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

