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
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
      {/* Gemini API Key 入力欄 */}
      <div className="qlc-input-wrap w-full sm:w-fit">
        <span className="qlc-input-label">Gemini API</span>
        <input
          type={showApiKey ? 'text' : 'password'}
          placeholder="APIキーを入力"
          value={geminiApiKey}
          onChange={(e) => {
            const val = e.target.value;
            setGeminiApiKey(val);
            localStorage.setItem('gemini_api_key', val);
          }}
          className="qlc-input sm:w-32"
          id="gemini-api-key-input"
        />
        <button
          type="button"
          id="toggle-api-key-visibility"
          onClick={() => setShowApiKey(!showApiKey)}
          className="qlc-eye-btn"
          title={showApiKey ? '非表示' : '表示'}
        >
          {showApiKey ? '●' : '○'}
        </button>
      </div>

      {/* ファイル選択ボタン + 切り抜きトグル */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative cursor-pointer shrink-0">
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <span className="qlc-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            ファイルを選択
          </span>
        </label>

        <label className="qlc-check-label">
          <input
            type="checkbox"
            checked={autoCrop}
            onChange={(e) => setAutoCrop(e.target.checked)}
            id="auto-crop-toggle"
          />
          自動切り抜き
        </label>

        <PlatformToggle value={platform} onChange={setPlatform} />
      </div>
    </div>
  );
}
