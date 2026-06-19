import { NextRequest, NextResponse } from 'next/server';
import { PlayerStats } from '@/app/lib/types';

/**
 * R6 Tracker プレイヤー戦績取得API
 * GET /api/tracker?ubiId=<PLAYER_ID>
 *
 * tracker.gg の公開ページをスクレイピングして実際のデータを返します。
 */

const TRACKER_BASE = 'https://r6.tracker.network/r6siege/profile/ubi';

/**
 * R6 Tracker からプレイヤーデータをスクレイピング
 */
async function fetchPlayerFromTracker(ubiId: string): Promise<PlayerStats | null> {
  const url = `${TRACKER_BASE}/${encodeURIComponent(ubiId)}/overview`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://r6.tracker.network/',
    },
    next: { revalidate: 300 }, // 5 分キャッシュ
  });

  if (!res.ok) {
    console.error(`Tracker fetch failed for ${ubiId}: ${res.status}`);
    return null;
  }

  const html = await res.text();

  // --- ユーザー名 ---
  const usernameMatch = html.match(/<h1[^>]*class="[^"]*trn-profile-header__name[^"]*"[^>]*>\s*([^<]+)\s*<\/h1>/i)
    || html.match(/<title>\s*([^|<]+?)\s*(?:\||<)/i);
  const username = usernameMatch ? usernameMatch[1].trim() : ubiId;

  // --- JSON-LD / data-state をパース ---
  // tracker.gg は __NEXT_DATA__ に全データを埋め込む
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);

  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      // ページProps → pageProps → data → segments 等を探索
      const pageProps = nextData?.props?.pageProps;
      const playerData = pageProps?.playerStats || pageProps?.data;

      if (playerData) {
        return parseNextData(ubiId, username, playerData);
      }
    } catch (e) {
      console.error('Failed to parse __NEXT_DATA__:', e);
    }
  }

  // --- フォールバック: HTML からスタッツを regex 抽出 ---
  return parseHtmlStats(ubiId, username, html);
}

/** __NEXT_DATA__ からデータを取り出す */
function parseNextData(ubiId: string, username: string, data: any): PlayerStats {
  // segments / stats 以下を検索
  const findStat = (key: string, obj: any): number | null => {
    if (!obj || typeof obj !== 'object') return null;
    if (key in obj) {
      const v = obj[key];
      return typeof v === 'number' ? v : parseFloat(v?.value ?? v ?? '0') || null;
    }
    for (const k of Object.keys(obj)) {
      const result = findStat(key, obj[k]);
      if (result !== null) return result;
    }
    return null;
  };

  const winRate = findStat('wlPercentage', data) ?? findStat('winPct', data) ?? 50;
  const kd = findStat('kdRatio', data) ?? findStat('kd', data) ?? 1.0;
  const matches = findStat('matchesPlayed', data) ?? findStat('matches', data) ?? 0;
  const level = findStat('level', data) ?? 1;

  return {
    ubiId,
    username,
    currentSeason: {
      title: 'Current Season',
      winRate: typeof winRate === 'number' ? parseFloat(winRate.toFixed(1)) : 50,
      kd: typeof kd === 'number' ? parseFloat(kd.toFixed(2)) : 1.0,
      matches: Math.round(matches),
    },
    lifetimeStats: {
      level: Math.round(level),
      matches: Math.round(matches),
      timePlayed: '-',
    },
    seasonPeaks: [],
  };
}

/** HTML から regex でスタッツを取り出すフォールバック */
function parseHtmlStats(ubiId: string, username: string, html: string): PlayerStats | null {
  // 汎用的なスタッツ値の抽出を試みる
  const extractNumber = (pattern: RegExp): number | null => {
    const m = html.match(pattern);
    return m ? parseFloat(m[1].replace(/,/g, '')) : null;
  };

  // tracker.gg の stat-value クラス付き要素から値を引き出す
  const winRate = extractNumber(/Win Rate[^<]*<\/span>[^<]*<span[^>]*>\s*([\d.]+)%/i)
    ?? extractNumber(/"wlPercentage"\s*:\s*{\s*"value"\s*:\s*"?([\d.]+)/i)
    ?? null;
  const kd = extractNumber(/K\/D[^<]*<\/span>[^<]*<span[^>]*>\s*([\d.]+)/i)
    ?? extractNumber(/"kdRatio"\s*:\s*{\s*"value"\s*:\s*"?([\d.]+)/i)
    ?? null;
  const matches = extractNumber(/Matches Played[^<]*<\/span>[^<]*<span[^>]*>\s*([\d,]+)/i)
    ?? extractNumber(/"matchesPlayed"\s*:\s*{\s*"value"\s*:\s*"?([\d,]+)/i)
    ?? null;

  // 何も取れなければ null を返す（カード非表示）
  if (winRate === null && kd === null && matches === null) {
    return null;
  }

  return {
    ubiId,
    username,
    currentSeason: {
      title: 'Current Season',
      winRate: winRate ?? 0,
      kd: kd ?? 0,
      matches: matches ?? 0,
    },
    lifetimeStats: {
      level: 0,
      matches: matches ?? 0,
      timePlayed: '-',
    },
    seasonPeaks: [],
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

    const playerStats = await fetchPlayerFromTracker(ubiId);

    if (!playerStats) {
      return NextResponse.json(
        { error: `Player "${ubiId}" not found or data unavailable` },
        { status: 404 }
      );
    }

    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(error) },
      { status: 500 }
    );
  }
}
