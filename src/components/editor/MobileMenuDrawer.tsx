'use client';

import React from 'react';
import {
  X,
  Upload,
  RotateCcw,
  Undo2,
  Redo2,
  Printer,
  Download,
  SplitSquareVertical,
  Layers,
  Check,
} from 'lucide-react';
import { SAMPLE_IMAGES } from '@/lib/image/sample-images';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerUpload: () => void;
  onSelectSample: (id: string) => void;
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
  onSelectSample,
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end no-print">
      {/* Dimmed Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"
        onClick={onClose}
      />

      {/* Slide-in Drawer Container */}
      <div
        className="relative w-[85vw] max-w-[340px] h-full flex flex-col z-10 select-none shadow-2xl ml-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 21, 36, 0.96) 0%, rgba(10, 14, 26, 0.98) 100%)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          borderLeft: '1px solid rgba(125, 211, 252, 0.22)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7), inset 1px 0 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Drawer Header with Safe-Area Clearance */}
        <div className="pt-[max(env(safe-area-inset-top),20px)] px-4 pb-3 border-b border-[rgba(125,211,252,0.15)] flex items-center justify-between shrink-0 bg-[rgba(10,14,26,0.5)]">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#94a3b8] hover:text-[#f0f6fc] hover:bg-[#7dd3fc]/15 transition-all"
            title="Close Menu"
          >
            <X className="w-5 h-5 text-[#7dd3fc]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
          {/* Quick Primary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onTriggerUpload();
                onClose();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#7dd3fc]/15 border border-[#7dd3fc]/30 text-[#7dd3fc] font-semibold text-xs active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>

            <button
              onClick={() => {
                onOpenExport();
                onClose();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#7dd3fc] text-[#0a0e1a] font-bold text-xs shadow-[0_0_15px_rgba(125,211,252,0.35)] active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Export</span>
            </button>
          </div>

          {/* History & Compare Tools */}
          <div className="p-3 rounded-2xl bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.12)] space-y-2.5">
            <span className="text-[10px] font-mono tracking-wider text-[#7dd3fc]/70 uppercase font-semibold">
              Studio Tools
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
                  canUndo
                    ? 'bg-[rgba(10,14,26,0.6)] border-[rgba(125,211,252,0.2)] text-[#f0f6fc] hover:bg-[#7dd3fc]/15'
                    : 'bg-transparent border-transparent text-slate-600 cursor-not-allowed'
                }`}
              >
                <Undo2 className="w-4 h-4 mb-0.5 text-[#7dd3fc]" />
                <span className="text-[10px]">Undo</span>
              </button>

              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
                  canRedo
                    ? 'bg-[rgba(10,14,26,0.6)] border-[rgba(125,211,252,0.2)] text-[#f0f6fc] hover:bg-[#7dd3fc]/15'
                    : 'bg-transparent border-transparent text-slate-600 cursor-not-allowed'
                }`}
              >
                <Redo2 className="w-4 h-4 mb-0.5 text-[#7dd3fc]" />
                <span className="text-[10px]">Redo</span>
              </button>

              <button
                onClick={onToggleCompare}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${
                  showCompare
                    ? 'bg-[#7dd3fc]/20 border-[#7dd3fc]/50 text-[#7dd3fc]'
                    : 'bg-[rgba(10,14,26,0.6)] border-[rgba(125,211,252,0.2)] text-[#94a3b8]'
                }`}
              >
                <SplitSquareVertical className="w-4 h-4 mb-0.5 text-[#7dd3fc]" />
                <span className="text-[10px]">Compare</span>
              </button>
            </div>
          </div>

          {/* Reference Samples Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-[#7dd3fc]/70 uppercase font-semibold flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#7dd3fc]" />
                Reference Samples
              </span>
              <span className="text-[9px] text-[#94a3b8]">3 Curated</span>
            </div>

            <div className="space-y-1.5">
              {SAMPLE_IMAGES.map((sample) => {
                const isActive = currentImageName === sample.title;
                return (
                  <button
                    key={sample.id}
                    onClick={() => {
                      onSelectSample(sample.id);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-[#7dd3fc]/20 border-[#7dd3fc]/50 text-[#f0f6fc] shadow-[0_0_15px_rgba(125,211,252,0.15)]'
                        : 'bg-[rgba(15,21,36,0.6)] border-[rgba(125,211,252,0.1)] text-[#94a3b8] hover:bg-[#7dd3fc]/10 hover:text-[#f0f6fc]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-semibold truncate text-[#f0f6fc]">
                        {sample.title}
                      </span>
                      <span className="text-[10px] text-[#94a3b8] truncate">
                        {sample.subtitle}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-[#7dd3fc] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output & Utilities */}
          <div className="space-y-1.5 pt-2 border-t border-[rgba(125,211,252,0.1)]">
            <button
              onClick={() => {
                onOpenPrint();
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/10 border border-[rgba(125,211,252,0.12)] text-[#f0f6fc] text-xs flex items-center gap-2.5 transition-all"
            >
              <Printer className="w-4 h-4 text-[#7dd3fc]" />
              <span>Print Scale Reference Sheet</span>
            </button>

            <button
              onClick={() => {
                onResetAll();
                onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-[rgba(15,21,36,0.4)] hover:bg-rose-500/15 border border-[rgba(125,211,252,0.1)] hover:border-rose-500/30 text-[#94a3b8] hover:text-rose-300 text-xs flex items-center gap-2.5 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Reset All Studio Settings</span>
            </button>
          </div>
        </div>

        {/* Drawer Footer with Safe-Area Clearance */}
        <div className="pb-[max(env(safe-area-inset-bottom),20px)] pt-2 px-4 border-t border-[rgba(125,211,252,0.1)] bg-[rgba(10,14,26,0.8)] text-center shrink-0">
          <span className="text-[9px] font-mono tracking-widest text-[#7dd3fc]/60 uppercase">
            Glacier Edition · Atelier Calibrated
          </span>
        </div>
      </div>
    </div>
  );
}
