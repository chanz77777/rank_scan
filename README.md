# R6 Siege Stats Dashboard

Rainbow Six Siege のプレイヤー戦績を R6 Tracker から取得し、見やすく1画面にまとめるWebアプリケーション。

## 🎯 機能概要

- **プレイヤー戦績表示**: R6 Tracker のデータを取得・表示
- **複数プレイヤー比較**: 複数のプレイヤーカードを並べて比較可能
- **ダークモード対応**: ゲーム風のモダンなダークテーマ
- **レスポンシブデザイン**: モバイル・タブレット・PCに対応
- **検索機能**: UBI IDでプレイヤーを検索・追加

### 表示される情報

- **今シーズンの戦績概要**
  - 勝率 (Win Rate)
  - K/D比
  - マッチ数

- **Lifetime Overall（生涯戦績）**
  - レベル (Level)
  - 総マッチ数 (Matches)
  - プレイ時間 (Time Played)

- **Season Peak（シーズン最高成績）**
  - ランク（COPPER ～ DIAMOND）
  - MMR/RP（最高数値）

---

## 📁 プロジェクト構造

```
rank_scan/
├── app/
│   ├── api/
│   │   └── tracker/
│   │       └── route.ts                # R6 Tracker API エンドポイント
│   ├── components/
│   │   └── PlayerStatsCard.tsx         # プレイヤー戦績カードコンポーネント
│   ├── lib/
│   │   ├── types.ts                    # TypeScript 型定義
│   │   └── mockData.ts                 # モックデータ（開発用）
│   ├── page.tsx                        # メインページ
│   ├── layout.tsx                      # ルートレイアウト
│   ├── globals.css                     # グローバルスタイル
│   └── favicon.ico
├── public/
├── node_modules/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

---

## 🚀 クイックスタート

### インストール

```bash
cd rank_scan
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します

### ビルド

```bash
npm run build
npm start
```

---

## 🔑 主要ファイル解説

### 1. `app/lib/types.ts` - 型定義

R6 Tracker のデータ構造を定義しています：

```typescript
interface PlayerStats {
  ubiId: string;              // Ubisoft ID
  username: string;           // プレイヤー名
  currentSeason: SeasonStats; // 今シーズンの戦績
  lifetimeStats: LifetimeStats; // 生涯戦績
  seasonPeaks: SeasonPeak[]; // シーズンピーク
}
```

### 2. `app/lib/mockData.ts` - モックデータ

開発用のダミーデータを提供。以下の関数が実装されています：

```typescript
// UBI IDからプレイヤーデータを取得
getPlayerStats(ubiId: string): Promise<PlayerStats | null>
```

### 3. `app/components/PlayerStatsCard.tsx` - カードコンポーネント

Tailwind CSS を使用したゲーム風デザイン：

- ランク別のカラーテーマ（COPPER ～ DIAMOND）
- グラデーション背景
- ホバーエフェクト
- レスポンシブレイアウト

### 4. `app/api/tracker/route.ts` - API Route

**GET エンドポイント:**

```bash
GET /api/tracker?ubiId=<PLAYER_ID>
```

レスポンス例：

```json
{
  "ubiId": "TokyoDisneyland",
  "username": "TokyoDisneyland",
  "currentSeason": {
    "title": "Y11S2 Overview",
    "winRate": 65.5,
    "kd": 1.48,
    "matches": 142
  },
  "lifetimeStats": {
    "level": 383,
    "matches": 2710,
    "timePlayed": "575h"
  },
  "seasonPeaks": [...]
}
```

**POST エンドポイント（複数プレイヤー取得）:**

```bash
POST /api/tracker
Content-Type: application/json

{
  "playerIds": ["TokyoDisneyland", "SamplePlayer2"]
}
```

### 5. `app/page.tsx` - メインページ

- 検索フォーム
- プレイヤーカード一覧（Grid レイアウト）
- 削除機能

---

## 🔄 データ取得フロー

### 現在（モック）

```
User Input (UBI ID)
  ↓
API Route (/api/tracker)
  ↓
getPlayerStats() (mockData.ts)
  ↓
mockPlayerData から検索
  ↓
PlayerStatsCard に表示
```

---

## 🔌 本番環境への切り替え

### オプション 1: R6 Tracker 非公式 API を使用（推奨）

**メリット:**
- スクレイピング検出されにくい
- 比較的安定している
- 実装が簡単

**実装例:**

```typescript
// app/lib/r6TrackerApi.ts
export async function fetchFromR6Tracker(ubiId: string): Promise<PlayerStats> {
  const response = await fetch(
    `https://r6.tracker.network/api/v5/siege/profiles?name=${ubiId}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
  );
  
  if (!response.ok) throw new Error('Player not found');
  const data = await response.json();
  
  // R6 Tracker のレスポンスを PlayerStats 型に変換
  return transformTrackerData(data);
}

// app/api/tracker/route.ts で利用
import { fetchFromR6Tracker } from '@/app/lib/r6TrackerApi';
// ... getPlayerStats の代わりに fetchFromR6Tracker を使用
```

**注意点:**
- User-Agent を必ず設定（ブロック対策）
- キャッシュ機能の実装が必須
  - Vercel KV（推奨）
  - Redis
  - ISR (Incremental Static Regeneration)

**キャッシュ実装例（ISR）:**

```typescript
// app/api/tracker/route.ts
export async function GET(request: NextRequest) {
  // 24時間ごとにキャッシュを更新
  const cache = 60 * 60 * 24;
  response.headers.set('Cache-Control', `s-maxage=${cache}, stale-while-revalidate`);
  return response;
}
```

### オプション 2: スクレイピング（Cheerio / Playwright）

**メリット:**
- 公式サイトのHTML から直接抽出
- 最新データが確実に取得可能

**デメリット:**
- ブロックされやすい
- 保守が大変（HTMLの変更に対応必要）
- 処理が遅い

**実装例:**

```bash
npm install cheerio
```

```typescript
// app/lib/r6Scraper.ts
import { load } from 'cheerio';

export async function scrapeR6Tracker(ubiId: string): Promise<PlayerStats> {
  const url = `https://r6.tracker.network/r6siege/profile/ubi/${ubiId}/overview`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const html = await response.text();
  const $ = load(html);
  
  // セレクタで データを抽出
  const level = $('#player-level').text();
  const matches = $('.lifetime-matches').text();
  // ... 他のデータを抽出
  
  return {
    ubiId,
    username: ubiId,
    currentSeason: {...},
    lifetimeStats: {...},
    seasonPeaks: [...]
  };
}
```

### オプション 3: 公式API（将来リリース予定）

Ubisoft が公式 API をリリースした場合、以下のように更新：

```typescript
// app/lib/ubisoftApi.ts
const UBISOFT_API_KEY = process.env.UBISOFT_API_KEY;

export async function fetchFromUbisoftAPI(ubiId: string) {
  const response = await fetch(
    `https://api.ubisoft.com/v1/siege/profiles/${ubiId}`,
    {
      headers: {
        'Authorization': `Bearer ${UBISOFT_API_KEY}`
      }
    }
  );
  
  return response.json();
}
```

---

## 🛠️ 開発ガイド

### 新しいデータフィールドを追加する場合

1. **型定義を更新** (`app/lib/types.ts`)

```typescript
interface SeasonStats {
  title: string;
  winRate: number;
  kd: number;
  matches: number;
  headshots?: number;  // 新規フィールド
}
```

2. **モックデータを更新** (`app/lib/mockData.ts`)

3. **カードコンポーネントを更新** (`app/components/PlayerStatsCard.tsx`)

```typescript
<div className="bg-slate-700 rounded-md p-3 text-center">
  <p className="text-2xl font-bold text-red-400">
    {currentSeason.headshots || 'N/A'}
  </p>
  <p className="text-xs text-slate-400 mt-1 uppercase">Headshots</p>
</div>
```

4. **API レスポンス変換ロジックを更新** (本番 API 使用時)

### カラースキームをカスタマイズ

`app/components/PlayerStatsCard.tsx` の関数を編集：

```typescript
const getRankColor = (rank: string): string => {
  // カスタムカラーの定義
};

const getRankBgColor = (rank: string): string => {
  // 背景色の定義
};
```

---

## 🚀 Vercel へのデプロイ

### 準備

```bash
git add .
git commit -m "Initial R6 Siege Stats Dashboard"
git push origin main
```

### Vercel での設定

1. https://vercel.com にアクセス
2. **"Import Project"** をクリック
3. GitHub リポジトリを選択
4. デフォルト設定でデプロイ
5. 本番 API 使用時は **Environment Variables** を設定：

```
UBISOFT_API_KEY=your_api_key_here
R6_TRACKER_API_KEY=your_api_key_here
```

### パフォーマンス最適化

- 画像最適化（`next/image` 使用）
- 静的生成（ISR）
- キャッシング戦略

---

## 📊 R6 Tracker データマッピング

R6 Tracker のHTML構造（参考）:

```html
<!-- シーズン戦績 -->
<div class="season-stats">
  <span class="win-rate">65.5%</span>
  <span class="kd-ratio">1.48</span>
  <span class="matches">142</span>
</div>

<!-- 生涯戦績 -->
<div class="lifetime-stats">
  <span class="level">383</span>
  <span class="matches">2,710</span>
  <span class="time-played">575h</span>
</div>

<!-- ランクピーク -->
<div class="rank-peak">
  <img src="platinum-rank.png" />
  <span class="mmr">4250</span>
</div>
```

---

## ⚙️ トラブルシューティング

### API が 404 エラーを返す

1. UBI ID が正しく入力されているか確認
2. R6 Tracker サイトで検証：
   ```
   https://r6.tracker.network/r6siege/profile/ubi/{UBI_ID}/overview
   ```

### ビルドエラーが発生

```bash
rm -rf .next node_modules
npm install
npm run build
```

### 型エラー

```bash
npm run type-check
```

---

## 📝 ライセンス

MIT License

## 🔗 参考リンク

- [R6 Tracker](https://r6.tracker.network/)
- [Next.js Documentation](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Rainbow Six Siege](https://www.ubisoft.com/siege/)

---

## 🤝 フィードバック・改善提案

バグ報告や機能リクエストはお気軽にどうぞ！
