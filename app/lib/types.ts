/**
 * R6 Tracker プレイヤー戦績関連の型定義
 */

/** ランクシーズンのランク情報 */
export interface RankInfo {
  rank: string; // "COPPER", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"
  mmr: number; // MMR数値（例: 4500）
  imageUrl?: string; // ランクのアイコンURL（将来の拡張用）
}

/** シーズンの戦績情報 */
export interface SeasonStats {
  title: string; // "Y11S2 Overview" など
  winRate: number; // 勝率（0-100）
  kd: number; // K/D比
  matches: number; // マッチ数
  wins?: number; // 勝利数（任意）
  losses?: number; // 敗北数（任意）
  isFallback?: boolean; // 今シーズンのランク戦データがない場合（Lifetime Unranked + Quick Match 等のデータ）
}

/** 生涯戦績（Lifetime Overall） */
export interface LifetimeStats {
  level: number; // プレイヤーレベル
  matches: number; // 総マッチ数
  timePlayed: string; // プレイ時間（例: "575h"）
}

/** ランクシーズンの最高成績 */
export interface SeasonPeak {
  season: string; // シーズン名（例: "Y11S2"）
  rank: RankInfo;
}

/** プレイヤーの完全な戦績情報 */
export interface PlayerStats {
  ubiId: string; // Ubisoft ID（URLのパラメータ）
  username: string; // プレイヤー名
  avatarUrl?: string; // アバター画像URL（R6 Tracker より）
  heroImageUrl?: string; // ヘッダーバナー画像URL
  currentSeason: SeasonStats;
  lifetimeStats: LifetimeStats;
  /** 現在シーズンのランク（明示フィールド）。seasonPeaks[0] のフォールバックも可 */
  currentRank?: RankInfo;
  /**
   * 過去最高ランクのリスト（同じ最高階級に達した全シーズン）。
   * 同値の最高MMRが複数シーズン存在する場合はすべて含む。
   * シーズンIDの降順（最新が先頭）でソート済み。
   */
  seasonPeaks: SeasonPeak[];
  /**
   * ランク済み全シーズンのランク情報（最新が先頭）。
   * ポケモンカード「にげる」欄のように全シーズンアイコンを横並びする際に使用。
   */
  allSeasonRanks: SeasonPeak[];
}
