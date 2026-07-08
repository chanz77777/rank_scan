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
  const { ubiId, username, currentSeason, lifetimeStats, heroImageUrl, seasonPeaks } = stats;
  const trackerUrl = `https://r6.tracker.network/r6siege/profile/ubi/${encodeURIComponent(ubiId)}/overview`;

  const currentRankInfo = seasonPeaks[0]?.rank;
  const bestRankInfo = seasonPeaks[1]?.rank || seasonPeaks[0]?.rank;
  const bestSeasonName = seasonPeaks[1]?.season || seasonPeaks[0]?.season || '';

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden hover:border-slate-500 hover:shadow-blue-900/10 transition-all duration-300 flex flex-row h-48 text-white relative">
      {/* 左側: バナー画像 (証明写真風) */}
      <div className="w-1/3 relative flex-shrink-0 border-r border-slate-800/80 bg-slate-950 overflow-hidden group">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={username}
            className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-1">
            <span className="text-3xl">🎮</span>
            <span className="text-[10px] text-slate-500 font-mono">No Custom Banner</span>
          </div>
        )}
        
        {/* 現在のランクアイコンをバナー画像に重ねる（右下） */}
        {currentRankInfo?.imageUrl && (
          <div 
            className="absolute bottom-2 right-2 w-11 h-11 bg-slate-950/85 rounded-full border border-slate-700/60 flex items-center justify-center backdrop-blur-sm p-1 shadow-lg" 
            title={`Current Rank: ${currentRankInfo.rank}`}
          >
            <img src={currentRankInfo.imageUrl} alt={currentRankInfo.rank} className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* 右側: プレイヤー情報と戦績 */}
      <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
        {/* 上段: 名前と基本情報 */}
        <div>
          <a
            href={trackerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 w-fit"
            title="tracker.gg で開く"
          >
            <h2 className="text-sm font-extrabold tracking-wide truncate max-w-[120px] sm:max-w-[160px] group-hover:text-blue-300 transition-colors drop-shadow" title={username}>
              {username}
            </h2>
            <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <p className="text-[11px] text-slate-400 mt-0.5">Lv.{lifetimeStats.level} · {lifetimeStats.timePlayed}</p>
        </div>

        {/* 中段: 今シーズンの戦績 */}
        <div className="my-1.5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">{currentSeason.title}</span>
            {currentRankInfo && (
              <span className="text-[9px] text-slate-400 font-semibold truncate max-w-[100px]" title={currentRankInfo.rank}>
                {currentRankInfo.rank}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-800/50 border border-slate-700/30 rounded py-0.5 px-1">
              <p className={`text-xs font-bold leading-tight ${getWrColor(currentSeason.winRate)}`}>{currentSeason.winRate.toFixed(1)}%</p>
              <p className="text-[8px] text-slate-500 font-medium uppercase leading-none">Win%</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/30 rounded py-0.5 px-1">
              <p className={`text-xs font-bold leading-tight ${getKdColor(currentSeason.kd)}`}>{currentSeason.kd.toFixed(2)}</p>
              <p className="text-[8px] text-slate-500 font-medium uppercase leading-none">K/D</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/30 rounded py-0.5 px-1">
              <p className="text-xs font-bold text-yellow-500/90 leading-tight">{currentSeason.matches}</p>
              <p className="text-[8px] text-slate-500 font-medium uppercase leading-none">Games</p>
            </div>
          </div>
        </div>

        {/* 下段: SEASON PEAKS (BEST ランク) */}
        {bestRankInfo && (
          <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              {bestRankInfo.imageUrl && (
                <img src={bestRankInfo.imageUrl} alt="Best Rank" className="w-6.5 h-6.5 object-contain flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[8px] text-slate-500 font-bold uppercase leading-none">Best Peak</p>
                <p className="text-[10px] text-white font-bold mt-0.5 truncate leading-none" title={bestRankInfo.rank}>
                  {bestRankInfo.rank}
                </p>
              </div>
            </div>
            <span className="text-[8px] text-slate-500 font-mono italic flex-shrink-0" title={`Peak Season: ${bestSeasonName}`}>
              {bestSeasonName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
