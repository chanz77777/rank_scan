'use client';

import { useState, useEffect } from 'react';
import PlayerStatsCard from '@/app/components/PlayerStatsCard';
import { PlayerStats } from '@/app/lib/types';
import { parsePlayerIdsFromText } from '@/app/lib/ocrProcessor';

const DEFAULT_IMAGE_PATH = '';

interface DebugLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

declare global {
  interface Window {
    Tesseract: typeof import('tesseract.js');
  }
}

export default function Home() {
  const [allies, setAllies] = useState<PlayerStats[]>([]);
  const [enemies, setEnemies] = useState<PlayerStats[]>([]);
  const [imagePath, setImagePath] = useState(DEFAULT_IMAGE_PATH);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [extractedPlayerIds, setExtractedPlayerIds] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);
  const [tesseractReady, setTesseractReady] = useState(false);
  const [autoCrop, setAutoCrop] = useState(true);
  const [croppedImage, setCroppedImage] = useState<string>('');

  const addDebugLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const now = new Date().toLocaleTimeString('ja-JP');
    setDebugLogs((prev) => [...prev, { timestamp: now, message, type }].slice(-30)); // 最新30件のみ保持
  };

  // 画像からスコアボードのプレイヤー名列部分（中央の特定エリア）を切り抜く
  const cropImageToCenterGrid = (base64Str: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          const width = img.naturalWidth;
          const height = img.naturalHeight;

          // スコアボードのプレイヤー名列の切り抜き範囲比率
          // 名前の先頭（左端）が切れず、かつ右端のランクアイコンや境界線が入らないよう調整
          // 横: 32.5% 〜 46.5% (幅 14.0%)
          // 縦: 29% 〜 80% (高さ 51%)
          const cropX = Math.round(width * 0.325);
          const cropY = Math.round(height * 0.29);
          const cropW = Math.round(width * 0.14);
          const cropH = Math.round(height * 0.51);

          // Tesseractの認識精度向上のため、4倍に拡大する
          const scale = 4;
          canvas.width = cropW * scale;
          canvas.height = cropH * scale;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

          // 画像処理（二値化・白黒反転）
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 輝度 (グレースケール)
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // 二値化 & 白黒反転 (文字を黒[0]、背景を白[255]にする)
            // 文字同士の癒着（特にGとドットなど）を防ぎ、文字を細めにして境界をくっきりさせるため、しきい値を 140 に設定
            const binValue = gray > 140 ? 0 : 255;

            data[i] = binValue;     // R
            data[i + 1] = binValue; // G
            data[i + 2] = binValue; // B
          }

          // ============================================================
          // 炎/Ubisoft swirlアイコンの自動除去処理（左マージン消去方式）
          // ============================================================
          // 各行について「最初に連続した白の空白ギャップが現れる位置まで」を
          // 丸ごと白で塗りつぶす。これにより炎/スワールなどの左端アイコンを
          // 形状に依存せず確実に除去できる。
          const rowCount = 10;
          const rowHeight = Math.floor(canvas.height / rowCount);
          // 左端からどこまでスキャンするか（プレイヤー名の先頭が入らない幅）
          const maxScanX = Math.round(canvas.width * 0.30);
          // 列が「黒い」とみなす最小黒ピクセル数（行高の4%以上で黒判定）
          const colBlackThreshold = Math.max(1, Math.floor(rowHeight * 0.04));
          // 「白の空白ギャップ」とみなす最小連続白列数 (4x拡大で約3〜4px相当)
          const whiteGapMinWidth = 12;

          for (let row = 0; row < rowCount; row++) {
            const yStart = row * rowHeight;
            const yEnd = Math.min((row + 1) * rowHeight, canvas.height);
            // 上下5%を除外してスキャン（境界線の干渉防止）
            const scanYStart = yStart + Math.floor((yEnd - yStart) * 0.05);
            const scanYEnd = yEnd - Math.floor((yEnd - yStart) * 0.05);

            // 各x列の黒ピクセル数を集計
            const colBlackCount = new Array(maxScanX).fill(0);
            for (let x = 0; x < maxScanX; x++) {
              let cnt = 0;
              for (let y = scanYStart; y < scanYEnd; y++) {
                if (data[(y * canvas.width + x) * 4] === 0) cnt++;
              }
              colBlackCount[x] = cnt;
            }

            // 左端から右へ走査し、「黒い列が1つ以上あった後に
            // whiteGapMinWidth 以上の連続白列が来た位置」を探す
            let foundBlack = false;
            let eraseUpTo = 0; // この列まで（含まない）を白に塗る
            let whiteRun = 0;

            for (let x = 0; x < maxScanX; x++) {
              const isBlack = colBlackCount[x] > colBlackThreshold;
              if (isBlack) {
                foundBlack = true;
                whiteRun = 0;
              } else {
                if (foundBlack) {
                  whiteRun++;
                  if (whiteRun >= whiteGapMinWidth) {
                    // ギャップが見つかった：ギャップの開始位置（アイコン末尾+1）まで消去
                    eraseUpTo = x - whiteGapMinWidth + 1;
                    break;
                  }
                }
              }
            }

            // eraseUpTo までの列を白に塗りつぶす
            if (eraseUpTo > 0) {
              for (let x = 0; x < eraseUpTo; x++) {
                for (let y = yStart; y < yEnd; y++) {
                  const idx = (y * canvas.width + x) * 4;
                  data[idx] = 255;
                  data[idx + 1] = 255;
                  data[idx + 2] = 255;
                }
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);

          // PNG形式でBase64書き出し
          const croppedBase64 = canvas.toDataURL('image/png').split(',')[1];
          resolve(croppedBase64);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = (err) => reject(new Error('Failed to load image for cropping'));
      img.src = `data:image/png;base64,${base64Str}`;
    });
  };

  // Tesseract.jsを読み込み
  useEffect(() => {
    const loadTesseract = async () => {
      try {
        // CDNからTesseract.jsを読み込み
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js';
        script.async = true;
        script.onload = () => {
          addDebugLog('✓ Tesseract.js を読み込みました', 'success');
          setTesseractReady(true);
        };
        script.onerror = () => {
          addDebugLog('✗ Tesseract.js の読み込みに失敗しました', 'error');
        };
        document.head.appendChild(script);
      } catch (error) {
        addDebugLog(`✗ Tesseract読み込みエラー: ${error}`, 'error');
      }
    };

    loadTesseract();
  }, []);

  // ページ読み込み時の初期化（画像パスまたはファイルがある場合のみ処理）
  useEffect(() => {
    if (tesseractReady) {
      addDebugLog('ページ初期化完了', 'info');
      if (imageFile || imagePath) {
        processImageFile();
      }
    }
  }, [tesseractReady]);

  const processImageFile = async (passedFile?: File) => {
    const activeFile = passedFile || imageFile;
    if (!activeFile && !imagePath) {
      addDebugLog('エラー: 画像ファイルが設定されていません', 'error');
      return;
    }

    if (!tesseractReady) {
      addDebugLog('⚠️ Tesseract.jsを読み込み中です。お待ちください...', 'warning');
      return;
    }

    setIsLoading(true);
    addDebugLog(`画像処理開始`, 'info');
    setCroppedImage('');

    try {
      let base64Image: string;
      let fileName: string;

      if (activeFile) {
        // ファイルがある場合はFormDataで送信
        addDebugLog(`ファイルアップロード: ${activeFile.name}`, 'info');
        const formData = new FormData();
        formData.append('file', activeFile);

        const response = await fetch('/api/process-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        base64Image = data.base64Image;
        fileName = data.fileName;
      } else {
        // ファイルパスを使用する場合
        addDebugLog(`ファイルパス処理: ${imagePath}`, 'info');
        const response = await fetch('/api/process-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imagePath }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || error.error);
        }

        const data = await response.json();
        base64Image = data.base64Image;
        fileName = data.fileName;
      }

      addDebugLog(`✓ Base64変換完了 (${(base64Image.length / 1024).toFixed(1)}KB)`, 'success');

      let ocrInputBase64 = base64Image;
      if (autoCrop) {
        try {
          addDebugLog('✂️ スコアボードID部分を自動切り抜き中...', 'info');
          const cropped = await cropImageToCenterGrid(base64Image);
          ocrInputBase64 = cropped;
          setCroppedImage(cropped);
          addDebugLog('✓ 切り抜き成功', 'success');
        } catch (cropErr: any) {
          addDebugLog(`⚠️ 切り抜きに失敗しました (元画像で処理します): ${cropErr.message || cropErr}`, 'warning');
        }
      }

      // Tesseract.jsでOCR処理
      addDebugLog(`🔍 OCR処理開始 (英語のみ)...`, 'info');
      const Tesseract = (window as any).Tesseract;

      const result = await Tesseract.recognize(
        `data:image/png;base64,${ocrInputBase64}`,
        'eng',
        {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              const percent = Math.round(m.progress * 100);
              console.log(`OCR Progress: ${percent}%`);
            }
          },
          parameters: {
            tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-|',
          },
        }
      );

      const extractedText = result.data.text;
      addDebugLog(`✓ OCR完了 (${extractedText.length}文字)`, 'success');

      // テキストからプレイヤーIDを抽出
      const playerIds = parsePlayerIdsFromText(extractedText);
      setExtractedPlayerIds(playerIds);
      addDebugLog(`✓ プレイヤーID抽出成功 (${playerIds.length}人)`, 'success');
      playerIds.forEach((id, idx) => {
        addDebugLog(`  [${idx + 1}] ${id}`, 'info');
      });

      // 各プレイヤーの詳細情報を取得
      // スコアボードは上5人が味方・下5人が敵の順番
      const alliesData: PlayerStats[] = [];
      const enemiesData: PlayerStats[] = [];

      for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        addDebugLog(`データ取得中 (${i + 1}/${playerIds.length}): ${playerId}`, 'info');

        const playerResponse = await fetch(
          `/api/tracker?ubiId=${encodeURIComponent(playerId)}`
        );
        if (playerResponse.ok) {
          const playerData = await playerResponse.json();
          // 最初の5人を味方、残りを敵として分類
          if (i < 5) {
            alliesData.push(playerData);
          } else {
            enemiesData.push(playerData);
          }
          addDebugLog(`✓ ${playerId} のデータ取得完了`, 'success');
        } else {
          addDebugLog(`✗ ${playerId} のデータ取得失敗 (${playerResponse.status})`, 'warning');
        }
      }

      setAllies(alliesData);
      setEnemies(enemiesData);
      const total = alliesData.length + enemiesData.length;
      if (total > 0) {
        addDebugLog(
          `✓ プレイヤー情報を取得完了 (味方${alliesData.length}人 / 敵${enemiesData.length}人)`,
          'success'
        );
      } else if (playerIds.length > 0) {
        addDebugLog('⚠️ プレイヤーIDは抽出されましたが、データ取得に失敗しました', 'warning');
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
      // ファイルオブジェクトを直接渡して即座に処理を開始
      processImageFile(file);
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
        // ファイルオブジェクトを直接渡して即座に処理を開始
        processImageFile(file);
      }
    }
  };

  const handleRemovePlayer = (ubiId: string) => {
    setAllies((prev) => prev.filter((p) => p.ubiId.toLowerCase() !== ubiId.toLowerCase()));
    setEnemies((prev) => prev.filter((p) => p.ubiId.toLowerCase() !== ubiId.toLowerCase()));
    addDebugLog(`削除: ${ubiId}`, 'warning');
  };

  const players = [...allies, ...enemies];

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
                onClick={() => processImageFile()}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {isLoading ? '⏳ 処理中...' : '🔍 解析'}
              </button>
            </div>

            {/* 切り抜き設定トグル */}
            <div className="flex items-center space-x-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                id="autoCropToggle"
                checked={autoCrop}
                onChange={(e) => setAutoCrop(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <label htmlFor="autoCropToggle" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
                ✂️ スコアボード自動切り抜き (中央プレイヤーID列のみをOCR)
              </label>
            </div>

            {/* 切り抜きプレビュー */}
            {croppedImage && (
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
                <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                  切り抜きプレビュー (OCR対象エリア)
                </p>
                <img
                  src={`data:image/png;base64,${croppedImage}`}
                  alt="Cropped scoreboard preview"
                  className="max-h-48 object-contain border border-slate-700 rounded shadow-md"
                />
              </div>
            )}

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

      {/* プレイヤーカード グリッド (5x2: 上行=味方, 下行=敵) */}
      <div className="max-w-screen-2xl mx-auto">
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
          <div className="space-y-6">
            {/* 味方チーム */}
            {allies.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-400"></span>
                  味方チーム ({allies.length}人)
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allies.map((player) => (
                    <div key={player.ubiId} className="relative group">
                      <PlayerStatsCard stats={player} />
                      <button
                        onClick={() => handleRemovePlayer(player.ubiId)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg text-sm"
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 敵チーム */}
            {enemies.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-400"></span>
                  敵チーム ({enemies.length}人)
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {enemies.map((player) => (
                    <div key={player.ubiId} className="relative group">
                      <PlayerStatsCard stats={player} />
                      <button
                        onClick={() => handleRemovePlayer(player.ubiId)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg text-sm"
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
