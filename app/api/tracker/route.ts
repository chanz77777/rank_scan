import { NextRequest, NextResponse } from 'next/server';
import { PlayerStats } from '@/app/lib/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * R6 Tracker プレイヤー戦績取得API
 * GET /api/tracker?ubiId=<PLAYER_ID>
 *
 * curl.exe を使って api.tracker.gg からリアルデータを取得します。
 * Node.js の fetch は Cloudflare に TLS フィンガープリントで弾かれるため、
 * Windows 標準の curl.exe (BoringSSL ベース) を使って回避します。
 */

const TRACKER_API = 'https://api.tracker.gg/api/v2/r6siege/standard/profile/ubi';

interface TrackerStat {
  value: number;
  displayValue: string;
  metadata?: Record<string, unknown>;
}

interface TrackerSegment {
  type: string;
  attributes: Record<string, unknown>;
  metadata: Record<string, unknown>;
  stats: Record<string, TrackerStat>;
}

interface TrackerResponse {
  data: {
    platformInfo: {
      platformUserHandle: string;
      avatarUrl?: string;
    };
    metadata: {
      clearanceLevel: number;
      currentSeason: number;
    };
    segments: TrackerSegment[];
  };
}

async function fetchWithCurl(ubiId: string): Promise<TrackerResponse | null> {
  const url = `${TRACKER_API}/${encodeURIComponent(ubiId)}`;

  const curlCmd = [
    'curl',
    '-s',                                         // サイレントモード
    '--max-time', '15',                            // タイムアウト15秒
    '--compressed',                                // gzip対応
    '-H', '"Accept: application/json, text/plain, */*"',
    '-H', '"Accept-Language: ja,en-US;q=0.9,en;q=0.8"',
    '-H', '"Origin: https://r6.tracker.network"',
    '-H', '"Referer: https://r6.tracker.network/"',
    '-H', '"User-Agent: Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36"',
    '-H', '"sec-fetch-dest: empty"',
    '-H', '"sec-fetch-mode: cors"',
    '-H', '"sec-fetch-site: cross-site"',
    '-H', '"sec-fetch-storage-access: active"',
    `"${url}"`,
  ].join(' ');

  try {
    const { stdout, stderr } = await execAsync(curlCmd, {
      timeout: 20000,
      windowsHide: true,
    });

    if (!stdout || stdout.trim().length === 0) {
      console.error(`curl returned empty response for "${ubiId}". stderr: ${stderr}`);
      return null;
    }

    const json = JSON.parse(stdout) as TrackerResponse;
    return json;
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(`curl/parse error for "${ubiId}": ${e.message}`);
    } else {
      console.error(`curl/parse error for "${ubiId}":`, e);
    }
    return null;
  }
}

function parseTrackerResponse(ubiId: string, json: TrackerResponse): PlayerStats {
  const { platformInfo, metadata, segments } = json.data;

  const username = platformInfo.platformUserHandle ?? ubiId;
  const level = metadata.clearanceLevel ?? 0;
  const currentSeasonId = metadata.currentSeason;

  // overview セグメント（全体戦績）
  const overviewSeg = segments.find((s) => s.type === 'overview');

  // 現在シーズンの ranked セグメント
  const currentSeasonSeg = segments.find(
    (s) =>
      s.type === 'season' &&
      s.attributes?.season === currentSeasonId &&
      s.attributes?.sessionType === 'ranked'
  );

  const totalMatches = overviewSeg?.stats?.matchesPlayed?.value ?? 0;
  const timePlayedDisplay = overviewSeg?.stats?.timePlayed?.displayValue ?? '-';

  const seasonMeta = currentSeasonSeg?.metadata as Record<string, unknown> | undefined;
  const seasonShortName = (seasonMeta?.shortName as string) ?? `S${currentSeasonId}`;

  const seasonMatches = currentSeasonSeg?.stats?.matchesPlayed?.value ?? 0;
  const seasonWins = currentSeasonSeg?.stats?.matchesWon?.value ?? 0;
  const seasonLosses = currentSeasonSeg?.stats?.matchesLost?.value ?? 0;
  const seasonWinPct = currentSeasonSeg?.stats?.winPercentage?.value ?? 0;
  // kdRatio が直接提供されていればそれを使う、なければ kills/deaths で計算
  const seasonKdRaw = currentSeasonSeg?.stats?.kdRatio?.value;
  const seasonKills = currentSeasonSeg?.stats?.kills?.value ?? 0;
  const seasonDeaths = currentSeasonSeg?.stats?.deaths?.value ?? 1;
  const seasonKd = seasonKdRaw != null
    ? parseFloat(seasonKdRaw.toFixed(2))
    : (seasonDeaths > 0 ? parseFloat((seasonKills / seasonDeaths).toFixed(2)) : 0);

  // ランク情報を探す（seasonSegのstats.rankなど）
  const rankStat = currentSeasonSeg?.stats?.['rank'];
  const rankMeta = rankStat?.metadata as { tierName?: string } | undefined;
  const rankName = rankMeta?.tierName ?? '';

  return {
    ubiId,
    username,
    currentSeason: {
      title: seasonShortName,
      winRate: parseFloat(seasonWinPct.toFixed(1)),
      kd: seasonKd,
      matches: Math.round(seasonMatches),
      wins: Math.round(seasonWins),
      losses: Math.round(seasonLosses),
    },
    lifetimeStats: {
      level: Math.round(level),
      matches: Math.round(totalMatches),
      timePlayed: timePlayedDisplay,
    },
    seasonPeaks: rankName
      ? [{ season: seasonShortName, rank: { rank: rankName, mmr: 0 } }]
      : [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const ubiId = request.nextUrl.searchParams.get('ubiId');

    if (!ubiId) {
      return NextResponse.json(
        { error: 'ubiId parameter is required' },
        { status: 400 }
      );
    }

    const json = await fetchWithCurl(ubiId);

    if (!json || !json.data) {
      return NextResponse.json(
        { error: `Player "${ubiId}" not found or data unavailable` },
        { status: 404 }
      );
    }

    const playerStats = parseTrackerResponse(ubiId, json);
    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(error) },
      { status: 500 }
    );
  }
}
