/**
 * OCR処理 - Tesseract.js をクライアント側で実行
 * 画像からテキストを抽出してプレイヤーIDを識別
 */

// スコアボード上に表示されるが、プレイヤーIDではない単語のブラックリスト
// 「YOU」は自分のプレイヤー名の横に付くラベルとして表示される
const ID_BLOCKLIST = new Set([
  'YOU?',
]);

/**
 * R6 SiegeのスクリーンショットのテキストからプレイヤーIDを抽出
 * R6 Siegeスコアボードではプレイヤー名が表示される
 * @param text OCRで抽出されたテキスト
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

    // ブラックリストチェック（大文字小文字を区別しない）
    if (ID_BLOCKLIST.has(cleanWord.toLowerCase())) continue;

    // Uplay IDは4〜16文字
    // （3文字以下は "You" などの誤検出が多いため除外）
    if (cleanWord.length >= 4 && cleanWord.length <= 16) {
      if (!seen.has(cleanWord.toLowerCase())) {
        playerIds.push(cleanWord);
        seen.add(cleanWord.toLowerCase());
      }
    }
  }

  return playerIds;
}