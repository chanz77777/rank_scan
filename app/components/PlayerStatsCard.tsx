'use client';

import { useRef, MouseEvent } from 'react';
import { PlayerStats } from '@/app/lib/types';
import {
  calcStrengthScore,
  getStrengthTier,
  getCardDecoration,
} from '@/app/lib/playerStrength';
import type { Platform } from '@/app/components/PlatformToggle';
import StatRow, {
  textStrokeWhiteStyle,
  getKdColorStyle,
  getKdIcon,
  getWrColorStyle,
  getWrIcon,
  getGamesColorStyle,
  getGamesIcon,
} from '@/app/components/player/StatRow';
import PlayerHeader from '@/app/components/player/PlayerHeader';
import SeasonPeakBadge from '@/app/components/player/SeasonPeakBadge';

interface PlayerStatsCardProps {
  stats: PlayerStats;
  platform?: Platform;
  hero?: boolean;
  isEnemy?: boolean;
}

export default function PlayerStatsCard({ stats, platform = 'ubi', hero = false, isEnemy = false }: PlayerStatsCardProps) {
  const { ubiId, username, currentSeason, lifetimeStats, heroImageUrl, seasonPeaks, currentRank, avatarUrl, allSeasonRanks } = stats;

  const currentRankInfo = currentRank ?? allSeasonRanks[0]?.rank;

  const rankScore = (rankName: string): number => {
    const upper = (rankName ?? '').toUpperCase().trim();
    let base = 0;
    if (upper.startsWith('CHAMPION')) base = 80;
    else if (upper.startsWith('DIAMOND')) base = 60;
    else if (upper.startsWith('EMERALD')) base = 50;
    else if (upper.startsWith('PLATINUM')) base = 40;
    else if (upper.startsWith('GOLD')) base = 30;
    else if (upper.startsWith('SILVER')) base = 15;
    else if (upper.startsWith('BRONZE')) base = 5;
    else if (upper.startsWith('COPPER')) base = 2;
    const m = upper.match(/(\d)$/);
    const sub = m ? (parseInt(m[1], 10) === 1 ? 4 : parseInt(m[1], 10) === 2 ? 2 : 0) : 2;
    return base + sub;
  };

  const bestPeak = seasonPeaks.reduce<typeof seasonPeaks[number] | undefined>((best, p) => {
    if (!best) return p;
    const bScore = rankScore(best.rank.rank);
    const pScore = rankScore(p.rank.rank);
    if (pScore > bScore) return p;
    if (pScore === bScore && p.rank.mmr > best.rank.mmr) return p;
    return best;
  }, undefined);

  const score = calcStrengthScore(stats);
  const tier = getStrengthTier(score);
  const deco = getCardDecoration(tier, isEnemy);


  const cardRef = useRef<HTMLDivElement>(null);
  const isHoloCard = tier === 'diamond' || tier === 'champion';

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isHoloCard || !cardRef.current) return;

    const bounds = cardRef.current.getBoundingClientRect();
    const pointerX = e.clientX - bounds.x;
    const pointerY = e.clientY - bounds.y;

    const ratioX = pointerX / bounds.width;
    const ratioY = pointerY / bounds.height;

    const rX = (ratioX - 0.5) * -30;
    const rY = (ratioY - 0.5) * 50;
    const mX = ratioX * 100;
    const mY = ratioY * 100;

    const holoX = 50 + (ratioX - 0.5) * 28;
    const holoY = 50 + (ratioY - 0.5) * 28;
    const holoHyp = Math.sqrt(Math.pow(ratioX - 0.5, 2) + Math.pow(ratioY - 0.5, 2)) * (10 / 7);
    const hyp = Math.sqrt(Math.pow(ratioX - 0.5, 2) + Math.pow(ratioY - 0.5, 2)) * 2;

    cardRef.current.style.setProperty('--ratiox', ratioX.toString());
    cardRef.current.style.setProperty('--ratioy', ratioY.toString());
    cardRef.current.style.setProperty('--rx', `${rX}deg`);
    cardRef.current.style.setProperty('--ry', `${rY}deg`);
    cardRef.current.style.setProperty('--mx', `${mX}%`);
    cardRef.current.style.setProperty('--my', `${mY}%`);
    cardRef.current.style.setProperty('--posx', `${mX}%`);
    cardRef.current.style.setProperty('--posy', `${mY}%`);
    cardRef.current.style.setProperty('--hyp', hyp.toString());
    cardRef.current.style.setProperty('--holo-pos', `${holoX}% ${holoY}%`);
    cardRef.current.style.setProperty('--holo-x', `${holoX}%`);
    cardRef.current.style.setProperty('--holo-y', `${holoY}%`);
    cardRef.current.style.setProperty('--holo-hyp', holoHyp.toString());
  };

  const handleMouseLeave = () => {
    if (!isHoloCard || !cardRef.current) return;

    cardRef.current.style.setProperty('--rx', '0deg');
    cardRef.current.style.setProperty('--ry', '0deg');
    cardRef.current.style.setProperty('--mx', '50%');
    cardRef.current.style.setProperty('--my', '50%');
    cardRef.current.style.setProperty('--posx', '50%');
    cardRef.current.style.setProperty('--posy', '50%');
    cardRef.current.style.setProperty('--hyp', '0.6');
    cardRef.current.style.setProperty('--holo-pos', '50% 50%');
    cardRef.current.style.setProperty('--holo-x', '50%');
    cardRef.current.style.setProperty('--holo-y', '50%');
    cardRef.current.style.setProperty('--holo-hyp', '0.6');
  };

  const isFallback = currentSeason.isFallback;
  const gamesCount = lifetimeStats.matches;

  const wrIcon = isFallback ? '☠️' : getWrIcon(currentSeason.winRate);
  const kdIcon = isFallback ? '☠️' : getKdIcon(currentSeason.kd);
  const gamesIcon = getGamesIcon(gamesCount);

  const wrStyle = isFallback ? textStrokeWhiteStyle : getWrColorStyle(currentSeason.winRate);
  const kdStyle = isFallback ? textStrokeWhiteStyle : getKdColorStyle(currentSeason.kd);
  const gamesStyle = getGamesColorStyle(gamesCount);

  const gamesValue = !isFallback && currentSeason.matches > 0 ? (
    <span>
      {gamesCount}
      <span className="text-[12px] font-bold opacity-90 ml-0.5">
        ({currentSeason.matches})
      </span>
    </span>
  ) : (
    String(gamesCount)
  );

  return (
    <div
      className={`${deco.wrapperClassName} group w-full ${hero ? 'h-full flex flex-col justify-stretch' : ''} rounded-[9px] overflow-hidden`}
      style={{ ...deco.wrapperStyle, perspective: isHoloCard ? '600px' : 'none' }}
    >
      <div
        ref={cardRef}
        className={[
          'w-full',
          'rounded-[9px] border border-slate-700/60',
          'shadow-2xl overflow-hidden',
          hero
            ? 'card-hero-body flex flex-col relative h-full justify-between'
            : 'flex flex-col aspect-[63/88] relative w-full max-w-[420px] mx-auto',
          tier === 'champion'
            ? 'card-3d-champion'
            : tier === 'diamond'
              ? 'card-3d-diamond'
              : 'transition-transform duration-200 hover:scale-[1.015]',
          deco.cardClassName,
        ].join(' ')}
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          ...deco.cardStyle,
          '--rx': '0deg',
          '--ry': '0deg',
          '--mx': '50%',
          '--my': '50%',
          '--posx': '50%',
          '--posy': '50%',
        } as any}
      >
        {/* 背景画像 */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt={username}
              className="w-full h-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-1">
              <span className="text-2xl">🎮</span>
              <span className="text-[9px] text-slate-500 font-mono">No Banner</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/30 to-slate-950/70" />
        </div>

        {/* 3D/ホログラムエフェクト */}
        {isHoloCard && (
          <>
            <div className={`absolute inset-0 z-[1] pointer-events-none rounded-[9px] ${tier === 'diamond' ? 'card-hologram-diamond' : 'card-hologram'}`} />
            <div className={`absolute inset-0 z-[2] pointer-events-none rounded-[9px] ${tier === 'diamond' ? 'card-highlight-diamond' : 'card-highlight'}`} />
          </>
        )}

        {/* コンテンツ */}
        <div className="flex-1 p-2 flex flex-col overflow-hidden relative z-10 select-none">
          {/* 上段: ヘッダー */}
          <PlayerHeader
            ubiId={ubiId}
            username={username}
            platform={platform}
            avatarUrl={avatarUrl}
            lifetimeStats={lifetimeStats}
            score={score}
            tierLabel={deco.tierLabel}
            currentRankInfo={currentRankInfo}
          />

          {/* シーズンタイトル + 現在ランク名 */}
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[8px] font-bold tracking-wider uppercase" style={textStrokeWhiteStyle}>
              {currentSeason.title}
            </span>
            {currentRankInfo && (
              <span className="text-[8px] font-extrabold truncate max-w-[80px]" title={currentRankInfo.rank} style={textStrokeWhiteStyle}>
                {currentRankInfo.rank}
              </span>
            )}
          </div>

          <div className="flex-1" />

          {/* 中段: ステータス */}
          <div className="flex flex-col gap-1.5">
            <StatRow icon={wrIcon} label="WIN" value={`${currentSeason.winRate.toFixed(1)}%`} valueStyle={wrStyle} />
            <StatRow icon={kdIcon} label="K/D" value={currentSeason.kd.toFixed(2)} valueStyle={kdStyle} />
            <StatRow icon={gamesIcon} label="GAMES" value={gamesValue} valueStyle={gamesStyle} />
          </div>

          {/* 下段: ピークランク */}
          <SeasonPeakBadge bestPeak={bestPeak} allSeasonRanks={allSeasonRanks} />
        </div>
      </div>
    </div>
  );
}