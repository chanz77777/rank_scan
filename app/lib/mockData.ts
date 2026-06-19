import { PlayerStats } from './types';

/**
 * モックデータ
 * 本番環境では R6 Tracker API から取得したデータに置き換えます
 */

export const mockPlayerData: PlayerStats[] = [
  {
    ubiId: 'TokyoDisneyland',
    username: 'TokyoDisneyland',
    currentSeason: {
      title: 'Y11S2 Overview',
      winRate: 65.5,
      kd: 1.48,
      matches: 142,
      wins: 93,
      losses: 49,
    },
    lifetimeStats: {
      level: 383,
      matches: 2710,
      timePlayed: '575h',
    },
    seasonPeaks: [
      {
        season: 'Y11S2',
        rank: {
          rank: 'PLATINUM',
          mmr: 4250,
        },
      },
      {
        season: 'Y11S1',
        rank: {
          rank: 'GOLD',
          mmr: 3890,
        },
      },
    ],
  },
  {
    ubiId: 'SamplePlayer2',
    username: 'SamplePlayer2',
    currentSeason: {
      title: 'Y11S2 Overview',
      winRate: 58.3,
      kd: 1.12,
      matches: 95,
      wins: 55,
      losses: 40,
    },
    lifetimeStats: {
      level: 245,
      matches: 1850,
      timePlayed: '412h',
    },
    seasonPeaks: [
      {
        season: 'Y11S2',
        rank: {
          rank: 'GOLD',
          mmr: 3650,
        },
      },
      {
        season: 'Y11S1',
        rank: {
          rank: 'SILVER',
          mmr: 3200,
        },
      },
    ],
  },
  {
    ubiId: 'SamplePlayer3',
    username: 'SamplePlayer3',
    currentSeason: {
      title: 'Y11S2 Overview',
      winRate: 71.2,
      kd: 1.85,
      matches: 178,
      wins: 126,
      losses: 52,
    },
    lifetimeStats: {
      level: 512,
      matches: 3420,
      timePlayed: '823h',
    },
    seasonPeaks: [
      {
        season: 'Y11S2',
        rank: {
          rank: 'DIAMOND',
          mmr: 5120,
        },
      },
      {
        season: 'Y11S1',
        rank: {
          rank: 'PLATINUM',
          mmr: 4890,
        },
      },
    ],
  },
];

/**
 * UBI IDからモックデータを取得する関数
 * 本番環境では R6 Tracker API を呼び出します
 */
export async function getPlayerStats(ubiId: string): Promise<PlayerStats | null> {
  // 実装例：
  // return await fetch(`/api/tracker?ubiId=${ubiId}`).then(r => r.json());
  
  const player = mockPlayerData.find(
    (p) => p.ubiId.toLowerCase() === ubiId.toLowerCase()
  );
  return player || null;
}
