'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'white' | 'dark' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  href?: string;
}

const SIZE_MAP = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-16',
};

export function BrandLogo({
  variant = 'auto',
  size = 'md',
  className = '',
  href = '/',
}: BrandLogoProps) {
  const sizeClass = SIZE_MAP[size] || 'h-10';

  const logoElement = (
    <div className={`relative inline-flex items-center group transition-transform duration-300 hover:scale-[1.03] ${className}`}>
      {variant === 'white' && (
        <img
          src="/logo-liquidar-white.png"
          alt="Liquidar.cl"
          className={`${sizeClass} w-auto object-contain drop-shadow-md`}
        />
      )}

      {variant === 'dark' && (
        <img
          src="/logo-liquidar-dark.png"
          alt="Liquidar.cl"
          className={`${sizeClass} w-auto object-contain`}
        />
      )}

      {variant === 'auto' && (
        <>
          {/* Light background variant (Dark text) */}
          <img
            src="/logo-liquidar-dark.png"
            alt="Liquidar.cl"
            className={`${sizeClass} w-auto object-contain dark:hidden`}
          />
          {/* Dark background variant (White text) */}
          <img
            src="/logo-liquidar-white.png"
            alt="Liquidar.cl"
            className={`${sizeClass} w-auto object-contain hidden dark:block drop-shadow-md`}
          />
        </>
      )}
    </div>
  );

  if (href) {
    return <Link href={href as any}>{logoElement}</Link>;
  }

  return logoElement;
}

export default BrandLogo;
