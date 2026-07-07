'use client';

import { PlayerStats } from '@/app/lib/types';

interface PlayerStatsCardProps {
  stats: PlayerStats;
}

// K/D値に応じた色を返す
const getKdColor = (kd: number): string => {
  if (kd >= 2.0) return 'text-purple-400';
  if (kd >= 1.5) return 'text-blue-400';
  if (kd >= 1.0) return 'text-green-400';
  if (kd >= 0.7) return 'text-yellow-400';
  return 'text-red-400';
};

// 勝率に応じた色を返す
const getWrColor = (wr: number): string => {
  if (wr >= 60) return 'text-purple-400';
  if (wr >= 55) return 'text-blue-400';
  if (wr >= 50) return 'text-green-400';
  if (wr >= 45) return 'text-yellow-400';
  return 'text-red-400';
};

export default function PlayerStatsCard({ stats }: PlayerStatsCardProps) {
  const { ubiId, username, currentSeason, lifetimeStats } = stats;
  const trackerUrl = `https://r6.tracker.network/r6siege/profile/ubi/${encodeURIComponent(ubiId)}/overview`;

  return (
    <div className="w-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg border border-slate-700 shadow-xl overflow-hidden hover:border-slate-500 hover:shadow-2xl transition-all duration-200 flex flex-col">
      {/* ヘッダー: プレイヤー名（アバター背景） */}
      <div
        className="relative px-3 py-2 border-b border-slate-700 overflow-hidden"
        style={
          stats.avatarUrl
            ? {
                backgroundImage: `linear-gradient(to right, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.55) 60%, rgba(15,23,42,0.2) 100%), url(${stats.avatarUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
              }
            : { background: 'linear-gradient(to right, #1e3a5f, #3b1f6b)' }
        }
      >
        <a
          href={trackerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1"
          title="tracker.gg で開く"
        >
          <h2 className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors drop-shadow" title={username}>
            {username}
          </h2>
          <svg className="w-3 h-3 text-slate-400 group-hover:text-blue-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <p className="text-xs text-slate-300 mt-0.5 drop-shadow">Lv.{lifetimeStats.level} · {lifetimeStats.timePlayed}</p>
      </div>

      {/* シーズンスタッツ */}
      <div className="px-3 py-2 flex-1">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">{currentSeason.title}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {/* 勝率 */}
          <div className="bg-slate-700/60 rounded p-1.5 text-center">
            <p className={`text-base font-bold leading-tight ${getWrColor(currentSeason.winRate)}`}>
              {currentSeason.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-none">Win%</p>
          </div>

          {/* K/D */}
          <div className="bg-slate-700/60 rounded p-1.5 text-center">
            <p className={`text-base font-bold leading-tight ${getKdColor(currentSeason.kd)}`}>
              {currentSeason.kd.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-none">K/D</p>
          </div>

          {/* マッチ数 */}
          <div className="bg-slate-700/60 rounded p-1.5 text-center">
            <p className="text-base font-bold text-yellow-400 leading-tight">
              {currentSeason.matches}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-none">Games</p>
          </div>
        </div>

        {/* 勝敗 */}
        {currentSeason.wins != null && currentSeason.losses != null && (
          <div className="mt-1.5 flex gap-1 text-xs">
            <span className="flex-1 bg-green-900/40 text-green-400 rounded text-center py-0.5 font-semibold">
              {currentSeason.wins}W
            </span>
            <span className="flex-1 bg-red-900/40 text-red-400 rounded text-center py-0.5 font-semibold">
              {currentSeason.losses}L
            </span>
          </div>
        )}
      </div>

      {/* フッター: lifetime マッチ数 */}
      <div className="px-3 py-1.5 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Total: {lifetimeStats.matches.toLocaleString()} games</span>
          <a
            href={trackerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            tracker.gg ↗
          </a>
        </div>
      </div>
    </div>
  );
}
