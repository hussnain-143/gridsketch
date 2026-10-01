'use client';

import React, { useRef } from 'react';
import {
  X,
  Upload,
  RotateCcw,
  Undo2,
  Redo2,
  Printer,
  Download,
  SplitSquareVertical,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerUpload: () => void;
  onUploadImage?: (file: File) => void;
  currentImageName?: string;
  onResetAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPrint: () => void;
  onOpenExport: () => void;
  showCompare: boolean;
  onToggleCompare: () => void;
}

export function MobileMenuDrawer({
  isOpen,
  onClose,
  onTriggerUpload,
  onUploadImage,
  currentImageName,
  onResetAll,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenPrint,
  onOpenExport,
  showCompare,
  onToggleCompare,
}: MobileMenuDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onUploadImage) {
        onUploadImage(file);
      } else {
        onTriggerUpload();
      }
      e.target.value = '';
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end no-print">
      {/* Hidden Dedicated File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu backdrop"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0 cursor-pointer touch-manipulation animate-backdrop-fade"
        onClick={handleBackdropClick}
        onTouchEnd={handleBackdropClick}
      />

      {/* Slide-in Drawer Container on the RIGHT */}
      <div
        className="relative w-[85vw] max-w-[340px] h-full flex flex-col z-10 select-none shadow-2xl ml-auto bg-[#161e27] border-l border-[#273444] animate-drawer-slide-in"
      >
        {/* Drawer Header with Safe-Area Clearance */}
        <div className="pt-[max(env(safe-area-inset-top),16px)] px-4 pb-3 border-b border-[#273444] flex items-center justify-between shrink-0 bg-[#0b0f14]/80">
          <BrandLogo size="sm" clickable={false} badgeText="MENU" />
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#38bdf8]/10 transition-all touch-manipulation cursor-pointer border border-[#273444]"
            title="Close Menu"
          >
            <X className="w-5 h-5 text-[#38bdf8]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-12 space-y-4 no-scrollbar">
          {/* Quick Primary Actions: Upload & Export */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                } else {
                  onTriggerUpload();
                  onClose();
                }
              }}
              className="min-h-[46px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#111820] border border-[#273444] text-[#38bdf8] hover:border-[#38bdf8]/40 font-semibold text-xs active:scale-95 transition-all touch-manipulation cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenExport();
                onClose();
              }}
              className="min-h-[46px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-[#0b0f14] font-bold text-xs shadow-md shadow-[#38bdf8]/20 active:scale-95 transition-all touch-manipulation cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Export</span>
            </button>
          </div>

          {/* Current Loaded File Readout */}
          {currentImageName && (
            <div className="p-3 rounded-2xl bg-[#111820] border border-[#273444] flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#94a3b8] uppercase font-semibold">
                Active Image
              </span>
              <span className="text-xs font-semibold text-[#f8fafc] truncate max-w-[180px]">
                {currentImageName}
              </span>
            </div>
          )}

          {/* Studio Tools: Undo, Redo, Compare */}
          <div className="p-3.5 rounded-2xl bg-[#111820] border border-[#273444] space-y-2.5">
            <span className="text-[10px] font-mono tracking-wider text-[#38bdf8] uppercase font-semibold">
              Studio Tools
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`min-h-[48px] flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all touch-manipulation ${
                  canUndo
                    ? 'bg-[#161e27] border-[#273444] text-[#f8fafc] hover:bg-[#38bdf8]/10 cursor-pointer active:scale-95'
                    : 'bg-transparent border-transparent text-slate-700 cursor-not-allowed'
                }`}
              >
                <Undo2 className="w-4 h-4 mb-0.5 text-[#38bdf8]" />
                <span className="text-[10px]">Undo</span>
              </button>

              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className={`min-h-[48px] flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all touch-manipulation ${
                  canRedo
                    ? 'bg-[#161e27] border-[#273444] text-[#f8fafc] hover:bg-[#38bdf8]/10 cursor-pointer active:scale-95'
                    : 'bg-transparent border-transparent text-slate-700 cursor-not-allowed'
                }`}
              >
                <Redo2 className="w-4 h-4 mb-0.5 text-[#38bdf8]" />
                <span className="text-[10px]">Redo</span>
              </button>

              <button
                type="button"
                onClick={onToggleCompare}
                className={`min-h-[48px] flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all touch-manipulation cursor-pointer active:scale-95 ${
                  showCompare
                    ? 'bg-[#38bdf8]/20 border-[#38bdf8]/50 text-[#38bdf8]'
                    : 'bg-[#161e27] border-[#273444] text-[#94a3b8]'
                }`}
              >
                <SplitSquareVertical className="w-4 h-4 mb-0.5 text-[#38bdf8]" />
                <span className="text-[10px]">Compare</span>
              </button>
            </div>
          </div>

          {/* Print & Reset Utilities */}
          <div className="space-y-2 pt-2 border-t border-[#273444]">
            <button
              type="button"
              onClick={() => {
                onOpenPrint();
                onClose();
              }}
              className="w-full min-h-[46px] p-2.5 rounded-xl bg-[#111820] hover:bg-[#38bdf8]/10 border border-[#273444] text-[#f8fafc] text-xs flex items-center gap-2.5 transition-all touch-manipulation cursor-pointer active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-[#38bdf8]" />
              <span>Print Scale Reference Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onResetAll();
                onClose();
              }}
              className="w-full min-h-[46px] p-2.5 rounded-xl bg-[#111820] hover:bg-rose-500/15 border border-[#273444] hover:border-rose-500/30 text-[#94a3b8] hover:text-rose-300 text-xs flex items-center gap-2.5 transition-all touch-manipulation cursor-pointer active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Reset All Studio Settings</span>
            </button>
          </div>
        </div>

        {/* Drawer Footer with Safe-Area Clearance */}
        <div className="pb-[max(calc(env(safe-area-inset-bottom)+16px),30px)] pt-3 px-4 border-t border-[#273444] bg-[#0b0f14]/90 text-center shrink-0">
          <span className="text-[9px] font-mono tracking-widest text-[#94a3b8] uppercase">
            Architectural Precision Studio
          </span>
        </div>
      </div>
    </div>
  );
}
