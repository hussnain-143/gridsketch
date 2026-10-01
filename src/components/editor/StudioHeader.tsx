'use client';

import React, { useRef } from 'react';
import {
  Upload,
  RotateCcw,
  Undo2,
  Redo2,
  Printer,
  Download,
  SplitSquareVertical,
  Menu,
  LayoutGrid,
  Columns2,
  Maximize2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

export type LayoutMode = 'bento' | 'split' | 'focus';

interface StudioHeaderProps {
  imageName: string;
  imageWidth: number;
  imageHeight: number;
  onUploadImage: (file: File) => void;
  onResetAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  showCompare: boolean;
  onToggleCompare: () => void;
  onOpenPrint: () => void;
  onOpenExport: () => void;
  layoutMode?: LayoutMode;
  onSelectLayout?: (mode: LayoutMode) => void;
  onOpenMobileDrawer?: () => void;
}

export function StudioHeader({
  imageName,
  imageWidth,
  imageHeight,
  onUploadImage,
  onResetAll,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showCompare,
  onToggleCompare,
  onOpenPrint,
  onOpenExport,
  layoutMode = 'bento',
  onSelectLayout,
  onOpenMobileDrawer,
}: StudioHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
      e.target.value = '';
    }
  };

  const hasImage = !!imageWidth && !!imageHeight;

  return (
    <header
      className="no-print pt-[max(env(safe-area-inset-top),12px)] sm:pt-0 min-h-[56px] px-3.5 sm:px-5 flex items-center justify-between select-none z-30 shrink-0 relative bg-[#0b0f14]/95 backdrop-blur-xl border-b border-[#273444] transition-all"
    >
      {/* Hidden Native File Input */}
      <input
        id="studio-file-input"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── LEFT: Brand Logo (Always Anchored Left) ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <BrandLogo size="sm" badgeText="STUDIO" />
      </div>

      {/* ── CENTER: Architectural Image Status Chip ── */}
      <div className="hidden sm:flex items-center justify-center flex-1 px-4 max-w-md mx-auto">
        {hasImage ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#161e27] border border-[#273444] text-xs text-[#94a3b8] shadow-sm max-w-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse shrink-0" />
            <ImageIcon className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
            <span className="font-medium text-[#f8fafc] truncate max-w-[140px] md:max-w-[200px]">
              {imageName || 'Active Reference'}
            </span>
            <span className="text-[#273444]">•</span>
            <span className="font-mono text-[11px] text-[#38bdf8] shrink-0">
              {imageWidth}×{imageHeight} px
            </span>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#161e27]/80 hover:bg-[#161e27] border border-[#273444] hover:border-[#38bdf8]/40 text-xs text-[#94a3b8] hover:text-[#38bdf8] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Empty Drafting Canvas • Tap to Upload</span>
          </button>
        )}
      </div>

      {/* ── RIGHT: Desktop Controls & Mobile Action Bar ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Quick Upload Button (Both Mobile & Desktop) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#161e27] hover:bg-[#38bdf8]/10 border border-[#273444] hover:border-[#38bdf8]/40 text-[#38bdf8] transition-all flex items-center gap-1.5 text-xs font-semibold active:scale-95 touch-manipulation cursor-pointer"
          title="Upload Reference Photo"
        >
          <Upload className="w-4 h-4 stroke-[2.2]" />
          <span className="hidden lg:inline">Upload</span>
        </button>

        {/* Desktop Undo / Redo */}
        <div className="hidden md:flex items-center bg-[#161e27] border border-[#273444] rounded-xl p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-colors ${
              canUndo
                ? 'text-[#f8fafc] hover:bg-[#38bdf8]/15 hover:text-[#38bdf8]'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-colors ${
              canRedo
                ? 'text-[#f8fafc] hover:bg-[#38bdf8]/15 hover:text-[#38bdf8]'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Reset All */}
        <button
          onClick={onResetAll}
          className="hidden md:flex p-2 rounded-xl bg-[#161e27] hover:bg-[#38bdf8]/10 border border-[#273444] text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
          title="Reset All Settings"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Desktop Layout Switcher */}
        {onSelectLayout && (
          <div className="hidden md:flex items-center bg-[#161e27] border border-[#273444] rounded-xl p-0.5">
            <button
              onClick={() => onSelectLayout('bento')}
              className={`p-1.5 rounded-lg transition-all ${
                layoutMode === 'bento'
                  ? 'bg-[#38bdf8] text-[#0b0f14]'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#38bdf8]/10'
              }`}
              title="Bento Grid Layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectLayout('split')}
              className={`p-1.5 rounded-lg transition-all ${
                layoutMode === 'split'
                  ? 'bg-[#38bdf8] text-[#0b0f14]'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#38bdf8]/10'
              }`}
              title="Studio Split Layout"
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectLayout('focus')}
              className={`p-1.5 rounded-lg transition-all ${
                layoutMode === 'focus'
                  ? 'bg-[#38bdf8] text-[#0b0f14]'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#38bdf8]/10'
              }`}
              title="Focus Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Compare Toggle (Desktop & Mobile) */}
        {hasImage && (
          <button
            onClick={onToggleCompare}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              showCompare
                ? 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/50 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'bg-[#161e27] hover:bg-[#38bdf8]/10 text-[#38bdf8] border-[#273444] hover:border-[#38bdf8]/40'
            }`}
            title="Compare Before / After"
          >
            <SplitSquareVertical className="w-4 h-4" />
          </button>
        )}

        {/* Desktop Print Button */}
        {hasImage && (
          <button
            onClick={onOpenPrint}
            className="hidden md:flex p-2 rounded-xl bg-[#161e27] hover:bg-[#38bdf8]/10 border border-[#273444] hover:border-[#38bdf8]/40 text-[#38bdf8] transition-all"
            title="Print Reference Sheet"
          >
            <Printer className="w-4 h-4" />
          </button>
        )}

        {/* Desktop Export Button */}
        {hasImage && (
          <button
            onClick={onOpenExport}
            className="hidden md:flex p-2 rounded-xl transition-all active:scale-95 items-center justify-center bg-[#38bdf8] text-[#0b0f14] hover:bg-[#0284c7] font-semibold shadow-md shadow-[#38bdf8]/20"
            title="Export Artwork"
          >
            <Download className="w-4 h-4 stroke-[2.4]" />
          </button>
        )}

        {/* ── MOBILE MENU BUTTON ON THE RIGHT (Touch target 44×44px) ── */}
        <button
          onClick={onOpenMobileDrawer}
          className="md:hidden w-11 h-11 rounded-xl border border-[#273444] bg-[#161e27] text-[#38bdf8] hover:border-[#38bdf8]/50 hover:bg-[#38bdf8]/15 active:scale-95 transition-all shrink-0 flex items-center justify-center touch-manipulation cursor-pointer shadow-sm"
          title="Open Studio Menu"
          aria-label="Open Studio Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
