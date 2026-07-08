'use client';

import { useState, useEffect } from 'react';
import PlayerStatsCard from '@/app/components/PlayerStatsCard';
import { PlayerStats } from '@/app/lib/types';
import { parsePlayerIdsFromText } from '@/app/lib/ocrProcessor';

const DEFAULT_IMAGE_PATH = '';



declare global {
  interface Window {
    Tesseract: typeof import('tesseract.js');
  }
}

export default function Home() {
  const [allies, setAllies] = useState<PlayerStats[]>([]);
  const [enemies, setEnemies] = useState<PlayerStats[]>([]);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [imagePath, setImagePath] = useState(DEFAULT_IMAGE_PATH);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [extractedPlayerIds, setExtractedPlayerIds] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [tesseractReady, setTesseractReady] = useState(false);
  const [autoCrop, setAutoCrop] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const addDebugLog = (message: string, _type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setStatusMsg(message);
  };


  // 画像からスコアボードのプレイヤー名列部分（中央の特定エリア）を切り抜く
  // アイコン除去は行わず、切り抜き＋二値化のみ実施
  const cropImageToCenterGrid = (base64Str: string, mimeType: string = 'image/png'): Promise<string> => {
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
          // 横: 29.0% 〜 46.0% (幅 17.0%)
          // 縦: 29% 〜 80% (高さ 51%)
          const cropX = Math.round(width * 0.29);
          const cropY = Math.round(height * 0.29);
          const cropW = Math.round(width * 0.17);
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
            // しきい値を100に設定: グレーアウト文字（切断プレイヤー等）も捕捉できるよう
            // 140だと輝度100-140の文字が白飛びして認識されない
            const binValue = gray > 100 ? 0 : 255;

            data[i] = binValue;     // R
            data[i + 1] = binValue; // G
            data[i + 2] = binValue; // B
          }

          ctx.putImageData(imgData, 0, 0);

          // PNG形式でBase64書き出し
          const croppedBase64 = canvas.toDataURL('image/png').split(',')[1];
          resolve(croppedBase64);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = `data:${mimeType};base64,${base64Str}`;
    });
  };


  useEffect(() => {
    // ローカルストレージからAPIキーを読み込む
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }

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

    if (!tesseractReady && !geminiApiKey) {
      addDebugLog('⚠️ Tesseract.jsを読み込み中です。お待ちください...', 'warning');
      return;
    }

    setIsLoading(true);
    addDebugLog(`画像処理開始`, 'info');
    setStatusMsg('処理中...');

    try {
      let base64Image: string;
      let fileName: string;
      let activeMimeType = 'image/png'; // デフォルト

      if (activeFile) {
        // クライアント側でファイルをBase64に変換（Vercelの4.5MB制限を回避）
        addDebugLog(`クライアント側でBase64に変換中: ${activeFile.name}`, 'info');

        let fileMime = activeFile.type;
        if (!fileMime) {
          const ext = activeFile.name.split('.').pop()?.toLowerCase();
          if (ext === 'jxr') {
            fileMime = 'image/jxr';
          } else if (ext === 'png') {
            fileMime = 'image/png';
          } else if (ext === 'webp') {
            fileMime = 'image/webp';
          } else if (ext === 'jpg' || ext === 'jpeg') {
            fileMime = 'image/jpeg';
          }
        }
        if (fileMime) {
          activeMimeType = fileMime;
        }

        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = () => reject(new Error('Failed to read file on the client'));
          reader.readAsDataURL(activeFile);
        });

        fileName = activeFile.name;
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

        // 拡張子から MIME タイプを判定
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'jxr') {
          activeMimeType = 'image/jxr';
        } else if (ext === 'png') {
          activeMimeType = 'image/png';
        } else if (ext === 'webp') {
          activeMimeType = 'image/webp';
        } else if (ext === 'jpg' || ext === 'jpeg') {
          activeMimeType = 'image/jpeg';
        }
      }

      addDebugLog(`✓ Base64変換完了 (${(base64Image.length / 1024).toFixed(1)}KB)`, 'success');

      let ocrInputBase64 = base64Image;
      let ocrInputMimeType = activeMimeType;
      if (autoCrop) {
        try {
          addDebugLog('✂️ スコアボードID部分を自動切り抜き中...', 'info');
          const cropped = await cropImageToCenterGrid(base64Image, activeMimeType);
          ocrInputBase64 = cropped;
          ocrInputMimeType = 'image/png'; // 切り抜き結果は常に PNG
          addDebugLog('✓ 切り抜き成功', 'success');
        } catch (cropErr: any) {
          addDebugLog(`⚠️ 切り抜きに失敗しました (元画像で処理します): ${cropErr.message || cropErr}`, 'warning');
        }
      }

      let extractedText = '';

      if (geminiApiKey) {
        // Gemini OCRで処理
        addDebugLog(`🔍 Gemini OCR 処理開始...`, 'info');
        const ocrResponse = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: ocrInputBase64,
            mimeType: ocrInputMimeType,
            apiKey: geminiApiKey,
          }),
        });

        if (!ocrResponse.ok) {
          const errData = await ocrResponse.json();
          throw new Error(errData.details || errData.error || 'Gemini OCR failed');
        }

        const ocrData = await ocrResponse.json();
        extractedText = ocrData.text;
        addDebugLog(`✓ Gemini OCR 完了 (${extractedText.length}文字)`, 'success');
      } else {
        // Tesseract.jsでOCR処理
        addDebugLog(`🔍 OCR処理開始 (英語のみ)...`, 'info');
        const Tesseract = (window as any).Tesseract;

        const result = await Tesseract.recognize(
          `data:${ocrInputMimeType};base64,${ocrInputBase64}`,
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
              // 単一カラムの可変サイズテキストとして解析（スコアボードの名前列に最適）
              tessedit_pageseg_mode: '4',
            },
          }
        );

        extractedText = result.data.text;
        addDebugLog(`✓ OCR完了 (${extractedText.length}文字)`, 'success');
      }

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

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setStatusMsg(`⚠️ 非対応形式: ${file.name}（JPEG・PNGのみ対応）`);
        return;
      }
      setImageFile(file);
      setImagePath(file.name);
      processImageFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
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
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setStatusMsg(`⚠️ 非対応形式: ${file.name}（JPEG・PNGのみ対応）`);
        return;
      }
      setImageFile(file);
      setImagePath(file.name);
      processImageFile(file);
    }
  };

  const handleRemovePlayer = (ubiId: string) => {
    setAllies((prev) => prev.filter((p) => p.ubiId.toLowerCase() !== ubiId.toLowerCase()));
    setEnemies((prev) => prev.filter((p) => p.ubiId.toLowerCase() !== ubiId.toLowerCase()));
  };


  return (
    <main
      className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 全画面D&Dオーバーレイ */}
      {isDragActive && (
        <div className="fixed inset-0 z-50 bg-blue-900/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-6xl mb-4">📥</p>
            <p className="text-3xl font-bold text-blue-200">ここにドロップ</p>
            <p className="text-slate-300 mt-2">JPEG / PNG</p>
          </div>
        </div>
      )}

      <div className="py-8 px-4">
        {/* ヘッダー */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">R6 Siege Stats Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">
                {isLoading ? (
                  <span className="text-blue-400 animate-pulse">{statusMsg || '処理中...'}</span>
                ) : statusMsg ? (
                  <span className="text-slate-300">{statusMsg}</span>
                ) : (
                  'スクリーンショット（JPEG/PNG）をここにドラッグ＆ドロップ'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Gemini API Key 入力欄 */}
              <div className="relative flex items-center bg-slate-800/85 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition-all duration-200 shadow-inner">
                <span className="text-xs text-slate-400 mr-2 font-semibold select-none">Gemini API:</span>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="APIキーを入力..."
                  value={geminiApiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGeminiApiKey(val);
                    localStorage.setItem('gemini_api_key', val);
                  }}
                  className="bg-transparent border-none text-white text-xs outline-none w-32 focus:ring-0 placeholder-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-slate-500 hover:text-slate-300 ml-1.5 focus:outline-none text-xs"
                  title={showApiKey ? '非表示' : '表示'}
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>

              {/* ファイル選択ボタン */}
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <span
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg text-sm flex items-center gap-2 cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  📂 ファイルを選択
                </span>
              </label>
              {/* 切り抜きトグル */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-400 hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={autoCrop}
                  onChange={(e) => setAutoCrop(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                自動切り抜き
              </label>
            </div>
          </div>
        </div>

        {/* 抽出プレイヤーID（デフォルト非表示） */}
        {extractedPlayerIds.length > 0 && (
          <div className="max-w-7xl mx-auto mb-6">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2"
            >
              {showDebug ? '▼ 抽出ID を隠す' : `▶ 抽出ID を表示 (${extractedPlayerIds.length}人)`}
            </button>
            {showDebug && (
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-1.5">
                {extractedPlayerIds.map((id, index) => (
                  <div key={id} className="bg-slate-800 rounded px-2 py-1 border border-slate-700 text-center">
                    <p className="text-xs text-slate-500">#{index + 1}</p>
                    <p className="text-xs text-white font-mono truncate" title={id}>{id}</p>
                    {[...allies, ...enemies].find((p: PlayerStats) => p.ubiId === id) && (
                      <p className="text-xs text-green-400">✓</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* プレイヤーカード */}
        <div className="max-w-screen-2xl mx-auto">
          {allies.length + enemies.length === 0 ? (
            <div className="text-center py-24">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="text-slate-400 text-sm">{statusMsg}</p>
                </div>
              ) : (
                <div className="text-slate-600">
                  <p className="text-6xl mb-4">🖼️</p>
                  <p className="text-xl">スクリーンショットをドラッグ＆ドロップ</p>
                  <p className="text-sm mt-2">JPEG / PNG のみ対応</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* 味方チーム */}
              {allies.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                    味方チーム ({allies.length}人)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {allies.map((player) => (
                      <div key={player.ubiId} className="relative group">
                        <PlayerStatsCard stats={player} />
                        <button
                          onClick={() => handleRemovePlayer(player.ubiId)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg text-xs"
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
                  <h2 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>
                    敵チーム ({enemies.length}人)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {enemies.map((player) => (
                      <div key={player.ubiId} className="relative group">
                        <PlayerStatsCard stats={player} />
                        <button
                          onClick={() => handleRemovePlayer(player.ubiId)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg text-xs"
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
        <div className="max-w-7xl mx-auto mt-16 pt-6 border-t border-slate-800">
          <p className="text-center text-slate-600 text-xs">
            R6 Siege Stats Dashboard — Data from R6 Tracker Network
          </p>
        </div>
      </div>
    </main>
  );
}
