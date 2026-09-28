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
  glow = true,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  glow?: boolean;
}) {
  const pixelSizes = {
    sm: 30,
    md: 40,
    lg: 52,
    xl: 68,
    hero: 88,
  };

  const dim = pixelSizes[size];

  return (
    <div
      style={{ width: dim, height: dim }}
      className={`relative shrink-0 rounded-2xl p-[1px] group-hover:scale-105 transition-all duration-300 ${
        glow ? 'shadow-lg shadow-[#7dd3fc]/15 group-hover:shadow-[#7dd3fc]/30' : ''
      }`}
    >
      {/* Outer Glacier Ice-Blue Gradient Ring */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7dd3fc] via-[#c8a0f0]/60 to-transparent p-[1px] opacity-75 group-hover:opacity-100 transition-opacity">
        <div className="w-full h-full bg-[#0a0e1a] rounded-[15px]" />
      </div>

      {/* Internal Background */}
      <div className="relative w-full h-full rounded-[15px] overflow-hidden bg-[rgba(15,21,36,0.8)] backdrop-blur-md flex items-center justify-center border border-[rgba(125,211,252,0.18)]">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute inset-0 bg-radial from-[#7dd3fc]/15 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

        {/* Master Precision Grid SVG */}
        <svg
          viewBox="0 0 54 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full p-1.5"
        >
          <defs>
            <linearGradient id="glacierGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="60%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="glacierLavender" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="100%" stopColor="#c8a0f0" />
            </linearGradient>
            <filter id="iceDrop" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#7dd3fc" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Precision Corner Viewfinder Brackets */}
          <path d="M7 13 V8 H13" stroke="url(#glacierGlow)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M41 8 H47 V13" stroke="url(#glacierGlow)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M7 41 V46 H13" stroke="url(#glacierGlow)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M41 46 H47 V41" stroke="url(#glacierGlow)" strokeWidth="1.8" strokeLinecap="round" />

          {/* Outer Bounding Grid Rect */}
          <rect
            x="9"
            y="9"
            width="36"
            height="36"
            rx="5"
            stroke="url(#glacierGlow)"
            strokeWidth="1.6"
            strokeOpacity="0.85"
          />

          {/* Internal Grid Subdivisions */}
          <line x1="21" y1="9" x2="21" y2="45" stroke="#7dd3fc" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="33" y1="9" x2="33" y2="45" stroke="#7dd3fc" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="9" y1="21" x2="45" y2="21" stroke="#7dd3fc" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="9" y1="33" x2="45" y2="33" stroke="#7dd3fc" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 2" />

          {/* Classical Diagonal Crosshairs in Center */}
          <line x1="21" y1="21" x2="33" y2="33" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="33" y1="21" x2="21" y2="33" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" />

          {/* Central Precision Focal Node */}
          <circle cx="27" cy="27" r="4" fill="url(#glacierGlow)" filter="url(#iceDrop)" />
          <circle cx="27" cy="27" r="6" stroke="#c8a0f0" strokeWidth="1" strokeOpacity="0.7" />
          <circle cx="27" cy="27" r="1.5" fill="#0a0e1a" />
        </svg>
      </div>
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
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
    hero: 'text-4xl sm:text-5xl lg:text-6xl',
  };

  const content = (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      <BrandLogoMark size={size} />

      <div className="flex flex-col">
        <div className="flex items-center tracking-tight font-sans">
          <span className={`font-bold text-[#f0f6fc] ${fontSizes[size]}`}>
            Grid
          </span>
          <span
            className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#7dd3fc] to-[#bae6fd] drop-shadow-[0_2px_12px_rgba(125,211,252,0.3)] ${fontSizes[size]}`}
          >
            Sketch
          </span>
          <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#7dd3fc] shadow-[0_0_8px_#7dd3fc] hidden sm:inline-block" />

          {badgeText && (
            <span className="ml-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#7dd3fc]/15 text-[#7dd3fc] border border-[#7dd3fc]/30 hidden sm:inline-block">
              {badgeText}
            </span>
          )}
        </div>

        {showTagline && (
          <span className="text-[10px] sm:text-[11px] font-medium tracking-widest text-[#94a3b8] uppercase -mt-0.5 flex items-center gap-1.5">
            <span>Precision Drawing Assistant</span>
            <span className="w-1 h-1 rounded-full bg-[#7dd3fc]/40" />
            <span className="text-[#7dd3fc]">Glacier Edition</span>
          </span>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" className="inline-block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
