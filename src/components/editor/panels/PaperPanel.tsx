'use client';

import React, { useState } from 'react';
import {
  PaperConfig,
  PaperPreset,
  PaperOrientation,
  ImageFitMode,
  ImageAlignment,
  FitLengthUnit,
} from '@/types/editor';
import {
  calculatePaperGridScale,
  calculatePageFraming,
  PAPER_SIZES,
} from '@/lib/image/paper-calculator';
import { CANVAS_BACKGROUND_PRESETS } from '@/lib/theme/color-schemes';
import {
  FileText,
  Ruler,
  AlertTriangle,
  RotateCw,
  Move,
  ZoomIn,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Maximize2,
  Minimize2,
  Scaling,
  Square,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Pipette,
} from 'lucide-react';
import { RangeSlider } from '@/components/editor/common/RangeSlider';
import { PanelSection } from '@/components/editor/common/PanelSection';
import { SegmentedControl } from '@/components/editor/common/SegmentedControl';

interface PaperPanelProps {
  paper: PaperConfig;
  imageWidth: number;
  imageHeight: number;
  rows: number;
  columns: number;
  onChange: (updates: Partial<PaperConfig>) => void;
  isMovingImage?: boolean;
  onToggleMoveImage?: () => void;
}

const LENGTH_PRESETS = [
  { label: '100 × 50 px', w: 100, h: 50, unit: 'px' as FitLengthUnit },
  { label: '200 × 100 px', w: 200, h: 100, unit: 'px' as FitLengthUnit },
  { label: '300 × 200 px', w: 300, h: 200, unit: 'px' as FitLengthUnit },
  { label: '400 × 300 px', w: 400, h: 300, unit: 'px' as FitLengthUnit },
  { label: '500 × 500 px', w: 500, h: 500, unit: 'px' as FitLengthUnit },
  { label: '800 × 600 px', w: 800, h: 600, unit: 'px' as FitLengthUnit },
  { label: '50% Page', w: 50, h: 50, unit: '%' as FitLengthUnit },
  { label: '100% Page', w: 100, h: 100, unit: '%' as FitLengthUnit },
];

const ALIGNMENT_OPTIONS: { id: ImageAlignment; label: string; iconLabel: string }[] = [
  { id: 'top-left', label: 'Top Left', iconLabel: '↖' },
  { id: 'top', label: 'Top Center', iconLabel: '⬆' },
  { id: 'top-right', label: 'Top Right', iconLabel: '↗' },
  { id: 'left', label: 'Center Left', iconLabel: '⬅' },
  { id: 'center', label: 'Center', iconLabel: '⏺' },
  { id: 'right', label: 'Center Right', iconLabel: '➡' },
  { id: 'bottom-left', label: 'Bottom Left', iconLabel: '↙' },
  { id: 'bottom', label: 'Bottom Center', iconLabel: '⬇' },
  { id: 'bottom-right', label: 'Bottom Right', iconLabel: '↘' },
];

export function PaperPanel({
  paper,
  imageWidth,
  imageHeight,
  rows,
  columns,
  onChange,
  isMovingImage = false,
  onToggleMoveImage,
}: PaperPanelProps) {
  const scaleAnalysis = calculatePaperGridScale(
    imageWidth,
    imageHeight,
    rows,
    columns,
    paper
  );

  const framing = calculatePageFraming(imageWidth, imageHeight, paper);

  const presets: PaperPreset[] = ['A4', 'A3', 'A2', 'Letter', 'Legal', 'Custom'];

  const currFitMode: ImageFitMode = paper.fitMode || 'cover';
  const currOffsetX = paper.imageOffsetX ?? 0;
  const currOffsetY = paper.imageOffsetY ?? 0;
  const currZoom = paper.imageZoom ?? 1.0;
  const currCustomW = paper.fitCustomWidth ?? Math.round(imageWidth * 0.5);
  const currCustomH = paper.fitCustomHeight ?? Math.round(imageHeight * 0.5);
  const currCustomUnit: FitLengthUnit = paper.fitCustomUnit || 'px';
  const currLockAspect = paper.fitLockAspect ?? false;
  const currAlignment: ImageAlignment = paper.fitAlignment || 'center';
  const currBgColor = paper.canvasBackground || '#12151d';

  const [customBgInput, setCustomBgInput] = useState<string>(
    currBgColor.startsWith('#') ? currBgColor : '#12151d'
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
    <div className="space-y-6 text-slate-200 text-xs">
      <div>
        <h3 className="font-semibold text-slate-300 uppercase text-[11px] tracking-wider mb-1 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Paper & Canvas Sizing</span>
        </h3>
        <p className="text-[11px] text-slate-400">
          Configure physical drawing sheet standard, image fitting modes, and real-world rulers.
        </p>
      </div>

      {/* Paper Preset Buttons */}
      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-2">
          Select Physical Paper Standard
        </label>
        <SegmentedControl
          options={presets.map((p) => ({ value: p, label: p }))}
          value={paper.preset}
          onChange={(p) => onChange({ preset: p as PaperPreset })}
          cols={3}
        />
      </div>

      {/* Orientation Selector */}
      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-2">
          Paper Orientation
        </label>
        <SegmentedControl
          options={[
            { value: 'portrait', label: 'Portrait', icon: RotateCw },
            { value: 'landscape', label: 'Landscape', icon: RotateCw },
          ]}
          value={paper.orientation}
          onChange={(orient) => onChange({ orientation: orient as PaperOrientation })}
          cols={2}
        />
      </div>

      {/* Custom Dimensions if Custom selected */}
      {paper.preset === 'Custom' && (
        <div className="p-3.5 rounded-xl bg-[#141721] border border-[#232838] space-y-3">
          <span className="text-[11px] font-semibold text-slate-300 block">
            Custom Canvas Dimensions (mm)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Width (mm)</label>
              <input
                type="number"
                min="10"
                max="2000"
                value={paper.customWidthMm}
                onChange={(e) =>
                  onChange({ customWidthMm: Math.max(10, parseInt(e.target.value) || 10) })
                }
                className="w-full bg-[#1b202e] border border-[#2e364a] rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Height (mm)</label>
              <input
                type="number"
                min="10"
                max="2000"
                value={paper.customHeightMm}
                onChange={(e) =>
                  onChange({ customHeightMm: Math.max(10, parseInt(e.target.value) || 10) })
                }
                className="w-full bg-[#1b202e] border border-[#2e364a] rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE FITTING & SIZING ── */}
      <PanelSection
        title="Image Fit & Sizing"
        icon={Scaling}
        description="Choose how your photo fits inside the container: cover, contain, auto, or exact specific lengths."
      >
        {/* Fit Mode Selector Cards */}
        <div className="grid grid-cols-2 gap-2">
          {/* Cover */}
          <button
            type="button"
            onClick={() => onChange({ fitMode: 'cover' })}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              currFitMode === 'cover'
                ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-semibold shadow-md shadow-amber-500/10'
                : 'bg-[#181c28] hover:bg-[#1f2434] border-[#293043] text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold">Cover</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Fills entire container, cropping overflow.
            </p>
          </button>

          {/* Contain */}
          <button
            type="button"
            onClick={() => onChange({ fitMode: 'contain' })}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              currFitMode === 'contain'
                ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-semibold shadow-md shadow-amber-500/10'
                : 'bg-[#181c28] hover:bg-[#1f2434] border-[#293043] text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold">Contain</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Fits completely inside without cropping.
            </p>
          </button>

          {/* Auto */}
          <button
            type="button"
            onClick={() => onChange({ fitMode: 'auto' })}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              currFitMode === 'auto'
                ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-semibold shadow-md shadow-amber-500/10'
                : 'bg-[#181c28] hover:bg-[#1f2434] border-[#293043] text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Square className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold">Auto</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              1:1 natural pixel dimensions of image.
            </p>
          </button>

          {/* Specific Lengths (Custom) */}
          <button
            type="button"
            onClick={() => onChange({ fitMode: 'custom' })}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              currFitMode === 'custom'
                ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-semibold shadow-md shadow-amber-500/10'
                : 'bg-[#181c28] hover:bg-[#1f2434] border-[#293043] text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Ruler className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold">Lengths (Custom)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Specific dimensions (e.g. 100px 50px).
            </p>
          </button>
        </div>

        {/* Specific Lengths Customizer (When Custom Mode is Selected) */}
        {currFitMode === 'custom' && (
          <div className="p-3.5 rounded-xl bg-[#141721] border border-[#262c3e] space-y-3.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-300">
                Custom Length Dimensions
              </span>
              {/* Unit Selector */}
              <div className="flex items-center bg-[#1b202e] border border-[#2e364a] rounded-lg p-0.5">
                {(['px', '%', 'mm', 'cm'] as FitLengthUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onChange({ fitCustomUnit: u })}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      currCustomUnit === u
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs for Width and Height */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Width ({currCustomUnit})
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={currCustomW}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#1b202e] border border-[#2e364a] rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Lock Aspect Ratio Toggle */}
              <div className="flex flex-col items-center justify-center pt-4">
                <button
                  type="button"
                  onClick={() => onChange({ fitLockAspect: !currLockAspect })}
                  className={`p-2 rounded-lg border transition-colors ${
                    currLockAspect
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#1b202e] border-[#2e364a] text-slate-400 hover:text-slate-200'
                  }`}
                  title={currLockAspect ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                >
                  {currLockAspect ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Height ({currCustomUnit})
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={currCustomH}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#1b202e] border border-[#2e364a] rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Quick Length Presets */}
            <div>
              <span className="block text-[10px] text-slate-400 mb-1.5 font-medium">
                Quick Length Presets
              </span>
              <div className="grid grid-cols-4 gap-1.5">
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
                      className={`px-1.5 py-1 rounded border text-[10px] font-mono text-center truncate transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                          : 'bg-[#1b202e] border-[#2e364a] text-slate-300 hover:bg-[#252c40]'
                      }`}
                      title={p.label}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 9-Position Alignment Matrix */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-slate-400">
              Alignment Inside Container
            </label>
            <span className="text-[10px] font-mono text-amber-400 uppercase">
              {currAlignment.replace('-', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-[#141721] border border-[#232838] max-w-[200px] mx-auto">
            {ALIGNMENT_OPTIONS.map((opt) => {
              const active = currAlignment === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ fitAlignment: opt.id })}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                      : 'bg-[#1b202e] hover:bg-[#252c40] text-slate-300 border border-[#2e364a]'
                  }`}
                  title={opt.label}
                >
                  <span>{opt.iconLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Placement Scope: Snap to Photo vs Full Sheet */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-slate-400">
              Grid Lines Placement
            </label>
            <span className="text-[10px] font-mono text-amber-400 uppercase">
              {(paper.gridTarget || (currFitMode === 'cover' ? 'paper' : 'image')) === 'image' ? 'On Photo' : 'Full Sheet'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ gridTarget: 'image' })}
              className={`py-2 px-3 rounded-lg border text-center text-xs transition-all ${
                (paper.gridTarget || (currFitMode === 'cover' ? 'paper' : 'image')) === 'image'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-[#181c28] hover:bg-[#1f2434] border-[#293043] text-slate-300'
              }`}
            >
              Snap Grid to Photo
            </button>
            <button
              type="button"
              onClick={() => onChange({ gridTarget: 'paper' })}
              className={`py-2 px-3 rounded-lg border text-center text-xs transition-all ${
                (paper.gridTarget || (currFitMode === 'cover' ? 'paper' : 'image')) === 'paper'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-[#181c28] hover:bg-[#1f2434] border-[#293043] text-slate-300'
              }`}
            >
              Span Full Sheet
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {(paper.gridTarget || (currFitMode === 'cover' ? 'paper' : 'image')) === 'image'
              ? 'Grid rows & columns divide your reference photo directly.'
              : 'Grid rows & columns divide the entire paper sheet boundary.'}
          </p>
        </div>

        {/* Container Matting Background Color (when letterboxed) */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-2">
            Matting Background Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {CANVAS_BACKGROUND_PRESETS.map((bg) => {
              const active = currBgColor === bg.color;
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => onChange({ canvasBackground: bg.color })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${
                    active
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-semibold ring-1 ring-amber-400/30'
                      : 'border-[#293043] bg-[#181c28] hover:bg-[#1e2333] text-slate-300'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                    style={{
                      backgroundColor: bg.color === 'transparent' ? '#334155' : bg.color,
                    }}
                  />
                  <span>{bg.label}</span>
                </button>
              );
            })}

            {/* Custom Hex Color Picker */}
            <div className="flex items-center gap-1.5 ml-auto">
              <input
                type="color"
                value={customBgInput}
                onChange={(e) => {
                  setCustomBgInput(e.target.value);
                  onChange({ canvasBackground: e.target.value });
                }}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                title="Pick custom background"
              />
            </div>
          </div>
        </div>
      </PanelSection>

      {/* ── IMAGE POSITION & FRAMING CONTROLS ── */}
      <PanelSection
        title="Framing, Zoom & Pan"
        icon={Move}
        action={
          <button
            type="button"
            onClick={handleResetFraming}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-400 transition-colors"
            title="Reset position and zoom to center"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Center</span>
          </button>
        }
        description={`Interactive zoom and pan positioning inside the ${paper.preset} container.`}
      >
        {/* Interactive Drag Toggle Button */}
        {onToggleMoveImage && (
          <button
            type="button"
            onClick={onToggleMoveImage}
            className={`w-full py-2 px-3 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
              isMovingImage
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25 animate-pulse'
                : 'bg-[#1b202e] hover:bg-[#23293b] border-[#2e364a] text-slate-200'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>{isMovingImage ? 'Done Moving Image' : 'Drag Photo On Canvas'}</span>
          </button>
        )}

        {/* Zoom / Scale inside page */}
        <RangeSlider
          label="Framing Zoom"
          icon={ZoomIn}
          value={currZoom}
          min={0.2}
          max={4}
          step={0.05}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(val) => onChange({ imageZoom: val })}
        />

        {/* Horizontal Position Slider */}
        <RangeSlider
          label="Horizontal Shift"
          value={currOffsetX}
          min={-Math.max(50, framing.maxPanX)}
          max={Math.max(50, framing.maxPanX)}
          step={2}
          leftLabel="← Left"
          centerLabel="Center"
          rightLabel="Right →"
          formatValue={(v) => (v === 0 ? 'Centered' : `${v > 0 ? '+' : ''}${v}px`)}
          onChange={(val) => onChange({ imageOffsetX: Math.round(val) })}
        />

        {/* Vertical Position Slider */}
        <RangeSlider
          label="Vertical Shift"
          value={currOffsetY}
          min={-Math.max(50, framing.maxPanY)}
          max={Math.max(50, framing.maxPanY)}
          step={2}
          leftLabel="↑ Top"
          centerLabel="Center"
          rightLabel="Bottom ↓"
          formatValue={(v) => (v === 0 ? 'Centered' : `${v > 0 ? '+' : ''}${v}px`)}
          onChange={(val) => onChange({ imageOffsetY: Math.round(val) })}
        />

        {/* Directional Nudge Pad */}
        <div className="pt-2 border-t border-[#1f2537]">
          <span className="block text-[10px] text-slate-400 mb-2 font-medium">Fine Nudge</span>
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleNudge(-25, 0)}
              className="p-1.5 rounded-lg bg-[#191e2b] hover:bg-[#23293b] border border-[#2a3143] text-slate-300"
              title="Nudge Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleNudge(0, -25)}
                className="p-1.5 rounded-lg bg-[#191e2b] hover:bg-[#23293b] border border-[#2a3143] text-slate-300"
                title="Nudge Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleNudge(0, 25)}
                className="p-1.5 rounded-lg bg-[#191e2b] hover:bg-[#23293b] border border-[#2a3143] text-slate-300"
                title="Nudge Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleNudge(25, 0)}
              className="p-1.5 rounded-lg bg-[#191e2b] hover:bg-[#23293b] border border-[#2a3143] text-slate-300"
              title="Nudge Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </PanelSection>

      {/* Live Physical Ruler Calculation Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#181c28] to-[#12151f] border border-amber-500/30 space-y-3.5 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
          <Ruler className="w-4 h-4 stroke-[2.5]" />
          <span>Real-World Ruler Dimensions</span>
        </div>

        {/* Calculated Square Dimension Readout */}
        <div className="bg-[#12151d] p-3 rounded-lg border border-[#272d3d] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            Each Grid Square On Your Paper
          </div>
          <div className="text-base font-bold font-mono text-amber-300">
            {scaleAnalysis.cellWidthMm.toFixed(1)} × {scaleAnalysis.cellHeightMm.toFixed(1)} mm
          </div>
          <div className="text-xs font-mono text-slate-400">
            ({scaleAnalysis.cellWidthIn.toFixed(2)}″ × {scaleAnalysis.cellHeightIn.toFixed(2)}″ inches)
          </div>
        </div>

        {/* Summary Table */}
        <div className="space-y-1.5 text-[11px] pt-1 border-t border-[#232838]">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Grid Cells:</span>
            <span className="font-mono text-slate-200">
              {columns} cols × {rows} rows ({columns * rows} squares)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Paper Sheet Size:</span>
            <span className="font-mono text-slate-200">
              {scaleAnalysis.paperWidthMm} × {scaleAnalysis.paperHeightMm} mm
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Framed Image Area:</span>
            <span className="font-mono text-slate-200">
              {framing.imgDisplayW} × {framing.imgDisplayH} px ({currFitMode})
            </span>
          </div>
        </div>

        {/* Aspect Ratio Note */}
        {scaleAnalysis.aspectRatioMismatch && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Image aspect ratio differs from {paper.preset} sheet proportions. Fitting mode is currently set to{' '}
              <strong className="underline uppercase">{currFitMode}</strong>.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
