'use client';

import { useEffect, useRef, useState } from 'react';

export type Platform = 'ubi' | 'psn' | 'xbl';

interface PlatformOption {
  value: Platform;
  label: string;
  activeBg: string;
}

const PLATFORMS: PlatformOption[] = [
  { value: 'ubi', label: 'PC',   activeBg: 'hsl(230, 60%, 30%)' },
  { value: 'psn', label: 'PS',   activeBg: 'hsl(230, 70%, 38%)' },
  { value: 'xbl', label: 'XBOX', activeBg: 'hsl(230, 55%, 28%)' },
];

interface PlatformToggleProps {
  value: Platform;
  onChange: (value: Platform) => void;
  className?: string;
}

export default function PlatformToggle({ value, onChange, className = '' }: PlatformToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const activeIndex = PLATFORMS.findIndex((p) => p.value === value);
  const active = PLATFORMS[activeIndex];

  // 💡 選択中ボタンの実測位置・幅をpx単位で取得し、インジケーターに反映（ズレ防止の核心部分）
  const updateIndicator = () => {
    const container = containerRef.current;
    const activeIndex = PLATFORMS.findIndex((p) => p.value === value);
    const btn = btnRefs.current[activeIndex];
    if (!container || !btn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    setIndicatorStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  };

  useEffect(() => {
    updateIndicator();
    // 画面幅変化（レスポンシブ）でもズレないように再計測
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center rounded-full p-1 select-none ${className}`}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-low)' }}
      role="radiogroup"
      aria-label="プラットフォーム選択"
    >
      {/* 💡 スライドするインジケーター（中立カラー、選択強調のみ） */}
      <div
        className="absolute top-1 bottom-1 rounded-full pointer-events-none"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          background: active.activeBg,
          boxShadow: '0 0 0 1px rgba(91,115,240,0.35)',
          transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {PLATFORMS.map((p, idx) => {
        const isActive = p.value === value;
        return (
          <button
            key={p.value}
            ref={(el) => { btnRefs.current[idx] = el; }}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(p.value)}
            className={[
              'relative z-10 flex-1 px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full',
              'transition-colors duration-300 ease-out',
              isActive ? 'text-white' : 'hover:text-white',
            ].join(' ')}
            style={{ color: isActive ? '#fff' : 'var(--text-muted)' }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}