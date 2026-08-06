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
    <div className="max-w-7xl mx-auto mb-4">
      <button
        type="button"
        id="id-editor-toggle"
        onClick={() => setShowIdEditor((prev) => !prev)}
        className="qlc-toggle-btn"
      >
        <span style={{ fontSize: 10 }}>{showIdEditor ? '▼' : '▶'}</span>
        プレイヤーIDを手動修正
      </button>

      {showIdEditor && (
        <div className="mt-3 qlc-id-editor-panel">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {editableIds.map((id, idx) => {
              const isAlly = idx < 5;
              return (
                <div
                  key={idx}
                  className={`qlc-id-cell ${isAlly ? 'qlc-id-cell-ally' : 'qlc-id-cell-enemy'}`}
                >
                  <span className={isAlly ? 'qlc-id-cell-label-ally' : 'qlc-id-cell-label-enemy'}>
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
                      className="qlc-id-input"
                      id={`player-id-input-${idx}`}
                    />
                    <button
                      type="button"
                      id={`re-search-btn-${idx}`}
                      onClick={() => handleReSearchSingle(idx)}
                      disabled={reSearchingIndex === idx}
                      className={isAlly ? 'qlc-id-btn-ally' : 'qlc-id-btn-enemy'}
                    >
                      {reSearchingIndex === idx ? '…' : '→'}
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
