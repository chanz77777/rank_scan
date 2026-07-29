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

const BG_GRADIENTS: Record<Platform, string> = {
  ubi: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  psn: 'linear-gradient(180deg, #0b3d91 0%, #0284c7 50%, #0b3d91 100%)',
  xbl: 'linear-gradient(180deg, #0f5132 0%, #16a34a 50%, #0f5132 100%)',
};

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

  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 背景クロスフェードレイヤー */}
      <div className="fixed inset-0 -z-10">
        {(Object.keys(BG_GRADIENTS) as Platform[]).map((key) => (
          <div
            key={key}
            className="absolute inset-0"
            style={{
              background: BG_GRADIENTS[key],
              opacity: platform === key ? 1 : 0,
              transition: 'opacity 0.6s ease',
            }}
          />
        ))}
      </div>

      {/* 全画面D&Dオーバーレイ */}
      {isDragActive && (
        <div className="fixed inset-0 z-50 bg-blue-900/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-6xl mb-4">📥</p>
            <p className="text-3xl font-bold text-blue-200">ここにドロップ</p>
            <p className="text-slate-300 mt-2">JPEG / PNG</p>
          </div>
        </div>
      )}

      <div className="py-3 px-4 max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">R6 Siege Stats Dashboard</h1>
              <p className="text-slate-400 text-xs mt-0.5">
                {isLoading ? (
                  <span className="text-blue-400 animate-pulse">{statusMsg || '処理中...'}</span>
                ) : statusMsg ? (
                  <span className="text-slate-300">{statusMsg}</span>
                ) : (
                  'スクリーンショット（JPEG/PNG）をここにドラッグ＆ドロップ'
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

        {/* プレイヤーカード Bento Grid */}
        <div className="max-w-full">
          {sortedAllies.length + sortedEnemies.length === 0 ? (
            <div className="text-center py-16">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                  <p className="text-slate-400 text-xs">{statusMsg}</p>
                </div>
              ) : (
                <div className="text-slate-600">
                  <p className="text-5xl mb-3">🖼️</p>
                  <p className="text-lg">スクリーンショットをドラッグ＆ドロップ</p>
                  <p className="text-xs mt-1">JPEG / PNG のみ対応</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bento-dashboard-container">
              {/* 味方チーム Bento Grid */}
              {sortedAllies.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-blue-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400 shadow-md shadow-blue-500/50" />
                    味方チーム ({sortedAllies.length}人)
                  </h2>
                  <div className={`team-bento-box ${sortedAllies.length < 3 ? 'bento-single' : ''}`}>
                    {/* MVP Hero Card (左) */}
                    {sortedAllies[0] && (
                      <BentoCardWrapper isHero>
                        <PlayerStatsCard stats={sortedAllies[0]} platform={platform} hero />
                      </BentoCardWrapper>
                    )}
                    {/* 残り4人 2x2 サブグリッド (右) */}
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

              {/* 敵チーム Bento Grid */}
              {sortedEnemies.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-red-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400 shadow-md shadow-red-500/50" />
                    敵チーム ({sortedEnemies.length}人)
                  </h2>
                  <div className={`team-bento-box ${sortedEnemies.length < 3 ? 'bento-single' : ''}`}>
                    {/* THREAT Hero Card (左) */}
                    {sortedEnemies[0] && (
                      <BentoCardWrapper isThreat>
                        <PlayerStatsCard stats={sortedEnemies[0]} platform={platform} hero />
                      </BentoCardWrapper>
                    )}
                    {/* 残り4人 2x2 サブグリッド (右) */}
                    <div className="team-bento-subgrid">
                      {sortedEnemies.slice(1).map((player) => (
                        <BentoCardWrapper key={player.ubiId}>
                          <PlayerStatsCard stats={player} platform={platform} />
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
