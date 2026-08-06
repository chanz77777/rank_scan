'use client';

import { useState } from 'react';
import PlayerStatsCard from '@/app/components/PlayerStatsCard';
import BentoCardWrapper from '@/app/components/player/BentoCardWrapper';
import type { Platform } from '@/app/components/PlatformToggle';
import ImageUploader from '@/app/components/scanner/ImageUploader';
import IdEditorPanel from '@/app/components/scanner/IdEditorPanel';
import { usePlayerStats } from '@/app/hooks/usePlayerStats';
import { useImageScanner } from '@/app/hooks/useImageScanner';
import { calcStrengthScore } from '@/app/lib/playerStrength';

export default function Home() {
  const [platform, setPlatform] = useState<Platform>('ubi');

  const {
    setPlayerSlots,
    editableIds,
    setEditableIds,
    showIdEditor,
    setShowIdEditor,
    reSearchingIndex,
    handleEditableIdChange,
    handleReSearchSingle,
    allies,
    enemies,
  } = usePlayerStats();

  const {
    geminiApiKey,
    setGeminiApiKey,
    showApiKey,
    setShowApiKey,
    isLoading,
    isDragActive,
    extractedPlayerIds,
    setExtractedPlayerIds,
    autoCrop,
    setAutoCrop,
    statusMsg,
    setStatusMsg,
    handleFileSelect,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useImageScanner(platform, setPlayerSlots, setEditableIds);

  const onReSearchSingle = (index: number) => {
    handleReSearchSingle(index, platform, setStatusMsg, setExtractedPlayerIds);
  };

  // スコア順にソート（最高スコアを先頭 = Bento Grid の MVP / THREAT 位置へ）
  const sortedAllies = [...allies].sort((a, b) => calcStrengthScore(b) - calcStrengthScore(a));
  const sortedEnemies = [...enemies].sort((a, b) => calcStrengthScore(b) - calcStrengthScore(a));

  const hasPlayers = sortedAllies.length + sortedEnemies.length > 0;

  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ── Quiet Luxury Console 固定背景 ── */}
      <div className="qlc-bg" aria-hidden="true">
        <div className="qlc-bg-glow-top" />
        <div className="qlc-bg-glow-bottom" />
      </div>

      {/* ── D&D オーバーレイ ── */}
      {isDragActive && (
        <div className="qlc-dnd-overlay">
          <div className="qlc-dnd-inner">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)', opacity: 0.9 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="qlc-dnd-title">ここにドロップ</p>
            <p className="qlc-dnd-sub">JPEG / PNG</p>
          </div>
        </div>
      )}

      <div className="py-4 px-4 max-w-7xl mx-auto">
        {/* ── ヘッダー ── */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="qlc-header-title">R6 Siege Stats Dashboard</h1>
              <p className="qlc-header-sub">
                {isLoading ? (
                  <span className="qlc-header-sub--active">{statusMsg || '処理中...'}</span>
                ) : statusMsg ? (
                  <span className="qlc-header-sub--message">{statusMsg}</span>
                ) : (
                  'スクリーンショット（JPEG/PNG）をドラッグ＆ドロップ'
                )}
              </p>
            </div>

            {/* コントロール群 */}
            <ImageUploader
              geminiApiKey={geminiApiKey}
              setGeminiApiKey={setGeminiApiKey}
              showApiKey={showApiKey}
              setShowApiKey={setShowApiKey}
              autoCrop={autoCrop}
              setAutoCrop={setAutoCrop}
              platform={platform}
              setPlatform={setPlatform}
              handleFileSelect={handleFileSelect}
            />
          </div>
        </div>

        {/* ID手動修正トグル */}
        <IdEditorPanel
          extractedPlayerIds={extractedPlayerIds}
          showIdEditor={showIdEditor}
          setShowIdEditor={setShowIdEditor}
          editableIds={editableIds}
          handleEditableIdChange={handleEditableIdChange}
          handleReSearchSingle={onReSearchSingle}
          reSearchingIndex={reSearchingIndex}
        />

        {/* ── プレイヤーカード Bento Grid ── */}
        <div className="max-w-full">
          {!hasPlayers ? (
            <div className="text-center">
              {isLoading ? (
                /* スケルトンローディング */
                <div className="bento-dashboard-container">
                  {/* 味方スケルトン */}
                  <div>
                    <div className="qlc-section-label mb-2">
                      <span className="qlc-section-label-dot" style={{ background: 'var(--accent)' }} />
                      <span style={{ color: 'var(--accent)', opacity: 0.7 }}>味方チーム</span>
                    </div>
                    <div className="team-bento-box">
                      <div className="bento-card-hero-wrapper">
                        <div className="qlc-skeleton qlc-skeleton-hero" />
                      </div>
                      <div className="team-bento-subgrid">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="qlc-skeleton qlc-skeleton-card" />
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* 敵スケルトン */}
                  <div>
                    <div className="qlc-section-label mb-2">
                      <span className="qlc-section-label-dot" style={{ background: 'var(--fn-red)' }} />
                      <span style={{ color: 'var(--fn-red)', opacity: 0.7 }}>敵チーム</span>
                    </div>
                    <div className="team-bento-box">
                      <div className="bento-card-hero-wrapper">
                        <div className="qlc-skeleton qlc-skeleton-hero" />
                      </div>
                      <div className="team-bento-subgrid">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="qlc-skeleton qlc-skeleton-card" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 空状態 */
                <div className="qlc-empty-state">
                  <p className="qlc-empty-title">スクリーンショットをドロップ</p>
                  <p className="qlc-empty-sub">JPEG / PNG のみ対応</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bento-dashboard-container qlc-fade-in">
              {/* 味方チーム */}
              {sortedAllies.length > 0 && (
                <div className="qlc-team-section">
                  <div className="qlc-section-label">
                    <span className="qlc-section-label-dot" style={{ background: 'var(--accent)' }} />
                    <span style={{ color: 'var(--accent)' }}>味方チーム</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({sortedAllies.length})</span>
                  </div>
                  <div className={`team-bento-box ${sortedAllies.length < 3 ? 'bento-single' : ''}`}>
                    {/* MVP Hero Card */}
                    {sortedAllies[0] && (
                      <BentoCardWrapper isHero>
                        <PlayerStatsCard stats={sortedAllies[0]} platform={platform} hero />
                      </BentoCardWrapper>
                    )}
                    {/* 残り 2x2 サブグリッド */}
                    <div className="team-bento-subgrid">
                      {sortedAllies.slice(1).map((player) => (
                        <BentoCardWrapper key={player.ubiId}>
                          <PlayerStatsCard stats={player} platform={platform} />
                        </BentoCardWrapper>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 敵チーム */}
              {sortedEnemies.length > 0 && (
                <div className="qlc-team-section">
                  <div className="qlc-section-label">
                    <span className="qlc-section-label-dot" style={{ background: 'var(--fn-red)' }} />
                    <span style={{ color: 'var(--fn-red)' }}>敵チーム</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({sortedEnemies.length})</span>
                  </div>
                  <div className={`team-bento-box ${sortedEnemies.length < 3 ? 'bento-single' : ''}`}>
                    {/* THREAT Hero Card */}
                    {sortedEnemies[0] && (
                      <BentoCardWrapper isThreat>
                        <PlayerStatsCard stats={sortedEnemies[0]} platform={platform} hero isEnemy />
                      </BentoCardWrapper>
                    )}
                    {/* 残り 2x2 サブグリッド */}
                    <div className="team-bento-subgrid">
                      {sortedEnemies.slice(1).map((player) => (
                        <BentoCardWrapper key={player.ubiId}>
                          <PlayerStatsCard stats={player} platform={platform} isEnemy />
                        </BentoCardWrapper>
                      ))}
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

