'use client';

import React from 'react';

interface IdEditorPanelProps {
  extractedPlayerIds: string[];
  showIdEditor: boolean;
  setShowIdEditor: React.Dispatch<React.SetStateAction<boolean>>;
  editableIds: string[];
  handleEditableIdChange: (index: number, value: string) => void;
  handleReSearchSingle: (index: number) => void;
  reSearchingIndex: number | null;
}

export default function IdEditorPanel({
  extractedPlayerIds,
  showIdEditor,
  setShowIdEditor,
  editableIds,
  handleEditableIdChange,
  handleReSearchSingle,
  reSearchingIndex,
}: IdEditorPanelProps) {
  if (extractedPlayerIds.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto mb-6">
      <button
        type="button"
        onClick={() => setShowIdEditor((prev) => !prev)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span>{showIdEditor ? '▼' : '▶'}</span>
        プレイヤーIDを手動修正
      </button>

      {showIdEditor && (
        <div className="mt-3 bg-slate-800/60 border border-slate-700 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {editableIds.map((id, idx) => {
              const isAlly = idx < 5;
              return (
                <div
                  key={idx}
                  className={[
                    'flex flex-col gap-1.5 rounded-lg p-2 border',
                    isAlly ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30',
                  ].join(' ')}
                >
                  <span className={`text-xs font-semibold ${isAlly ? 'text-blue-300' : 'text-red-300'}`}>
                    {idx < 5 ? `味方${idx + 1}` : `敵${idx - 4}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={id}
                      onChange={(e) => handleEditableIdChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleReSearchSingle(idx);
                      }}
                      className={[
                        'flex-1 min-w-0 rounded px-2 py-1 text-xs text-white font-mono outline-none border',
                        isAlly
                          ? 'bg-blue-950/40 border-blue-500/40 focus:border-blue-400'
                          : 'bg-red-950/40 border-red-500/40 focus:border-red-400',
                      ].join(' ')}
                    />
                    <button
                      type="button"
                      onClick={() => handleReSearchSingle(idx)}
                      disabled={reSearchingIndex === idx}
                      className={[
                        'shrink-0 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded transition-colors',
                        isAlly ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700',
                      ].join(' ')}
                    >
                      {reSearchingIndex === idx ? '...' : '🔍'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
