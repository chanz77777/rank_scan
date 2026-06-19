# クイックスタートガイド

## 5分で始める R6 Siege Stats Dashboard

### 1️⃣ インストール（1分）

```bash
cd rank_scan
npm install
```

### 2️⃣ 開発サーバー起動（1分）

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

### 3️⃣ プレイヤーを検索（2分）

以下のいずれかのプレイヤーIDを入力：

- `TokyoDisneyland`
- `SamplePlayer2`
- `SamplePlayer3`

### 4️⃣ 戦績を確認（1分）

以下の情報が表示されます：

| 情報 | 例 |
|------|-----|
| 勝率 | 65.5% |
| K/D比 | 1.48 |
| マッチ数 | 142 |
| レベル | 383 |
| 総マッチ | 2,710 |
| プレイ時間 | 575h |
| ランク（最高） | PLATINUM 4250 MMR |

---

## 本番API連携への移行

### ステップA: API レイヤーを作成

```bash
# 新しいファイルを作成
touch app/lib/r6TrackerApi.ts
```

```typescript
// app/lib/r6TrackerApi.ts
export async function fetchFromR6Tracker(ubiId: string) {
  const response = await fetch(
    `https://r6.tracker.network/api/v5/siege/profiles?name=${ubiId}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 ...'
      }
    }
  );
  
  const data = await response.json();
  return transformData(data);
}
```

### ステップB: API Route を更新

```typescript
// app/api/tracker/route.ts
import { fetchFromR6Tracker } from '@/app/lib/r6TrackerApi';

// mockData の代わりに呼び出し
const playerStats = await fetchFromR6Tracker(ubiId);
```

### ステップC: テスト

```bash
npm run dev
# http://localhost:3000 でテスト
```

---

## Vercel へのデプロイ

### 3ステップでデプロイ可能

#### Step 1: GitHub に push

```bash
git add .
git commit -m "R6 Stats Dashboard"
git push
```

#### Step 2: Vercel に接続

https://vercel.com にアクセス → GitHub を接続

#### Step 3: プロジェクトをインポート

"rank_scan" リポジトリを選択 → Deploy

**完了！** 自動的にデプロイされます。

```
URL: https://rank_scan-<yourname>.vercel.app
```

---

## よくある質問

### Q: モックデータを変更したい

**A:** `app/lib/mockData.ts` を編集

```typescript
{
  ubiId: 'NewPlayer',
  username: 'NewPlayer',
  currentSeason: {
    title: 'Y11S2 Overview',
    winRate: 70.0,
    kd: 1.5,
    matches: 100,
  },
  // ...
}
```

### Q: ランク画像を表示したい

**A:** `ImageUrl` フィールドを追加

```typescript
// types.ts
interface RankInfo {
  rank: string;
  mmr: number;
  imageUrl?: string;  // 追加
}

// PlayerStatsCard.tsx
{imageUrl && <img src={imageUrl} alt={rank} />}
```

### Q: 複数プレイヤーを一度に追加したい

**A:** POST エンドポイントを使用

```typescript
const response = await fetch('/api/tracker', {
  method: 'POST',
  body: JSON.stringify({
    playerIds: ['Player1', 'Player2', 'Player3']
  })
});
```

### Q: カラースキームを変更したい

**A:** `PlayerStatsCard.tsx` の関数を編集

```typescript
const getRankBgColor = (rank: string): string => {
  switch(rank) {
    case 'DIAMOND': return 'bg-blue-500';  // カスタム色
    // ...
  }
};
```

---

## コマンド一覧

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番環境で実行
npm start

# 型チェック
npm run type-check

# Lint
npm run lint

# デプロイ（Vercel CLI必須）
vercel --prod
```

---

## ファイル構造（重要なファイルのみ）

```
app/
├── components/
│   └── PlayerStatsCard.tsx   ← UIの見た目
├── lib/
│   ├── types.ts              ← データ型
│   └── mockData.ts           ← テストデータ
├── api/tracker/
│   └── route.ts              ← API エンドポイント
└── page.tsx                  ← メインページ
```

---

## 開発のコツ

### 1. ホットリロード活用

ファイルを保存すると自動的にブラウザが更新されます。

### 2. Browser DevTools

`F12` キーでコンソール・ネットワークを確認

### 3. API テスト

```bash
curl "http://localhost:3000/api/tracker?ubiId=TokyoDisneyland"
```

### 4. TypeScript の活用

```typescript
// ✅ 良い例
const player: PlayerStats = {
  ubiId: 'Player1',
  username: 'Player1',
  // ... 型安全
};

// ❌ 避けるべき
const player: any = { /* ... */ };
```

---

## 次のチャレンジ

### 簡単
- [ ] プレイヤーIDをURLパラメータで指定
- [ ] ダークモードトグル
- [ ] カラースキーム変更

### 中級
- [ ] 本番API統合
- [ ] キャッシング機能
- [ ] ユーザー履歴保存（LocalStorage）

### 上級
- [ ] データベース連携
- [ ] ユーザー認証
- [ ] 統計グラフ表示

---

## 参考リンク

- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/
- **R6 Tracker**: https://r6.tracker.network/

---

## 困ったときの対処法

### エラー表示が出た場合

1. **ターミナルを確認** - エラーメッセージを読む
2. **コンソール(F12)を確認** - JavaScript エラーを見る
3. **localhost:3000を再読み込み** - Ctrl+Shift+R
4. **npm run dev を再起動** - Ctrl+C で中止後に再実行

### APIが応答しない場合

```bash
# サーバーが起動しているか確認
curl http://localhost:3000

# 指定したプレイヤーIDが正しいか確認
curl "http://localhost:3000/api/tracker?ubiId=TokyoDisneyland"
```

### ビルドに失敗した場合

```bash
# キャッシュをクリア
rm -rf .next
npm run build
```

---

**Happy Coding! 🎮**

このダッシュボードで R6 Siege の戦績管理を楽しんでください！
