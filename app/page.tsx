'use client';

import { useState } from 'react';
import PlayerStatsCard from '@/app/components/PlayerStatsCard';
import type { Platform } from '@/app/components/PlatformToggle';
import ImageUploader from '@/app/components/scanner/ImageUploader';
import IdEditorPanel from '@/app/components/scanner/IdEditorPanel';
import { usePlayerStats } from '@/app/hooks/usePlayerStats';
import { useImageScanner } from '@/app/hooks/useImageScanner';

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

      <div className="py-8 px-4">
        {/* ヘッダー */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">R6 Siege Stats Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">
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

        {/* プレイヤーカードグリッド */}
        <div className="max-w-full px-8 mx-auto">
          {allies.length + enemies.length === 0 ? (
            <div className="text-center py-24">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
                  <p className="text-slate-400 text-sm">{statusMsg}</p>
                </div>
              ) : (
                <div className="text-slate-600">
                  <p className="text-6xl mb-4">🖼️</p>
                  <p className="text-xl">スクリーンショットをドラッグ＆ドロップ</p>
                  <p className="text-sm mt-2">JPEG / PNG のみ対応</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* 味方チーム */}
              {allies.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                    味方チーム ({allies.length}人)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {allies.map((player) => (
                      <div key={player.ubiId} className="relative group">
                        <PlayerStatsCard stats={player} platform={platform} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 敵チーム */}
              {enemies.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                    敵チーム ({enemies.length}人)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {enemies.map((player) => (
                      <div key={player.ubiId} className="relative group">
                        <PlayerStatsCard stats={player} platform={platform} />
                      </div>
                    ))}
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
