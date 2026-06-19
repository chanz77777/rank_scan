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
  currentSeason: SeasonStats;
  lifetimeStats: LifetimeStats;
  seasonPeaks: SeasonPeak[];
}
