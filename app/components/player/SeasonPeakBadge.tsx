'use client';

import React from 'react';
import { textStrokeWhiteStyle } from './StatRow';
import type { SeasonPeak } from '@/app/lib/types';

interface SeasonPeakBadgeProps {
  bestPeak?: SeasonPeak;
  allSeasonRanks: SeasonPeak[];
}

export default function SeasonPeakBadge({ bestPeak, allSeasonRanks }: SeasonPeakBadgeProps) {
  if (!bestPeak) return null;

  return (
    <div className="border-t border-slate-700/60 pt-1">
      <div className="flex items-center gap-1">
        {/* 左: BEST ラベル + ランクアイコン + ランク名 */}
        <span
          className="text-[7px] font-bold uppercase tracking-wider flex-shrink-0"
          style={textStrokeWhiteStyle}
        >
          BEST
        </span>
        {bestPeak.rank.imageUrl && (
          <img
            src={bestPeak.rank.imageUrl}
            alt={bestPeak.rank.rank}
            className="w-6 h-6 object-contain flex-shrink-0"
            title={bestPeak.rank.rank}
          />
        )}
        <span
          className="text-[9px] font-extrabold truncate leading-none flex-shrink min-w-0"
          title={bestPeak.rank.rank}
          style={textStrokeWhiteStyle}
        >
          {bestPeak.rank.rank}
        </span>

        {/* スペーサー */}
        <div className="flex-1" />

        {/* 右: ALL ラベル + 全シーズンのアイコン横並び */}
        {allSeasonRanks.length > 1 ? (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <span
              className="text-[7px] font-bold uppercase tracking-wider"
              style={textStrokeWhiteStyle}
            >
              ALL
            </span>
            {allSeasonRanks.map((peak) => (
              <div
                key={peak.season}
                className="relative group/rank flex-shrink-0"
                title={`${peak.rank.rank} (${peak.season})`}
              >
                {peak.rank.imageUrl ? (
                  <img
                    src={peak.rank.imageUrl}
                    alt={peak.rank.rank}
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-700/60 flex items-center justify-center">
                    <span className="text-[8px] text-slate-300 font-bold leading-none">
                      {peak.rank.rank.slice(0, 1)}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 px-1 py-0.5 bg-slate-900/95 border border-slate-600/60 rounded text-[7px] text-white font-mono whitespace-nowrap opacity-0 group-hover/rank:opacity-100 transition-opacity pointer-events-none z-50">
                  {peak.season}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span
            className="text-[9px] font-mono italic font-bold flex-shrink-0"
            title={`Peak Season: ${bestPeak.season}`}
            style={textStrokeWhiteStyle}
          >
            {bestPeak.season}
          </span>
        )}
      </div>
    </div>
  );
}
