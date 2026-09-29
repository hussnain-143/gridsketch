'use client';

import React from 'react';
import { PaperConfig, PaperPreset, PaperOrientation } from '@/types/editor';
import { calculatePaperGridScale } from '@/lib/image/paper-calculator';
import { BentoCard } from './BentoCard';
import {
  Ruler,
  RectangleVertical,
  RectangleHorizontal,
  FileText,
  RotateCw,
  FileSpreadsheet,
  ArrowLeftRight,
  ArrowUpDown,
} from 'lucide-react';
import { SegmentedControl } from '@/components/editor/common/SegmentedControl';

interface PaperRulerBentoCardProps {
  paper: PaperConfig;
  imageWidth: number;
  imageHeight: number;
  rows: number;
  columns: number;
  onChange: (updates: Partial<PaperConfig>) => void;
  colSpan?: string;
}

const PRESETS: PaperPreset[] = ['A4', 'A3', 'Letter', 'Legal', 'Custom'];

export function PaperRulerBentoCard({
  paper,
  imageWidth,
  imageHeight,
  rows,
  columns,
  onChange,
  colSpan = '',
}: PaperRulerBentoCardProps) {
  const scaleAnalysis = calculatePaperGridScale(
    imageWidth,
    imageHeight,
    rows,
    columns,
    paper
  );

  return (
    <BentoCard
      title="Physical Paper & Scale"
      icon={Ruler}
      badge={`${paper.preset} · ${paper.orientation === 'portrait' ? 'Port.' : 'Land.'}`}
      colSpan={colSpan}
    >
      {/* Paper Standard Selector */}
      <div>
        <div className="flex items-center mb-1.5 text-[#7dd3fc]" title="Paper Sheet Standard">
          <FileText className="w-3.5 h-3.5" />
        </div>
        <SegmentedControl
          options={PRESETS.map((p) => ({ value: p, label: p }))}
          value={paper.preset}
          onChange={(p) => onChange({ preset: p as PaperPreset })}
          cols={5}
        />
      </div>

      {/* Orientation Selector */}
      <div>
        <div className="flex items-center mb-1.5 text-[#7dd3fc]" title="Paper Orientation">
          <RotateCw className="w-3.5 h-3.5" />
        </div>
        <SegmentedControl
          options={[
            { value: 'portrait', label: 'Portrait', icon: RectangleVertical },
            { value: 'landscape', label: 'Landscape', icon: RectangleHorizontal },
          ]}
          value={paper.orientation}
          onChange={(orient) => onChange({ orientation: orient as PaperOrientation })}
          cols={2}
          iconsOnly={false}
        />
      </div>

      {/* Custom Dimensions (if Custom selected) */}
      {paper.preset === 'Custom' && (
        <div className="p-3.5 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.14)] space-y-2">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7dd3fc]">
            <Ruler className="w-3.5 h-3.5" />
            <span className="font-mono text-[9px]">mm</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center gap-1 text-[9px] text-[#94a3b8] mb-1" title="Width (mm)">
                <ArrowLeftRight className="w-3 h-3 text-[#7dd3fc]" />
                <span className="font-mono">mm</span>
              </div>
              <input
                type="number"
                min="10"
                max="2000"
                value={paper.customWidthMm}
                onChange={(e) =>
                  onChange({ customWidthMm: Math.max(10, parseInt(e.target.value) || 10) })
                }
                className="w-full bg-[rgba(15,21,36,0.7)] border border-[rgba(125,211,252,0.15)] rounded-lg px-2.5 py-1 text-[#f0f6fc] font-mono text-xs focus:outline-none focus:border-[#7dd3fc]/50"
              />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[9px] text-[#94a3b8] mb-1" title="Height (mm)">
                <ArrowUpDown className="w-3 h-3 text-[#7dd3fc]" />
                <span className="font-mono">mm</span>
              </div>
              <input
                type="number"
                min="10"
                max="2000"
                value={paper.customHeightMm}
                onChange={(e) =>
                  onChange({ customHeightMm: Math.max(10, parseInt(e.target.value) || 10) })
                }
                className="w-full bg-[rgba(15,21,36,0.7)] border border-[rgba(125,211,252,0.15)] rounded-lg px-2.5 py-1 text-[#f0f6fc] font-mono text-xs focus:outline-none focus:border-[#7dd3fc]/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Clean Physical Dimensions Box */}
      <div className="p-3.5 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.14)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[#7dd3fc]" title="Physical Cell Size">
            <Ruler className="w-3.5 h-3.5" />
          </span>
          <span className="text-[10px] font-mono text-[#c8a0f0]">
            {scaleAnalysis.cellWidthIn.toFixed(2)}″ × {scaleAnalysis.cellHeightIn.toFixed(2)}″
          </span>
        </div>

        <div className="text-xl font-bold font-mono text-[#7dd3fc] tracking-tight">
          {scaleAnalysis.cellWidthMm.toFixed(1)} × {scaleAnalysis.cellHeightMm.toFixed(1)}{' '}
          <span className="text-xs text-[#94a3b8] font-normal">mm</span>
        </div>

        <div className="pt-2 border-t border-[rgba(125,211,252,0.1)] flex items-center justify-between text-[10px] text-[#94a3b8]">
          <span className="flex items-center gap-1 text-[#7dd3fc]" title="Sheet Dimension">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </span>
          <span className="font-mono text-[#f0f6fc]">
            {scaleAnalysis.paperWidthMm} × {scaleAnalysis.paperHeightMm} mm
          </span>
        </div>
      </div>
    </BentoCard>
  );
}
