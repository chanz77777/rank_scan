<!-- last_synced_commit: e206575cf21aa376897e63c27ccb1dffec9ad30d -->

# Project Context: R6 Siege Stats Dashboard

## 1. プロジェクト概要
Rainbow Six Siegeのプレイヤー戦績を効率的に可視化・比較するモダンなSaaS型ダッシュボード。
ゲーム画面のスクリーンショットのOCR処理によるプレイヤーID抽出と、Tracker.gg等からのデータ取得を組み合わせた戦績表示をコア機能とする。
複数のプレイヤー戦績を並べて比較するマルチプレイヤー比較機能や、PC/PS/Xboxのマルチプラットフォーム対応も提供する。

## 2. 技術スタック・アーキテクチャ
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, CSS Modules, Design Tokens (`design-system.css`)
- **OCR Engine**: Tesseract.js (クライアント側で実行)
- **AI Integration**: `@google/genai` (コンテキスト管理の自動化に利用)
- **Deployment**: Vercel
- **Design Language**: Quiet Luxury Console (QLC)
  - 3D傾きエフェクト (`card-3d.css`)
  - ホログラフィック・UI (`holograms.css`)
  - Bento Gridレイアウト (`bento.css`)
  - アニメーション (`animations.css`), ベーススタイル (`base.css`) など、カスタムCSSモジュールを多用

## 3. ディレクトリ構成と役割
- `app/api/`: APIルート
  - `ocr/`: OCR処理関連のAPIエンドポイント
  - `process-image/`: 画像処理（Base64変換など）関連のAPIエンドポイント
  - `tracker/`: 外部データ（Tracker.ggなど）取得用APIエンドポイント
- `app/components/`: UIコンポーネント
  - `player/`: プレイヤー戦績表示カード、MVP/Threatバッジ、3D傾き効果など
  - `scanner/`: OCR画像アップロード、ID手動修正パネル
  - `PlatformToggle.tsx`: PC/PS/Xboxのプラットフォーム切り替え
- `app/hooks/`: カスタムフック
  - `useImageScanner.ts`: 画像スキャン処理に関するロジック
  - `usePlayerStats.ts`: プレイヤー戦績取得に関するロジック
- `app/lib/`: ヘルパー関数、ユーティリティ
  - `imageProcessor.ts`: 画像クロッピング・二値化ロジック
  - `mockData.ts`: 開発用モックデータ
  - `ocrProcessor.ts`: Tesseract.jsによるID抽出・クリーニングロジック
  - `playerStrength.ts`: プレイヤーの強さ分析・評価ロジック
  - `types.ts`: 戦績データの型定義 (RankInfo, SeasonStats, PlayerStats)
- `app/styles/`: スタイル定義
  - `animations.css`: UIアニメーション
  - `base.css`: ベースとなるグローバルスタイル
  - `bento.css`: Bento Gridレイアウト関連
  - `card-3d.css`: 3D傾きエフェクト
  - `design-system.css`: Quiet Luxury Console (QLC) のデザイントークン
  - `holograms.css`: ホログラムUIエフェクト
- `scripts/`: スクリプト
  - `update-context.mjs`: プロジェクトコンテキスト（`PROJECT_CONTEXT.md`）を最新のコミットハッシュとコード差分に基づいてAI（Google Gemini API）が自動更新するためのユーティリティスクリプト。
- **ルートディレクトリの主要ドキュメントファイル**:
  - `AGENTS.md`: AIエージェントへの指示とルール
  - `PROJECT_CONTEXT.md`: 本プロジェクトの唯一の正となる全体コンテキスト
  - `QUICKSTART.md`: プロジェクトのセットアップと本番APIへの移行ガイド
  - `DEPLOYMENT.md`: デプロイ手順
  - `IMAGE_PROCESSING.md`: 画像処理・OCRに関する詳細
  - その他 (`CLAUDE.md`, `CHANGELOG_v1.1.md`, `DRAG_DROP_FEATURE.md`, `IMPLEMENTATION.md`, `v1.2_SUMMARY.md` など)

## 4. 開発・設計の重要なルール
- **Quiet Luxury Console (QLC) デザイン**:
  - 明度4段階の背景色（`#050608`〜`#1E2230`）を使用すること。
  - カスタムの「レイキャスト」境界線エフェクト（Border Beam）をクラス名で管理。
  - `design-system.css` を用いて、統一されたデザイントークンとスタイルを管理する。
- **データ取得フロー**:
  - OCRで取得したIDに基づき、API経由でTrackerデータを取得。
  - アイコンの誤読対策として `stripIconPrefix` を `ocrProcessor.ts` に実装済み。
- **コンテキスト管理**:
  - 本ファイル `PROJECT_CONTEXT.md` をプロジェクトの唯一の正（Single Source of Truth）として扱い、アーキテクチャ、デザインルール、仕様の全てがここに集約される。
  - `scripts/update-context.mjs` を使用し、`PROJECT_CONTEXT.md` の `last_synced_commit` を最新のコミットハッシュに同期させるだけでなく、**AI (Google Gemini API) を用いてコードの差分に基づきコンテキスト内容自体を自動的に更新する。**
  - この自動更新プロセスには `GEMINI_API_KEY` の環境変数設定が必須である。
  - エージェントは作業開始時にこの同期状態を確認し、コンテキストが古い場合は`scripts/update-context.mjs`を実行し、その更新を優先すること。

## 5. 現在の課題・TODO
- 本番API連携の構築（`QUICKSTART.md` 参照）。
- OCR精度の継続的な調整（特に日本語環境での誤読対策）。