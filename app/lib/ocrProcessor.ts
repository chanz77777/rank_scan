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

  const lines = text.split('\n').map((line) => line.trim());
  const playerIds: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!line) continue;

    // アルファベット、数字、ドット、アンダースコア、ハイフン、パイプ(|)、スペースのみを許可
    const cleanedLine = line.replace(/[^A-Za-z0-9._\-\|\s]/g, '').trim();
    if (!cleanedLine) continue;

    // 1行に1人分のIDという仕様に基づき、行内のスペースはアンダースコア（Tesseractが誤読したもの）に変換して結合する
    const lineWithUnderscores = cleanedLine.replace(/\s+/g, '_');
    const cleanWord = lineWithUnderscores.replace(/[^A-Za-z0-9._\-\|]/g, '');

    // Uplay IDは3〜15文字
    if (cleanWord.length >= 3 && cleanWord.length <= 15) {
      if (!seen.has(cleanWord.toLowerCase())) {
        playerIds.push(cleanWord);
        seen.add(cleanWord.toLowerCase());
      }
    }
  }

  return playerIds;
}