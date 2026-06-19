/**
 * OCR処理 - Tesseract.js をクライアント側で実行
 * 画像からテキストを抽出してプレイヤーIDを識別
 */

// ⬇️ エラーの原因になっていた fs と path のインポートを削除 ⬇️
// import fs from 'fs';
// import path from 'path';

/**
 * R6 SiegeのスクリーンショットのテキストからプレイヤーIDを抽出
 * R6 Siegeスコアボードではプレイヤー名が表示される
 * * @param text OCRで抽出されたテキスト
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
    if (line.length > 2 && line.length < 50) {
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
        if (!seen.has(line.toLowerCase())) {
          playerIds.push(line);
          seen.add(line.toLowerCase());
        }
      }
    }
  }

  return playerIds;
}