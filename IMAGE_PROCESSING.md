# 画像処理機能 - 実装ガイド

## 概要

このドキュメントでは、R6 Siege Stats Dashboard に画像処理機能を追加する方法について説明します。

ゲームのスクリーンショットから自動的にプレイヤーIDを抽出し、R6 Tracker から戦績を取得します。

---

## 🎯 機能

### v1.0（現在）
- ✅ 画像ファイル選択UI
- ✅ デフォルトパス設定
- ✅ API エンドポイント準備
- ✅ モックデータ統合

### v2.0（実装待機）
- ⏳ Claude Vision API 統合
- ⏳ OCR テキスト抽出
- ⏳ プレイヤーID 自動抽出
- ⏳ R6 Tracker API 連携

---

## 📋 セットアップ手順

### 1. Claude API キーを取得

```bash
# Anthropic アカウントを作成
# https://console.anthropic.com/

# API キーをコピー
# .env.local に追加
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. 環境変数を設定

```bash
# .env.local
ANTHROPIC_API_KEY=your_api_key_here
NEXT_PUBLIC_DEFAULT_IMAGE_PATH=C:\Users\yuuch\Pictures\Desktop Screenshot 2026.06.19 - 15.08.38.64.jxr.jpg
```

### 3. 依存関係をインストール

```bash
npm install
# Note: Claude API のみを使用する場合は追加インストール不要
# Tesseract.js を使う場合: npm install tesseract.js
```

---

## 🔧 実装方法

### オプション 1: Claude Vision API（推奨）

**メリット:**
- 高精度な OCR
- テキスト以外の情報も取得可能
- 日本語対応

**デメリット:**
- API 利用料金がかかる
- ネットワーク依存

**実装例:**

```typescript
// app/api/process-image/route.ts の実装例

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imagePath } = body;

    if (!imagePath) {
      return NextResponse.json(
        { error: 'imagePath is required' },
        { status: 400 }
      );
    }

    // ファイルを読み込み、Base64に変換
    const fileContent = fs.readFileSync(imagePath);
    const base64 = fileContent.toString('base64');

    // 拡張子から MIME タイプを判定
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.jxr') mimeType = 'image/jxr'; // or image/vnd.ms-photo

    // Claude Vision API を呼び出し
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `このR6 Siegeのゲームスクリーンショットから、
                     プレイヤー名/IDを全て抽出してください。
                     
                     以下のいずれかの形式で返してください：
                     1. スコアボード形式: 順位とプレイヤー名
                     2. リスト形式: プレイヤー名の一覧
                     
                     JSON形式で応答してください：
                     {
                       "playerIds": ["Player1", "Player2", "Player3"],
                       "confidence": 0.95,
                       "format": "scoreboard" | "list",
                       "details": "見つかったプレイヤー数など"
                     }`,
            },
          ],
        },
      ],
    });

    // レスポンスをパース
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(responseText);

    return NextResponse.json({
      playerIds: parsed.playerIds,
      confidence: parsed.confidence || 0.85,
      format: parsed.format,
      details: parsed.details,
    });
  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
```

**使用方法:**

```bash
# 依存関係をインストール
npm install @anthropic-ai/sdk

# .env.local を設定
ANTHROPIC_API_KEY=sk-ant-...
```

### オプション 2: Tesseract.js（ブラウザ内 OCR）

**メリット:**
- API キー不要
- プライベート（オンラインで処理しない）
- 無料

**デメリット:**
- 精度が低い（特に日本語）
- 処理が遅い
- ブラウザのメモリを消費

**実装例:**

```typescript
// app/lib/imageProcessor.ts

import Tesseract from 'tesseract.js';

export async function extractPlayerIdsWithTesseract(
  imageFile: File
): Promise<string[]> {
  try {
    const imageUrl = URL.createObjectURL(imageFile);

    const result = await Tesseract.recognize(imageUrl, 'jpn+eng', {
      logger: (m) => console.log('Tesseract progress:', m),
    });

    const text = result.data.text;
    const playerIds = parsePlayerIdsFromText(text);

    return playerIds;
  } catch (error) {
    console.error('Tesseract error:', error);
    throw error;
  }
}

export function parsePlayerIdsFromText(text: string): string[] {
  // テキストからプレイヤーID を抽出
  const lines = text.split('\n');
  const playerIds: string[] = [];

  lines.forEach((line) => {
    // パターン1: "1. PlayerName - Points"
    let match = line.match(/\d+\.\s+([A-Za-z0-9_-]+)/);
    if (match) {
      playerIds.push(match[1]);
      return;
    }

    // パターン2: "PlayerName - Points"
    match = line.match(/^([A-Za-z0-9_-]+)\s*-/);
    if (match) {
      playerIds.push(match[1]);
      return;
    }

    // パターン3: 単体のプレイヤー名（3文字以上）
    const word = line.trim();
    if (word.length >= 3 && /^[A-Za-z0-9_-]+$/.test(word)) {
      playerIds.push(word);
    }
  });

  return [...new Set(playerIds)]; // 重複を削除
}
```

**使用方法:**

```bash
npm install tesseract.js
```

### オプション 3: Google Cloud Vision API

**メリット:**
- 高精度
- 多言語対応
- Google の信頼性

**デメリット:**
- 有料
- セットアップが複雑

---

## 🔄 ワークフロー

```
1. ユーザーがスクリーンショットを選択
   ↓
2. 画像ファイルを /api/process-image に送信
   ↓
3. OCR 処理（Claude/Tesseract/Google）
   ↓
4. プレイヤーID を抽出
   ↓
5. 各プレイヤーの /api/tracker を呼び出し
   ↓
6. R6 Tracker データを取得（本番API時）
   ↓
7. プレイヤーカードを表示
```

---

## 💻 ローカルテスト

### テスト画像の準備

1. R6 Siege でゲームプレイ
2. スコアボードが表示されている状態でスクリーンショット
3. 保存場所: `C:\Users\yuuch\Pictures\`

### テスト実行

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで開く
http://localhost:3000

# スクリーンショットを選択 → 「解析」ボタンをクリック
```

### デバッグ

```typescript
// app/api/process-image/route.ts にログを追加
console.log('Image path:', imagePath);
console.log('Extracted text:', text);
console.log('Player IDs:', playerIds);
```

ブラウザコンソール（F12）とサーバーログを確認

---

## 📊 実装チェックリスト

- [ ] Claude API キーを取得
- [ ] .env.local に設定
- [ ] 依存関係をインストール
- [ ] /api/process-image/route.ts を実装
- [ ] imageProcessor.ts を更新
- [ ] ローカルテスト
- [ ] エラーハンドリングを追加
- [ ] 本番環境で動作確認

---

## 🛠️ トラブルシューティング

### "API キーが無効" エラー

```
解決方法:
1. console.anthropic.com で API キーを確認
2. .env.local に正しくコピーされているか確認
3. npm run dev を再起動
```

### "画像を読み込めない" エラー

```
確認項目:
1. ファイルパスが正しいか
2. ファイル形式が対応しているか (JPEG, PNG, WebP, JXR)
3. ファイル サイズが 5MB 以下か
```

### "プレイヤーIDが抽出されない"

```
解決方法:
1. OCR テキストを確認: console.log(text)
2. parsePlayerIdsFromText() の正規表現を調整
3. テスト画像を確認（スコアボードが見やすいか）
```

---

## 🚀 本番環境での推奨設定

### Vercel での環境変数設定

```
Settings → Environment Variables

ANTHROPIC_API_KEY = sk-ant-...
```

### Rate Limiting

```typescript
// 1時間に100リクエストまで
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
});
```

### キャッシング

```typescript
// 同じ画像は1日キャッシュ
export const revalidate = 86400;
```

---

## 📈 パフォーマンス

| 方法 | 処理時間 | 精度 | コスト |
|------|---------|------|-------|
| Claude API | 2-5秒 | 95% | $0.003/画像 |
| Tesseract.js | 10-30秒 | 70% | 無料 |
| Google Vision | 1-3秒 | 98% | $0.005/画像 |

---

## 🔐 セキュリティ考慮事項

1. **API キーの管理**
   - .env.local で管理（リポジトリにコミットしない）
   - Vercel Secrets を使用

2. **ファイル検証**
   ```typescript
   // ファイルサイズチェック
   if (fileSize > 5 * 1024 * 1024) {
     throw new Error('File too large');
   }
   
   // MIME タイプチェック
   const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
   if (!validTypes.includes(file.type)) {
     throw new Error('Invalid file type');
   }
   ```

3. **入力検証**
   ```typescript
   // プレイヤーIDのバリデーション
   if (!/^[A-Za-z0-9_-]{3,20}$/.test(playerId)) {
     throw new Error('Invalid player ID');
   }
   ```

---

## 📚 参考リンク

- [Claude API Documentation](https://docs.anthropic.com/)
- [Tesseract.js](https://github.com/naptha/tesseract.js)
- [Google Cloud Vision](https://cloud.google.com/vision)
- [R6 Tracker Network](https://r6.tracker.network/)

---

**作成日**: 2026年6月19日
**バージョン**: 1.0.0
**ステータス**: 実装準備完了 🚀
