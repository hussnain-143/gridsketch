'use client';

import React from 'react';
import Link from 'next/link';
import {
  Grid3X3,
  ArrowLeft,
  Compass,
  Sparkles,
  Layers,
  Ruler,
  HelpCircle,
  Home,
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200 relative overflow-hidden">
      {/* Background Architectural Drafting Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(245, 158, 11, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(245, 158, 11, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Minimal Navigation */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-amber-400/50 rounded-lg"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Grid3X3 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
            GridSketch
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold tracking-wide">
              Atelier
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <Link
            href="/editor"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 hover:shadow-amber-500/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Studio</span>
          </Link>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl text-center space-y-8">
          {/* Visual 404 Drafting Grid Matrix */}
          <div className="inline-block mx-auto relative group">
            <div className="p-4 rounded-2xl bg-[#131620]/90 backdrop-blur-xl border border-amber-500/20 shadow-2xl shadow-black/60 relative">
              {/* Corner crosshairs */}
              <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400" />

              {/* 3x3 Mock Grid with "4 0 4" in the middle */}
              <div className="grid grid-cols-3 gap-2 w-64 h-64 font-mono select-none">
                {/* Row 1 */}
                <div className="rounded-lg bg-[#181d2a] border border-[#273043] flex flex-col items-center justify-center p-2 text-slate-500 text-[10px]">
                  <span>A1</span>
                </div>
                <div className="rounded-lg bg-[#181d2a] border border-[#273043] flex flex-col items-center justify-center p-2 text-slate-500 text-[10px]">
                  <span>B1</span>
                </div>
                <div className="rounded-lg bg-[#181d2a] border border-[#273043] flex flex-col items-center justify-center p-2 text-slate-500 text-[10px]">
                  <span>C1</span>
                </div>

                {/* Row 2: 4 - 0 - 4 Focal Cells */}
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center p-2 text-amber-400 font-extrabold text-2xl shadow-inner">
                  <span>4</span>
                  <span className="text-[8px] text-amber-500/70 font-normal mt-0.5">X-AXIS</span>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-extrabold text-3xl flex flex-col items-center justify-center p-2 shadow-lg shadow-amber-500/25 scale-105 transition-transform">
                  <span>0</span>
                  <span className="text-[8px] text-slate-900 font-bold uppercase tracking-wider mt-0.5">
                    VOID
                  </span>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center p-2 text-amber-400 font-extrabold text-2xl shadow-inner">
                  <span>4</span>
                  <span className="text-[8px] text-amber-500/70 font-normal mt-0.5">Y-AXIS</span>
                </div>

                {/* Row 3 */}
                <div className="rounded-lg bg-[#181d2a] border border-[#273043] flex flex-col items-center justify-center p-2 text-slate-500 text-[10px]">
                  <span>A3</span>
                </div>
                <div className="rounded-lg bg-[#181d2a] border border-[#273043] flex flex-col items-center justify-center p-2 text-slate-500 text-[10px]">
                  <span>B3</span>
                </div>
                <div className="rounded-lg bg-[#181d2a] border border-[#273043] flex flex-col items-center justify-center p-2 text-slate-500 text-[10px]">
                  <span>C3</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-3 py-1 px-2.5 rounded-full bg-[#1b202e] border border-white/5 inline-flex items-center gap-1.5 text-[11px] text-amber-300 font-mono">
                <Compass className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>COORDINATE OUT OF BOUNDS</span>
              </div>
            </div>
          </div>

          {/* Heading & Explanation */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Canvas Margin Exceeded
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
              The sheet or coordinate you requested does not exist on this paper. It may have been relocated, erased, or drafted on another canvas.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/editor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Grid3X3 className="w-4 h-4 stroke-[2.5]" />
              <span>Launch Studio Editor</span>
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#161a26] hover:bg-[#1e2334] text-slate-200 border border-[#273044] hover:border-slate-500 font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Return to Homepage</span>
            </Link>
          </div>

          {/* Helpful Artist Quick Shortcuts */}
          <div className="pt-6 border-t border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono block mb-3">
              Helpful Atelier Shortcuts
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left max-w-xl mx-auto">
              <Link
                href="/editor"
                className="p-3 rounded-xl bg-[#141824] hover:bg-[#1b2030] border border-[#232a3d] hover:border-amber-500/30 transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                  <Grid3X3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Grid Sizing</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Square 1:1, 2cm physical rules, & custom dimensions.
                </p>
              </Link>

              <Link
                href="/editor"
                className="p-3 rounded-xl bg-[#141824] hover:bg-[#1b2030] border border-[#232a3d] hover:border-amber-500/30 transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                  <Ruler className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Paper Standards</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  A4, A3, Letter scaling & real-world millimetre metrics.
                </p>
              </Link>

              <Link
                href="/"
                className="p-3 rounded-xl bg-[#141824] hover:bg-[#1b2030] border border-[#232a3d] hover:border-amber-500/30 transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                  <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Sample Gallery</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Fine art portrait, still life, and anatomy references.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
        <span>© {new Date().getFullYear()} GridSketch Atelier. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-slate-300 transition-colors">
            Home
          </Link>
          <Link href="/editor" className="hover:text-slate-300 transition-colors">
            Editor
          </Link>
        </div>
      </footer>
    </div>
  );
}
