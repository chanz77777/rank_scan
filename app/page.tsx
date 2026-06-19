'use client';

import { useState, useEffect } from 'react';
import PlayerStatsCard from '@/app/components/PlayerStatsCard';
import { PlayerStats } from '@/app/lib/types';
import { mockPlayerData } from '@/app/lib/mockData';

const DEFAULT_IMAGE_PATH = 'C:\\Users\\yuuch\\Pictures\\Desktop Screenshot 2026.06.19 - 15.08.38.64.jxr.jpg';

interface DebugLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export default function Home() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [imagePath, setImagePath] = useState(DEFAULT_IMAGE_PATH);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [extractedPlayerIds, setExtractedPlayerIds] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);

  const addDebugLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const now = new Date().toLocaleTimeString('ja-JP');
    setDebugLogs((prev) => [...prev, { timestamp: now, message, type }].slice(-20)); // 最新20件のみ保持
  };

  // ページ読み込み時にデフォルト画像を処理
  useEffect(() => {
    addDebugLog('ページ初期化完了', 'info');
    processImageFile();
  }, []);

  const processImageFile = async () => {
    if (!imageFile && !imagePath) {
      addDebugLog('エラー: 画像ファイルが設定されていません', 'error');
      return;
    }

    setIsLoading(true);
    addDebugLog(`画像処理開始`, 'info');

    try {
      let response;

      if (imageFile) {
        // ファイルがある場合はFormDataで送信
        addDebugLog(`ファイルアップロード: ${imageFile.name}`, 'info');
        const formData = new FormData();
        formData.append('file', imageFile);

        response = await fetch('/api/process-image', {
          method: 'POST',
          body: formData,
        });
      } else {
        // ファイルパスを使用する場合
        addDebugLog(`ファイルパス処理: ${imagePath}`, 'info');
        response = await fetch('/api/process-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imagePath }),
        });
      }

      if (response.ok) {
        const data = await response.json();

        // 抽出されたプレイヤーIDを取得
        const playerIds = (data.playerIds as string[]) || [];
        setExtractedPlayerIds(playerIds);
        addDebugLog(`✓ プレイヤーID抽出成功 (${playerIds.length}人)`, 'success');
        playerIds.forEach((id, idx) => {
          addDebugLog(`  [${idx + 1}] ${id}`, 'info');
        });

        // 各プレイヤーの詳細情報を取得
        const playersData: PlayerStats[] = [];
        for (let i = 0; i < playerIds.length; i++) {
          const playerId = playerIds[i];
          addDebugLog(`データ取得中 (${i + 1}/${playerIds.length}): ${playerId}`, 'info');

          const playerResponse = await fetch(
            `/api/tracker?ubiId=${encodeURIComponent(playerId)}`
          );
          if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            playersData.push(playerData);
            addDebugLog(`✓ ${playerId} のデータ取得完了`, 'success');
          } else {
            addDebugLog(`✗ ${playerId} のデータ取得失敗 (${playerResponse.status})`, 'warning');
          }
        }

        setPlayers(playersData);
        if (playersData.length > 0) {
          addDebugLog(
            `✓ すべてのプレイヤー情報を取得完了 (${playersData.length}人)`,
            'success'
          );
        } else {
          addDebugLog('⚠️ プレイヤーIDは抽出されましたが、データ取得に失敗しました', 'warning');
        }
      } else {
        const errorData = await response.json();
        addDebugLog(
          `✗ API処理失敗: ${errorData.error || '不明なエラー'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error processing image:', error);
      addDebugLog(`✗ エラー: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePath(file.name);
      addDebugLog(`ファイル選択: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`, 'info');
      // ファイル選択後に自動処理
      setTimeout(() => processImageFile(), 100);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
    addDebugLog('ドラッグ開始', 'info');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    addDebugLog('ドラッグ終了', 'info');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        setImagePath(file.name);
        addDebugLog(`ドロップ: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`, 'info');
        // ファイルドロップ後に自動処理
        setTimeout(() => processImageFile(), 100);
      }
    }
  };

  const handleRemovePlayer = (ubiId: string) => {
    setPlayers((prev) =>
      prev.filter((p) => p.ubiId.toLowerCase() !== ubiId.toLowerCase())
    );
    addDebugLog(`削除: ${ubiId}`, 'warning');
  };

  const handleClearDebugLogs = () => {
    setDebugLogs([]);
    addDebugLog('ログをクリアしました', 'info');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            R6 Siege Stats Dashboard
          </h1>
          <p className="text-slate-300 text-lg">
            ゲームスクリーンショットから戦績を自動抽出・表示
          </p>
        </div>

        {/* ドラッグアンドドロップ＆ファイル選択エリア */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`bg-slate-800 rounded-lg p-8 border-2 transition-all duration-200 shadow-lg cursor-pointer ${
            isDragActive
              ? 'border-blue-500 bg-slate-700 ring-2 ring-blue-400'
              : 'border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="space-y-4">
            {/* 現在の画像パス表示 */}
            <div className="bg-slate-700 rounded p-3 border border-slate-600">
              <p className="text-sm text-slate-300 break-all font-mono">
                📁 <span className="text-cyan-400">Current:</span> {imagePath}
              </p>
            </div>

            {/* ドラッグアンドドロップエリア */}
            <div className="bg-slate-900 rounded-lg p-8 text-center border-2 border-dashed border-slate-600 hover:border-slate-500 transition-colors">
              {isDragActive ? (
                <div className="space-y-2">
                  <p className="text-2xl">📥</p>
                  <p className="text-lg font-semibold text-blue-400">
                    ここにドロップしてください
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-3xl">🖼️</p>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      スクリーンショットをドラッグ＆ドロップ
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      または下のボタンをクリックして選択
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ファイル選択ボタン */}
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 relative">
                <input
                  type="file"
                  accept="image/*,.jxr"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg cursor-pointer"
                  onClick={() =>
                    document.querySelector('input[type="file"]')?.dispatchEvent(
                      new MouseEvent('click')
                    )
                  }
                >
                  📂 ファイルを選択
                </button>
              </label>

              <button
                onClick={processImageFile}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {isLoading ? '⏳ 処理中...' : '🔍 解析'}
              </button>
            </div>

            <p className="text-sm text-slate-400 text-center">
              💡 対応形式: JPEG, PNG, WebP, JXR
            </p>
          </div>
        </div>
      </div>

      {/* 抽出されたプレイヤーID デバッグパネル */}
      {extractedPlayerIds.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8 bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
              🔍 抽出されたプレイヤーID ({extractedPlayerIds.length}人)
            </h2>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300"
            >
              {showDebug ? '▼ 隠す' : '▶ 表示'}
            </button>
          </div>
          
          {showDebug && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {extractedPlayerIds.map((id, index) => (
                <div
                  key={id}
                  className="bg-gradient-to-r from-green-900 to-emerald-900 rounded p-3 border border-green-700 text-center"
                >
                  <p className="text-xs text-green-300 font-semibold">#{index + 1}</p>
                  <p className="text-sm text-white font-mono break-words">{id}</p>
                  {players.find((p) => p.ubiId === id) && (
                    <p className="text-xs text-green-400 mt-1">✓ 取得済</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* デバッグログパネル */}
      <div className="max-w-7xl mx-auto mb-8 bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
            🐛 デバッグログ ({debugLogs.length})
          </h2>
          <button
            onClick={handleClearDebugLogs}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
          >
            クリア
          </button>
        </div>

        <div className="bg-slate-900 rounded p-4 font-mono text-xs max-h-64 overflow-y-auto space-y-1">
          {debugLogs.length === 0 ? (
            <p className="text-slate-500">ログはまだありません...</p>
          ) : (
            debugLogs.map((log, idx) => (
              <div
                key={idx}
                className={`${
                  log.type === 'success'
                    ? 'text-green-400'
                    : log.type === 'error'
                    ? 'text-red-400'
                    : log.type === 'warning'
                    ? 'text-yellow-400'
                    : 'text-blue-400'
                }`}
              >
                <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* プレイヤーカード グリッド */}
      <div className="max-w-7xl mx-auto">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              スクリーンショットをドラッグ＆ドロップするか、ファイル選択してください
            </p>
            {isLoading && (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => (
              <div key={player.ubiId} className="relative group">
                <PlayerStatsCard stats={player} />
                <button
                  onClick={() => handleRemovePlayer(player.ubiId)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                  title="削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-700">
        <p className="text-center text-slate-400 text-sm">
          R6 Siege Stats Dashboard - Image Processing & Data from R6 Tracker Network
        </p>
      </div>
    </main>
  );
}
