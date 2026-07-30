'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'official' | 'white' | 'dark' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  href?: string;
}

const SIZE_MAP = {
  sm: 'h-8 md:h-9',
  md: 'h-10 md:h-12',
  lg: 'h-14 md:h-16',
  xl: 'h-16 md:h-20',
  '2xl': 'h-20 md:h-24',
};

export function BrandLogo({
  variant = 'official',
  size = 'md',
  className = '',
  href = '/',
}: BrandLogoProps) {
  const sizeClass = SIZE_MAP[size] || 'h-10 md:h-12';

  const logoElement = (
    <div className={`relative inline-flex items-center group transition-all duration-300 hover:scale-[1.04] ${className}`}>
      {/* 4K High Resolution Official Brand Logo */}
      <img
        src="/logo-liquidar-official.png"
        alt="Liquidar.cl — Subastas B2B Chile"
        className={`${sizeClass} w-auto object-contain drop-shadow-2xl brightness-105 contrast-105 transition-all duration-300 filter group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]`}
        style={{
          imageRendering: 'crisp-edges',
        }}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href as any} className="inline-flex items-center">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}

export default BrandLogo;
