'use client';

import React, { useRef, useState } from 'react';
import {
  Upload,
  RotateCcw,
  Undo2,
  Redo2,
  Printer,
  Download,
  SplitSquareVertical,
  Layers,
  MoreVertical,
  Menu,
  X,
  LayoutGrid,
  Columns2,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { SAMPLE_IMAGES } from '@/lib/image/sample-images';
import { BrandLogo } from '@/components/brand/BrandLogo';

export type LayoutMode = 'bento' | 'split' | 'focus';

interface StudioHeaderProps {
  imageName: string;
  imageWidth: number;
  imageHeight: number;
  onUploadImage: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
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
  onSelectSample,
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
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
      e.target.value = '';
    }
  };

  return (
    <header
      className="no-print pt-[max(env(safe-area-inset-top),20px)] min-h-[58px] px-3 sm:px-5 flex items-center justify-between select-none z-30 shrink-0 relative"
      style={{
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 0%, rgba(15, 21, 36, 0.75) 40%, rgba(10, 14, 26, 0.85) 100%)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        borderBottom: '1px solid rgba(125, 211, 252, 0.16)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
      }}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        id="studio-file-input"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Brand & Mobile Menu Hamburger Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Menu Drawer Button */}
        <button
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 rounded-xl border bg-[rgba(15,21,36,0.6)] text-[#7dd3fc] border-[rgba(125,211,252,0.25)] hover:bg-[#7dd3fc]/15 active:scale-95 transition-all shrink-0 flex items-center justify-center"
          title="Open Menu"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <BrandLogo size="sm" />

        {/* Desktop Image info pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.12)] text-xs text-[#94a3b8]">
          <ImageIcon className="w-3.5 h-3.5 text-[#7dd3fc] shrink-0" />
          <span className="font-semibold text-[#f0f6fc] truncate max-w-[140px]">
            {imageName}
          </span>
          <span className="text-[#7dd3fc]/40">•</span>
          <span className="font-mono text-[#7dd3fc]">
            {imageWidth} × {imageHeight} px
          </span>
        </div>
      </div>

      {/* Middle Tools (Desktop & Tablet) — Pure Icon Buttons */}
      <div className="hidden md:flex items-center gap-1.5">
        {/* Sample Switcher (Icon Only) */}
        <button
          onClick={() => setSampleMenuOpen((prev) => !prev)}
          className="p-2 rounded-xl bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.14)] hover:border-[#7dd3fc]/40 text-[#7dd3fc] transition-all"
          title="Reference Samples"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Desktop Upload Button (Icon Only) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.14)] hover:border-[#7dd3fc]/40 text-[#7dd3fc] transition-all"
          title="Upload Photo"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Undo / Redo (Icons Only) */}
        <div className="flex items-center bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.12)] rounded-xl p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-colors ${
              canUndo
                ? 'text-[#f0f6fc] hover:bg-[#7dd3fc]/15 hover:text-[#7dd3fc]'
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
                ? 'text-[#f0f6fc] hover:bg-[#7dd3fc]/15 hover:text-[#7dd3fc]'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Reset All (Icon Only) */}
        <button
          onClick={onResetAll}
          className="p-2 rounded-xl bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc] transition-colors"
          title="Reset All Settings"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Right Controls: Glacier Layout Switcher, Compare, Print, Export — Pure Icons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Glacier Glass Segmented Layout Selector (Icons Only) */}
        {onSelectLayout && (
          <div className="hidden md:flex items-center bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.12)] rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => onSelectLayout('bento')}
              className={`p-2 rounded-lg transition-all ${
                layoutMode === 'bento'
                  ? 'bg-[#7dd3fc] text-[#0a0e1a] shadow-[0_0_15px_rgba(125,211,252,0.3)]'
                  : 'text-[#94a3b8] hover:text-[#f0f6fc] hover:bg-[#7dd3fc]/10'
              }`}
              title="Bento Grid Layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectLayout('split')}
              className={`p-2 rounded-lg transition-all ${
                layoutMode === 'split'
                  ? 'bg-[#7dd3fc] text-[#0a0e1a] shadow-[0_0_15px_rgba(125,211,252,0.3)]'
                  : 'text-[#94a3b8] hover:text-[#f0f6fc] hover:bg-[#7dd3fc]/10'
              }`}
              title="Studio Split Layout"
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectLayout('focus')}
              className={`p-2 rounded-lg transition-all ${
                layoutMode === 'focus'
                  ? 'bg-[#7dd3fc] text-[#0a0e1a] shadow-[0_0_15px_rgba(125,211,252,0.3)]'
                  : 'text-[#94a3b8] hover:text-[#f0f6fc] hover:bg-[#7dd3fc]/10'
              }`}
              title="Focus Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Before / After Toggle (Icon Only) */}
        <button
          onClick={onToggleCompare}
          className={`p-2 rounded-xl border transition-all ${
            showCompare
              ? 'bg-[#7dd3fc]/20 text-[#7dd3fc] border-[#7dd3fc]/50 shadow-[0_0_15px_rgba(125,211,252,0.25)]'
              : 'bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 text-[#7dd3fc] border-[rgba(125,211,252,0.14)] hover:border-[#7dd3fc]/40'
          }`}
          title="Compare Before / After"
        >
          <SplitSquareVertical className="w-4 h-4" />
        </button>

        {/* Print Button (Icon Only) */}
        <button
          onClick={onOpenPrint}
          className="hidden md:flex p-2 rounded-xl bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.14)] hover:border-[#7dd3fc]/40 text-[#7dd3fc] transition-all"
          title="Print Reference"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Mobile Menu Drawer Button (Opens slide-out MobileMenuDrawer) */}
        <button
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 rounded-xl bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.18)] hover:border-[#7dd3fc]/50 text-[#7dd3fc] active:scale-95 transition-all"
          title="Open Menu Drawer"
          aria-label="Open Menu Drawer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Primary Action Button: Semi-transparent Primary Fill with Border */}
        {/* Primary Action Button: Export (Icon Only) */}
        <button
          onClick={onOpenExport}
          className="p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center"
          style={{
            background: '#7dd3fc',
            color: '#0a0e1a',
            boxShadow: '0 0 20px rgba(125, 211, 252, 0.35)',
          }}
          title="Export Artwork"
        >
          <Download className="w-4 h-4 stroke-[2.4]" />
        </button>
      </div>

      {/* Universal Sample Picker Modal in Layer 2 Elevated Glass */}
      {sampleMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={() => setSampleMenuOpen(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-2xl py-3.5 z-50 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{
              background: 'rgba(15, 21, 36, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(125, 211, 252, 0.2)',
              boxShadow: '0 0 40px rgba(125, 211, 252, 0.12)',
            }}
          >
            <div className="flex items-center justify-between px-4 pb-2.5 border-b border-[rgba(125,211,252,0.12)]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7dd3fc]" />
                <span className="text-xs font-semibold text-[#f0f6fc]">
                  Select Reference Sample
                </span>
              </div>
              <button
                onClick={() => setSampleMenuOpen(false)}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-[#f0f6fc] hover:bg-[#7dd3fc]/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto px-2 pt-2 space-y-1">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample.id);
                    setSampleMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#7dd3fc]/15 border border-transparent hover:border-[rgba(125,211,252,0.2)] flex flex-col gap-0.5 transition-all"
                >
                  <span className="font-semibold text-[#f0f6fc]">
                    {sample.title}
                  </span>
                  <span className="text-[11px] text-[#94a3b8] truncate">
                    {sample.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
