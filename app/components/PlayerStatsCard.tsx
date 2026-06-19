'use client';

import { PlayerStats } from '@/app/lib/types';

interface PlayerStatsCardProps {
  stats: PlayerStats;
}

// ランクの色を定義（ゲーム風なカラースキーム）
const getRankColor = (rank: string): string => {
  switch (rank.toUpperCase()) {
    case 'COPPER':
      return '#B87333';
    case 'BRONZE':
      return '#CD7F32';
    case 'SILVER':
      return '#C0C0C0';
    case 'GOLD':
      return '#FFD700';
    case 'PLATINUM':
      return '#E5E4E2';
    case 'DIAMOND':
      return '#B9F3FF';
    default:
      return '#888888';
  }
};

// ランクの背景色を定義（濃い版）
const getRankBgColor = (rank: string): string => {
  switch (rank.toUpperCase()) {
    case 'COPPER':
      return 'bg-amber-900';
    case 'BRONZE':
      return 'bg-yellow-800';
    case 'SILVER':
      return 'bg-gray-400';
    case 'GOLD':
      return 'bg-yellow-400';
    case 'PLATINUM':
      return 'bg-slate-200';
    case 'DIAMOND':
      return 'bg-cyan-300';
    default:
      return 'bg-gray-600';
  }
};

export default function PlayerStatsCard({ stats }: PlayerStatsCardProps) {
  const { username, currentSeason, lifetimeStats, seasonPeaks } = stats;
  const currentPeak = seasonPeaks[0];

  return (
    <div className="w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg border border-slate-700 shadow-2xl overflow-hidden hover:shadow-3xl transition-shadow duration-300">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 px-6 py-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white drop-shadow-lg">{username}</h2>
        <p className="text-sm text-slate-300 mt-1">R6 Siege Pro Stats</p>
      </div>

      {/* メインコンテンツ */}
      <div className="p-6 space-y-6">
        {/* 現シーズン戦績 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">
              {currentSeason.title}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* 勝率 */}
            <div className="bg-slate-700 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {currentSeason.winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-1 uppercase">Win Rate</p>
            </div>

            {/* K/D比 */}
            <div className="bg-slate-700 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-cyan-400">
                {currentSeason.kd.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-1 uppercase">K/D Ratio</p>
            </div>

            {/* マッチ数 */}
            <div className="bg-slate-700 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {currentSeason.matches}
              </p>
              <p className="text-xs text-slate-400 mt-1 uppercase">Matches</p>
            </div>
          </div>
        </div>

        {/* 生涯戦績 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">
              Lifetime Overall
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* レベル */}
            <div className="bg-slate-700 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {lifetimeStats.level}
              </p>
              <p className="text-xs text-slate-400 mt-1 uppercase">Level</p>
            </div>

            {/* 総マッチ数 */}
            <div className="bg-slate-700 rounded-md p-3 text-center">
              <p className="text-xl font-bold text-blue-400">
                {lifetimeStats.matches.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1 uppercase">Matches</p>
            </div>

            {/* プレイ時間 */}
            <div className="bg-slate-700 rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-orange-400">
                {lifetimeStats.timePlayed}
              </p>
              <p className="text-xs text-slate-400 mt-1 uppercase">Played</p>
            </div>
          </div>
        </div>

        {/* ランクピーク */}
        {currentPeak && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">
                Season Peak ({currentPeak.season})
              </h3>
            </div>

            <div
              className={`${getRankBgColor(
                currentPeak.rank.rank
              )} rounded-md p-4 flex items-center justify-between`}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 uppercase">
                  {currentPeak.rank.rank}
                </p>
                <p className="text-xs text-slate-700 mt-1">Rank Achieved</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">
                  {currentPeak.rank.mmr}
                </p>
                <p className="text-xs text-slate-700 mt-1">MMR</p>
              </div>
            </div>

            {/* 過去のシーズンピーク */}
            {seasonPeaks.length > 1 && (
              <div className="text-xs text-slate-400 space-y-1">
                {seasonPeaks.slice(1, 3).map((peak) => (
                  <div key={peak.season} className="flex justify-between">
                    <span>{peak.season}:</span>
                    <span className="text-slate-300">
                      {peak.rank.rank} ({peak.rank.mmr} MMR)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="bg-slate-900 px-6 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">
          Last Updated: {new Date().toLocaleDateString('ja-JP')}
        </p>
      </div>
    </div>
  );
}
