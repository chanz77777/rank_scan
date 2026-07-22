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

// 色名からアイコン絵文字を返す
function colorToIcon(color: string): string {
  if (color === '#c084fc') return '✨'; // purple
  if (color === '#60a5fa') return '💧'; // blue
  if (color === '#4ade80') return '🍃'; // green
  if (color === '#facc15') return '⚡'; // yellow
  return '🔥';                           // red (default)
}

// K/D値のアイコンを返す
const getKdIcon = (kd: number): string => {
  if (kd >= 2.0) return colorToIcon('#c084fc');
  if (kd >= 1.5) return colorToIcon('#60a5fa');
  if (kd >= 1.0) return colorToIcon('#4ade80');
  if (kd >= 0.7) return colorToIcon('#facc15');
  return colorToIcon('#f87171');
};

// 勝率のアイコンを返す
const getWrIcon = (wr: number): string => {
  if (wr >= 60) return colorToIcon('#c084fc');
  if (wr >= 55) return colorToIcon('#60a5fa');
  if (wr >= 50) return colorToIcon('#4ade80');
  if (wr >= 45) return colorToIcon('#facc15');
  return colorToIcon('#f87171');
};

export default function PlayerStatsCard({ stats }: PlayerStatsCardProps) {
  const { ubiId, username, currentSeason, lifetimeStats, heroImageUrl, seasonPeaks, currentRank, avatarUrl, allSeasonRanks } = stats;
  const trackerUrl = `https://r6.tracker.network/r6siege/profile/ubi/${encodeURIComponent(ubiId)}/overview`;

  // 現在ランク: 明示フィールド → allSeasonRanks[0] の順にフォールバック
  const currentRankInfo = currentRank ?? allSeasonRanks[0]?.rank;

  // ランク名からスコアを計算するローカルヘルパー（route.tsのロジックと同等）
  const rankScore = (rankName: string): number => {
    const upper = (rankName ?? '').toUpperCase().trim();
    let base = 0;
    if (upper.startsWith('CHAMPION')) base = 70;
    else if (upper.startsWith('DIAMOND')) base = 58;
    else if (upper.startsWith('EMERALD')) base = 46;
    else if (upper.startsWith('PLATINUM')) base = 34;
    else if (upper.startsWith('GOLD')) base = 24;
    else if (upper.startsWith('SILVER')) base = 14;
    else if (upper.startsWith('BRONZE')) base = 6;
    else if (upper.startsWith('COPPER')) base = 2;
    const m = upper.match(/(\d)$/);
    const sub = m ? (parseInt(m[1], 10) === 1 ? 4 : parseInt(m[1], 10) === 2 ? 2 : 0) : 2;
    return base + sub;
  };

  // ベストピーク: ランク階級スコアが最高のシーズン（同点ならMMRが高い方）
  const bestPeak = seasonPeaks.reduce<typeof seasonPeaks[number] | undefined>((best, p) => {
    if (!best) return p;
    const bScore = rankScore(best.rank.rank);
    const pScore = rankScore(p.rank.rank);
    if (pScore > bScore) return p;
    if (pScore === bScore && p.rank.mmr > best.rank.mmr) return p;
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
    cardRef.current.style.setProperty('--hyp', '0.6');

    // 🌟 追加：ダイヤモンド用変数も中央（50%）にリセット
    cardRef.current.style.setProperty('--holo-pos', '50% 50%');
    cardRef.current.style.setProperty('--holo-x', '50%');
    cardRef.current.style.setProperty('--holo-y', '50%');
    cardRef.current.style.setProperty('--holo-hyp', '0.6');
  };

  // ────────────────────────────────────────────────────────────────────────
  // ポケモンカード技欄風ステータス行
  // ────────────────────────────────────────────────────────────────────────
  const StatRow = ({
    icon,
    label,
    value,
    valueStyle,
  }: {
    icon: string;
    label: string;
    value: string;
    valueStyle?: React.CSSProperties;
  }) => (
    <div
      className="flex items-center gap-1 py-[3px] px-1.5 rounded"
      style={{ background: 'rgba(15,23,42,0.45)', borderBottom: '1px solid rgba(148,163,184,0.12)' }}
    >
      {/* 左端: 色対応アイコン */}
      <span className="text-[13px] flex-shrink-0 leading-none w-5 text-center">{icon}</span>
      {/* 中央: 項目名 */}
      <span
        className="flex-1 text-[9px] font-bold uppercase tracking-wide leading-none"
        style={textStrokeWhiteStyle}
      >
        {label}
      </span>
      {/* 右端: 数値 */}
      <span
        className="text-[13px] font-black leading-none tabular-nums"
        style={valueStyle ?? textStrokeWhiteStyle}
      >
        {value}
      </span>
    </div>
  );

  // 勝率・K/Dのアイコンを事前計算
  const wrIcon = getWrIcon(currentSeason.winRate);
  const kdIcon = getKdIcon(currentSeason.kd);

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
          'flex flex-col aspect-[63/88] relative max-w-[250px] mx-auto',
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
        <div className="flex-1 p-2 flex flex-col overflow-hidden relative z-10 select-none">

          {/* ══════════════════════════════════════════════════════
              上段: 名前・Lv情報 + アバター + 現在ランク
              ポケモンカードのヘッダー欄に相当
              ══════════════════════════════════════════════════════ */}
          <div className="flex items-start justify-between gap-1">
            {/* 左: アバター + 名前・Lv情報 (縦に詰める) */}
            <div className="flex items-center gap-1.5 min-w-0">
              {/* アバター: 名前行のすぐ左に配置 */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    className="w-9 h-9 rounded-full object-cover border border-slate-600/80 shadow-md"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-0.5 border border-slate-700">
                    <span className="text-sm">🎮</span>
                  </div>
                )}
              </div>
              {/* 名前・Lv情報 */}
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
                      'font-extrabold tracking-wide truncate max-w-[90px] group-hover/link:opacity-80 transition-all drop-shadow text-[13px]',
                    ].join(' ')}
                    style={{
                      ...textStrokeWhiteStyle,
                    }}
                    title={username}
                  >
                    {username}
                  </h2>
                  <svg className="w-2.5 h-2.5 opacity-80 group-hover/link:opacity-100 flex-shrink-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ stroke: '#ffffff' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <p
                  className="text-[9px] font-bold leading-tight mt-0"
                  style={textStrokeWhiteStyle}
                >
                  Lv.{lifetimeStats.level} · {lifetimeStats.timePlayed} · {lifetimeStats.matches}matches
                </p>
              </div>
            </div>

            {/* 右: 現在ランクアイコン */}
            <div className="flex-shrink-0" title={deco.tierLabel}>
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

          {/* シーズンタイトル + 現在ランク名 */}
          <div className="flex justify-between items-center px-0.5">
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

          {/* スペーサー: ステータスを下寄りに押し下げる */}
          <div className="flex-1" />

          {/* ══════════════════════════════════════════════════════
              中段: ポケモンカード「技」欄風ステータス
              アイコン | 項目名 | 数値  の3カラム
              ══════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-[3px]">
            <StatRow
              icon={wrIcon}
              label="WIN"
              value={`${currentSeason.winRate.toFixed(1)}%`}
              valueStyle={getWrColorStyle(currentSeason.winRate)}
            />
            <StatRow
              icon={kdIcon}
              label="K/D"
              value={currentSeason.kd.toFixed(2)}
              valueStyle={getKdColorStyle(currentSeason.kd)}
            />
            <StatRow
              icon="🎮"
              label="GAMES"
              value={String(currentSeason.matches)}
            />
          </div>

          {/* ══════════════════════════════════════════════════════
              下段: ポケモンカード「弱点/にげる」欄風ランク表示
              1行で: [BEST ラベル][アイコン][ランク名]  ...スペーサー...  [ALLアイコン横並び]
              ══════════════════════════════════════════════════════ */}
          {bestPeak && (
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

                {/* 右: ALL ラベル + 全シーズンのアイコン横並び（ポケモンカード「にげる」欄） */}
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
                        {/* ホバー時シーズン名ツールチップ */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 px-1 py-0.5 bg-slate-900/95 border border-slate-600/60 rounded text-[7px] text-white font-mono whitespace-nowrap opacity-0 group-hover/rank:opacity-100 transition-opacity pointer-events-none z-50">
                          {peak.season}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* allSeasonRanks が1件のみ → シーズン名を右端に表示 */
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
          )}
        </div>
      </div>
    </div>
  );
}