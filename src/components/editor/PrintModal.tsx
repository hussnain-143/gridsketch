'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GridConfig, PaperConfig, ExportMode } from '@/types/editor';
import { calculatePaperGridScale } from '@/lib/image/paper-calculator';
import {
  X,
  Printer,
  Ruler,
  FileText,
  Grid,
  Columns2,
  Layers,
  Bookmark,
  Check,
  AlertCircle,
} from 'lucide-react';
import { createExportCanvas, downloadPdf } from '@/lib/image/export';
import { PermissionDialog, checkStoragePermissionGranted } from './PermissionDialog';
import { Capacitor } from '@capacitor/core';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedCanvas: HTMLCanvasElement | null;
  rawImageCanvas?: HTMLCanvasElement | null;
  imageName?: string;
  grid: GridConfig;
  paper: PaperConfig;
}

export function PrintModal({
  isOpen,
  onClose,
  processedCanvas,
  rawImageCanvas,
  imageName = 'Drawing Reference',
  grid,
  paper,
}: PrintModalProps) {
  const printCanvasRef = useRef<HTMLCanvasElement>(null);
  const [printMode, setPrintMode] = useState<ExportMode>('standard');
  const [includeRulerMargins, setIncludeRulerMargins] = useState<boolean>(true);
  const [includeDrafterLegend, setIncludeDrafterLegend] = useState<boolean>(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState<boolean>(false);

  const scaleAnalysis = processedCanvas
    ? calculatePaperGridScale(
        processedCanvas.width,
        processedCanvas.height,
        grid.rows,
        grid.columns,
        paper,
        0,
        grid
      )
    : null;

  // Render high-res preview onto the modal canvas
  useEffect(() => {
    if (!isOpen || !processedCanvas || !printCanvasRef.current) return;
    setErrorMessage(null);

    const exportCanvas = createExportCanvas(
      processedCanvas,
      grid,
      {
        format: 'pdf',
        exportMode: printMode,
        includeGrid: true,
        includeLabels: grid.labelMode !== 'none',
        includeScaleWatermark: true,
        includeRulerMargins: includeRulerMargins,
        includeDrafterLegend: includeDrafterLegend,
        quality: 1.0,
        drafterTitle: imageName,
      },
      paper,
      'Print Master',
      rawImageCanvas
    );

    const canvas = printCanvasRef.current;
    canvas.width = exportCanvas.width;
    canvas.height = exportCanvas.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(exportCanvas, 0, 0);
    }
  }, [isOpen, processedCanvas, rawImageCanvas, grid, paper, printMode, includeRulerMargins, includeDrafterLegend, imageName]);

  if (!isOpen || !processedCanvas || !scaleAnalysis) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  const executePdfDownload = async () => {
    setIsPdfGenerating(true);
    setErrorMessage(null);
    try {
      const exportCanvas = createExportCanvas(
        processedCanvas,
        grid,
        {
          format: 'pdf',
          exportMode: printMode,
          includeGrid: true,
          includeLabels: grid.labelMode !== 'none',
          includeScaleWatermark: true,
          includeRulerMargins: includeRulerMargins,
          includeDrafterLegend: includeDrafterLegend,
          quality: 1.0,
          drafterTitle: imageName,
        },
        paper,
        'Print Master',
        rawImageCanvas
      );

      await downloadPdf(exportCanvas, imageName, paper, grid, {
        format: 'pdf',
        exportMode: printMode,
        includeGrid: true,
        includeLabels: grid.labelMode !== 'none',
        includeScaleWatermark: true,
        includeRulerMargins: includeRulerMargins,
        includeDrafterLegend: includeDrafterLegend,
        quality: 1.0,
      });
    } catch (err: unknown) {
      console.error('Print PDF error:', err);
      const msg = err instanceof Error ? err.message : 'Could not generate printable PDF. Please check available memory.';
      setErrorMessage(msg);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePrintPdfDownload = async () => {
    if (Capacitor.isNativePlatform()) {
      const granted = await checkStoragePermissionGranted();
      if (!granted) {
        setIsPermissionDialogOpen(true);
        return;
      }
    }
    await executePdfDownload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl overflow-hidden text-[#f8fafc] shadow-2xl animate-in zoom-in-95 duration-150 bg-[#161e27] border border-[#273444]"
      >
        {/* Header */}
        <div className="no-print flex items-center justify-between p-4 border-b border-[#273444] bg-[#0b0f14]/80">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#111820] border border-[#273444] text-[#38bdf8]"
            >
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#f0f6fc]">
                Print Physical Drawing Reference
              </h2>
              <p className="text-[11px] text-[#94a3b8]">
                Calibrated to exact paper standards for home printers
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

        {/* Print Setup Bar */}
        <div className="no-print p-3 bg-[rgba(10,14,26,0.7)] border-b border-[rgba(125,211,252,0.12)] space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Print Mode Selector */}
            <div className="flex items-center gap-1.5 bg-[#161e27] p-1 rounded-xl border border-[#273444]">
              {[
                { id: 'standard' as ExportMode, label: 'Reference Sheet', icon: Layers },
                { id: 'blank_grid' as ExportMode, label: 'Blank Grid Sheet', icon: Grid },
                { id: 'side_by_side' as ExportMode, label: 'Side-by-Side Dual', icon: Columns2 },
              ].map((m) => {
                const active = printMode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPrintMode(m.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      active
                        ? 'bg-[#38bdf8] text-[#0b0f14] font-bold shadow-sm'
                        : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#38bdf8]/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Verification Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIncludeRulerMargins((prev) => !prev)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] border transition-colors ${
                  includeRulerMargins
                    ? 'bg-[#38bdf8]/15 border-[#38bdf8]/50 text-[#38bdf8]'
                    : 'bg-[#111820] border-[#273444] text-[#94a3b8]'
                }`}
              >
                <Ruler className="w-3 h-3" />
                <span>Ruler Margins</span>
                {includeRulerMargins && <Check className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIncludeDrafterLegend((prev) => !prev)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] border transition-colors ${
                  includeDrafterLegend
                    ? 'bg-[#38bdf8]/15 border-[#38bdf8]/50 text-[#38bdf8]'
                    : 'bg-[#111820] border-[#273444] text-[#94a3b8]'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                <span>Drafter Legend</span>
                {includeDrafterLegend && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Paper Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-[#070a12]">
          {/* Virtual Paper Sheet */}
          <div
            id="printable-virtual-sheet"
            style={{
              aspectRatio:
                paper.orientation === 'portrait' ? '210 / 297' : '297 / 210',
            }}
            className="w-full max-w-lg bg-white text-slate-900 rounded-lg p-3 sm:p-4 shadow-2xl flex flex-col justify-between border border-slate-300 overflow-hidden"
          >
            {/* Sheet Preview Canvas */}
            <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
              <canvas
                ref={printCanvasRef}
                className="max-h-full max-w-full object-contain shadow-sm"
              />
            </div>
          </div>

          {/* Inline Error Banner */}
          {errorMessage && (
            <div className="no-print p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <span className="font-semibold block">Print Generation Interrupted</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Print Metadata & Action Bar */}
        <div className="no-print p-4 bg-[rgba(15,21,36,0.7)] border-t border-[rgba(125,211,252,0.12)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#7dd3fc]" />
              <span className="text-[#f0f6fc] font-medium">
                {paper.preset} ({paper.orientation})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-[#7dd3fc]" />
              <span className="text-[#f0f6fc] font-medium">
                {scaleAnalysis.cellWidthMm.toFixed(1)} × {scaleAnalysis.cellHeightMm.toFixed(1)} mm per cell
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#38bdf8]/10 font-medium text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handlePrintPdfDownload}
              disabled={isPdfGenerating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#273444] bg-[#161e27] text-[#38bdf8] hover:bg-[#38bdf8]/10 font-semibold text-xs transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isPdfGenerating ? 'Generating PDF...' : 'Save Print PDF'}</span>
            </button>

            <button
              onClick={handleBrowserPrint}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] bg-[#38bdf8] hover:bg-[#0284c7] text-[#0b0f14] shadow-lg shadow-[#38bdf8]/25"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Sheet Now</span>
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
          executePdfDownload();
        }}
      />
    </div>
  );
}
