'use client';

import { useRef, MouseEvent } from 'react'; // 💡 useRef と MouseEvent をインポート
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

// ────────────────────────────────────────────────────────────────────────
// 白縁取り（細め）を施すための CSS テキストシャドウスタイル
// ────────────────────────────────────────────────────────────────────────
const textStrokeWhiteStyle = {
  color: '#0f172a', // 文字色を黒（濃いネイビー）に設定
  textShadow: `
    -1px -1px 0 #ffffff,  
     1px -1px 0 #ffffff,
    -1px  1px 0 #ffffff,
     1px  1px 0 #ffffff
  `,
};

// K/D値に応じた色を返す（白の細い縁取りを維持したまま、中身に各色を適用）
const getKdColorStyle = (kd: number) => {
  let color = '#f87171'; // red-400
  if (kd >= 2.0) color = '#c084fc'; // purple-400
  else if (kd >= 1.5) color = '#60a5fa'; // blue-400
  else if (kd >= 1.0) color = '#4ade80'; // green-400
  else if (kd >= 0.7) color = '#facc15'; // yellow-400

  return {
    color: color,
    textShadow: '-1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff',
  };
};

// 勝率に応じた色を返す（白の細い縁取りを維持したまま、中身に各色を適用）
const getWrColorStyle = (wr: number) => {
  let color = '#f87171'; // red-400
  if (wr >= 60) color = '#c084fc'; // purple-400
  else if (wr >= 55) color = '#60a5fa'; // blue-400
  else if (wr >= 50) color = '#4ade80'; // green-400
  else if (wr >= 45) color = '#facc15'; // yellow-400

  return {
    color: color,
    textShadow: '-1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff',
  };
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

  // 💡 3D傾き効果・ホログラム計算用の参照
  const cardRef = useRef<HTMLDivElement>(null);

  // 💡 ダイヤモンドとチャンピオンをエフェクト対象とする判定条件
  const isHoloCard = tier === 'diamond' || tier === 'champion';

  // 💡 マウス移動時の座標計算ハンドラ
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isHoloCard || !cardRef.current) return;

    const bounds = cardRef.current.getBoundingClientRect();
    const pointerX = e.clientX - bounds.x;
    const pointerY = e.clientY - bounds.y;

    const ratioX = pointerX / bounds.width;
    const ratioY = pointerY / bounds.height;

    // 1. オリジナル通りの3D傾き角の算出
    const rX = (ratioX - 0.5) * -30;
    const rY = (ratioY - 0.5) * 50;

    // 2. 光の中心点座標（mx, my）
    const mX = ratioX * 100;
    const mY = ratioY * 100;

    // ==========================================
    // 🌟 変更点①：CodePenに合わせた計算式の追加
    // ==========================================
    // ダイヤモンド専用：CodePen準拠のパララックス位置計算
    const holoX = 50 + (ratioX - 0.5) * 28;
    const holoY = 50 + (ratioY - 0.5) * 28;
    // ダイヤモンド専用：CodePen準拠の明るさ(hyp)計算（* 10 / 7 を使用）
    const holoHyp = Math.sqrt(Math.pow(ratioX - 0.5, 2) + Math.pow(ratioY - 0.5, 2)) * (10 / 7);

    // チャンピオン用：従来の対角距離計算
    const hyp = Math.sqrt(Math.pow(ratioX - 0.5, 2) + Math.pow(ratioY - 0.5, 2)) * 2;

    // 共通のCSS変数セット
    cardRef.current.style.setProperty('--ratiox', ratioX.toString());
    cardRef.current.style.setProperty('--ratioy', ratioY.toString());
    cardRef.current.style.setProperty('--rx', `${rX}deg`);
    cardRef.current.style.setProperty('--ry', `${rY}deg`);
    cardRef.current.style.setProperty('--mx', `${mX}%`);
    cardRef.current.style.setProperty('--my', `${mY}%`);

    // チャンピオン用CSS変数
    cardRef.current.style.setProperty('--posx', `${mX}%`);
    cardRef.current.style.setProperty('--posy', `${mY}%`);
    cardRef.current.style.setProperty('--hyp', hyp.toString());

    // 🌟 ダイヤモンド用CSS変数（CodePenの変数を名前を変えて注入）
    cardRef.current.style.setProperty('--holo-pos', `${holoX}% ${holoY}%`);
    cardRef.current.style.setProperty('--holo-x', `${holoX}%`);
    cardRef.current.style.setProperty('--holo-y', `${holoY}%`);
    cardRef.current.style.setProperty('--holo-hyp', holoHyp.toString());
  };

  // 💡 マウスが離れたとき：デフォルトの美しい輝き位置・明るさに強制固定する
  const handleMouseLeave = () => {
    if (!isHoloCard || !cardRef.current) return;

    // 3Dの傾きはまっさらに戻す
    cardRef.current.style.setProperty('--rx', '0deg');
    cardRef.current.style.setProperty('--ry', '0deg');

    // 非ホバー時でもキラキラの計算式が潰れないよう、デフォルト値を直接流し込む
    cardRef.current.style.setProperty('--mx', '50%');
    cardRef.current.style.setProperty('--my', '50%');
    cardRef.current.style.setProperty('--posx', '50%');
    cardRef.current.style.setProperty('--posy', '50%');

    // 明るさの係数（hyp）を、一番輝きが綺麗に映える「0.6」に強制固定
    cardRef.current.style.setProperty('--hyp', '0.6');
  };

  return (
    // ────────────────────────────────────────────────────────────────────────
    // 外側ラッパー: ティア別グラデーションボーダーを担う
    // 💡 ホロ対象カードに perspective (奥行き) を仕込み、傾きアニメーション用のハンドラを追加
    // ────────────────────────────────────────────────────────────────────────
    <div
      className={`${deco.wrapperClassName} group`}
      style={{
        ...deco.wrapperStyle,
        perspective: isHoloCard ? '600px' : 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* カード本体 */}
      <div
        ref={cardRef} // 💡 3D制御・CSS変数適用のための参照バインド
        className={[
          'w-full',
          'rounded-[9px] border border-slate-700/60',
          'shadow-2xl overflow-hidden',
          'flex flex-col aspect-[63/88] relative max-w-[350px] mx-auto',
          // 💡 ティアに応じた専用のクラスを付与し、それ以外は標準のホバースケールを適用
          tier === 'champion'
            ? 'card-3d-champion'
            : tier === 'diamond'
              ? 'card-3d-diamond' // ※もしCSS側で呼ぶ名前が別なら適宜差し替えてください
              : 'transition-transform duration-200 hover:scale-[1.015]',
          deco.cardClassName,
        ].join(' ')}
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          ...deco.cardStyle,
          // 初期値のCSS変数をセットしておく
          '--rx': '0deg',
          '--ry': '0deg',
          '--mx': '50%',
          '--my': '50%',
          '--posx': '50%',
          '--posy': '50%',
        } as any}
      >
        {/* ────────────────────────────────────────────────────────────────
            背景画像（z-index 0 で常時表示）
            ──────────────────────────────────────────────────────────────── */}
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
          {/* 常に画像を視認しつつ、文字との境界を作るオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/30 to-slate-950/70" />
        </div>

        {/* 💡 チャンピオン・ダイヤモンド共通：キラキラホログラムとハイライトを背後に重ねる */}
        {/* ==========================================
            🌟 変更点②：クラスの出し分け
            ========================================== */}
        {isHoloCard && (
          <>
            <div className={`absolute inset-0 z-[1] pointer-events-none rounded-[9px] ${tier === 'diamond' ? 'card-hologram-diamond' : 'card-hologram'
              }`} />
            <div className={`absolute inset-0 z-[2] pointer-events-none rounded-[9px] ${tier === 'diamond' ? 'card-highlight-diamond' : 'card-highlight'
              }`} />
          </>
        )}

        {/* ────────────────────────────────────────────────────────────────
            コンテンツ（relative z-10）- z-indexを上げてホログラムの上に配置します
            ──────────────────────────────────────────────────────────────── */}
        <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden relative z-10 select-none">
          {/* 上段: 名前・基本情報 */}
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <a
                href={trackerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-center gap-1 w-fit"
                title="tracker.gg で開く"
              >
                <h2
                  className={[
                    'font-extrabold tracking-wide truncate max-w-[110px] group-hover/link:opacity-80 transition-all drop-shadow',
                    tier === 'champion' ? 'text-[14px] neon-text-champion font-black' : '',
                    tier === 'diamond' ? 'text-[13px] neon-text-diamond font-black' : '',
                    tier === 'emerald' ? 'text-[13px] neon-text-emerald' : '',
                    tier !== 'champion' && tier !== 'diamond' && tier !== 'emerald' ? 'text-xs' : '',
                  ].join(' ')}
                  style={{
                    ...textStrokeWhiteStyle,
                  }}
                  title={username}
                >
                  {username}
                </h2>
                <svg className="w-3 h-3 opacity-80 group-hover/link:opacity-100 flex-shrink-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ stroke: '#ffffff' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p
                className="text-[9px] font-bold mt-0.5"
                style={textStrokeWhiteStyle}
              >
                Lv.{lifetimeStats.level} · {lifetimeStats.timePlayed}
              </p>
            </div>
            {/* ランクアイコン */}
            <div className="text-base leading-none" title={deco.tierLabel}>
              {currentRankInfo?.imageUrl && (
                <div
                  className="w-9 h-9 bg-slate-950/90 rounded-full border border-slate-700/80 flex items-center justify-center backdrop-blur-sm p-0.5 shadow-lg"
                  title={`Current Rank: ${currentRankInfo.rank}`}
                >
                  <img src={currentRankInfo.imageUrl} alt={currentRankInfo.rank} className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* 中段: 今シーズンの戦績 */}
          <div className="my-0.5">
            <div className="flex justify-between items-center mb-0.5">
              <span
                className="text-[8px] font-bold tracking-wider uppercase"
                style={textStrokeWhiteStyle}
              >
                {currentSeason.title}
              </span>
              {currentRankInfo && (
                <span
                  className="text-[8px] font-extrabold truncate max-w-[80px]"
                  title={currentRankInfo.rank}
                  style={textStrokeWhiteStyle}
                >
                  {currentRankInfo.rank}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="bg-slate-950/40 border border-slate-700/40 rounded py-0.5 px-0.5 backdrop-blur-[1px]">
                <p
                  className="text-[11px] font-black leading-tight"
                  style={getWrColorStyle(currentSeason.winRate)}
                >
                  {currentSeason.winRate.toFixed(1)}%
                </p>
                <p className="text-[7px] text-white font-bold uppercase leading-none" style={{ textShadow: '1px 1px 1px #000' }}>Win%</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-700/40 rounded py-0.5 px-0.5 backdrop-blur-[1px]">
                <p
                  className="text-[11px] font-black leading-tight"
                  style={getKdColorStyle(currentSeason.kd)}
                >
                  {currentSeason.kd.toFixed(2)}
                </p>
                <p className="text-[7px] text-white font-bold uppercase leading-none" style={{ textShadow: '1px 1px 1px #000' }}>K/D</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-700/40 rounded py-0.5 px-0.5 backdrop-blur-[1px]">
                <p
                  className="text-[11px] font-black leading-tight"
                  style={{ color: '#fbbf24', ...textStrokeWhiteStyle }}
                >
                  {currentSeason.matches}
                </p>
                <p className="text-[7px] text-white font-bold uppercase leading-none" style={{ textShadow: '1px 1px 1px #000' }}>Games</p>
              </div>
            </div>
          </div>

          {/* 下段: BEST PEAK ランク */}
          {bestPeak && (
            <div className="border-t border-slate-800/80 pt-1 flex items-center justify-between">
              <div className="flex items-center gap-1 min-w-0">
                {bestPeak.rank.imageUrl && (
                  <img src={bestPeak.rank.imageUrl} alt="Best Rank" className="w-5 h-5 object-contain flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className="text-[7px] font-bold uppercase leading-none"
                    style={textStrokeWhiteStyle}
                  >
                    Best Peak
                  </p>
                  <p
                    className="text-[9px] font-extrabold mt-0.5 truncate leading-none"
                    title={bestPeak.rank.rank}
                    style={textStrokeWhiteStyle}
                  >
                    {bestPeak.rank.rank}
                  </p>
                </div>
              </div>
              {/* 同率ベスト */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span
                  className="text-[7px] font-mono italic font-bold"
                  title={`Peak Season: ${bestPeak.season}`}
                  style={textStrokeWhiteStyle}
                >
                  {bestPeak.season}
                </span>
                {seasonPeaks.length > 1 && (
                  <span
                    className="text-[6px] font-mono font-bold"
                    style={textStrokeWhiteStyle}
                  >
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