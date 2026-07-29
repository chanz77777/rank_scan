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
      {children}
    </div>
  );
}
