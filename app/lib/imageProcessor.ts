/**
 * 画像処理モジュール
 * R6 Siege のゲームスクリーンショットからプレイヤーIDを抽出
 */

/**
 * 画像からスコアボードのプレイヤー名列部分（中央の特定エリア）を切り抜く
 * アイコン除去は行わず、切り抜き＋二値化のみ実施
 */
export const cropImageToCenterGrid = (base64Str: string, mimeType: string = 'image/png'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        const width = img.naturalWidth;
        const height = img.naturalHeight;

        // スコアボードのプレイヤー名列の切り抜き範囲比率
        // 横: 29.0% 〜 46.0% (幅 17.0%)
        // 縦: 29% 〜 80% (高さ 51%)
        const cropX = Math.round(width * 0.29);
        const cropY = Math.round(height * 0.29);
        const cropW = Math.round(width * 0.17);
        const cropH = Math.round(height * 0.51);

        // Tesseractの認識精度向上のため、4倍に拡大する
        const scale = 4;
        canvas.width = cropW * scale;
        canvas.height = cropH * scale;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

        // 画像処理（二値化・白黒反転）
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // 輝度 (グレースケール)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // 二値化 & 白黒反転 (文字を黒[0]、背景を白[255]にする)
          const binValue = gray > 100 ? 0 : 255;

          data[i] = binValue;     // R
          data[i + 1] = binValue; // G
          data[i + 2] = binValue; // B
        }

        ctx.putImageData(imgData, 0, 0);

        // PNG形式でBase64書き出し
        const croppedBase64 = canvas.toDataURL('image/png').split(',')[1];
        resolve(croppedBase64);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = `data:${mimeType};base64,${base64Str}`;
  });
};

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
