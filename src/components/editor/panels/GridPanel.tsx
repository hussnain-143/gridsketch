'use client';

import React, { useState, useEffect } from 'react';
import { GridConfig, GridSizeMode, GridSizeUnit, LabelMode, PaperConfig } from '@/types/editor';
import { calculatePaperGridScale } from '@/lib/image/paper-calculator';
import {
  Grid3X3,
  Hash,
  Sliders,
  Type,
  Ruler,
  Compass,
  Link2,
  Unlink2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { RangeSlider } from '@/components/editor/common/RangeSlider';
import { PanelSection } from '@/components/editor/common/PanelSection';
import { SegmentedControl } from '@/components/editor/common/SegmentedControl';

interface GridPanelProps {
  grid: GridConfig;
  paper?: PaperConfig;
  imageWidth?: number;
  imageHeight?: number;
  onChange: (updates: Partial<GridConfig>) => void;
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
  cm: [1, 1.5, 2, 2.5, 3, 4, 5],
  in: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
  px: [40, 60, 80, 100, 150, 200],
};

const SWATCH_COLORS = [
  { hex: '#ffffff', name: 'White' },
  { hex: '#0f1117', name: 'Charcoal' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#f59e0b', name: 'Amber' },
  { hex: '#ef4444', name: 'Crimson' },
  { hex: '#ec4899', name: 'Magenta' },
  { hex: '#84cc16', name: 'Lime' },
];

const DEFAULT_PAPER: PaperConfig = {
  preset: 'A4',
  orientation: 'portrait',
  customWidthMm: 210,
  customHeightMm: 297,
};

export function GridPanel({
  grid,
  paper = DEFAULT_PAPER,
  imageWidth = 800,
  imageHeight = 800,
  onChange,
}: GridPanelProps) {
  // Tab state: 'number' (Grid Number) or 'size' (Grid Size in mm/cm/in/px)
  const [activeTab, setActiveTab] = useState<GridSizeMode>(grid.gridMode || 'number');
  const [sizeUnit, setSizeUnit] = useState<GridSizeUnit>(grid.sizeUnit || 'mm');
  const [targetCellSize, setTargetCellSize] = useState<number>(() => {
    if (grid.cellSize) return grid.cellSize;
    // Calculate initial target cell size in current unit
    const scale = calculatePaperGridScale(imageWidth, imageHeight, grid.rows, grid.columns, paper);
    if (sizeUnit === 'mm') return Math.round(scale.cellWidthMm) || 25;
    if (sizeUnit === 'cm') return parseFloat((scale.cellWidthMm / 10).toFixed(1)) || 2.5;
    if (sizeUnit === 'in') return parseFloat(scale.cellWidthIn.toFixed(2)) || 1.0;
    return Math.round(imageWidth / grid.columns) || 100;
  });

  // Calculate paper scale analysis
  const scaleAnalysis = calculatePaperGridScale(
    imageWidth,
    imageHeight,
    grid.rows,
    grid.columns,
    paper
  );

  // Convert current cell size to mm
  const getCellSizeInMm = (val: number, unit: GridSizeUnit): number => {
    switch (unit) {
      case 'mm':
        return val;
      case 'cm':
        return val * 10;
      case 'in':
        return val * 25.4;
      case 'px': {
        // Approximate mm from pixels using image printable width
        const ratio = scaleAnalysis.printableWidthMm / Math.max(1, imageWidth);
        return val * ratio;
      }
    }
  };

  // Convert from mm to selected unit
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

  // Handle switching unit (e.g., mm -> cm)
  const handleUnitChange = (newUnit: GridSizeUnit) => {
    const currentMm = getCellSizeInMm(targetCellSize, sizeUnit);
    const converted = convertFromMm(currentMm, newUnit);
    setSizeUnit(newUnit);
    setTargetCellSize(converted);
    onChange({ sizeUnit: newUnit, cellSize: converted });
  };

  // Apply cell size to compute rows and columns
  const applyCellSize = (sizeVal: number, unit: GridSizeUnit) => {
    const validSize = Math.max(0.1, sizeVal);
    setTargetCellSize(validSize);

    let newCols = grid.columns;
    let newRows = grid.rows;

    if (unit === 'px') {
      const baseCols = Math.max(1, Math.min(60, Math.round(imageWidth / validSize)));
      newCols = baseCols;
      if (grid.lockAspectRatio) {
        const cellPx = imageWidth / newCols;
        newRows = Math.max(1, Math.min(60, Math.round(imageHeight / cellPx)));
      } else {
        newRows = Math.max(1, Math.min(60, Math.round(imageHeight / validSize)));
      }
    } else {
      const targetMm = getCellSizeInMm(validSize, unit);
      if (targetMm > 0) {
        const paperW = scaleAnalysis.paperWidthMm;
        const paperH = scaleAnalysis.paperHeightMm;

        const baseCols = Math.max(1, Math.min(60, Math.round(paperW / targetMm)));
        const candidates = [baseCols - 1, baseCols, baseCols + 1].filter((c) => c >= 1 && c <= 60);

        let bestCols = baseCols;
        let bestRows = Math.max(1, Math.min(60, Math.round(paperH / targetMm)));
        let minScore = Infinity;

        if (grid.lockAspectRatio) {
          for (const c of candidates) {
            const cellW = paperW / c;
            const r = Math.max(1, Math.min(60, Math.round(paperH / cellW)));
            const cellH = paperH / r;
            const squareMismatch = Math.abs(cellW - cellH);
            const sizeMismatch = Math.abs(cellW - targetMm);
            const score = squareMismatch * 3 + sizeMismatch;
            if (score < minScore) {
              minScore = score;
              bestCols = c;
              bestRows = r;
            }
          }
          newCols = bestCols;
          newRows = bestRows;
        } else {
          newCols = baseCols;
          newRows = Math.max(1, Math.min(60, Math.round(paperH / targetMm)));
        }
      }
    }

    onChange({
      columns: newCols,
      rows: newRows,
      gridMode: 'size',
      sizeUnit: unit,
      cellSize: validSize,
    });
  };

  const handlePresetGridClick = (rows: number, cols: number) => {
    onChange({
      rows,
      columns: cols,
      gridMode: 'number',
    });
  };

  const handleRowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
    if (grid.lockAspectRatio) {
      const cols = Math.max(
        1,
        Math.min(60, Math.round(val * (scaleAnalysis.paperWidthMm / scaleAnalysis.paperHeightMm)))
      );
      onChange({ rows: val, columns: cols, gridMode: 'number' });
    } else {
      onChange({ rows: val, gridMode: 'number' });
    }
  };

  const handleColsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
    if (grid.lockAspectRatio) {
      const rows = Math.max(
        1,
        Math.min(60, Math.round(val * (scaleAnalysis.paperHeightMm / scaleAnalysis.paperWidthMm)))
      );
      onChange({ columns: val, rows: rows, gridMode: 'number' });
    } else {
      onChange({ columns: val, gridMode: 'number' });
    }
  };

  return (
    <div className="space-y-5 text-slate-200 text-xs">
      {/* Primary Sub-Tabs: Grid Number vs Grid Size */}
      <SegmentedControl
        options={[
          { value: 'number', label: 'Grid Number', icon: Hash },
          { value: 'size', label: 'Grid Size (mm/cm)', icon: Ruler },
        ]}
        value={activeTab}
        onChange={(val) => {
          setActiveTab(val as GridSizeMode);
          onChange({ gridMode: val as GridSizeMode });
        }}
        cols={2}
      />

      {/* TAB 1: GRID NUMBER (COUNT MODE) */}
      {activeTab === 'number' && (
        <div className="space-y-4">
          {/* Preset Grids */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Grid3X3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Preset Divisions</span>
              </label>
              <span className="text-[11px] text-amber-400 font-mono font-bold">
                {grid.columns} × {grid.rows}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_GRIDS.map((p) => {
                const active = grid.rows === p.rows && grid.columns === p.cols;
                return (
                  <button
                    key={p.label}
                    onClick={() => handlePresetGridClick(p.rows, p.cols)}
                    className={`py-1.5 px-2 rounded-lg font-mono text-xs transition-all ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 scale-[1.02]'
                        : 'bg-[#161a24] hover:bg-[#1f2433] text-slate-300 border border-[#262c3d]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Row & Column Inputs */}
          <PanelSection
            title="Custom Grid Count"
            icon={Hash}
            action={
              <button
                type="button"
                onClick={() => onChange({ lockAspectRatio: !grid.lockAspectRatio })}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
                  grid.lockAspectRatio
                    ? 'bg-amber-500/20 text-amber-400 font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Lock square 1:1 cells"
              >
                {grid.lockAspectRatio ? <Link2 className="w-3 h-3" /> : <Unlink2 className="w-3 h-3" />}
                <span>{grid.lockAspectRatio ? 'Square 1:1' : 'Freeform'}</span>
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-medium">Columns (Vertical)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={grid.columns}
                  onChange={handleColsChange}
                  className="w-full bg-[#1b202e] border border-[#2d3448] rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-medium">Rows (Horizontal)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={grid.rows}
                  onChange={handleRowsChange}
                  className="w-full bg-[#1b202e] border border-[#2d3448] rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          </PanelSection>

          {/* Physical Scale Readout for Number Mode */}
          <div className="p-3 rounded-xl bg-[#11141d] border border-amber-500/20 flex items-start gap-2.5">
            <Ruler className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-slate-300">
              <span className="font-bold text-amber-300 block">
                Physical Size on {paper.preset} ({paper.orientation}):
              </span>
              <span>
                Each cell is{' '}
                <strong className="text-white font-mono">
                  {scaleAnalysis.cellWidthMm.toFixed(1)} × {scaleAnalysis.cellHeightMm.toFixed(1)} mm
                </strong>{' '}
                ({(scaleAnalysis.cellWidthMm / 10).toFixed(2)} × {(scaleAnalysis.cellHeightMm / 10).toFixed(2)} cm •{' '}
                {scaleAnalysis.cellWidthIn.toFixed(2)}″ × {scaleAnalysis.cellHeightIn.toFixed(2)}″).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GRID SIZE (PHYSICAL DIMENSION MODE) */}
      {activeTab === 'size' && (
        <div className="space-y-4">
          {/* Unit Selector (mm, cm, in, px) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Ruler className="w-3.5 h-3.5 text-amber-400" />
                <span>Measurement Unit</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {paper.preset} Standard
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

          {/* Quick Preset Size Pills */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1.5 font-medium">
              Quick Size Presets ({sizeUnit})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SIZES[sizeUnit].map((sz) => {
                const active = Math.abs(targetCellSize - sz) < 0.05;
                return (
                  <button
                    key={sz}
                    onClick={() => applyCellSize(sz, sizeUnit)}
                    className={`py-1 px-2.5 rounded-lg text-xs font-mono font-medium transition-all ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25 scale-105'
                        : 'bg-[#141721] hover:bg-[#1f2433] text-slate-300 border border-[#262c3d]'
                    }`}
                  >
                    {sz} {sizeUnit}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Cell Size Input */}
          <PanelSection
            title={`Cell Dimension (${sizeUnit})`}
            icon={Sliders}
            action={
              <button
                type="button"
                onClick={() => onChange({ lockAspectRatio: !grid.lockAspectRatio })}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
                  grid.lockAspectRatio
                    ? 'bg-amber-500/20 text-amber-400 font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Lock square 1:1 cells"
              >
                {grid.lockAspectRatio ? <Link2 className="w-3 h-3" /> : <Unlink2 className="w-3 h-3" />}
                <span>{grid.lockAspectRatio ? 'Square 1:1' : 'Freeform'}</span>
              </button>
            }
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
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
                  className="w-full bg-[#1b202e] border border-[#2d3448] rounded-lg px-3 py-2 text-slate-100 font-mono text-sm font-bold focus:outline-none focus:border-amber-400 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400 uppercase">
                  {sizeUnit}
                </span>
              </div>
            </div>

            {/* Live Computed Grid Breakdown Card */}
            <div className="p-3 rounded-lg bg-[#0e111a] border border-[#1f2537] space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>Resulting Grid Count:</span>
                <strong className="text-amber-400 font-mono text-xs">
                  {grid.columns} cols × {grid.rows} rows ({grid.columns * grid.rows} cells)
                </strong>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>Physical Size on Paper:</span>
                <span className="font-mono text-slate-200">
                  {scaleAnalysis.cellWidthMm.toFixed(1)} × {scaleAnalysis.cellHeightMm.toFixed(1)} mm
                  {' '}({(scaleAnalysis.cellWidthMm / 10).toFixed(1)} × {(scaleAnalysis.cellHeightMm / 10).toFixed(1)} cm)
                </span>
              </div>

              <div className="text-[10px] text-emerald-400/90 pt-1 border-t border-white/5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>Rule your sketchbook lines every {targetCellSize} {sizeUnit}!</span>
              </div>
            </div>
          </PanelSection>
        </div>
      )}

      {/* LINE COLOR & OPACITY (SHARED) */}
      <div className="pt-2 border-t border-[#1d2332]">
        <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider mb-2.5">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Line Style & Thickness</span>
        </label>

        {/* Color Swatches */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-1">
            {SWATCH_COLORS.map((swatch) => (
              <button
                key={swatch.hex}
                onClick={() => onChange({ color: swatch.hex })}
                style={{ backgroundColor: swatch.hex }}
                className={`w-6 h-6 rounded-full border transition-all ${
                  grid.color.toLowerCase() === swatch.hex.toLowerCase()
                    ? 'scale-110 border-amber-400 ring-2 ring-amber-400/40'
                    : 'border-slate-700 hover:scale-105'
                }`}
                title={swatch.name}
              />
            ))}
          </div>

          <div className="relative">
            <input
              type="color"
              value={grid.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
              title="Custom Hex Color"
            />
          </div>
        </div>

        {/* Opacity Slider */}
        <RangeSlider
          label="Opacity"
          value={grid.opacity}
          min={0.1}
          max={1}
          step={0.05}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(val) => onChange({ opacity: val })}
          className="mb-3"
        />

        {/* Thickness Slider */}
        <RangeSlider
          label="Line Thickness"
          value={grid.thickness}
          min={1}
          max={8}
          step={1}
          unit="px"
          onChange={(val) => onChange({ thickness: Math.round(val) })}
        />
      </div>

      {/* GUIDES & ALIGNMENT (SHARED) */}
      <div className="pt-2 border-t border-[#1d2332]">
        <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider mb-2">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Guides & Diagonal Cross</span>
        </label>

        <div className="space-y-1.5">
          {/* Center Lines Toggle */}
          <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#141721] border border-[#232838] cursor-pointer hover:bg-[#191e2b] transition-colors">
            <span className="font-medium text-slate-200 text-xs">Center Crosshairs (Red)</span>
            <input
              type="checkbox"
              checked={grid.showCenterLines}
              onChange={(e) => onChange({ showCenterLines: e.target.checked })}
              className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer accent-amber-500"
            />
          </label>

          {/* Diagonals Toggle (X inside each square) */}
          <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#141721] border border-[#232838] cursor-pointer hover:bg-[#191e2b] transition-colors">
            <div className="flex flex-col">
              <span className="font-medium text-slate-200 text-xs">Diagonal Cross (X in Each Square)</span>
              <span className="text-[10px] text-slate-400">Rules diagonal crosses inside every individual cell</span>
            </div>
            <input
              type="checkbox"
              checked={grid.showDiagonals}
              onChange={(e) => onChange({ showDiagonals: e.target.checked })}
              className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer accent-amber-500"
            />
          </label>

          {/* Light Lines / Subdivisions Control */}
          <div className="p-2.5 rounded-lg bg-[#141721] border border-[#232838] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-slate-200 text-xs">Light Lines (Subdivisions)</span>
                <span className="text-[10px] text-slate-400">Subdivides cells with fine secondary reference lines</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-400">
                {(grid.subdivisions || 1) === 1 ? 'Off' : `${grid.subdivisions}×${grid.subdivisions}`}
              </span>
            </div>
            <SegmentedControl
              options={[
                { value: 1, label: 'Off (None)' },
                { value: 2, label: '2×2 (Half)' },
                { value: 4, label: '4×4 (Quarter)' },
              ]}
              value={grid.subdivisions || 1}
              onChange={(val) => onChange({ subdivisions: val as 1 | 2 | 4 })}
              cols={3}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* GRID LABELS (SHARED) */}
      <div className="pt-2 border-t border-[#1d2332]">
        <label className="font-semibold text-slate-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider mb-2.5">
          <Type className="w-3.5 h-3.5 text-amber-400" />
          <span>Grid Labels & Coordinates</span>
        </label>

        <SegmentedControl
          options={[
            { value: 'alphanumeric', label: 'A1, B2' },
            { value: 'numeric', label: '1, 2, 3' },
            { value: 'none', label: 'No Labels' },
          ]}
          value={grid.labelMode}
          onChange={(val) => onChange({ labelMode: val as LabelMode })}
          cols={3}
          size="sm"
          className="mb-3"
        />

        {grid.labelMode !== 'none' && (
          <RangeSlider
            label="Label Font Size"
            value={grid.labelSize}
            min={10}
            max={28}
            step={1}
            unit="px"
            onChange={(val) => onChange({ labelSize: Math.round(val) })}
          />
        )}
      </div>
    </div>
  );
}
