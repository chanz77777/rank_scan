'use client';

import React from 'react';

// 白縁取り（細め）テキストスタイル
export const textStrokeWhiteStyle = {
  color: '#0f172a',
  textShadow: `
    -1px -1px 0 #ffffff,  
     1px -1px 0 #ffffff,
    -1px  1px 0 #ffffff,
     1px  1px 0 #ffffff
  `,
};

// 内側黒縁＋外側白縁のダブルアウトラインスタイル
export const getColoredDoubleStrokeStyle = (color: string) => ({
  color: color,
  textShadow: `
    -0.5px -0.5px 0 #000000,
     0.5px -0.5px 0 #000000,
    -0.5px  0.5px 0 #000000,
     0.5px  0.5px 0 #000000,
    -2px -2px 0 #ffffff,
     0px -2px 0 #ffffff,
     2px -2px 0 #ffffff,
    -2px  0px 0 #ffffff,
     2px  0px 0 #ffffff,
    -2px  2px 0 #ffffff,
     0px  2px 0 #ffffff,
     2px  2px 0 #ffffff
  `,
});

// アイコンヘルパー
export function colorToIcon(color: string): string {
  if (color === '#f87171') return '🔥🔥🔥🔥';
  if (color === '#c084fc') return '✨✨✨';
  if (color === '#006400') return '🍃🍃';
  if (color === '#ffd700') return '⚡';
  return '💧';
}

export const getKdColorStyle = (kd: number) => {
  let color = '#4169e1';
  if (kd >= 1.5) color = '#f87171';
  else if (kd >= 1.0) color = '#c084fc';
  else if (kd >= 0.8) color = '#006400';
  else if (kd >= 0.5) color = '#ffd700';

  return getColoredDoubleStrokeStyle(color);
};

export const getKdIcon = (kd: number): string => {
  if (kd >= 1.5) return colorToIcon('#f87171');
  if (kd >= 1.0) return colorToIcon('#c084fc');
  if (kd >= 0.8) return colorToIcon('#006400');
  if (kd >= 0.5) return colorToIcon('#ffd700');
  return colorToIcon('#4169e1');
};

export const getWrColorStyle = (wr: number) => {
  let color = '#4169e1';
  if (wr >= 70) color = '#f87171';
  else if (wr >= 60) color = '#c084fc';
  else if (wr >= 50) color = '#006400';
  else if (wr >= 30) color = '#ffd700';

  return getColoredDoubleStrokeStyle(color);
};

export const getWrIcon = (wr: number): string => {
  if (wr >= 70) return colorToIcon('#f87171');
  if (wr >= 60) return colorToIcon('#c084fc');
  if (wr >= 50) return colorToIcon('#006400');
  if (wr >= 30) return colorToIcon('#ffd700');
  return colorToIcon('#4169e1');
};

export const getGamesColorStyle = (games: number) => {
  let color = '#4169e1';
  if (games >= 5000) color = '#f87171';
  else if (games >= 3000) color = '#c084fc';
  else if (games >= 1000) color = '#006400';
  else if (games >= 500) color = '#ffd700';

  return getColoredDoubleStrokeStyle(color);
};

export const getGamesIcon = (games: number): string => {
  if (games >= 5000) return colorToIcon('#f87171');
  if (games >= 3000) return colorToIcon('#c084fc');
  if (games >= 1000) return colorToIcon('#006400');
  if (games >= 500) return colorToIcon('#ffd700');
  return colorToIcon('#4169e1');
};

interface StatRowProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  valueStyle?: React.CSSProperties;
}

export default function StatRow({ icon, label, value, valueStyle }: StatRowProps) {
  return (
    <div
      className="flex items-center py-2 px-2 rounded min-w-0"
      style={{ background: 'rgba(15,23,42,0.45)', borderBottom: '1px solid rgba(148,163,184,0.15)' }}
    >
      <div className="w-[62px] flex-shrink-0 flex items-center justify-start overflow-hidden">
        <span className="text-[12px] leading-none whitespace-nowrap tracking-tighter">{icon}</span>
      </div>
      <div className="w-[50px] flex-shrink-0 flex items-center justify-center">
        <span
          className="text-[10px] font-bold uppercase tracking-wider leading-none text-center truncate"
          style={textStrokeWhiteStyle}
        >
          {label}
        </span>
      </div>
      <div className="flex-1 flex items-center justify-end min-w-0">
        <span
          className="text-[16px] font-black leading-none tabular-nums flex items-baseline whitespace-nowrap"
          style={valueStyle ?? textStrokeWhiteStyle}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
