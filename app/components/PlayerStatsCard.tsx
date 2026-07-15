'use client';

import { PlayerStats } from '@/app/lib/types';
import {
  calcStrengthScore,
  getStrengthTier,
  getCardDecoration,
  type StrengthTier,
} from '@/app/lib/playerStrength';

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

/** ティアバッジの背景色クラス（ティア別） */
const TIER_BADGE_STYLE: Record<StrengthTier, string> = {
  champion: 'bg-gradient-to-r from-pink-600 via-yellow-400 to-cyan-400 text-black font-extrabold shadow-lg shadow-yellow-400/40',
  diamond:  'bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold shadow-md shadow-violet-500/30',
  emerald:  'bg-gradient-to-r from-emerald-600 to-teal-400 text-white font-bold shadow-md shadow-emerald-500/30',
  platinum: 'bg-gradient-to-r from-slate-500 to-sky-400 text-white font-bold shadow-md shadow-sky-400/20',
  gold:     'bg-gradient-to-r from-amber-600 to-yellow-400 text-black font-bold shadow-md shadow-yellow-400/20',
  silver:   'bg-gradient-to-r from-slate-500 to-slate-300 text-black font-semibold',
  bronze:   'bg-gradient-to-r from-amber-900 to-amber-600 text-white font-semibold',
  copper:   'bg-gradient-to-r from-red-900 to-red-700 text-white font-semibold',
};

export default function PlayerStatsCard({ stats }: PlayerStatsCardProps) {
  const { ubiId, username, currentSeason, lifetimeStats, heroImageUrl, seasonPeaks, currentRank } = stats;
  const trackerUrl = `https://r6.tracker.network/r6siege/profile/ubi/${encodeURIComponent(ubiId)}/overview`;

  // 現在ランク: 明示フィールド → seasonPeaksの最初のエントリ の順にフォールバック
  const currentRankInfo = currentRank ?? seasonPeaks[0]?.rank;

  // ベストピーク: 全 seasonPeaks の中で最高 MMR を持つもの
  const bestPeak = seasonPeaks.reduce<typeof seasonPeaks[number] | undefined>((best, p) => {
    if (!best || p.rank.mmr > best.rank.mmr) return p;
    return best;
  }, undefined);

  // 強さスコア・ティア・装飾を算出
  const score = calcStrengthScore(stats);
  const tier = getStrengthTier(score);
  const deco = getCardDecoration(tier);

  const isChampion = tier === 'champion';

  return (
    // ────────────────────────────────────────────────────────────────────────
    // 外側ラッパー: ティア別グラデーションボーダーを担う
    // copper は特殊（border クラス直指定のため padding 不要）
    // ────────────────────────────────────────────────────────────────────────
    <div
      className={deco.wrapperClassName}
      style={deco.wrapperStyle}
    >
      {/* カード本体 */}
      <div
        className={[
          'w-full',
          // 背景は cardStyle.background のインラインスタイルで制御（ティア別グラデーション）
          // fallback: 背景未指定のティアはダークスレートに見える
          'rounded-[9px]',   // ラッパーの rounded-xl(12px) より 3px 小さく（最大パディング分）
          'shadow-2xl overflow-hidden',
          'flex flex-row h-48 text-white relative',
          'transition-transform duration-200 hover:scale-[1.015]',
          deco.cardClassName,
        ].join(' ')}
        style={{
          // ティア指定がない場合のフォールバック背景
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          // cardStyle を後から上書き（ティア別の色・shadow を優先）
          ...deco.cardStyle,
        }}
      >
        {/* ────────────────────────────────────────────────────────────────
            左側: バナー画像 (証明写真風)
            ──────────────────────────────────────────────────────────────── */}
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

          {/* ────────────────────────────────────────────────────────────────
              チャンピオン専用: 虹色の輝き内側オーバーレイ
              ──────────────────────────────────────────────────────────────── */}
          {isChampion && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,0,68,0.08), rgba(255,119,0,0.06), rgba(0,229,118,0.06), rgba(41,121,255,0.08))',
              }}
            />
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────
            右側: プレイヤー情報と戦績
            ──────────────────────────────────────────────────────────────── */}
        <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
          {/* 上段: 名前・基本情報・ティアバッジ */}
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <a
                href={trackerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 w-fit"
                title="tracker.gg で開く"
              >
                <h2
                  className="text-sm font-extrabold tracking-wide truncate max-w-[110px] sm:max-w-[140px] group-hover:text-blue-300 transition-colors drop-shadow"
                  title={username}
                >
                  {username}
                </h2>
                <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p className="text-[11px] text-slate-400 mt-0.5">Lv.{lifetimeStats.level} · {lifetimeStats.timePlayed}</p>
            </div>

            {/* ティアバッジ（右上） */}
            <div
              className={[
                'flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] leading-none',
                TIER_BADGE_STYLE[tier],
              ].join(' ')}
              title={`強さスコア: ${score}`}
            >
              <span>{deco.tierEmoji}</span>
              <span className="hidden sm:inline">{deco.tierLabel}</span>
            </div>
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

          {/* 下段: BEST PEAK ランク */}
          {bestPeak && (
            <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                {bestPeak.rank.imageUrl && (
                  <img src={bestPeak.rank.imageUrl} alt="Best Rank" className="w-6.5 h-6.5 object-contain flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[8px] text-slate-500 font-bold uppercase leading-none">Best Peak</p>
                  <p className="text-[10px] text-white font-bold mt-0.5 truncate leading-none" title={bestPeak.rank.rank}>
                    {bestPeak.rank.rank}
                  </p>
                </div>
              </div>
              {/* 同率ベストが複数ある場合は件数を表示 */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="text-[8px] text-slate-500 font-mono italic" title={`Peak Season: ${bestPeak.season}`}>
                  {bestPeak.season}
                </span>
                {seasonPeaks.length > 1 && (
                  <span className="text-[7px] text-slate-600 font-mono">
                    +{seasonPeaks.length - 1} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
