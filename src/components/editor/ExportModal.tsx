'use client';

import React, { useState } from 'react';
import {
  ExportConfig,
  ExportFormat,
  ExportMode,
  GridConfig,
  PaperConfig,
} from '@/types/editor';
import {
  X,
  Download,
  FileImage,
  FileText,
  CheckCircle2,
  Share2,
  Grid,
  Columns2,
  Layers,
  Ruler,
  FileSpreadsheet,
  Scissors,
  Bookmark,
  AlertCircle,
} from 'lucide-react';
import {
  createExportCanvas,
  downloadImage,
  shareImage,
  downloadPdf,
  sharePdf,
} from '@/lib/image/export';
import { calculatePaperGridScale } from '@/lib/image/paper-calculator';
import { PermissionDialog, checkStoragePermissionGranted } from './PermissionDialog';
import { Capacitor } from '@capacitor/core';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedCanvas: HTMLCanvasElement | null;
  rawImageCanvas?: HTMLCanvasElement | null;
  imageName: string;
  grid: GridConfig;
  paper: PaperConfig;
  currentFilterName: string;
}

export function ExportModal({
  isOpen,
  onClose,
  processedCanvas,
  rawImageCanvas,
  imageName,
  grid,
  paper,
  currentFilterName,
}: ExportModalProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'png',
    exportMode: 'standard',
    includeGrid: true,
    includeLabels: grid.labelMode !== 'none',
    includeScaleWatermark: true,
    includeRulerMargins: false,
    includeDrafterLegend: false,
    quality: 0.95,
    posterConfig: {
      rows: 2,
      columns: 2,
      overlapMm: 10,
    },
    drafterTitle: imageName,
    artistName: '',
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportMethod, setExportMethod] = useState<'share' | 'download'>('download');
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState<boolean>(false);

  if (!isOpen || !processedCanvas) return null;

  const scaleAnalysis = calculatePaperGridScale(
    processedCanvas.width,
    processedCanvas.height,
    grid.rows,
    grid.columns,
    paper,
    0,
    grid
  );

  const handleExportModeChange = (mode: ExportMode) => {
    setErrorMessage(null);
    setConfig((prev) => {
      let format = prev.format;
      // Multi-tile poster requires PDF
      if (mode === 'poster') {
        format = 'pdf';
      }
      return {
        ...prev,
        exportMode: mode,
        format,
      };
    });
  };

  const executeDownload = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setErrorMessage(null);
    try {
      const exportCanvas = createExportCanvas(
        processedCanvas,
        grid,
        config,
        paper,
        currentFilterName,
        rawImageCanvas
      );

      let result: { method: 'download' | 'share'; filename: string; path?: string };
      if (config.format === 'pdf' || config.exportMode === 'poster') {
        result = await downloadPdf(exportCanvas, imageName, paper, grid, config);
      } else {
        result = await downloadImage(exportCanvas, imageName, config.format, config.quality);
      }
      setExportMethod('download');
      if (result.path) {
        setSavedPath(result.path);
      }
      setExportSuccess(true);
      setTimeout(() => {
        onClose();
        setExportSuccess(false);
        setSavedPath(null);
      }, 2000);
    } catch (err: unknown) {
      console.error('Download error:', err);
      const msg = err instanceof Error ? err.message : 'Download failed. Please check device storage and permissions.';
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadClick = async () => {
    if (Capacitor.isNativePlatform()) {
      const granted = await checkStoragePermissionGranted();
      if (!granted) {
        setIsPermissionDialogOpen(true);
        return;
      }
    }
    await executeDownload();
  };

  const handleShareClick = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setErrorMessage(null);
    try {
      const exportCanvas = createExportCanvas(
        processedCanvas,
        grid,
        config,
        paper,
        currentFilterName,
        rawImageCanvas
      );

      if (config.format === 'pdf' || config.exportMode === 'poster') {
        await sharePdf(exportCanvas, imageName, paper, grid, config);
      } else {
        await shareImage(exportCanvas, imageName, config.format, config.quality);
      }
      setExportMethod('share');
      setExportSuccess(true);
      setTimeout(() => {
        onClose();
        setExportSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      console.error('Share error:', err);
      const msg = err instanceof Error ? err.message : 'Share failed. Please check device storage.';
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden text-[#f8fafc] shadow-2xl animate-in zoom-in-95 duration-150 bg-[#161e27] border border-[#273444]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#273444] bg-[#0b0f14]/80">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#111820] border border-[#273444] text-[#38bdf8]"
            >
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#f0f6fc]">
                Export & Printing Studio
              </h2>
              <p className="text-[11px] text-[#94a3b8]">
                Standard sheets, blank grids, dual views & poster splits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f0f6fc] hover:bg-[#7dd3fc]/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* 1. Purpose & Export Mode Segmented Tabs */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
              Reference Output Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'standard' as ExportMode,
                  title: 'Standard',
                  sub: 'Calibrated reference',
                  icon: Layers,
                },
                {
                  id: 'blank_grid' as ExportMode,
                  title: 'Blank Grid',
                  sub: 'Skip manual ruler drawing',
                  icon: Grid,
                },
                {
                  id: 'side_by_side' as ExportMode,
                  title: 'Side-by-Side',
                  sub: 'Oil painters & colorists',
                  icon: Columns2,
                },
                {
                  id: 'poster' as ExportMode,
                  title: 'Poster Split',
                  sub: 'Multi-tile home printer',
                  icon: Scissors,
                },
              ].map((m) => {
                const active = config.exportMode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleExportModeChange(m.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 text-left transition-all ${
                      active
                        ? 'bg-[#38bdf8]/15 border-[#38bdf8]/60 text-[#38bdf8] font-medium shadow-md shadow-[#38bdf8]/15'
                        : 'bg-[#111820] hover:bg-[#38bdf8]/10 border-[#273444] text-[#94a3b8] hover:text-[#f8fafc]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#38bdf8]" />
                    <span className="font-bold text-xs leading-none">{m.title}</span>
                    <span className="text-[10px] text-[#94a3b8] leading-tight line-clamp-1">{m.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Context Description Banner */}
          {config.exportMode === 'blank_grid' && (
            <div className="p-3 rounded-xl bg-[rgba(125,211,252,0.08)] border border-[rgba(125,211,252,0.2)] text-[11px] text-[#7dd3fc] flex items-start gap-2.5">
              <Grid className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-[#f0f6fc]">Matching Blank Grid Sheet</strong>
                Skips manual pencil and ruler measuring! Prints pure high-contrast calibrated grid lines, coordinates, and aspect ratios directly onto blank artist paper or canvas.
              </div>
            </div>
          )}

          {config.exportMode === 'side_by_side' && (
            <div className="p-3 rounded-xl bg-[rgba(200,160,240,0.08)] border border-[rgba(200,160,240,0.2)] text-[11px] text-[#c8a0f0] flex items-start gap-2.5">
              <Columns2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-[#f0f6fc]">Side-by-Side Dual Reference</strong>
                Designed for oil painters and portrait colorists: uncluttered clean reference photo on the left, calibrated coordinate grid on the right on a single unified canvas.
              </div>
            </div>
          )}

          {config.exportMode === 'poster' && (
            <div className="p-3 rounded-xl bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.2)] space-y-3">
              <div className="flex items-start gap-2.5 text-[11px] text-[#38bdf8]">
                <Scissors className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-[#f0f6fc]">Poster Multi-Tile Split (Multi-Page PDF)</strong>
                  Splits large canvas references across standard home printer pages (A4 / Letter) with alignment cut marks, 10mm overlap glue margins, and corner crosshairs.
                </div>
              </div>

              {/* Poster Grid Configuration */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[rgba(125,211,252,0.12)]">
                <div>
                  <label className="block text-[10px] text-[#94a3b8] mb-1">
                    Tile Grid Sheets ({config.posterConfig?.columns || 2} × {config.posterConfig?.rows || 2} = {(config.posterConfig?.columns || 2) * (config.posterConfig?.rows || 2)} Pages)
                  </label>
                  <select
                    value={`${config.posterConfig?.columns || 2}x${config.posterConfig?.rows || 2}`}
                    onChange={(e) => {
                      const [cols, rows] = e.target.value.split('x').map(Number);
                      setConfig((prev) => ({
                        ...prev,
                        posterConfig: {
                          ...prev.posterConfig,
                          rows: rows || 2,
                          columns: cols || 2,
                          overlapMm: prev.posterConfig?.overlapMm || 10,
                        },
                      }));
                    }}
                    className="w-full bg-[rgba(15,21,36,0.8)] border border-[rgba(125,211,252,0.2)] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
                  >
                    <option value="2x2">2 × 2 Grid (4 Sheets)</option>
                    <option value="2x3">2 × 3 Grid (6 Sheets)</option>
                    <option value="3x3">3 × 3 Grid (9 Sheets)</option>
                    <option value="3x4">3 × 4 Grid (12 Sheets)</option>
                    <option value="4x4">4 × 4 Grid (16 Sheets)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#94a3b8] mb-1">
                    Glue / Tape Overlap Margin
                  </label>
                  <select
                    value={config.posterConfig?.overlapMm || 10}
                    onChange={(e) => {
                      const mm = Number(e.target.value);
                      setConfig((prev) => ({
                        ...prev,
                        posterConfig: {
                          rows: prev.posterConfig?.rows || 2,
                          columns: prev.posterConfig?.columns || 2,
                          overlapMm: mm,
                        },
                      }));
                    }}
                    className="w-full bg-[rgba(15,21,36,0.8)] border border-[rgba(125,211,252,0.2)] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
                  >
                    <option value={5}>5 mm Overlap</option>
                    <option value={10}>10 mm Standard Overlap</option>
                    <option value={15}>15 mm Wide Margin</option>
                    <option value={20}>20 mm Extra Wide</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. File Format Picker (disabled when poster mode requires PDF) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'png' as ExportFormat, label: 'PNG', sub: 'Lossless quality', icon: FileImage, disabled: config.exportMode === 'poster' },
                { id: 'jpeg' as ExportFormat, label: 'JPG', sub: 'Compressed image', icon: FileImage, disabled: config.exportMode === 'poster' },
                { id: 'pdf' as ExportFormat, label: 'PDF', sub: `Ready for ${paper.preset}`, icon: FileText, disabled: false },
              ].map((fmt) => {
                const active = config.format === fmt.id;
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    disabled={fmt.disabled}
                    onClick={() => setConfig((prev) => ({ ...prev, format: fmt.id }))}
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all ${
                      fmt.disabled ? 'opacity-35 cursor-not-allowed bg-[rgba(10,14,26,0.3)] border-transparent' :
                      active
                        ? 'bg-[rgba(125,211,252,0.18)] border-[#7dd3fc]/70 text-[#7dd3fc] font-medium shadow-[0_0_15px_rgba(125,211,252,0.2)]'
                        : 'bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/10 border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#7dd3fc]" />
                    <span className="font-bold text-xs">{fmt.label}</span>
                    <span className="text-[10px] text-[#94a3b8]">{fmt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality slider if JPEG */}
          {config.format === 'jpeg' && config.exportMode !== 'poster' && (
            <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#94a3b8]">JPEG Quality</span>
                <span className="font-mono text-[#7dd3fc]">
                  {Math.round(config.quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.0"
                step="0.05"
                value={config.quality}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, quality: parseFloat(e.target.value) }))
                }
                className="w-full"
              />
            </div>
          )}

          {/* 3. Measurement & Verification Layer Options */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
              Physical Measurement & Spec Legends
            </label>
            <div className="space-y-2">
              {/* Physical Ruler Margins Toggle */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] cursor-pointer hover:bg-[#7dd3fc]/10 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Ruler className="w-4 h-4 text-[#7dd3fc] shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-[#f0f6fc]">Physical Ruler Margins</span>
                    <span className="text-[10px] text-[#94a3b8]">
                      Millimeter & centimeter ruler tick marks along margins for direct wooden ruler verification
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeRulerMargins}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, includeRulerMargins: e.target.checked }))
                  }
                  className="rounded w-4 h-4 cursor-pointer accent-[#7dd3fc]"
                />
              </label>

              {/* Drafter's Spec Legend Toggle */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] cursor-pointer hover:bg-[#7dd3fc]/10 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-[#7dd3fc] shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-[#f0f6fc]">Drafter&apos;s Spec Legend</span>
                    <span className="text-[10px] text-[#94a3b8]">
                      Engineering title block with grid specs, paper dimensions, and record-keeping notes
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeDrafterLegend}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, includeDrafterLegend: e.target.checked }))
                  }
                  className="rounded w-4 h-4 cursor-pointer accent-[#7dd3fc]"
                />
              </label>

              {/* Grid & Label Controls */}
              {config.exportMode !== 'blank_grid' && (
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] cursor-pointer hover:bg-[#7dd3fc]/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Grid className="w-4 h-4 text-[#7dd3fc] shrink-0" />
                    <span className="font-medium text-[#f0f6fc]">Include Grid Overlay</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.includeGrid}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, includeGrid: e.target.checked }))
                    }
                    className="rounded w-4 h-4 cursor-pointer accent-[#7dd3fc]"
                  />
                </label>
              )}

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] cursor-pointer hover:bg-[#7dd3fc]/10 transition-colors">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#7dd3fc] shrink-0" />
                  <span className="font-medium text-[#f0f6fc]">Include Coordinates (A1, B2)</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeLabels}
                  disabled={!config.includeGrid && config.exportMode !== 'blank_grid'}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, includeLabels: e.target.checked }))
                  }
                  className="rounded w-4 h-4 cursor-pointer accent-[#7dd3fc] disabled:opacity-30"
                />
              </label>
            </div>
          </div>

          {/* Drafter Title / Artist input if Drafter's Spec Legend enabled */}
          {config.includeDrafterLegend && (
            <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.14)] grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#94a3b8] mb-1">Project / Artwork Title</label>
                <input
                  type="text"
                  value={config.drafterTitle || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, drafterTitle: e.target.value }))}
                  placeholder="Artwork title..."
                  className="w-full bg-[rgba(15,21,36,0.8)] border border-[rgba(125,211,252,0.2)] rounded-lg px-2.5 py-1 text-xs text-[#f0f6fc] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#94a3b8] mb-1">Artist / Drafter Name</label>
                <input
                  type="text"
                  value={config.artistName || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, artistName: e.target.value }))}
                  placeholder="Artist name..."
                  className="w-full bg-[rgba(15,21,36,0.8)] border border-[rgba(125,211,252,0.2)] rounded-lg px-2.5 py-1 text-xs text-[#f0f6fc] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 4. Live Calibration Spec Summary */}
          <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] space-y-1 text-[11px] text-[#94a3b8]">
            <div className="flex justify-between">
              <span>Standard Paper</span>
              <span className="font-mono text-[#f0f6fc]">
                {paper.preset} ({scaleAnalysis.paperWidthMm} × {scaleAnalysis.paperHeightMm} mm)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cell Calibration</span>
              <span className="font-mono text-[#7dd3fc]">
                {scaleAnalysis.cellWidthMm.toFixed(1)} × {scaleAnalysis.cellHeightMm.toFixed(1)} mm ({scaleAnalysis.cellWidthIn.toFixed(2)}″ × {scaleAnalysis.cellHeightIn.toFixed(2)}″)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Matrix</span>
              <span className="font-mono text-[#c8a0f0]">
                {grid.columns} × {grid.rows} ({grid.columns * grid.rows} cells)
              </span>
            </div>
          </div>

          {/* Inline Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <span className="font-semibold block">Export Interrupted</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#273444] flex flex-wrap items-center justify-between gap-2 bg-[#111820]">
          <div className="text-[10px] text-[#94a3b8] hidden sm:block">
            {savedPath ? (
              <span className="text-emerald-400 font-medium">✓ Saved: {savedPath}</span>
            ) : (
              '✓ Direct device storage & studio calibrated resolution'
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#161e27] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Explicit Share Button */}
            <button
              type="button"
              onClick={handleShareClick}
              disabled={isExporting || exportSuccess}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[#161e27] hover:bg-[#38bdf8]/15 border border-[#273444] hover:border-[#38bdf8]/40 text-[#38bdf8] active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Share via Android Sheet / Apps"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {/* Primary Direct Download to Device Button */}
            <button
              type="button"
              onClick={handleDownloadClick}
              disabled={isExporting || exportSuccess}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 bg-[#38bdf8] hover:bg-[#0284c7] text-[#0b0f14] shadow-lg shadow-[#38bdf8]/25 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0b0f14] border-t-transparent animate-spin" />
                  <span>Saving...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{exportMethod === 'share' ? '✓ Shared!' : '✓ Saved to Device!'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Download {config.exportMode === 'poster' ? 'POSTER PDF' : config.format.toUpperCase()}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Storage & Media Permission Dialog */}
      <PermissionDialog
        isOpen={isPermissionDialogOpen}
        onClose={() => setIsPermissionDialogOpen(false)}
        onGranted={() => {
          setIsPermissionDialogOpen(false);
          executeDownload();
        }}
      />
    </div>
  );
}
