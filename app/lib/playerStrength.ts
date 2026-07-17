/**
 * プレイヤー実力評価ロジック
 *
 * 優先順位:
 *  1. ベストランク / 現在ランク（最大 ~84点）
 *  2. プレイ時間              （最大 10点）
 *  3. K/D比                  （最大  5点）
 *
 * 合計 ~100点満点でスコアを算出し、StrengthTier に変換する。
 */

import type { CSSProperties } from 'react';
import type { PlayerStats, RankInfo } from './types';

// ────────────────────────────────────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────────────────────────────────────

export type StrengthTier =
  | 'champion'
  | 'diamond'
  | 'emerald'
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'copper';

/** カードに適用する装飾情報 */
export interface CardDecoration {
  /** StrengthTier 識別子 */
  tier: StrengthTier;
  /** 外側ラッパー div の className（レインボー等のアニメクラスを含む） */
  wrapperClassName: string;
  /** 外側ラッパー div の inline style */
  wrapperStyle: CSSProperties;
  /** カード本体 div に追加する className */
  cardClassName: string;
  /** カード本体 div に追加する inline style（box-shadow 等） */
  cardStyle: CSSProperties;
  /** 表示用ラベル */
  tierLabel: string;
  /** 絵文字バッジ */
  tierEmoji: string;
}

// ────────────────────────────────────────────────────────────────────────────
// ランク名 → ベーススコア
// ────────────────────────────────────────────────────────────────────────────

/**
 * ランク名（大文字）のプレフィックスからベーススコアを返す
 * 正しい順序: Copper → Bronze → Silver → Gold → Platinum → Emerald → Diamond → Champion
 */
function getRankBaseScore(rankName: string): number {
  const upper = (rankName ?? '').toUpperCase().trim();
  if (upper.startsWith('CHAMPION')) return 70;
  if (upper.startsWith('DIAMOND')) return 58;
  if (upper.startsWith('EMERALD')) return 46;
  if (upper.startsWith('PLATINUM')) return 34;
  if (upper.startsWith('GOLD')) return 24;
  if (upper.startsWith('SILVER')) return 14;
  if (upper.startsWith('BRONZE')) return 6;
  if (upper.startsWith('COPPER')) return 2;
  return 0;
}

/**
 * サブティア（1/2/3）を考慮した細かい補正。
 * "Diamond 1" は "Diamond 3" より高い。
 */
function getRankSubBonus(rankName: string): number {
  const m = (rankName ?? '').match(/(\d)$/);
  if (!m) return 2; // サブティアなし（単一ランク）= 中程度ボーナス
  const sub = parseInt(m[1], 10);
  // 1 が最高、3 が最低
  return sub === 1 ? 4 : sub === 2 ? 2 : 0;
}

/** RankInfo からトータルランクスコアを返す */
function rankInfoToScore(info: RankInfo | undefined): number {
  if (!info) return 0;
  return getRankBaseScore(info.rank) + getRankSubBonus(info.rank);
}

// ────────────────────────────────────────────────────────────────────────────
// プレイ時間パース
// ────────────────────────────────────────────────────────────────────────────

/**
 * timePlayed 文字列（例: "575h", "1,234h 30m", "575 Hours"）を時間数（number）に変換。
 */
function parsePlaytimeHours(timePlayed: string): number {
  if (!timePlayed) return 0;
  // 先頭の数字グループ（カンマ区切りを除去）を取得
  const m = timePlayed.replace(/,/g, '').match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * プレイ時間（時間数）→ ボーナス点（最大 20点）
 * 4桁（1000h以上）はかなり強いとみなし大幅加点
 */
function playtimeBonus(timePlayed: string): number {
  const hours = parsePlaytimeHours(timePlayed);
  if (hours >= 5000) return 50; // 超ベテラン
  if (hours >= 3000) return 30;
  if (hours >= 2000) return 25;
  if (hours >= 1000) return 20; // 4桁 = かなり強い
  if (hours >= 500) return 15;
  if (hours >= 200) return 10;
  if (hours >= 50) return 1;
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// K/D ボーナス
// ────────────────────────────────────────────────────────────────────────────

/** K/D 比 → ボーナス点（最大 5点） */
function kdBonus(kd: number): number {
  if (kd >= 2.5) return 5;
  if (kd >= 2.0) return 4;
  if (kd >= 1.5) return 3;
  if (kd >= 1.2) return 2;
  if (kd >= 1.0) return 1;
  return 0;
}

// ────────────────────────────────────────────────────────────────────────────
// メイン: 強さスコア算出
// ────────────────────────────────────────────────────────────────────────────

/**
 * PlayerStats から強さスコア（0〜100 程度）を算出する。
 *
 * 配点:
 *   ベストランク:   最大 74点（ランク 70 + サブボーナス 4）
 *   現在ランク:     最大 10点（上乗せ補正）
 *   プレイ時間:     最大 10点
 *   K/D比:         最大  5点
 */
export function calcStrengthScore(stats: PlayerStats): number {
  // 1. ベストランクスコア（seasonPeaks の中で最高 MMR を持つものを採用）
  const bestPeak = stats.seasonPeaks.reduce<RankInfo | undefined>((best, p) => {
    if (!best || p.rank.mmr > best.mmr) return p.rank;
    return best;
  }, undefined);

  const bestRankScore = rankInfoToScore(bestPeak ?? stats.currentRank);

  // 2. 現在ランクによる上乗せ（ベストより低い場合は 0 or 小さい補正）
  const currentRankScore = rankInfoToScore(stats.currentRank ?? stats.seasonPeaks[0]?.rank);
  // 現在ランクがベストランク以上なら最大 10点、低ければ比例して減少
  const currentBonus = bestRankScore > 0
    ? Math.round((currentRankScore / Math.max(bestRankScore, 1)) * 10)
    : 0;

  // 3. プレイ時間ボーナス
  const ptBonus = playtimeBonus(stats.lifetimeStats.timePlayed);

  // 4. K/D ボーナス
  const kd = stats.currentSeason.kd;
  const kdBonusScore = kdBonus(kd);

  return bestRankScore + currentBonus + ptBonus + kdBonusScore;
}

// ────────────────────────────────────────────────────────────────────────────
// スコア → StrengthTier
// ────────────────────────────────────────────────────────────────────────────

/**
 * スコア値から StrengthTier を返す
 * Copper → Bronze → Silver → Gold → Platinum → Emerald → Diamond → Champion
 */
export function getStrengthTier(score: number): StrengthTier {
  if (score >= 85) return 'champion';
  if (score >= 70) return 'diamond';
  if (score >= 56) return 'emerald';
  if (score >= 42) return 'platinum';
  if (score >= 30) return 'gold';
  if (score >= 18) return 'silver';
  if (score >= 9) return 'bronze';
  return 'copper';
}

// ────────────────────────────────────────────────────────────────────────────
// StrengthTier → CardDecoration
// ────────────────────────────────────────────────────────────────────────────

/**
 * StrengthTier に応じたカード装飾情報（CSS クラス・スタイル）を返す。
 *
 * 実現方式:
 *   - wrapperClassName + wrapperStyle で外側ラッパー div をスタイリング
 *   - ラッパーに padding: 2px (または 1px) を与え、内側カードとの隙間で
 *     グラデーションボーダーを表現する
 *   - champion のみ globals.css の .card-champion-border クラスでレインボーアニメ
 */
export function getCardDecoration(tier: StrengthTier): CardDecoration {
  switch (tier) {
    case 'champion':
      return {
        tier,
        wrapperClassName: 'animate-float',
        wrapperStyle: {},
        cardClassName: 'animate-bg-flow',
        cardStyle: {
          background: 'linear-gradient(135deg, #3b0066 0%, #1a0044 50%, #4a004f 100%)',
          boxShadow: '0 0 35px 10px rgba(236,72,153,0.45), 0 0 70px 20px rgba(99,102,241,0.3)',
          color: '#ffffff',
        },
        tierLabel: 'チャンピオン',
        tierEmoji: '👑',
      };

    case 'diamond':
      return {
        tier,
        wrapperClassName: 'animate-float',
        wrapperStyle: {},
        cardClassName: 'animate-bg-flow',
        cardStyle: {
          background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #1e1b4b 100%)',
          boxShadow: '0 0 24px 6px rgba(168,85,247,0.5), 0 0 48px 12px rgba(6,182,212,0.3)',
          color: '#f3e8ff',
        },
        tierLabel: 'ダイヤモンド',
        tierEmoji: '💎',
      };

    case 'emerald':
      return {
        tier,
        wrapperClassName: 'animate-float',
        wrapperStyle: {},
        cardClassName: 'animate-bg-flow',
        cardStyle: {
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)',
          boxShadow: '0 0 20px 5px rgba(52,211,153,0.5), 0 0 40px 10px rgba(5,150,105,0.3)',
          color: '#d1fae5',
        },
        tierLabel: 'エメラルド',
        tierEmoji: '💚',
      };

    case 'platinum':
      return {
        tier,
        wrapperClassName: '',
        wrapperStyle: {},
        cardClassName: '',
        cardStyle: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          boxShadow: '0 0 12px 3px rgba(148,163,184,0.45), 0 0 24px 6px rgba(56,189,248,0.25)',
          color: '#ffffff',
        },
        tierLabel: 'プラチナ',
        tierEmoji: '🩵',
      };

    case 'gold':
      return {
        tier,
        wrapperClassName: '',
        wrapperStyle: {},
        cardClassName: '',
        cardStyle: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          boxShadow: '0 0 12px 4px rgba(251,191,36,0.5), 0 0 24px 6px rgba(217,119,6,0.25)',
          color: '#ffffff',
        },
        tierLabel: 'ゴールド',
        tierEmoji: '⭐',
      };

    case 'silver':
      return {
        tier,
        wrapperClassName: '',
        wrapperStyle: {},
        cardClassName: '',
        cardStyle: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          boxShadow: '0 0 8px 2px rgba(148,163,184,0.35)',
          color: '#ffffff',
        },
        tierLabel: 'シルバー',
        tierEmoji: '🔘',
      };

    case 'bronze':
      return {
        tier,
        wrapperClassName: '',
        wrapperStyle: {},
        cardClassName: '',
        cardStyle: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          boxShadow: '0 0 8px 2px rgba(180,83,9,0.35)',
          color: '#ffffff',
        },
        tierLabel: 'ブロンズ',
        tierEmoji: '🟫',
      };

    case 'copper':
    default:
      return {
        tier,
        wrapperClassName: '',
        wrapperStyle: {},
        cardClassName: '',
        cardStyle: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          boxShadow: '0 0 8px 2px rgba(239,68,68,0.25)',
          color: '#ffffff',
        },
        tierLabel: 'コッパー',
        tierEmoji: '🔴',
      };
  }
}

/** PlayerStats → CardDecoration の一発変換ヘルパー */
export function getPlayerCardDecoration(stats: PlayerStats): CardDecoration {
  const score = calcStrengthScore(stats);
  const tier = getStrengthTier(score);
  return getCardDecoration(tier);
}
