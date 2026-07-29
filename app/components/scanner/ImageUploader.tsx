'use client';

import React from 'react';
import PlatformToggle, { Platform } from '@/app/components/PlatformToggle';

interface ImageUploaderProps {
  geminiApiKey: string;
  setGeminiApiKey: (val: string) => void;
  showApiKey: boolean;
  setShowApiKey: (val: boolean) => void;
  autoCrop: boolean;
  setAutoCrop: (val: boolean) => void;
  platform: Platform;
  setPlatform: (p: Platform) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageUploader({
  geminiApiKey,
  setGeminiApiKey,
  showApiKey,
  setShowApiKey,
  autoCrop,
  setAutoCrop,
  platform,
  setPlatform,
  handleFileSelect,
}: ImageUploaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
      {/* Gemini API Key 入力欄 */}
      <div className="relative flex items-center bg-slate-800/85 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition-all duration-200 shadow-inner w-full sm:w-fit">
        <span className="text-xs text-slate-400 mr-2 font-semibold select-none whitespace-nowrap">Gemini API:</span>
        <input
          type={showApiKey ? 'text' : 'password'}
          placeholder="APIキーを入力..."
          value={geminiApiKey}
          onChange={(e) => {
            const val = e.target.value;
            setGeminiApiKey(val);
            localStorage.setItem('gemini_api_key', val);
          }}
          className="bg-transparent border-none text-white text-xs outline-none w-full min-w-0 sm:w-32 focus:ring-0 placeholder-slate-600 font-mono"
        />
        <button
          type="button"
          onClick={() => setShowApiKey(!showApiKey)}
          className="text-slate-500 hover:text-slate-300 ml-1.5 focus:outline-none text-xs shrink-0"
          title={showApiKey ? '非表示' : '表示'}
        >
          {showApiKey ? '🙈' : '👁️'}
        </button>
      </div>

      {/* ファイル選択ボタン + 切り抜きトグル */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative cursor-pointer shrink-0">
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap">
            📂 ファイルを選択
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap shrink-0">
          <input
            type="checkbox"
            checked={autoCrop}
            onChange={(e) => setAutoCrop(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          自動切り抜き
        </label>
        <PlatformToggle value={platform} onChange={setPlatform} />
      </div>
    </div>
  );
}
