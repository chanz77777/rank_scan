# 🎯 Rainbow Six Siege Stats Dashboard (rank_scan)

Rainbow Six Siege のプレイヤー戦績を効率的に可視化・比較するモダンな SaaS 型 Web アプリケーションです。  
ゲーム画面のスクリーンショットからの **OCR（光学文字認識）によるプレイヤー ID 抽出** と、Tracker API を活用した戦績取得・分析をコア機能として備えています。

---

## ✨ 主な機能

- 📸 **スクリーンショット OCR スキャン**: Tesseract.js と画像処理（二値化・クロッピング）により、戦績画面から ID を自動抽出。
- 📊 **戦績表示 & Bento Grid UI**: 3D チルト効果やホログラムエフェクトを取り入れた「Quiet Luxury Console (QLC)」デザイン。
- ⚔️ **マルチプレイヤー比較**: 複数プレイヤーの戦績カードを並べて比較・分析。
- 💻 **マルチプラットフォーム対応**: PC / PlayStation / Xbox のプラットフォーム切替機能。

---

## 🛠 技術スタック

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **OCR Engine**: Tesseract.js (クライアントサイド処理)
- **Deployment**: Vercel

---

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

### 3. ビルド & 動作確認

```bash
npm run build
npm start
```

---
## 📁 プロジェクト構造

```text
rank_scan/
├── app/
│   ├── api/
│   │   ├── ocr/                   # OCR処理用API
│   │   ├── process-image/         # 画像処理用API
│   │   └── tracker/               # R6 Tracker API エンドポイント
│   ├── components/
│   │   ├── player/                # プレイヤー表示関連コンポーネント
│   │   ├── scanner/               # スキャナー・アップロード関連コンポーネント
│   │   └── PlatformToggle.tsx     # プラットフォーム切り替え
│   ├── hooks/
│   │   ├── useImageScanner.ts     # 画像スキャン用カスタムフック
│   │   └── usePlayerStats.ts      # 戦績取得用カスタムフック
│   ├── lib/
│   │   ├── imageProcessor.ts      # 画像クロッピング・処理
│   │   ├── mockData.ts            # モックデータ
│   │   ├── ocrProcessor.ts        # OCR・IDプレフィックス除去
│   │   ├── playerStrength.ts      # プレイヤー評価・強さ分析
│   │   └── types.ts               # TypeScript 型定義
│   ├── styles/
│   │   ├── animations.css         # アニメーション定義
│   │   ├── base.css               # ベーススタイル
│   │   ├── bento.css              # Bento Grid スタイル
│   │   ├── card-3d.css            # 3Dカード効果
│   │   ├── design-system.css      # デザイントークン
│   │   └── holograms.css          # ホログラムエフェクト
│   ├── favicon.ico
│   ├── globals.css                # グローバルスタイル
│   ├── layout.tsx                 # ルートレイアウト
│   └── page.tsx                   # メインページ
├── public/
├── scripts/
│   └── update-context.mjs         # コンテキスト自動同期スクリプト
├── AGENTS.md                      # エージェント用ルール設定
├── CLAUDE.md
├── PROJECT_CONTEXT.md             # プロジェクトの正解（Single Source of Truth）
├── QUICKSTART.md
├── DEPLOYMENT.md
├── CHANGELOG_v1.1.md
├── DRAG_DROP_FEATURE.md
├── IMAGE_PROCESSING.md
├── IMPLEMENTATION.md
├── v1.2_SUMMARY.md
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🤖 AI 開発・コンテキスト管理ルール

本プロジェクトでは `PROJECT_CONTEXT.md` をプロジェクトの唯一の仕様・アーキテクチャ定義（Single Source of Truth）として管理しています。

コード変更を行ってコミットした後は、以下のコマンドを実行して AI コンテキストを常に最新状態に同期してください：

```bash
node scripts/update-context.mjs
```

---

## 📖 詳細ドキュメント

開発・運用の詳細については各ファイルを参照してください：

* **セットアップ & 本番 API 移行**: `QUICKSTART.md`
* **デプロイ手順**: `DEPLOYMENT.md`
* **画像処理・OCR 詳細**: `IMAGE_PROCESSING.md`
