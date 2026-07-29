'use client';

import { useState } from 'react';
import type { PlayerStats } from '@/app/lib/types';
import type { Platform } from '@/app/components/PlatformToggle';

export function usePlayerStats() {
  const [playerSlots, setPlayerSlots] = useState<(PlayerStats | null)[]>([]);
  const [editableIds, setEditableIds] = useState<string[]>([]);
  const [showIdEditor, setShowIdEditor] = useState(false);
  const [reSearchingIndex, setReSearchingIndex] = useState<number | null>(null);

  const handleEditableIdChange = (index: number, value: string) => {
    setEditableIds((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemovePlayer = (ubiId: string) => {
    setPlayerSlots((prev) =>
      prev.map((p) => (p && p.ubiId.toLowerCase() === ubiId.toLowerCase() ? null : p))
    );
  };

  const handleReSearchSingle = async (
    index: number,
    platform: Platform,
    setStatusMsg: (msg: string) => void,
    setExtractedPlayerIds: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newId = editableIds[index]?.trim();
    if (!newId) return;

    setReSearchingIndex(index);
    setStatusMsg(`🔍 ${newId} を再検索中...`);

    try {
      const playerResponse = await fetch(`/api/tracker?ubiId=${encodeURIComponent(newId)}&platform=${platform}`);
      if (playerResponse.ok) {
        const playerData: PlayerStats = await playerResponse.json();
        setPlayerSlots((prev) => {
          const next = [...prev];
          next[index] = playerData;
          return next;
        });
        setExtractedPlayerIds((prev) => {
          const next = [...prev];
          next[index] = newId;
          return next;
        });
        setStatusMsg(`✓ ${newId} のデータを再取得しました`);
      } else {
        setStatusMsg(`✗ ${newId} のデータ取得失敗 (${playerResponse.status})`);
      }
    } catch (error) {
      setStatusMsg(`✗ エラー: ${error}`);
    } finally {
      setReSearchingIndex(null);
    }
  };

  const allies = playerSlots.slice(0, 5).filter((p): p is PlayerStats => p !== null);
  const enemies = playerSlots.slice(5, 10).filter((p): p is PlayerStats => p !== null);

  return {
    playerSlots,
    setPlayerSlots,
    editableIds,
    setEditableIds,
    showIdEditor,
    setShowIdEditor,
    reSearchingIndex,
    handleEditableIdChange,
    handleRemovePlayer,
    handleReSearchSingle,
    allies,
    enemies,
  };
}
