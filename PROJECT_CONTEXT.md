<!-- last_synced_commit: a9afc3b996b2656f63c29d1e1d0cce230cba2e47 -->

# Project Context: R6 Siege Stats Dashboard

## 1. プロジェクト概要
Rainbow Six Siegeのプレイヤー戦績を効率的に可視化するSaaS型ダッシュボード。
スクリーンショットのOCR処理によるプレイヤーID抽出と、Tracker.gg等からのデータ取得を組み合わせた戦績表示をコア機能とする。

## 2. 技術スタック・アーキテクチャ
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, CSS Modules (Quiet Luxury Console - Design Tokens)
- **OCR Engine**: Tesseract.js (クライアント側で実行)
- **Design Language**:
  - 3D傾きエフェクト (`card-3d.css`)
  - ホログラフィック・UI (`holograms.css`)
  - Bento Gridレイアウト (`bento.css`)

## 3. ディレクトリ構成と役割
- `app/api/`: `process-image` (OCR向けBase64変換), `tracker` (外部データ取得用ルート)
- `app/components/`:
  - `scanner/`: OCR画像アップロード、ID手動修正パネル
  - `player/`: 戦績表示カード、MVP/Threatバッジ、3D傾き効果
  - `PlatformToggle.tsx`: PC/PS/Xboxのプラットフォーム切り替え
- `app/lib/`:
  - `ocrProcessor.ts`: Tesseract.jsによるID抽出・クリーニングロジック
  - `imageProcessor.ts`: 画像クロッピング・二値化ロジック
  - `types.ts`: 戦績データの型定義 (RankInfo, SeasonStats, PlayerStats)
- `scripts/`:
  - `update-context.mjs`: プロジェクトコンテキスト（`PROJECT_CONTEXT.md`）を最新のコミットハッシュと同期させるためのユーティリティスクリプト。AIエージェントへのプロンプト生成も行う。

## 4. 開発・設計の重要なルール
- **Quiet Luxury Console (QLC) デザイン**:
  - 明度4段階の背景色（`#050608`〜`#1E2230`）を使用すること。
  - カスタムの「レイキャスト」境界線エフェクト（Border Beam）をクラス名で管理。
- **データ取得フロー**:
  - OCRで取得したIDに基づき、API経由でTrackerデータを取得。
  - アイコンの誤読対策として `stripIconPrefix` を実装済み。
- **コンテキスト管理**:
  - 本ファイル `PROJECT_CONTEXT.md` をプロジェクトの唯一の正として扱う。
  - `scripts/update-context.mjs` を使用し、`PROJECT_CONTEXT.md` の `last_synced_commit` を最新のコミットハッシュに同期させる。
  - エージェントは作業開始時にこの同期状態を確認し、コンテキストが古い場合はその更新を優先すること。

## 5. 現在の課題・TODO
- 本番API連携の構築（`QUICKSTART.md` 参照）。
- OCR精度の継続的な調整（特に日本語環境での誤読対策）。