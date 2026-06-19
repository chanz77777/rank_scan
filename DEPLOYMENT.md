# Vercel デプロイメントガイド

このドキュメントでは、R6 Siege Stats Dashboard を Vercel にデプロイする手順を説明します。

## 前提条件

- GitHub アカウント
- Vercel アカウント（無料）
- このプロジェクトがGitHubリポジトリとして初期化されていること

## ステップバイステップガイド

### 1. GitHub にプロジェクトをプッシュ

```bash
cd rank_scan

# 既にGitリポジトリが初期化されている場合
git add .
git commit -m "Initial R6 Siege Stats Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rank_scan.git
git push -u origin main
```

### 2. Vercel にログイン・接続

1. https://vercel.com にアクセス
2. **Sign Up** または **Sign In**
3. **GitHub** で認証

### 3. プロジェクトをインポート

1. Vercel ダッシュボードで **"Add New..."** をクリック
2. **"Project"** を選択
3. GitHub リポジトリから `rank_scan` を検索・選択
4. **"Import"** をクリック

### 4. ビルド設定（デフォルトで問題ない）

```
Framework Preset: Next.js
Build Command: `npm run build`
Output Directory: `.next`
Install Command: `npm install`
```

### 5. デプロイ実行

**"Deploy"** ボタンをクリック

数分後に以下のURLでアプリケーションが利用可能：
```
https://rank_scan-YOUR_USERNAME.vercel.app
```

---

## 環境変数の設定（本番API使用時）

本番環境でR6 Tracker APIを使用する場合：

### 1. Vercel プロジェクト設定を開く

```
Settings → Environment Variables
```

### 2. 以下の環境変数を追加

```
TRACKER_API_KEY=your_api_key_here
CACHE_TTL=86400
```

### 3. 自動デプロイの確認

GitHub にプッシュすると自動的にVercelでデプロイされます

---

## カスタムドメインの設定

### 1. ドメインを購入（例：r6stats.com）

### 2. Vercel で設定

```
Settings → Domains → Add Domain
```

### 3. DNS設定を確認

Vercelの指示に従ってDNS レコードを更新

---

## トラブルシューティング

### デプロイが失敗する場合

1. **ビルドエラーを確認**
   ```
   Deployments → 失敗したデプロイ → Logs
   ```

2. **ローカルでビルドテスト**
   ```bash
   npm run build
   ```

3. **Node.js バージョン確認**
   - Vercel Settings → Node.js Version
   - ローカルと同じバージョンに設定

### API エラー

1. **CORS エラー**
   - 環境変数を確認
   - APIエンドポイントのURLが正しいか確認

2. **404 エラー**
   - プレイヤーIDが正しいか確認
   - R6 Tracker サイトで検証

---

## パフォーマンス最適化

### 1. 画像最適化

```typescript
// app/components/RankIcon.tsx
import Image from 'next/image';

export default function RankIcon({ rank, imageUrl }: Props) {
  return (
    <Image
      src={imageUrl}
      alt={rank}
      width={100}
      height={100}
      priority
    />
  );
}
```

### 2. ISR (Incremental Static Regeneration)

```typescript
// app/api/tracker/route.ts
export const revalidate = 3600; // 1時間ごと更新
```

### 3. キャッシング

```typescript
// Vercel KV (Redis) を使用
import { kv } from '@vercel/kv';

export async function getPlayerStats(ubiId: string) {
  // キャッシュから取得
  const cached = await kv.get(`player:${ubiId}`);
  if (cached) return cached;
  
  // APIから取得
  const data = await fetchFromR6Tracker(ubiId);
  
  // キャッシュに保存（24時間有効）
  await kv.setex(`player:${ubiId}`, 86400, data);
  
  return data;
}
```

---

## セキュリティのベストプラクティス

### 1. API キーを安全に管理

```bash
# .env.local（ローカルのみ）
TRACKER_API_KEY=your_secret_key

# .env.example（リポジトリに含める）
TRACKER_API_KEY=example_key
```

`.gitignore` で `.env.local` を除外

### 2. Rate Limiting

```typescript
// app/api/tracker/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 60秒間に10リクエスト
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for');
  const { success } = await ratelimit.limit(ip || 'anonymous');
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // ... 処理続行
}
```

### 3. CORS設定

```typescript
// app/api/tracker/route.ts
const headers = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

---

## 監視とログ

### 1. Vercel Analytics

```
Settings → Analytics → Web Analytics を有効化
```

### 2. エラートラッキング

Sentry と統合：

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### 3. ロギング

```typescript
// app/api/tracker/route.ts
console.log(`[${new Date().toISOString()}] Fetching: ${ubiId}`);
```

---

## CI/CD パイプライン

### GitHub Actions で自動テスト

`.github/workflows/test.yml`:

```yaml
name: Test & Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run build
      - run: npm run type-check
```

---

## ローリングバック

デプロイに問題がある場合：

```
Deployments → 以前のデプロイ → "Redeploy"
```

または

```bash
# ローカルから再デプロイ
vercel --prod
```

---

## よくある質問

**Q: Vercel は無料ですか？**
A: はい、個人プロジェクトであれば無料です。本番環境では有料プランがおすすめです。

**Q: カスタムドメインは必須ですか？**
A: いいえ、デフォルトのVercelドメインで問題ありません。

**Q: APIレートリミットはありますか？**
A: R6 Tracker APIを使用する場合は、実装することをおすすめします。

**Q: データベースは必要ですか？**
A: モックデータを使用している間は不要。本番環境ではキャッシング（Vercel KV）をおすすめします。

---

## サポート

- [Vercel ドキュメント](https://vercel.com/docs)
- [Next.js デプロイメント](https://nextjs.org/docs/deployment)
- [GitHub Issues](https://github.com/YOUR_USERNAME/rank_scan/issues)
