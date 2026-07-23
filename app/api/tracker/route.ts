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

function getRankBaseScore(rankName: string): number {
  const upper = (rankName ?? '').toUpperCase().trim();
  if (upper.startsWith('CHAMPION')) return 80;
  if (upper.startsWith('DIAMOND')) return 60;
  if (upper.startsWith('EMERALD')) return 50;
  if (upper.startsWith('PLATINUM')) return 40;
  if (upper.startsWith('GOLD')) return 30;
  if (upper.startsWith('SILVER')) return 15;
  if (upper.startsWith('BRONZE')) return 5;
  if (upper.startsWith('COPPER')) return 2;
  return 0;
}

function getRankSubBonus(rankName: string): number {
  const m = (rankName ?? '').match(/(\d)$/);
  if (!m) return 2;
  const sub = parseInt(m[1], 10);
  return sub === 1 ? 4 : sub === 2 ? 2 : 0;
}

function parseTrackerResponse(ubiId: string, json: TrackerResponse): PlayerStats {
  const { platformInfo, metadata, segments } = json.data;
  const userInfo = (json.data as any).userInfo;

  const username = platformInfo.platformUserHandle ?? ubiId;
  const level = metadata.clearanceLevel ?? 0;
  const currentSeasonId = metadata.currentSeason;
  const heroImageUrl = userInfo?.customHeroUrl ?? undefined;

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

  const rawSeasonMatches = currentSeasonSeg?.stats?.matchesPlayed?.value ?? 0;
  const isFallback = rawSeasonMatches === 0;

  let finalWinPct = currentSeasonSeg?.stats?.winPercentage?.value ?? 0;
  let finalMatches = rawSeasonMatches;
  let finalWins = currentSeasonSeg?.stats?.matchesWon?.value ?? 0;
  let finalLosses = currentSeasonSeg?.stats?.matchesLost?.value ?? 0;
  let finalKd = 0;

  if (isFallback && overviewSeg) {
    finalMatches = overviewSeg?.stats?.matchesPlayed?.value ?? 0;
    finalWins = overviewSeg?.stats?.matchesWon?.value ?? 0;
    finalLosses = overviewSeg?.stats?.matchesLost?.value ?? 0;
    finalWinPct = overviewSeg?.stats?.winPercentage?.value ?? 0;
    const ovKdRaw = overviewSeg?.stats?.kdRatio?.value;
    const ovKills = overviewSeg?.stats?.kills?.value ?? 0;
    const ovDeaths = overviewSeg?.stats?.deaths?.value ?? 1;
    finalKd = ovKdRaw != null
      ? parseFloat(ovKdRaw.toFixed(2))
      : (ovDeaths > 0 ? parseFloat((ovKills / ovDeaths).toFixed(2)) : 0);
  } else {
    const seasonKdRaw = currentSeasonSeg?.stats?.kdRatio?.value;
    const seasonKills = currentSeasonSeg?.stats?.kills?.value ?? 0;
    const seasonDeaths = currentSeasonSeg?.stats?.deaths?.value ?? 1;
    finalKd = seasonKdRaw != null
      ? parseFloat(seasonKdRaw.toFixed(2))
      : (seasonDeaths > 0 ? parseFloat((seasonKills / seasonDeaths).toFixed(2)) : 0);
  }

  // 現在シーズンのランク情報を探す
  const currentRankPointsStat = currentSeasonSeg?.stats?.['rankPoints'] || currentSeasonSeg?.stats?.['rank'] || currentSeasonSeg?.stats?.['mmr'];
  const currentRankMeta = currentRankPointsStat?.metadata as { name?: string; tierName?: string; imageUrl?: string } | undefined;
  const currentRankName = currentRankMeta?.name || currentRankMeta?.tierName || '';
  const currentRankImg = currentRankMeta?.imageUrl || '';
  const currentRankVal = currentRankPointsStat?.value ?? 0;

  // ────────────────────────────────────────────────────────
  // ランク済みシーズン一覧の抽出 & シーズンID 降順でソート（最新が先頭）
  // ────────────────────────────────────────────────────────
  const rankedSeasons = segments.filter(
    (s) => s.type === 'season' && s.attributes?.sessionType === 'ranked'
  );

  const sortedRankedSeasons = [...rankedSeasons].sort((a, b) => {
    const sa = (a.attributes?.season as number) ?? 0;
    const sb = (b.attributes?.season as number) ?? 0;
    return sb - sa; // 降順
  });

  // ────────────────────────────────────────────────────────
  // 過去最高ランクのピーク（階級ベース）を探索
  // 同等の最高ランクが複数シーズンある場合はすべて収集する
  // ────────────────────────────────────────────────────────
  let highestBaseScore = 0;
  let highestSubBonus = 0;

  // まず最高ランクの基準を特定
  for (const s of rankedSeasons) {
    const stat = s.stats?.maxRankPoints || s.stats?.rankPoints || s.stats?.mmr;
    if (!stat) continue;
    const meta = stat.metadata as { name?: string; tierName?: string } | undefined;
    const rName = meta?.name || meta?.tierName || '';
    if (!rName) continue;

    const base = getRankBaseScore(rName);
    const sub = getRankSubBonus(rName);
    const totalRankValue = base + sub; // 例: Emerald 1 は 46 + 4 = 50, Platinum 1 は 34 + 4 = 38

    if (totalRankValue > (highestBaseScore + highestSubBonus)) {
      highestBaseScore = base;
      highestSubBonus = sub;
    }
  }

  // 最高ランク階級と一致する全シーズンを抽出
  const bestPeakSeasons = sortedRankedSeasons.filter((s) => {
    const stat = s.stats?.maxRankPoints || s.stats?.rankPoints || s.stats?.mmr;
    if (!stat) return false;
    const meta = stat.metadata as { name?: string; tierName?: string } | undefined;
    const rName = meta?.name || meta?.tierName || '';
    if (!rName) return false;

    const base = getRankBaseScore(rName);
    const sub = getRankSubBonus(rName);
    return base === highestBaseScore && sub === highestSubBonus && highestBaseScore > 0;
  });

  // SeasonPeak[] に変換（最高ランク階級と同等のシーズンのみ）
  const peaks = bestPeakSeasons.map((s) => {
    const stat = s.stats?.maxRankPoints || s.stats?.rankPoints || s.stats?.mmr;
    const val = stat?.value ?? 0;
    const meta = stat?.metadata as { name?: string; tierName?: string; imageUrl?: string } | undefined;
    const rName = meta?.name || meta?.tierName || '';
    const rImg = meta?.imageUrl || '';
    const sName = (s.metadata?.shortName as string) ?? `S${s.attributes?.season}`;
    return {
      season: sName,
      rank: { rank: rName, mmr: Math.round(val), imageUrl: rImg },
    };
  }).filter((p) => p.rank.rank !== '');

  // peaks が空（ランクデータなし）の場合は現在ランクをフォールバックとして入れる
  if (peaks.length === 0 && currentRankName) {
    peaks.push({
      season: seasonShortName,
      rank: { rank: currentRankName, mmr: Math.round(currentRankVal), imageUrl: currentRankImg },
    });
  }

  // 全ランク済みシーズン（NO RANK を除く）を allSeasonRanks として整備
  const allSeasonRanks = sortedRankedSeasons.map((s) => {
    const stat = s.stats?.maxRankPoints || s.stats?.rankPoints || s.stats?.mmr;
    if (!stat) return null;
    const val = stat?.value ?? 0;
    const meta = stat?.metadata as { name?: string; tierName?: string; imageUrl?: string } | undefined;
    const rName = meta?.name || meta?.tierName || '';
    const rImg = meta?.imageUrl || '';
    const sName = (s.metadata?.shortName as string) ?? `S${s.attributes?.season}`;
    if (!rName || rName === 'NO RANK') return null;
    return {
      season: sName,
      rank: { rank: rName, mmr: Math.round(val), imageUrl: rImg },
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);

  // allSeasonRanks の重複シーズンを除去（同一シーズン名が複数ある場合は最高MMRのもののみ残す）
  const seenSeasons = new Map<string, typeof allSeasonRanks[number]>();
  for (const entry of allSeasonRanks) {
    const existing = seenSeasons.get(entry.season);
    if (!existing || entry.rank.mmr > existing.rank.mmr) {
      seenSeasons.set(entry.season, entry);
    }
  }
  const dedupedAllSeasonRanks = Array.from(seenSeasons.values());

  return {
    ubiId,
    username,
    avatarUrl: platformInfo.avatarUrl ?? undefined,
    heroImageUrl,
    currentRank: currentRankName
      ? { rank: currentRankName, mmr: Math.round(currentRankVal), imageUrl: currentRankImg }
      : undefined,
    currentSeason: {
      title: seasonShortName,
      winRate: parseFloat(finalWinPct.toFixed(1)),
      kd: finalKd,
      matches: Math.round(finalMatches),
      wins: Math.round(finalWins),
      losses: Math.round(finalLosses),
      isFallback,
    },
    lifetimeStats: {
      level: Math.round(level),
      matches: Math.round(totalMatches),
      timePlayed: timePlayedDisplay,
    },
    seasonPeaks: peaks,
    allSeasonRanks: dedupedAllSeasonRanks,
  };
}

/**
 * OCRの誤読パターンに基づき、候補IDのリストを生成する。
 * 大文字小文字は維持しつつ、フォント混同文字(1, l, I, |)および(o, O, 0)を賢く置換してリトライ用の候補リストを最大20件程度作成する。
 */
function getOcrCandidates(id: string): string[] {
  const candidatesSet = new Set<string>();

  // 基本的な相互置換テーブル
  // 1, l, I, | の相互置換グループ
  const simL = ['1', 'l', 'I'];
  // o, O, 0 の相互置換グループ
  const simO = ['o', 'O', '0'];

  // 1. まず単純な一括置換候補を生成
  // _ と - の相互置換
  if (id.includes('_')) candidatesSet.add(id.replace(/_/g, '-'));
  if (id.includes('-')) candidatesSet.add(id.replace(/-/g, '_'));

  // プレフィックスの誤読除去
  if (id.startsWith('W_')) candidatesSet.add(id.slice(2));
  if (id.startsWith('w_')) candidatesSet.add(id.slice(2));

  // 2. 文字列の各文字をスキャンして置換候補を作成する
  // 組み合わせ数が爆発するのを防ぐため、最大3箇所の変更に制限して実用的な候補を生成する。
  const chars = id.split('');

  // 置換可能な文字のインデックスと、その代替文字候補のリストを抽出
  const targets: { index: number; options: string[] }[] = [];
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (simL.includes(char)) {
      targets.push({
        index: i,
        options: simL.filter(c => c !== char)
      });
    } else if (simO.includes(char)) {
      targets.push({
        index: i,
        options: simO.filter(c => c !== char)
      });
    }
  }

  // もし置換対象文字が見つかったら、組み合わせを生成
  if (targets.length > 0) {
    // 置換対象が多すぎる場合は先頭側の3つに絞る
    const activeTargets = targets.slice(0, 3);

    // バックトラック的に組み合わせを再帰生成
    function generate(targetIdx: number, currentChars: string[]) {
      if (targetIdx === activeTargets.length) {
        candidatesSet.add(currentChars.join(''));
        return;
      }

      const { index, options } = activeTargets[targetIdx];
      // 変更しないパターン
      generate(targetIdx + 1, [...currentChars]);

      // 変更するパターン
      for (const opt of options) {
        const nextChars = [...currentChars];
        nextChars[index] = opt;
        generate(targetIdx + 1, nextChars);
      }
    }

    generate(0, chars);
  }

  // 元のIDは除外して返す
  candidatesSet.delete(id);

  // 優先順位をつける（変更箇所が少ないものを手前に、実用性の高いものを優先）
  const result = Array.from(candidatesSet);

  // デバッグ用にコンソール出力
  console.log(`Generated ${result.length} OCR correction candidates for: "${id}"`, result);

  // APIへの過剰な負荷を避けるため、最大15件に制限して返す
  return result.slice(0, 15);
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

    // まず元のIDで検索
    let json = await fetchWithCurl(ubiId);
    let resolvedId = ubiId;

    // 404の場合はOCR補正候補でリトライ
    if (!json || !json.data) {
      const candidates = getOcrCandidates(ubiId);
      for (const candidate of candidates) {
        console.log(`Retrying with OCR candidate: "${candidate}" (original: "${ubiId}")`);
        const retryJson = await fetchWithCurl(candidate);
        if (retryJson && retryJson.data) {
          json = retryJson;
          resolvedId = candidate;
          console.log(`OCR correction succeeded: "${ubiId}" → "${candidate}"`);
          break;
        }
      }
    }

    if (!json || !json.data) {
      return NextResponse.json(
        { error: `Player "${ubiId}" not found or data unavailable` },
        { status: 404 }
      );
    }

    const playerStats = parseTrackerResponse(resolvedId, json);
    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(error) },
      { status: 500 }
    );
  }
}
