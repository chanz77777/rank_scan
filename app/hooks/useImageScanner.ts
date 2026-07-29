'use client';

import { useState, useEffect } from 'react';
import { PlayerStats } from '@/app/lib/types';
import { parsePlayerIdsFromText } from '@/app/lib/ocrProcessor';
import { cropImageToCenterGrid } from '@/app/lib/imageProcessor';
import type { Platform } from '@/app/components/PlatformToggle';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

export function useImageScanner(
  platform: Platform,
  setPlayerSlots: (slots: (PlayerStats | null)[]) => void,
  setEditableIds: (ids: string[]) => void
) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [imagePath, setImagePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [extractedPlayerIds, setExtractedPlayerIds] = useState<string[]>([]);
  const [tesseractReady, setTesseractReady] = useState(false);
  const [autoCrop, setAutoCrop] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const addDebugLog = (message: string, _type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setStatusMsg(message);
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }

    const loadTesseract = async () => {
      try {
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
      let activeMimeType = 'image/png';

      if (activeFile) {
        addDebugLog(`クライアント側でBase64に変換中: ${activeFile.name}`, 'info');

        let fileMime = activeFile.type;
        if (!fileMime) {
          const ext = activeFile.name.split('.').pop()?.toLowerCase();
          if (ext === 'jxr') fileMime = 'image/jxr';
          else if (ext === 'png') fileMime = 'image/png';
          else if (ext === 'webp') fileMime = 'image/webp';
          else if (ext === 'jpg' || ext === 'jpeg') fileMime = 'image/jpeg';
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

        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'jxr') activeMimeType = 'image/jxr';
        else if (ext === 'png') activeMimeType = 'image/png';
        else if (ext === 'webp') activeMimeType = 'image/webp';
        else if (ext === 'jpg' || ext === 'jpeg') activeMimeType = 'image/jpeg';
      }

      addDebugLog(`✓ Base64変換完了 (${(base64Image.length / 1024).toFixed(1)}KB)`, 'success');

      let ocrInputBase64 = base64Image;
      let ocrInputMimeType = activeMimeType;
      if (autoCrop) {
        try {
          addDebugLog('✂️ スコアボードID部分を自動切り抜き中...', 'info');
          const cropped = await cropImageToCenterGrid(base64Image, activeMimeType);
          ocrInputBase64 = cropped;
          ocrInputMimeType = 'image/png';
          addDebugLog('✓ 切り抜き成功', 'success');
        } catch (cropErr: any) {
          addDebugLog(`⚠️ 切り抜きに失敗しました (元画像で処理します): ${cropErr.message || cropErr}`, 'warning');
        }
      }

      let extractedText = '';

      if (geminiApiKey) {
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
              tessedit_pageseg_mode: '4',
            },
          }
        );

        extractedText = result.data.text;
        addDebugLog(`✓ OCR完了 (${extractedText.length}文字)`, 'success');
      }

      const playerIds = parsePlayerIdsFromText(extractedText);
      setExtractedPlayerIds(playerIds);
      setEditableIds(playerIds);
      addDebugLog(`✓ プレイヤーID抽出成功 (${playerIds.length}人)`, 'success');

      const slotsData: (PlayerStats | null)[] = new Array(playerIds.length).fill(null);

      for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        addDebugLog(`データ取得中 (${i + 1}/${playerIds.length}): ${playerId}`, 'info');

        const playerResponse = await fetch(
          `/api/tracker?ubiId=${encodeURIComponent(playerId)}&platform=${platform}`
        );
        if (playerResponse.ok) {
          const playerData = await playerResponse.json();
          slotsData[i] = playerData;
          addDebugLog(`✓ ${playerId} のデータ取得完了`, 'success');
        } else {
          addDebugLog(`✗ ${playerId} のデータ取得失敗 (${playerResponse.status})`, 'warning');
        }
      }

      setPlayerSlots(slotsData);
      const successCount = slotsData.filter((p) => p !== null).length;
      if (successCount > 0) {
        addDebugLog(
          `✓ プレイヤー情報を取得完了 (${successCount}/${playerIds.length}人)`,
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

  return {
    geminiApiKey,
    setGeminiApiKey,
    showApiKey,
    setShowApiKey,
    isLoading,
    isDragActive,
    extractedPlayerIds,
    setExtractedPlayerIds,
    autoCrop,
    setAutoCrop,
    statusMsg,
    setStatusMsg,
    handleFileSelect,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
