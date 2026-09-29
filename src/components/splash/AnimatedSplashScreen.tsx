'use client';

import React, { useEffect, useState } from 'react';

export function AnimatedSplashScreen() {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // If running inside Capacitor Native, hide native splash smoothly
    const hideNativeSplash = async () => {
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch {
        // Web browser environment or Capacitor not available
      }
    };
    hideNativeSplash();

    // Sequence the exit after splash animation plays
    const exitTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2200);

    const removeTimer = setTimeout(() => {
      setIsDismissed(true);
    }, 2800);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const handleQuickDismiss = () => {
    if (!isFadingOut) {
      setIsFadingOut(true);
      setTimeout(() => setIsDismissed(true), 400);
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      onClick={handleQuickDismiss}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-600 ease-out ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none backdrop-blur-0'
          : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#0a0e1a',
      }}
    >
      {/* 1. Atmospheric Ambient Caustic Glows */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-[#38bdf8]/20 blur-[100px] animate-pulse" />
        <div
          className="absolute w-[420px] h-[420px] rounded-full bg-[#c8a0f0]/15 blur-[90px] translate-x-16 translate-y-12"
          style={{ animation: 'splashAuraPulse 4s ease-in-out infinite alternate' }}
        />
      </div>

      {/* 2. Central Glassmorphic Emblem Container */}
      <div className="relative flex flex-col items-center justify-center z-10">
        {/* Floating 3D Frosted Glass Plate */}
        <div
          className="relative w-[180px] h-[180px] sm:w-[210px] sm:h-[210px] flex items-center justify-center"
          style={{ animation: 'splashFloat 3.5s ease-in-out infinite alternate' }}
        >
          {/* Glass Cast Shadow */}
          <div className="absolute inset-4 rounded-[42px] bg-black/60 blur-[18px] translate-y-4" />

          {/* SVG Vector Precision Glass Plate */}
          <svg
            className="w-full h-full drop-shadow-2xl"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Under-Glass Ethereal Prismatic Light */}
              <radialGradient id="animUnderGlow" cx="40%" cy="35%" r="55%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="animLavenderGlow" cx="70%" cy="65%" r="45%">
                <stop offset="0%" stopColor="#c8a0f0" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#c8a0f0" stopOpacity="0" />
              </radialGradient>

              {/* Frosted Glass Surface Tint */}
              <linearGradient id="animGlassTint" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                <stop offset="40%" stopColor="#7dd3fc" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0a0e1a" stopOpacity="0.75" />
              </linearGradient>

              {/* Glass Specular Rim Highlight */}
              <linearGradient id="animGlassRim" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="25%" stopColor="#7dd3fc" stopOpacity="0.85" />
                <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#c8a0f0" stopOpacity="0.8" />
              </linearGradient>

              {/* Top Specular Highlight Edge */}
              <linearGradient id="animSpecularLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0" />
                <stop offset="35%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#7dd3fc" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
              </linearGradient>

              {/* Neon Grid Lines */}
              <linearGradient id="animGridNeon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
              </linearGradient>

              {/* Central Reticle Core Aura */}
              <radialGradient id="animCoreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#7dd3fc" />
                <stop offset="70%" stopColor="#0284c7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 1. Ambient Under-Plate Caustics */}
            <circle cx="210" cy="190" r="180" fill="url(#animUnderGlow)" />
            <circle cx="340" cy="330" r="160" fill="url(#animLavenderGlow)" />

            {/* 2. Frosted Glass Slate */}
            <rect
              x="68"
              y="68"
              width="376"
              height="376"
              rx="76"
              fill="url(#animGlassTint)"
              stroke="url(#animGlassRim)"
              strokeWidth="2.8"
            />
            <path
              d="M 130 69.5 L 382 69.5"
              stroke="url(#animSpecularLine)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* 3. Animated Corner Viewfinder Registration Brackets */}
            <g
              stroke="url(#animGridNeon)"
              strokeWidth="4.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ animation: 'splashBracketsIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
              <path d="M 120 162 V 120 H 162" />
              <path d="M 350 120 H 392 V 162" />
              <path d="M 120 350 V 392 H 162" />
              <path d="M 350 392 H 392 V 350" />
            </g>

            {/* 4. Inner Precision 3x3 Artist Grid Frame */}
            <rect
              x="136"
              y="136"
              width="240"
              height="240"
              rx="24"
              fill="rgba(10, 14, 26, 0.45)"
              stroke="url(#animGridNeon)"
              strokeWidth="2.4"
              style={{ animation: 'splashGridFrame 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            />

            {/* Animated 3x3 Dashed Laser Grid Tracks */}
            <g
              stroke="#7dd3fc"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeOpacity="0.8"
              className="splash-grid-tracks"
            >
              <line x1="216" y1="136" x2="216" y2="376" />
              <line x1="296" y1="136" x2="296" y2="376" />
              <line x1="136" y1="216" x2="376" y2="216" />
              <line x1="136" y1="296" x2="376" y2="296" />
            </g>

            {/* Animated Center Crosshairs */}
            <g
              stroke="#7dd3fc"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeOpacity="0.9"
              style={{ animation: 'splashCrosshairs 1s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
              <line x1="216" y1="216" x2="296" y2="296" />
              <line x1="296" y1="216" x2="216" y2="296" />
            </g>

            {/* 5. Pulsing Precision Radar Reticle Waves */}
            <circle
              cx="256"
              cy="256"
              r="44"
              stroke="#7dd3fc"
              strokeWidth="1.2"
              fill="none"
              style={{ animation: 'splashReticleRadar 2s ease-out infinite' }}
            />
            <circle
              cx="256"
              cy="256"
              r="30"
              stroke="#c8a0f0"
              strokeWidth="2"
              strokeOpacity="0.85"
              fill="none"
            />
            <circle cx="256" cy="256" r="18" fill="url(#animCoreGlow)" />
            <circle
              cx="256"
              cy="256"
              r="18"
              stroke="#ffffff"
              strokeWidth="1.6"
              fill="none"
              strokeOpacity="0.95"
            />
            <circle cx="256" cy="256" r="6" fill="#0a0e1a" />
            <circle cx="254" cy="254" r="2.2" fill="#ffffff" />
          </svg>
        </div>

        {/* 3. Typography & Subtitle Sequence */}
        <div className="mt-8 flex flex-col items-center text-center">
          {/* Main App Title with Glacial Shimmer */}
          <div
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#f0f6fc] flex items-center justify-center gap-0.5"
            style={{ animation: 'splashTitleReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            <span>Grid</span>
            <span className="bg-gradient-to-r from-[#7dd3fc] via-[#38bdf8] to-[#c8a0f0] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(125,211,252,0.4)]">
              Sketch
            </span>
          </div>

          {/* Subtitle Tagline */}
          <div
            className="mt-2 text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] text-[#94a3b8] uppercase"
            style={{ animation: 'splashSubtitleReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            Digital Drawing Assistant
          </div>

          {/* Calibration Status Beam */}
          <div className="mt-5 flex items-center gap-3">
            <div className="w-10 sm:w-14 h-[1px] bg-gradient-to-r from-transparent to-[#7dd3fc]/30" />
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#7dd3fc] animate-ping" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
            </div>
            <div className="w-10 sm:w-14 h-[1px] bg-gradient-to-l from-transparent to-[#7dd3fc]/30" />
          </div>

          {/* Atelier Calibrated Indicator */}
          <div
            className="mt-2 text-[9px] font-mono tracking-[0.25em] text-[#7dd3fc]/80 uppercase"
            style={{ animation: 'splashSubtitleReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            Glacier Edition · Atelier Calibrated
          </div>
        </div>
      </div>
    </div>
  );
}
