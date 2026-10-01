'use client';

import React, { useState } from 'react';
import {
  GridConfig,
  PaperConfig,
  GridSizeMode,
  GridSizeUnit,
  LabelMode,
} from '@/types/editor';
import { BentoCard } from './BentoCard';
import {
  Grid3X3,
  Hash,
  Ruler,
  Link2,
  Unlink2,
  Sliders,
  Sparkles,
  Type,
  EyeOff,
  Columns3,
  Rows3,
  Sun,
  Palette,
  FileSpreadsheet,
  Compass,
  Crosshair,
  Slash,
  Maximize2,
} from 'lucide-react';
import { RangeSlider } from '@/components/editor/common/RangeSlider';
import { SegmentedControl } from '@/components/editor/common/SegmentedControl';
import { calculatePaperGridScale } from '@/lib/image/paper-calculator';

interface GridBlueprintBentoCardProps {
  grid: GridConfig;
  onChange: (updates: Partial<GridConfig>) => void;
  paper?: PaperConfig;
  imageWidth?: number;
  imageHeight?: number;
  colSpan?: string;
}

const PRESET_GRIDS = [
  { label: '2×2', rows: 2, cols: 2 },
  { label: '4×4', rows: 4, cols: 4 },
  { label: '6×6', rows: 6, cols: 6 },
  { label: '8×8', rows: 8, cols: 8 },
  { label: '10×10', rows: 10, cols: 10 },
  { label: '12×12', rows: 12, cols: 12 },
  { label: '16×16', rows: 16, cols: 16 },
  { label: '20×20', rows: 20, cols: 20 },
];

const PRESET_SIZES: Record<GridSizeUnit, number[]> = {
  mm: [10, 15, 20, 25, 30, 40, 50],
  cm: [1, 1.5, 2, 2.5, 3, 5],
  in: [0.5, 0.75, 1, 1.25, 1.5, 2],
  px: [50, 75, 100, 150, 200, 300],
};

const SWATCH_COLORS = [
  { hex: '#7dd3fc', name: 'Ice Blue' },
  { hex: '#ffffff', name: 'White' },
  { hex: '#c8a0f0', name: 'Lavender' },
  { hex: '#0a0e1a', name: 'Navy Black' },
  { hex: '#f59e0b', name: 'Amber' },
];

export function GridBlueprintBentoCard({
  grid,
  onChange,
  paper,
  imageWidth = 800,
  imageHeight = 800,
  colSpan = '',
}: GridBlueprintBentoCardProps) {
  const [activeTab, setActiveTab] = useState<GridSizeMode>(grid.gridMode || 'number');
  const [sizeUnit, setSizeUnit] = useState<GridSizeUnit>(grid.sizeUnit || 'mm');

  const safePaper: PaperConfig = paper || {
    preset: 'A4',
    orientation: 'portrait',
    customWidthMm: 210,
    customHeightMm: 297,
    fitMode: 'cover',
    fitAlignment: 'center',
  };

  // Paper scale analysis for computing physical grid dimensions
  const scaleAnalysis = calculatePaperGridScale(
    imageWidth,
    imageHeight,
    grid.rows,
    grid.columns,
    safePaper,
    0,
    grid
  );

  const [targetCellSize, setTargetCellSize] = useState<number>(() => {
    if (grid.cellSize) return grid.cellSize;
    if (sizeUnit === 'mm') return Math.round(scaleAnalysis.cellWidthMm) || 25;
    if (sizeUnit === 'cm') return parseFloat((scaleAnalysis.cellWidthMm / 10).toFixed(1)) || 2.5;
    if (sizeUnit === 'in') return parseFloat(scaleAnalysis.cellWidthIn.toFixed(2)) || 1.0;
    return Math.round(imageWidth / grid.columns) || 100;
  });

  const getCellSizeInMm = (val: number, unit: GridSizeUnit): number => {
    switch (unit) {
      case 'mm':
        return val;
      case 'cm':
        return val * 10;
      case 'in':
        return val * 25.4;
      case 'px': {
        const ratio = scaleAnalysis.printableWidthMm / Math.max(1, imageWidth);
        return val * ratio;
      }
    }
  };

  const convertFromMm = (mm: number, unit: GridSizeUnit): number => {
    switch (unit) {
      case 'mm':
        return Math.round(mm);
      case 'cm':
        return parseFloat((mm / 10).toFixed(1));
      case 'in':
        return parseFloat((mm / 25.4).toFixed(2));
      case 'px': {
        const ratio = imageWidth / Math.max(1, scaleAnalysis.printableWidthMm);
        return Math.round(mm * ratio);
      }
    }
  };

  const handleUnitChange = (newUnit: GridSizeUnit) => {
    const currentMm = getCellSizeInMm(targetCellSize, sizeUnit);
    const converted = convertFromMm(currentMm, newUnit);
    setSizeUnit(newUnit);
    setTargetCellSize(converted);
    onChange({ sizeUnit: newUnit, cellSize: converted });
  };

  const applyCellSize = (sizeVal: number, unit: GridSizeUnit) => {
    const validSize = Math.max(0.1, sizeVal);
    setTargetCellSize(validSize);

    let newCols = grid.columns;
    let newRows = grid.rows;

    if (unit === 'px') {
      const baseCols = Math.max(1, Math.min(100, Math.ceil(imageWidth / validSize)));
      newCols = baseCols;
      if (grid.lockAspectRatio) {
        newRows = Math.max(1, Math.min(100, Math.ceil(imageHeight / validSize)));
      } else {
        newRows = Math.max(1, Math.min(100, Math.ceil(imageHeight / validSize)));
      }
    } else {
      const targetMm = getCellSizeInMm(validSize, unit);
      if (targetMm > 0) {
        const paperW = scaleAnalysis.paperWidthMm;
        const paperH = scaleAnalysis.paperHeightMm;

        // Directly compute integer columns and rows matching the target physical pitch
        // Main cells will be EXACTLY targetMm. Last column & row take the remaining space!
        newCols = Math.max(1, Math.min(100, Math.ceil(paperW / targetMm)));
        newRows = Math.max(1, Math.min(100, Math.ceil(paperH / targetMm)));
      }
    }

    onChange({
      columns: newCols,
      rows: newRows,
      cellSize: validSize,
      sizeUnit: unit,
      gridMode: 'size',
      lockAspectRatio: true,
      exactCellSize: true,
    });
  };

  const handlePresetSelect = (preset: typeof PRESET_GRIDS[0]) => {
    onChange({ rows: preset.rows, columns: preset.cols, gridMode: 'number' });
  };

  const handleColsChange = (cols: number) => {
    if (grid.lockAspectRatio) {
      const ratio = scaleAnalysis.paperHeightMm / Math.max(1, scaleAnalysis.paperWidthMm);
      const newRows = Math.max(1, Math.min(60, Math.round(cols * ratio)));
      onChange({ columns: cols, rows: newRows, gridMode: 'number' });
    } else {
      onChange({ columns: cols, gridMode: 'number' });
    }
  };

  const handleRowsChange = (rows: number) => {
    if (grid.lockAspectRatio) {
      const ratio = scaleAnalysis.paperWidthMm / Math.max(1, scaleAnalysis.paperHeightMm);
      const newCols = Math.max(1, Math.min(60, Math.round(rows * ratio)));
      onChange({ rows, columns: newCols, gridMode: 'number' });
    } else {
      onChange({ rows, gridMode: 'number' });
    }
  };

  return (
    <BentoCard
      title="Grid Overlay"
      icon={Grid3X3}
      badge={
        activeTab === 'number'
          ? `${grid.columns} × ${grid.rows}`
          : `${targetCellSize} ${sizeUnit}`
      }
      colSpan={colSpan}
    >
      {/* Primary Sub-Tabs: Grid Number vs Grid Size with Units (Icons Only) */}
      <div className="mb-1">
        <SegmentedControl
          options={[
            { value: 'number', label: 'Grid Divisions (Count)', icon: Hash },
            { value: 'size', label: `Grid Cell Dimensions (${sizeUnit})`, icon: Ruler },
          ]}
          value={activeTab}
          onChange={(val) => {
            const nextMode = val as GridSizeMode;
            setActiveTab(nextMode);
            if (nextMode === 'size') {
              applyCellSize(targetCellSize, sizeUnit);
            } else {
              onChange({ gridMode: nextMode });
            }
          }}
          cols={2}
          iconsOnly={true}
          size="sm"
        />
      </div>

      {/* OPTION 1: GRID NUMBER (COUNT / DIVISIONS MODE) */}
      {activeTab === 'number' && (
        <div className="space-y-3.5">
          {/* Quick Density Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-[#7dd3fc]" title="Preset Grid Divisions">
                <Grid3X3 className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] text-[#7dd3fc] font-mono font-bold">
                {grid.columns} × {grid.rows}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {PRESET_GRIDS.map((preset) => {
                const isSelected = grid.rows === preset.rows && grid.columns === preset.cols;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`py-1.5 rounded-lg text-xs font-mono transition-all border ${
                      isSelected
                        ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold border-[#7dd3fc] shadow-[0_0_15px_rgba(125,211,252,0.3)]'
                        : 'bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/10 border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders: Columns & Rows with Pure Icon Headers */}
          <div className="space-y-3 p-3.5 rounded-xl bg-[rgba(10,14,26,0.65)] backdrop-blur-xl border border-[rgba(125,211,252,0.14)] border-t-[rgba(255,255,255,0.15)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-[#7dd3fc]" title="Columns & Rows Division">
                <Columns3 className="w-3.5 h-3.5" />
              </span>
              <button
                type="button"
                onClick={() => onChange({ lockAspectRatio: !grid.lockAspectRatio })}
                className={`p-1 rounded-md border transition-all ${
                  grid.lockAspectRatio
                    ? 'bg-[#7dd3fc]/20 text-[#7dd3fc] border-[#7dd3fc]/50 shadow-[0_0_12px_rgba(125,211,252,0.25)]'
                    : 'bg-[rgba(15,21,36,0.6)] text-[#94a3b8] border-[rgba(125,211,252,0.12)] hover:text-[#f0f6fc]'
                }`}
                title={grid.lockAspectRatio ? 'Unlock 1:1 Square Cells' : 'Lock 1:1 Square Cells'}
              >
                {grid.lockAspectRatio ? <Link2 className="w-3.5 h-3.5 text-[#7dd3fc]" /> : <Unlink2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <RangeSlider
              label="Columns"
              icon={Columns3}
              iconOnly={true}
              value={grid.columns}
              min={1}
              max={40}
              step={1}
              onChange={handleColsChange}
            />

            <RangeSlider
              label="Rows"
              icon={Rows3}
              iconOnly={true}
              value={grid.rows}
              min={1}
              max={40}
              step={1}
              onChange={handleRowsChange}
            />
          </div>
        </div>
      )}

      {/* OPTION 2: GRID SIZE WITH UNITS (PHYSICAL DIMENSION MODE) */}
      {activeTab === 'size' && (
        <div className="space-y-3.5">
          {/* Measurement Unit Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1 text-[#7dd3fc]" title="Measurement Unit">
                <Ruler className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] text-[#7dd3fc] font-mono">
                {safePaper.preset} Standard
              </span>
            </div>

            <SegmentedControl
              options={[
                { value: 'mm', label: 'MM' },
                { value: 'cm', label: 'CM' },
                { value: 'in', label: 'IN' },
                { value: 'px', label: 'PX' },
              ]}
              value={sizeUnit}
              onChange={(u) => handleUnitChange(u as GridSizeUnit)}
              cols={4}
              size="sm"
            />
          </div>

          {/* Quick Size Presets for Current Unit */}
          <div>
            <div className="flex items-center gap-1 mb-1.5 text-[#7dd3fc]" title={`Quick Size Presets (${sizeUnit})`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[9px] font-mono text-[#7dd3fc]/80">{sizeUnit}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SIZES[sizeUnit].map((sz) => {
                const active = Math.abs(targetCellSize - sz) < 0.05;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => applyCellSize(sz, sizeUnit)}
                    className={`py-1 px-2.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                      active
                        ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold border-[#7dd3fc] shadow-[0_0_15px_rgba(125,211,252,0.3)] scale-[1.03]'
                        : 'bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/10 border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
                    }`}
                  >
                    {sz} {sizeUnit}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Cell Dimension Input */}
          <div className="space-y-3 p-3.5 rounded-xl bg-[rgba(10,14,26,0.65)] backdrop-blur-xl border border-[rgba(125,211,252,0.14)] border-t-[rgba(255,255,255,0.15)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-[#7dd3fc]" title={`Cell Dimension (${sizeUnit})`}>
                <Sliders className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono text-[#7dd3fc]/80">{sizeUnit}</span>
              </span>
              <button
                type="button"
                onClick={() => onChange({ lockAspectRatio: !grid.lockAspectRatio })}
                className={`p-1 rounded-md border transition-all ${
                  grid.lockAspectRatio
                    ? 'bg-[#7dd3fc]/20 text-[#7dd3fc] border-[#7dd3fc]/50 shadow-[0_0_12px_rgba(125,211,252,0.2)]'
                    : 'bg-[rgba(15,21,36,0.6)] text-[#94a3b8] border-[rgba(125,211,252,0.12)] hover:text-[#f0f6fc]'
                }`}
                title={grid.lockAspectRatio ? 'Unlock Square 1:1 Ratio' : 'Lock Square 1:1 Ratio'}
              >
                {grid.lockAspectRatio ? <Link2 className="w-3.5 h-3.5 text-[#7dd3fc]" /> : <Unlink2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                step={sizeUnit === 'mm' || sizeUnit === 'px' ? '1' : '0.1'}
                min="0.1"
                max={sizeUnit === 'px' ? 1000 : 200}
                value={targetCellSize}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1;
                  applyCellSize(val, sizeUnit);
                }}
                className="w-full glass-input rounded-xl px-3 py-2 text-[#f0f6fc] font-mono text-sm font-bold focus:outline-none transition-colors pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#7dd3fc] uppercase pointer-events-none">
                {sizeUnit}
              </span>
            </div>

            {/* Computed Grid Breakdown Glass Card */}
            <div className="p-3 rounded-xl bg-[rgba(15,21,36,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.1)] space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-[#94a3b8]">
                <span className="flex items-center gap-1.5 text-[#7dd3fc]" title="Resulting Grid Matrix">
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span className="font-semibold text-[#f0f6fc]">Grid Matrix</span>
                </span>
                <strong className="text-[#7dd3fc] font-mono text-xs font-bold">
                  {grid.columns} × {grid.rows} ({grid.columns * grid.rows} cells)
                </strong>
              </div>

              <div className="flex items-center justify-between text-[#94a3b8] text-[10px]">
                <span className="flex items-center gap-1.5 text-[#7dd3fc]" title="Physical Size on Paper">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Exact Cell Pitch</span>
                </span>
                <span className="font-mono text-[#f0f6fc] font-semibold bg-[#7dd3fc]/15 px-2 py-0.5 rounded-md border border-[#7dd3fc]/30">
                  {targetCellSize} × {targetCellSize} {sizeUnit} · Exact Match
                </span>
              </div>

              {scaleAnalysis.remainderColMm !== undefined && scaleAnalysis.remainderRowMm !== undefined && (
                <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
                  <span className="flex items-center gap-1.5 text-[#c8a0f0]" title="Remaining Space in Edge Cells">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Edge Remainder</span>
                  </span>
                  <span className="font-mono text-[#c8a0f0] font-medium">
                    Col: {scaleAnalysis.remainderColMm.toFixed(1)} mm · Row: {scaleAnalysis.remainderRowMm.toFixed(1)} mm
                  </span>
                </div>
              )}

              <div className="text-[10px] text-[#7dd3fc] pt-1.5 border-t border-[rgba(125,211,252,0.1)] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#7dd3fc] shrink-0" />
                  <span>Rule lines every {targetCellSize} {sizeUnit}</span>
                </span>
                <span className="font-mono text-[9px] text-[#94a3b8]">{safePaper.preset} ({safePaper.orientation})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guides, Diagonals & Crosshairs */}
      <div className="space-y-2.5 p-3.5 rounded-xl bg-[rgba(10,14,26,0.65)] backdrop-blur-xl border border-[rgba(125,211,252,0.14)] border-t-[rgba(255,255,255,0.15)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-[#7dd3fc] font-semibold text-[11px] uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-[#7dd3fc]" />
            <span>Guides & Diagonals</span>
          </span>
          <span className="text-[10px] text-[#94a3b8] font-mono">
            {grid.showDiagonals ? 'Cell Diagonals' : grid.showFullDiagonals ? 'Full Diagonals' : 'Clean'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {/* Diagonal Cross (X in Each Square) */}
          <button
            type="button"
            onClick={() => onChange({ showDiagonals: !grid.showDiagonals })}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
              grid.showDiagonals
                ? 'bg-[#7dd3fc]/20 border-[#7dd3fc]/50 text-[#f0f6fc] shadow-[0_0_12px_rgba(125,211,252,0.2)]'
                : 'bg-[rgba(15,21,36,0.6)] border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Grid3X3 className="w-3.5 h-3.5 text-[#7dd3fc] shrink-0" />
              <div className="truncate">
                <div className="text-xs font-semibold leading-tight">Cell Diagonals</div>
                <div className="text-[9px] text-[#94a3b8] leading-tight">X in every square</div>
              </div>
            </div>
            <div
              className={`w-3.5 h-3.5 rounded-full border transition-colors shrink-0 ml-1 flex items-center justify-center ${
                grid.showDiagonals
                  ? 'bg-[#7dd3fc] border-[#7dd3fc]'
                  : 'border-[rgba(125,211,252,0.3)] bg-transparent'
              }`}
            >
              {grid.showDiagonals && <div className="w-1.5 h-1.5 rounded-full bg-[#0a0e1a]" />}
            </div>
          </button>

          {/* Full Canvas Diagonals (Corner-to-Corner) */}
          <button
            type="button"
            onClick={() => onChange({ showFullDiagonals: !grid.showFullDiagonals })}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
              grid.showFullDiagonals
                ? 'bg-[#7dd3fc]/20 border-[#7dd3fc]/50 text-[#f0f6fc] shadow-[0_0_12px_rgba(125,211,252,0.2)]'
                : 'bg-[rgba(15,21,36,0.6)] border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Slash className="w-3.5 h-3.5 text-[#7dd3fc] shrink-0" />
              <div className="truncate">
                <div className="text-xs font-semibold leading-tight">Full Diagonals</div>
                <div className="text-[9px] text-[#94a3b8] leading-tight">Corner-to-corner X</div>
              </div>
            </div>
            <div
              className={`w-3.5 h-3.5 rounded-full border transition-colors shrink-0 ml-1 flex items-center justify-center ${
                grid.showFullDiagonals
                  ? 'bg-[#7dd3fc] border-[#7dd3fc]'
                  : 'border-[rgba(125,211,252,0.3)] bg-transparent'
              }`}
            >
              {grid.showFullDiagonals && <div className="w-1.5 h-1.5 rounded-full bg-[#0a0e1a]" />}
            </div>
          </button>
        </div>

        {/* Center Crosshairs & Subdivisions in a Dual Row */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {/* Center Crosshairs */}
          <button
            type="button"
            onClick={() => onChange({ showCenterLines: !grid.showCenterLines })}
            className={`flex items-center justify-between p-2 rounded-xl border transition-all text-left ${
              grid.showCenterLines
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                : 'bg-[rgba(15,21,36,0.6)] border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Crosshair className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-xs font-semibold truncate">Center Cross</span>
            </div>
            <div
              className={`w-3 h-3 rounded-full border transition-colors shrink-0 ${
                grid.showCenterLines ? 'bg-rose-400 border-rose-400' : 'border-[rgba(125,211,252,0.3)]'
              }`}
            />
          </button>

          {/* Subdivisions / Light Lines */}
          <div className="p-1 rounded-xl bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.12)] flex items-center justify-between gap-1">
            <span className="text-[10px] text-[#94a3b8] pl-1 font-mono truncate">Subdivide:</span>
            <div className="flex items-center gap-0.5 shrink-0">
              {([1, 2, 4] as (1 | 2 | 4)[]).map((sub) => {
                const active = (grid.subdivisions || 1) === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => onChange({ subdivisions: sub })}
                    className={`py-0.5 px-1.5 rounded-md text-[10px] font-mono transition-all ${
                      active
                        ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold shadow-[0_0_8px_rgba(125,211,252,0.3)]'
                        : 'text-[#94a3b8] hover:text-[#f0f6fc]'
                    }`}
                  >
                    {sub === 1 ? 'Off' : `${sub}×`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Line Thickness & Opacity (Shared) with Pure Icon Sliders */}
      <div className="space-y-3 p-3.5 rounded-xl bg-[rgba(10,14,26,0.65)] backdrop-blur-xl border border-[rgba(125,211,252,0.14)] border-t-[rgba(255,255,255,0.15)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.25)]">
        <RangeSlider
          label="Thickness"
          icon={Sliders}
          iconOnly={true}
          value={grid.thickness}
          min={1}
          max={8}
          step={1}
          formatValue={(v) => `${v}px`}
          onChange={(val) => onChange({ thickness: val })}
        />

        <RangeSlider
          label="Opacity"
          icon={Sun}
          iconOnly={true}
          value={Math.round(grid.opacity * 100)}
          min={10}
          max={100}
          step={5}
          formatValue={(v) => `${v}%`}
          onChange={(val) => onChange({ opacity: val / 100 })}
        />
      </div>

      {/* Labels & Colors (Shared) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Label Mode */}
        <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.65)] backdrop-blur-xl border border-[rgba(125,211,252,0.14)] border-t-[rgba(255,255,255,0.12)]">
          <div className="flex items-center mb-1.5 text-[#7dd3fc]" title="Grid Cell Labels">
            <Type className="w-3.5 h-3.5" />
          </div>
          <SegmentedControl
            options={[
              { value: 'alphanumeric', label: 'Alphanumeric (A1)', icon: Type },
              { value: 'numeric', label: 'Numeric (1,2)', icon: Hash },
              { value: 'none', label: 'Labels Off', icon: EyeOff },
            ]}
            value={grid.labelMode}
            onChange={(val) => onChange({ labelMode: val as LabelMode })}
            cols={3}
            iconsOnly={true}
          />
        </div>

        {/* Line Color Swatches */}
        <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.65)] backdrop-blur-xl border border-[rgba(125,211,252,0.14)] border-t-[rgba(255,255,255,0.12)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1 text-[#7dd3fc]" title="Grid Line Color">
              <Palette className="w-3.5 h-3.5" />
            </span>
            <input
              type="color"
              value={grid.color.startsWith('#') ? grid.color : '#ffffff'}
              onChange={(e) => onChange({ color: e.target.value, labelColor: e.target.value })}
              className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
              title="Custom color"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {SWATCH_COLORS.map((c) => {
              const active = grid.color.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onChange({ color: c.hex, labelColor: c.hex })}
                  className={`w-5 h-5 rounded-md border transition-transform ${
                    active
                      ? 'scale-110 border-[#7dd3fc] ring-2 ring-[#7dd3fc]/40 shadow-[0_0_8px_rgba(125,211,252,0.4)]'
                      : 'border-[rgba(125,211,252,0.2)]'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              );
            })}
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
