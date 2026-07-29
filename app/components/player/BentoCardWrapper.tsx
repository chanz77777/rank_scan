'use client';

import React from 'react';

interface BentoCardWrapperProps {
  isHero?: boolean;
  isThreat?: boolean;
  children: React.ReactNode;
}

export default function BentoCardWrapper({
  isHero = false,
  isThreat = false,
  children,
}: BentoCardWrapperProps) {
  const wrapperClasses = [
    'relative',
    isHero ? 'bento-card-hero-wrapper' : 'bento-card-normal-wrapper',
    isThreat ? 'bento-card-threat-wrapper' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {/* MVP バッジ */}
      {isHero && (
        <div className="bento-badge bento-badge-mvp flex items-center gap-1">
          <span>👑</span>
          <span>MVP</span>
        </div>
      )}

      {/* THREAT バッジ */}
      {isThreat && (
        <div className="bento-badge bento-badge-threat flex items-center gap-1">
          <span>⚠️</span>
          <span>THREAT</span>
        </div>
      )}

      {children}
    </div>
  );
}
