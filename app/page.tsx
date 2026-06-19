'use client';

import { useState, useEffect } from 'react';
import PlayerStatsCard from '@/app/components/PlayerStatsCard';
import { PlayerStats } from '@/app/lib/types';
import { mockPlayerData } from '@/app/lib/mockData';

const DEFAULT_IMAGE_PATH = 'C:\\Users\\yuuch\\Pictures\\Desktop Screenshot 2026.06.19 - 15.08.38.64.jxr.jpg';

export default function Home() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [imagePath, setImagePath] = useState(DEFAULT_IMAGE_PATH);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ページ読み込み時にデフォルト画像を処理
  useEffect(() => {
    processImageFile();
  }, []);

  const processImageFile = async () => {
    if (!imageFile && !imagePath) return;

    setIsLoading(true);
    try {
      // 画像ファイルパスまたはファイルオブジェクトを処理
      const response = await fetch('/api/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePath: imagePath || null,
          useFile: !!imageFile,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // 抽出されたプレイヤーIDを取得
        const playerIds = data.playerIds as string[];
        
        // 各プレイヤーの詳細情報を取得
        const playersData: PlayerStats[] = [];
        for (const playerId of playerIds) {
          const playerResponse = await fetch(
            `/api/tracker?ubiId=${encodeURIComponent(playerId)}`
          );
          if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            playersData.push(playerData);
          }
        }

        setPlayers(playersData);
      } else {
        // フォールバック：モックデータを表示
        setPlayers(mockPlayerData);
        console.log('Note: Using mock data. For real data, connect to R6 Tracker API.');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      // エラー時もモックデータを表示
      setPlayers(mockPlayerData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePath(file.name);
      // ファイル選択後に自動処理
      setTimeout(() => processImageFile(), 100);
    }
  };

  const handleRemovePlayer = (ubiId: string) => {
    setPlayers((prev) =>
      prev.filter((p) => p.ubiId.toLowerCase() !== ubiId.toLowerCase())
    );
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

        {/* 画像ファイル選択フォーム */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
          <div className="space-y-4">
            {/* 現在の画像パス表示 */}
            <div className="bg-slate-700 rounded p-3 border border-slate-600">
              <p className="text-sm text-slate-300 break-all font-mono">
                📁 <span className="text-cyan-400">Current:</span> {imagePath}
              </p>
            </div>

            {/* ファイル選択 */}
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
                  🖼️ スクリーンショットを選択
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

            <p className="text-sm text-slate-400">
              💡 スクリーンショット内のプレイヤーIDを自動抽出して、R6 Trackerから戦績を取得します
            </p>
          </div>
        </div>
      </div>

      {/* プレイヤーカード グリッド */}
      <div className="max-w-7xl mx-auto">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              スクリーンショットを選択するか、デフォルト画像を解析してください
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
