import { PlayerStats } from './types';

/**
 * モックデータ（使用しない）
 * すべてのデータは実際のR6 Tracker APIから取得
 */

export const mockPlayerData: PlayerStats[] = [];

/**
 * UBI IDからプレイヤー情報を取得
 * R6 Tracker API経由で実際のデータを取得
 */
export async function getPlayerStats(ubiId: string): Promise<PlayerStats | null> {
  // API実装は /api/tracker で行われます
  const response = await fetch(`/api/tracker?ubiId=${encodeURIComponent(ubiId)}`);
  if (response.ok) {
    return await response.json();
  }
  return null;
}

