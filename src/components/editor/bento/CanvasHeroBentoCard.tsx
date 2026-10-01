'use client';

import React from 'react';
import { BentoCard } from './BentoCard';
import { GridConfig, PaperConfig } from '@/types/editor';
import { StudioCanvas } from '@/components/editor/StudioCanvas';
import {
  Maximize2,
  Eye,
  EyeOff,
  FileImage,
} from 'lucide-react';

interface CanvasHeroBentoCardProps {
  processedCanvas: HTMLCanvasElement | null;
  rawImageCanvas: HTMLCanvasElement | null;
  grid: GridConfig;
  paper: PaperConfig;
  showCompare: boolean;
  isProcessing: boolean;
  showPage: boolean;
  onToggleShowPage: () => void;
  isMovingImage: boolean;
  onToggleMoveImage: () => void;
  onPaperChange: (updates: Partial<PaperConfig>) => void;
  imageName: string;
  imageWidth: number;
  imageHeight: number;
  onExpandFullscreen?: () => void;
  onUploadImage?: (file: File) => void;
  onTriggerUpload?: () => void;
  colSpan?: string;
  className?: string;
}

export function CanvasHeroBentoCard({
  processedCanvas,
  rawImageCanvas,
  grid,
  paper,
  showCompare,
  isProcessing,
  showPage,
  onToggleShowPage,
  isMovingImage,
  onToggleMoveImage,
  onPaperChange,
  imageName,
  imageWidth,
  imageHeight,
  onExpandFullscreen,
  onUploadImage,
  onTriggerUpload,
  colSpan = 'col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 row-span-2',
  className = '',
}: CanvasHeroBentoCardProps) {
  return (
    <BentoCard
      title={imageName ? `Canvas Viewport — ${imageName}` : 'Canvas Viewport'}
      icon={FileImage}
      badge={imageWidth > 0 ? `${imageWidth} × ${imageHeight} px` : (paper.fitMode ? `${paper.fitMode}` : 'Live')}
      colSpan={colSpan}
      className={`min-h-[500px] lg:min-h-[620px] ${className}`}
      action={
        <div className="flex items-center gap-1.5">
          {/* Toggle Paper Framing Border */}
          <button
            type="button"
            onClick={onToggleShowPage}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              showPage
                ? 'bg-[#7dd3fc]/20 border-[#7dd3fc]/50 text-[#7dd3fc] shadow-[0_0_12px_rgba(125,211,252,0.2)]'
                : 'bg-[rgba(10,14,26,0.6)] border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
            }`}
            title={showPage ? 'Hide Paper Framing Border' : 'Show Paper Framing Border'}
          >
            {showPage ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen / Focus Mode Trigger */}
          {onExpandFullscreen && (
            <button
              type="button"
              onClick={onExpandFullscreen}
              className="p-1.5 rounded-lg bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.15)] text-[#94a3b8] hover:text-[#7dd3fc] transition-all"
              title="Expand to Fullscreen Focus"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      }
    >
      {/* Canvas Viewport Housing */}
      <div className="relative w-full flex-1 min-h-[420px] lg:min-h-[520px] rounded-xl overflow-hidden border border-[rgba(125,211,252,0.15)] bg-[#070a12] shadow-inner">
        <StudioCanvas
          processedCanvas={processedCanvas}
          rawImageCanvas={rawImageCanvas}
          grid={grid}
          showCompare={showCompare}
          isProcessing={isProcessing}
          paper={paper}
          showPage={showPage}
          onToggleShowPage={onToggleShowPage}
          isMovingImage={isMovingImage}
          onToggleMoveImage={onToggleMoveImage}
          onPaperChange={onPaperChange}
          onUploadImage={onUploadImage}
          onTriggerUpload={onTriggerUpload}
        />
      </div>
    </BentoCard>
  );
}
