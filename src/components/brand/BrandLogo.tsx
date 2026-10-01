'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showTagline?: boolean;
  clickable?: boolean;
  className?: string;
  badgeText?: string;
}

export function BrandLogoMark({
  size = 'md',
  glow = false,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  glow?: boolean;
}) {
  const pixelSizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 60,
    hero: 76,
  };

  const dim = pixelSizes[size];

  return (
    <div
      style={{ width: dim, height: dim }}
      className={`relative shrink-0 rounded-xl transition-all duration-200 overflow-hidden ${
        glow ? 'shadow-md shadow-[#38bdf8]/15' : ''
      }`}
    >
      {/* Outer Graphite Precision Border Frame */}
      <div className="absolute inset-0 rounded-xl bg-[#0b0f14] border border-[#273444]" />

      {/* Master Precision G + Grid SVG Symbol */}
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full p-1"
      >
        {/* Subtle Blueprint Drafting Grid */}
        <g stroke="#334155" strokeWidth="3" opacity="0.65">
          <line x1="80" y1="120" x2="432" y2="120" />
          <line x1="80" y1="188" x2="432" y2="188" />
          <line x1="80" y1="256" x2="432" y2="256" />
          <line x1="80" y1="324" x2="432" y2="324" />
          <line x1="80" y1="392" x2="432" y2="392" />

          <line x1="120" y1="80" x2="120" y2="432" />
          <line x1="188" y1="80" x2="188" y2="432" />
          <line x1="256" y1="80" x2="256" y2="432" />
          <line x1="324" y1="80" x2="324" y2="432" />
          <line x1="392" y1="80" x2="392" y2="432" />
        </g>

        {/* Precision Corner Crop Marks */}
        <g stroke="#38bdf8" strokeWidth="3" opacity="0.45" strokeLinecap="round">
          <path d="M 68 84 H 84 V 68" fill="none" />
          <path d="M 444 84 H 428 V 68" fill="none" />
          <path d="M 68 428 H 84 V 444" fill="none" />
          <path d="M 444 428 H 428 V 444" fill="none" />
        </g>

        {/* Stylized Geometric G Symbol */}
        <path
          d="M 372 168 
             C 344 120, 304 104, 256 104 
             C 172 104, 112 172, 112 256 
             C 112 340, 172 408, 256 408 
             C 336 408, 396 348, 396 268 
             L 396 256 
             L 256 256"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="42"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Blueprint Cyan Highlight Reticle Node */}
        <circle cx="256" cy="256" r="16" fill="#38bdf8" />
        <circle
          cx="256"
          cy="256"
          r="30"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeDasharray="5 4"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

export function BrandLogo({
  size = 'md',
  showTagline = false,
  clickable = true,
  className = '',
  badgeText,
}: BrandLogoProps) {
  const fontSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
    hero: 'text-3xl sm:text-4xl lg:text-5xl',
  };

  const content = (
    <div className={`flex items-center gap-2 group select-none ${className}`}>
      <BrandLogoMark size={size} />

      <div className="flex flex-col leading-tight">
        <div className="flex items-center tracking-tight font-sans">
          <span className={`font-bold text-[#f8fafc] ${fontSizes[size]}`}>
            Grid
          </span>
          <span className={`font-bold text-[#38bdf8] ${fontSizes[size]}`}>
            Sketch
          </span>

          {badgeText && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 hidden sm:inline-block">
              {badgeText}
            </span>
          )}
        </div>

        {showTagline && (
          <span className="text-[10px] font-medium tracking-wider text-[#94a3b8] uppercase">
            Precision Drafting Studio
          </span>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
