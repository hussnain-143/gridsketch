'use client';

import React from 'react';
import { BentoCard } from './BentoCard';
import { GridConfig, PaperConfig, FilterMode } from '@/types/editor';
import { calculatePaperGridScale } from '@/lib/image/paper-calculator';
import {
  Sparkles,
  Printer,
  Download,
  SplitSquareVertical,
  Ruler,
  FileText,
  Grid3X3,
  Scaling,
  SunMoon,
} from 'lucide-react';

interface BlueprintStatsBentoCardProps {
  grid: GridConfig;
  paper: PaperConfig;
  mode: FilterMode;
  imageWidth: number;
  imageHeight: number;
  onOpenPrint: () => void;
  onOpenExport: () => void;
  showCompare: boolean;
  onToggleCompare: () => void;
  colSpan?: string;
}

export function BlueprintStatsBentoCard({
  grid,
  paper,
  mode,
  imageWidth,
  imageHeight,
  onOpenPrint,
  onOpenExport,
  showCompare,
  onToggleCompare,
  colSpan = '',
}: BlueprintStatsBentoCardProps) {
  const scale = calculatePaperGridScale(
    imageWidth,
    imageHeight,
    grid.rows,
    grid.columns,
    paper
  );

  const totalCells = grid.rows * grid.columns;

  return (
    <BentoCard
      title="Blueprint Specs"
      icon={Sparkles}
      badge={`${totalCells} Cells`}
      colSpan={colSpan}
    >
      {/* Metrics Row in Layered Glass (Icons Only) */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.12)]">
          <div className="flex items-center gap-1.5 text-[#7dd3fc] mb-1" title="Cell Paper Size">
            <Ruler className="w-3.5 h-3.5" />
          </div>
          <div className="text-sm font-bold font-mono text-[#7dd3fc]">
            {scale.cellWidthMm.toFixed(1)} × {scale.cellHeightMm.toFixed(1)}{' '}
            <span className="text-[10px] text-[#94a3b8] font-normal">mm</span>
          </div>
          <span className="text-[9px] font-mono text-[#c8a0f0]">
            {scale.cellWidthIn.toFixed(2)}″ × {scale.cellHeightIn.toFixed(2)}″
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.12)]">
          <div className="flex items-center gap-1.5 text-[#7dd3fc] mb-1" title="Paper Sheet Format">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="text-sm font-bold font-mono text-[#f0f6fc]">
            {paper.preset} {paper.orientation === 'portrait' ? 'Port.' : 'Land.'}
          </div>
          <span className="text-[9px] font-mono text-[#94a3b8]">
            {scale.paperWidthMm} × {scale.paperHeightMm} mm
          </span>
        </div>
      </div>

      {/* Configuration Status Chips (Icons Only) */}
      <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.1)] space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[#7dd3fc]" title="Grid Matrix Cells">
            <Grid3X3 className="w-3.5 h-3.5" />
          </span>
          <span className="font-mono text-[#f0f6fc] font-medium">
            {grid.columns} × {grid.rows} ({totalCells})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[#7dd3fc]" title="Fit Mode">
            <Scaling className="w-3.5 h-3.5" />
          </span>
          <span className="font-mono text-[#7dd3fc] uppercase font-semibold">
            {paper.fitMode || 'cover'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[#7dd3fc]" title="Tonal Mode">
            <SunMoon className="w-3.5 h-3.5" />
          </span>
          <span className="font-mono text-[#c8a0f0] capitalize font-medium">
            {mode.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Action Buttons (Icons Only) */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          onClick={onOpenPrint}
          title="Print Reference Sheet"
          className="p-3 rounded-xl bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.2)] hover:border-[#7dd3fc]/50 text-[#7dd3fc] flex items-center justify-center transition-all"
        >
          <Printer className="w-5 h-5 stroke-[2]" />
        </button>

        <button
          type="button"
          onClick={onToggleCompare}
          title={showCompare ? 'Exit Compare View' : 'Compare Original Photo'}
          className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
            showCompare
              ? 'bg-[#7dd3fc]/20 border-[#7dd3fc]/50 text-[#7dd3fc] shadow-[0_0_15px_rgba(125,211,252,0.2)]'
              : 'bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/15 border-[rgba(125,211,252,0.12)] text-[#7dd3fc]'
          }`}
        >
          <SplitSquareVertical className="w-5 h-5 stroke-[2]" />
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          title="Export Artwork Image"
          className="p-3 rounded-xl bg-[#7dd3fc] hover:bg-[#bae6fd] text-[#0a0e1a] font-bold flex items-center justify-center shadow-[0_0_20px_rgba(125,211,252,0.3)] transition-all"
        >
          <Download className="w-5 h-5 stroke-[2.4]" />
        </button>
      </div>
    </BentoCard>
  );
}
