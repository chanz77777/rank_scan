import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStats } from '@/app/lib/mockData';
import { PlayerStats } from '@/app/lib/types';

/**
 * R6 Tracker プレイヤー戦績取得API
 * GET /api/tracker?ubiId=<PLAYER_ID>
 *
 * 現在はモックデータを返しています。本番環境では以下の方法で実装可能：
 *
 * 1. 非公式API（r6.tracker.network）を利用する場合：
 *    - fetch(`https://r6.tracker.network/api/v5/siege/profiles?name=${ubiId}`)
 *    - User-Agentをブラウザのものに設定
 *    - キャッシュ機能を実装（Vercel KV推奨）
 *
 * 2. スクレイピング（Cheerio等）する場合：
 *    - Puppeteer / Playwright でブラウザ制御
 *    - 公式サイトのrobots.txtを確認
 *    - キャッシュと速度制限が必須
 *
 * 3. 公式API（将来リリース予定）：
 *    - 最も安全で推奨される方法
 */

export async function GET(request: NextRequest) {
  try {
    const ubiId = request.nextUrl.searchParams.get('ubiId');

    if (!ubiId) {
      return NextResponse.json(
        { error: 'ubiId parameter is required' },
        { status: 400 }
      );
    }

    // モックデータから取得
    const playerStats = await getPlayerStats(ubiId);

    if (!playerStats) {
      return NextResponse.json(
        { error: `Player "${ubiId}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST エンドポイント（将来の拡張用）
 * 複数のプレイヤーIDを一度に取得する場合の実装例
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerIds } = body;

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json(
        { error: 'playerIds array is required' },
        { status: 400 }
      );
    }

    // 複数プレイヤーのデータを並列取得
    const results = await Promise.all(
      playerIds.map((id: string) => getPlayerStats(id))
    );

    return NextResponse.json({
      players: results.filter((p): p is PlayerStats => p !== null),
      notFound: playerIds.filter(
        (id: string) =>
          !results.find((p) => p && p.ubiId.toLowerCase() === id.toLowerCase())
      ),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
