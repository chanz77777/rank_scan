'use client';

import { useState, useEffect } from 'react';
import PlayerStatsCard from '@/app/components/PlayerStatsCard';
import { PlayerStats } from '@/app/lib/types';
import { mockPlayerData } from '@/app/lib/mockData';

export default function Home() {
  const [players, setPlayers] = useState<PlayerStats[]>(mockPlayerData);
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPlayer = async () => {
    if (!searchInput.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/tracker?ubiId=${encodeURIComponent(searchInput)}`
      );

      if (response.ok) {
        const playerData: PlayerStats = await response.json();
        setPlayers((prev) => {
          const exists = prev.some(
            (p) => p.ubiId.toLowerCase() === playerData.ubiId.toLowerCase()
          );
          if (!exists) {
            return [...prev, playerData];
          }
          return prev;
        });
        setSearchInput('');
      } else {
        alert('プレイヤーが見つかりませんでした');
      }
    } catch (error) {
      console.error('Error fetching player:', error);
      alert('エラーが発生しました');
    } finally {
      setIsLoading(false);
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
            プレイヤー戦績を一画面にまとめて表示
          </p>
        </div>

        {/* 検索フォーム */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
              placeholder="プレイヤーID を入力 (例: TokyoDisneyland)"
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddPlayer}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {isLoading ? '読込中...' : '追加'}
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-3">
            💡 モックデータ例: TokyoDisneyland, SamplePlayer2, SamplePlayer3
          </p>
        </div>
      </div>

      {/* プレイヤーカード グリッド */}
      <div className="max-w-7xl mx-auto">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              プレイヤーを追加してください
            </p>
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
          R6 Siege Stats Dashboard - Data from R6 Tracker Network
        </p>
      </div>
    </main>
  );
}
