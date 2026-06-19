import { PlayerStats } from './types';

// ランク一覧
const RANKS = ['COPPER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

/**
 * プレイヤー情報をモックデータとして生成（動的生成）
 * 実際の本番環境APIの代わりに、入力された任意のプレイヤー名に対して
 * ハッシュベースで一意かつリアルな戦績を自動生成して返します。
 * これにより、どのプレイヤー名を検索・抽出してもモックカードが表示されます。
 */
export async function getPlayerStats(ubiId: string): Promise<PlayerStats | null> {
  if (!ubiId || ubiId.trim() === '') {
    return null;
  }

  // プレイヤー名文字列からハッシュ値を計算（毎回同じ名前に対して同じスタッツを返すため）
  let hash = 0;
  for (let i = 0; i < ubiId.length; i++) {
    hash = ubiId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);

  // リアルなスタッツを決定論的に生成
  const level = 50 + (absHash % 350); // レベル 50 〜 400
  const matches = 100 + (absHash % 3000); // 生涯マッチ数 100 〜 3100
  const timePlayed = `${Math.floor(matches * 0.2 + (absHash % 100))}h`;
  
  const winRate = parseFloat((45 + (absHash % 30) + (absHash % 10) / 10).toFixed(1)); // 勝率 45% 〜 76%
  const kd = parseFloat((0.7 + (absHash % 130) / 100).toFixed(2)); // K/D 0.7 〜 2.0
  
  const currentSeasonMatches = 15 + (absHash % 150); // 今シーズンのマッチ数
  const wins = Math.floor(currentSeasonMatches * (winRate / 100));
  const losses = currentSeasonMatches - wins;

  const rankIndex = absHash % RANKS.length;
  const rank = RANKS[rankIndex];
  
  // ランクに応じたMMRを適当にマッピング
  const baseMmr = [1200, 1800, 2400, 3000, 3600, 4200];
  const mmr = baseMmr[rankIndex] + (absHash % 500);

  return {
    ubiId,
    username: ubiId,
    currentSeason: {
      title: 'Y11S2 Overview',
      winRate,
      kd,
      matches: currentSeasonMatches,
      wins,
      losses
    },
    lifetimeStats: {
      level,
      matches,
      timePlayed
    },
    seasonPeaks: [
      {
        season: 'Y11S2',
        rank: {
          rank,
          mmr
        }
      }
    ]
  };
}
