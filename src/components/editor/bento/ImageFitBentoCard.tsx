'use client';

import React, { useState } from 'react';
import {
  PaperConfig,
  ImageFitMode,
  ImageAlignment,
  FitLengthUnit,
} from '@/types/editor';
import { BentoCard } from './BentoCard';
import {
  Scaling,
  Maximize2,
  Minimize2,
  Square,
  Ruler,
  Lock,
  Unlock,
  Move,
  ZoomIn,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  FileText,
  Layers,
  LayoutGrid,
  Palette,
  ArrowLeftRight,
  ArrowUpDown,
} from 'lucide-react';
import { RangeSlider } from '@/components/editor/common/RangeSlider';

interface ImageFitBentoCardProps {
  paper: PaperConfig;
  imageWidth: number;
  imageHeight: number;
  onChange: (updates: Partial<PaperConfig>) => void;
  isMovingImage?: boolean;
  onToggleMoveImage?: () => void;
  colSpan?: string;
}

const LENGTH_PRESETS = [
  { label: '100 × 50 px', w: 100, h: 50, unit: 'px' as FitLengthUnit },
  { label: '200 × 100 px', w: 200, h: 100, unit: 'px' as FitLengthUnit },
  { label: '300 × 200 px', w: 300, h: 200, unit: 'px' as FitLengthUnit },
  { label: '500 × 500 px', w: 500, h: 500, unit: 'px' as FitLengthUnit },
  { label: '50% Page', w: 50, h: 50, unit: '%' as FitLengthUnit },
  { label: '100% Page', w: 100, h: 100, unit: '%' as FitLengthUnit },
];

const ALIGNMENT_OPTIONS: { id: ImageAlignment; label: string; iconLabel: string }[] = [
  { id: 'top-left', label: 'Top Left', iconLabel: '↖' },
  { id: 'top', label: 'Top Center', iconLabel: '↑' },
  { id: 'top-right', label: 'Top Right', iconLabel: '↗' },
  { id: 'left', label: 'Center Left', iconLabel: '←' },
  { id: 'center', label: 'Center', iconLabel: '•' },
  { id: 'right', label: 'Center Right', iconLabel: '→' },
  { id: 'bottom-left', label: 'Bottom Left', iconLabel: '↙' },
  { id: 'bottom', label: 'Bottom Center', iconLabel: '↓' },
  { id: 'bottom-right', label: 'Bottom Right', iconLabel: '↘' },
];

const MATTING_COLORS = [
  { id: 'charcoal', label: 'Navy Deep', color: '#0a0e1a' },
  { id: 'white', label: 'White Glass', color: '#ffffff' },
  { id: 'slate', label: 'Glacier Slate', color: '#151d30' },
  { id: 'lavender', label: 'Lavender', color: '#c8a0f0' },
];

export function ImageFitBentoCard({
  paper,
  imageWidth,
  imageHeight,
  onChange,
  isMovingImage = false,
  onToggleMoveImage,
  colSpan = '',
}: ImageFitBentoCardProps) {
  const currFitMode: ImageFitMode = paper.fitMode || 'cover';
  const currOffsetX = paper.imageOffsetX ?? 0;
  const currOffsetY = paper.imageOffsetY ?? 0;
  const currZoom = paper.imageZoom ?? 1.0;
  const currCustomW = paper.fitCustomWidth ?? Math.round(imageWidth * 0.5);
  const currCustomH = paper.fitCustomHeight ?? Math.round(imageHeight * 0.5);
  const currCustomUnit: FitLengthUnit = paper.fitCustomUnit || 'px';
  const currLockAspect = paper.fitLockAspect ?? false;
  const currAlignment: ImageAlignment = paper.fitAlignment || 'center';
  const currBgColor = paper.canvasBackground || '#0a0e1a';
  const currGridTarget = paper.gridTarget || (currFitMode === 'cover' ? 'paper' : 'image');

  const [customBgInput, setCustomBgInput] = useState<string>(
    currBgColor.startsWith('#') ? currBgColor : '#0a0e1a'
  );

  const handleNudge = (dx: number, dy: number) => {
    onChange({
      imageOffsetX: currOffsetX + dx,
      imageOffsetY: currOffsetY + dy,
    });
  };

  const handleResetFraming = () => {
    onChange({
      imageOffsetX: 0,
      imageOffsetY: 0,
      imageZoom: 1.0,
      fitAlignment: 'center',
    });
  };

  const handleWidthChange = (val: number) => {
    const newW = Math.max(1, val);
    if (currLockAspect && imageWidth > 0) {
      const ratio = imageHeight / imageWidth;
      const newH = Math.max(1, Math.round(newW * ratio));
      onChange({ fitCustomWidth: newW, fitCustomHeight: newH });
    } else {
      onChange({ fitCustomWidth: newW });
    }
  };

  const handleHeightChange = (val: number) => {
    const newH = Math.max(1, val);
    if (currLockAspect && imageHeight > 0) {
      const ratio = imageWidth / imageHeight;
      const newW = Math.max(1, Math.round(newH * ratio));
      onChange({ fitCustomHeight: newH, fitCustomWidth: newW });
    } else {
      onChange({ fitCustomHeight: newH });
    }
  };

  const handleApplyPresetLength = (preset: typeof LENGTH_PRESETS[0]) => {
    onChange({
      fitMode: 'custom',
      fitCustomWidth: preset.w,
      fitCustomHeight: preset.h,
      fitCustomUnit: preset.unit,
    });
  };

  return (
    <BentoCard
      title="Image Fit & Sizing"
      icon={Scaling}
      badge={currFitMode}
      colSpan={colSpan}
      action={
        <button
          type="button"
          onClick={handleResetFraming}
          className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#7dd3fc] hover:bg-[#7dd3fc]/10 transition-colors"
          title="Reset to center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      }
    >
      {/* 4 Glacier Glass Mode Tabs (Icons Only) */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.12)]">
        {[
          { id: 'cover' as ImageFitMode, label: 'Cover (Fill viewport)', icon: Maximize2 },
          { id: 'contain' as ImageFitMode, label: 'Contain (Fit entire image)', icon: Minimize2 },
          { id: 'auto' as ImageFitMode, label: 'Auto (Original aspect & scale)', icon: Square },
          { id: 'custom' as ImageFitMode, label: 'Custom Dimensions (e.g. 100px 50px)', icon: Ruler },
        ].map((item) => {
          const active = currFitMode === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ fitMode: item.id })}
              title={item.label}
              className={`py-2 px-2 rounded-lg flex items-center justify-center transition-all duration-150 ${
                active
                  ? 'bg-[#7dd3fc] text-[#0a0e1a] shadow-[0_0_20px_rgba(125,211,252,0.3)]'
                  : 'text-[#94a3b8] hover:text-[#f0f6fc] hover:bg-[#7dd3fc]/10'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Specific Lengths Panel (When Custom Mode is Active) */}
      {currFitMode === 'custom' && (
        <div className="p-3.5 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.14)] space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-semibold text-[#7dd3fc]" title="Custom Length Dimensions">
              <Ruler className="w-3.5 h-3.5" />
            </span>
            <div className="flex items-center bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.15)] rounded-lg p-0.5">
              {(['px', '%', 'mm', 'cm'] as FitLengthUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => onChange({ fitCustomUnit: u })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    currCustomUnit === u
                      ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold shadow-xs'
                      : 'text-[#94a3b8] hover:text-[#f0f6fc]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Width & Height Inputs with Icon Labels */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div>
              <div className="flex items-center gap-1 text-[10px] text-[#94a3b8] mb-1 font-medium" title={`Width (${currCustomUnit})`}>
                <ArrowLeftRight className="w-3 h-3 text-[#7dd3fc]" />
                <span className="font-mono text-[9px] text-[#7dd3fc]/80">{currCustomUnit}</span>
              </div>
              <input
                type="number"
                min="1"
                max="10000"
                value={currCustomW}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                className="w-full bg-[rgba(15,21,36,0.7)] border border-[rgba(125,211,252,0.15)] rounded-lg px-2.5 py-1.5 text-[#f0f6fc] font-mono text-xs focus:outline-none focus:border-[#7dd3fc]/50 focus:shadow-[0_0_15px_rgba(125,211,252,0.15)]"
              />
            </div>

            <div className="flex flex-col items-center justify-center pt-4">
              <button
                type="button"
                onClick={() => onChange({ fitLockAspect: !currLockAspect })}
                className={`p-2 rounded-lg border transition-all ${
                  currLockAspect
                    ? 'bg-[#7dd3fc]/20 border-[#7dd3fc]/50 text-[#7dd3fc] shadow-[0_0_15px_rgba(125,211,252,0.15)]'
                    : 'bg-[rgba(15,21,36,0.6)] border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
                }`}
                title={currLockAspect ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
              >
                {currLockAspect ? (
                  <Lock className="w-3.5 h-3.5 text-[#7dd3fc]" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[10px] text-[#94a3b8] mb-1 font-medium" title={`Height (${currCustomUnit})`}>
                <ArrowUpDown className="w-3 h-3 text-[#7dd3fc]" />
                <span className="font-mono text-[9px] text-[#7dd3fc]/80">{currCustomUnit}</span>
              </div>
              <input
                type="number"
                min="1"
                max="10000"
                value={currCustomH}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                className="w-full bg-[rgba(15,21,36,0.7)] border border-[rgba(125,211,252,0.15)] rounded-lg px-2.5 py-1.5 text-[#f0f6fc] font-mono text-xs focus:outline-none focus:border-[#7dd3fc]/50 focus:shadow-[0_0_15px_rgba(125,211,252,0.15)]"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {LENGTH_PRESETS.map((p) => {
              const isActive =
                currCustomW === p.w &&
                currCustomH === p.h &&
                currCustomUnit === p.unit;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPresetLength(p)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                    isActive
                      ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold border-[#7dd3fc] shadow-[0_0_15px_rgba(125,211,252,0.25)]'
                      : 'bg-[rgba(15,21,36,0.6)] border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc] hover:border-[#7dd3fc]/30'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid Placement Scope: Photo vs Sheet (Icons Only) */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.12)]">
        <span className="flex items-center gap-1.5 text-[#7dd3fc]" title="Grid Placement Target (Photo Boundary vs Full Sheet)">
          <Layers className="w-3.5 h-3.5" />
        </span>
        <div className="flex items-center bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.15)] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onChange({ gridTarget: 'image' })}
            title="Snap to Photo Boundaries"
            className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
              currGridTarget === 'image'
                ? 'bg-[#7dd3fc] text-[#0a0e1a] shadow-[0_0_12px_rgba(125,211,252,0.3)]'
                : 'text-[#94a3b8] hover:text-[#f0f6fc]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChange({ gridTarget: 'paper' })}
            title="Span Full Paper Sheet"
            className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
              currGridTarget === 'paper'
                ? 'bg-[#7dd3fc] text-[#0a0e1a] shadow-[0_0_12px_rgba(125,211,252,0.3)]'
                : 'text-[#94a3b8] hover:text-[#f0f6fc]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alignment Matrix & Matting in Glass Cards (Icon Headers) */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {/* Alignment */}
        <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.12)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 text-[#7dd3fc]" title="9-Point Subject Alignment">
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <div className="grid grid-cols-3 gap-1.5 w-24 mx-auto">
            {ALIGNMENT_OPTIONS.map((opt) => {
              const active = currAlignment === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ fitAlignment: opt.id })}
                  className={`h-7 rounded-lg text-xs flex items-center justify-center transition-all ${
                    active
                      ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold shadow-[0_0_15px_rgba(125,211,252,0.3)] scale-105'
                      : 'bg-[rgba(15,21,36,0.6)] text-[#94a3b8] hover:text-[#f0f6fc] border border-[rgba(125,211,252,0.12)]'
                  }`}
                  title={opt.label}
                >
                  {opt.iconLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Matting Color Swatches (Icons Only) */}
        <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.12)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 text-[#7dd3fc]" title="Canvas Matting Background">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center justify-around h-full">
            {MATTING_COLORS.map((bg) => {
              const active = currBgColor.toLowerCase() === bg.color.toLowerCase();
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => onChange({ canvasBackground: bg.color })}
                  title={bg.label}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    active
                      ? 'border-[#7dd3fc] ring-2 ring-[#7dd3fc]/50 scale-110 shadow-[0_0_10px_rgba(125,211,252,0.35)]'
                      : 'border-[rgba(125,211,252,0.2)] hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: bg.color }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Framing Dragging & Fine Nudge Controls */}
      <div className="pt-2 border-t border-[rgba(125,211,252,0.1)] space-y-2.5">
        {onToggleMoveImage && (
          <button
            type="button"
            onClick={onToggleMoveImage}
            title={isMovingImage ? 'Done Dragging' : 'Drag & Reposition Subject on Canvas'}
            className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
              isMovingImage
                ? 'bg-[#7dd3fc] text-[#0a0e1a] border-[#7dd3fc] shadow-[0_0_20px_rgba(125,211,252,0.3)] animate-pulse'
                : 'bg-[rgba(125,211,252,0.08)] hover:bg-[rgba(125,211,252,0.15)] border-[rgba(125,211,252,0.2)] text-[#7dd3fc]'
            }`}
          >
            <Move className="w-4 h-4" />
          </button>
        )}

        <RangeSlider
          label="Framing Zoom"
          icon={ZoomIn}
          iconOnly={true}
          value={currZoom}
          min={0.2}
          max={4}
          step={0.05}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(val) => onChange({ imageZoom: val })}
        />

        {/* Directional Nudge Pad (Icons Only) */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[#7dd3fc]" title="Fine Directional Nudge">
            <Move className="w-3.5 h-3.5" />
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleNudge(-25, 0)}
              className="p-1.5 rounded-lg bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.15)] text-[#94a3b8] hover:text-[#7dd3fc] transition-colors"
              title="Nudge Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, -25)}
              className="p-1.5 rounded-lg bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.15)] text-[#94a3b8] hover:text-[#7dd3fc] transition-colors"
              title="Nudge Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, 25)}
              className="p-1.5 rounded-lg bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.15)] text-[#94a3b8] hover:text-[#7dd3fc] transition-colors"
              title="Nudge Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(25, 0)}
              className="p-1.5 rounded-lg bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.15)] text-[#94a3b8] hover:text-[#7dd3fc] transition-colors"
              title="Nudge Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
