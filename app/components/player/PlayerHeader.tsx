'use client';

import React from 'react';
import { textStrokeWhiteStyle } from './StatRow';
import type { Platform } from '@/app/components/PlatformToggle';
import type { RankInfo, LifetimeStats } from '@/app/lib/types';

interface PlayerHeaderProps {
  ubiId: string;
  username: string;
  platform: Platform;
  avatarUrl?: string;
  lifetimeStats: LifetimeStats;
  score: number;
  tierLabel: string;
  currentRankInfo?: RankInfo;
}

export default function PlayerHeader({
  ubiId,
  username,
  platform,
  avatarUrl,
  lifetimeStats,
  score,
  tierLabel,
  currentRankInfo,
}: PlayerHeaderProps) {
  const trackerUrl = `https://r6.tracker.network/r6siege/profile/${platform}/${encodeURIComponent(ubiId)}/overview`;

  return (
    <div className="flex items-start justify-between gap-1">
      {/* 左: アバター + 名前・Lv情報 */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="w-9 h-9 rounded-full object-cover border border-slate-600/80 shadow-md"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-0.5 border border-slate-700">
              <span className="text-sm">🎮</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <a
            href={trackerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link flex items-center gap-1 w-fit"
            title="tracker.gg で開く"
          >
            <h2
              className="font-extrabold tracking-wide truncate max-w-[90px] group-hover/link:opacity-80 transition-all drop-shadow text-[13px]"
              style={textStrokeWhiteStyle}
              title={username}
            >
              {username}
            </h2>
            <svg
              className="w-2.5 h-2.5 opacity-80 group-hover/link:opacity-100 flex-shrink-0 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ stroke: '#ffffff' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <p className="text-[9px] font-bold leading-tight mt-0" style={textStrokeWhiteStyle}>
            Lv.{lifetimeStats.level} · {lifetimeStats.timePlayed}
          </p>
          <p
            className="text-[9px] font-bold leading-tight mt-0"
            style={textStrokeWhiteStyle}
            title={`強さスコア: ${score} (${tierLabel})`}
          >
            {score} pt
          </p>
        </div>
      </div>

      {/* 右: 現在ランクアイコン */}
      <div className="flex-shrink-0" title={tierLabel}>
        {currentRankInfo?.imageUrl && (
          <div
            className="w-10 h-10 bg-slate-950/90 rounded-full border border-slate-700/80 flex items-center justify-center backdrop-blur-sm p-0.5 shadow-lg"
            title={`Current Rank: ${currentRankInfo.rank}`}
          >
            <img src={currentRankInfo.imageUrl} alt={currentRankInfo.rank} className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}
