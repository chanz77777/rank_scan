/**
 * OCR処理 - Tesseract.js をクライアント側で実行
 * 画像からテキストを抽出してプレイヤーIDを識別
 */

// スコアボード上に表示されるが、プレイヤーIDではない単語のブラックリスト
const ID_BLOCKLIST = new Set([
  'YOU?',
  'you',
]);

/**
 * アイコン誤読によるごみプレフィックスを取り除く
 * R6 Siege のスコアボードにはアバター・炎・Ubisoft渦巻きアイコンが名前の左に並ぶ。
 * これらが OCR で 1〜3 文字のゴミ + 区切り文字として誤読されることがある。
 *
 * 例: "y_Rukh-."        → "Rukh-."
 * 例: "-_W_s0-UzoU.SPL" → "s0-UzoU.SPL"
 */
function stripIconPrefix(str: string): string {
  // // ステップ1: 先頭の非英数字文字を除去 ("-_W_foo" → "W_foo")
  // let s = str.replace(/^[^A-Za-z0-9]+/, '');
  // // ステップ2: "1〜3文字英数字 + 区切り文字" が繰り返す先頭パターンを除去
  // //           ("W_foo" → "foo", "y_bar" → "bar", "Ab_cd_RealName" → "RealName" など)
  // s = s.replace(/^([A-Za-z0-9]{1,3}[_\-.]+)+/, '');
  // // ステップ3: 再度先頭の非英数字を除去
  // s = s.replace(/^[^A-Za-z0-9]+/, '');
  return str;
}

/**
 * R6 SiegeのスクリーンショットのテキストからプレイヤーIDを抽出
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

    // スペースをアンダースコアに変換して結合
    const joined = cleanedLine.replace(/\s+/g, '_').replace(/[^A-Za-z0-9._\-\|]/g, '');
    if (!joined) continue;

    // アイコン誤読プレフィックスを除去した候補も生成（除去版を優先）
    const stripped = stripIconPrefix(joined);

    // 試す順: stripped優先、次にoriginal（重複除去）
    const candidates = [stripped, joined].filter(
      (c, idx, arr) => c.length > 0 && arr.indexOf(c) === idx
    );

    for (const candidate of candidates) {
      if (ID_BLOCKLIST.has(candidate.toLowerCase())) continue;

      // Uplay IDは4〜16文字
      if (candidate.length >= 4 && candidate.length <= 16) {
        const key = candidate.toLowerCase();
        if (!seen.has(key)) {
          playerIds.push(candidate);
          seen.add(key);
          break; // このラインからは最初に有効だった候補1つだけ使う
        }
      }
    }
  }

  return playerIds;
}