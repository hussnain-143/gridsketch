'use client';

import React from 'react';
import { GridConfig, PaperConfig } from '@/types/editor';
import { calculatePaperGridScale, calculatePageFraming } from '@/lib/image/paper-calculator';
import { X, Printer, Ruler, FileText } from 'lucide-react';
import { drawGridOverlay, drawGridOverlayOnRect } from '@/lib/image/grid-renderer';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedCanvas: HTMLCanvasElement | null;
  grid: GridConfig;
  paper: PaperConfig;
}

export function PrintModal({
  isOpen,
  onClose,
  processedCanvas,
  grid,
  paper,
}: PrintModalProps) {
  const printCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const scaleAnalysis = processedCanvas
    ? calculatePaperGridScale(
        processedCanvas.width,
        processedCanvas.height,
        grid.rows,
        grid.columns,
        paper
      )
    : null;

  React.useEffect(() => {
    if (!isOpen || !processedCanvas || !printCanvasRef.current) return;

    const canvas = printCanvasRef.current;
    const isPage = paper && paper.preset !== 'Custom';

    if (isPage) {
      const framing = calculatePageFraming(processedCanvas.width, processedCanvas.height, paper);
      canvas.width = framing.pageW;
      canvas.height = framing.pageH;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, framing.pageW, framing.pageH);
      ctx.clip();
      ctx.drawImage(
        processedCanvas,
        framing.imgOffsetX,
        framing.imgOffsetY,
        framing.imgDisplayW,
        framing.imgDisplayH
      );
      ctx.restore();

      const isCustomOrContain = paper?.fitMode && paper.fitMode !== 'cover';
      const target = paper?.gridTarget || (isCustomOrContain ? 'image' : 'paper');
      if (target === 'image' && framing.imgDisplayW > 0 && framing.imgDisplayH > 0) {
        drawGridOverlayOnRect(ctx, framing.imgOffsetX, framing.imgOffsetY, framing.imgDisplayW, framing.imgDisplayH, grid, true);
      } else {
        drawGridOverlay(ctx, framing.pageW, framing.pageH, grid, true);
      }
    } else {
      canvas.width = processedCanvas.width;
      canvas.height = processedCanvas.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(processedCanvas, 0, 0);
      drawGridOverlay(ctx, canvas.width, canvas.height, grid, true);
    }
  }, [isOpen, processedCanvas, grid, paper]);

  if (!isOpen || !processedCanvas || !scaleAnalysis) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden text-[#f0f6fc] shadow-2xl animate-in zoom-in-95 duration-150"
        style={{
          background: 'rgba(14, 23, 42, 0.85)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(125, 211, 252, 0.2)',
          boxShadow: '0 20px 50px rgba(6, 12, 24, 0.6), 0 0 35px rgba(125, 211, 252, 0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 border-b border-[rgba(125,211,252,0.12)] bg-[rgba(15,21,36,0.5)]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(125, 211, 252, 0.12)',
                border: '1px solid rgba(125, 211, 252, 0.25)',
                color: '#7dd3fc',
              }}
            >
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#f0f6fc]">
                Print Drawing Reference
              </h2>
              <p className="text-[11px] text-[#94a3b8]">
                Optimized layout formatted for physical paper drawing
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

        {/* Paper Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-[#070a12]">
          {/* Virtual Paper Sheet */}
          <div
            style={{
              aspectRatio:
                paper.orientation === 'portrait' ? '210 / 297' : '297 / 210',
            }}
            className="w-full max-w-md bg-white text-slate-900 rounded-lg p-5 shadow-2xl flex flex-col justify-between border border-slate-300"
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[9px] text-slate-500">
              <span className="font-bold tracking-wider uppercase text-slate-700">
                GridSketch Artist Reference
              </span>
              <span>
                Sheet: {paper.preset} ({paper.orientation}) • Grid: {grid.columns} × {grid.rows}
              </span>
            </div>

            {/* Centered Drawing Reference Image */}
            <div className="my-2 flex items-center justify-center overflow-hidden flex-1 border border-slate-300 bg-slate-100">
              <canvas
                ref={printCanvasRef}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Sheet Footer Ruler Measurement */}
            <div className="border-t border-slate-200 pt-1.5 text-center text-[9px] font-mono text-slate-600">
              {scaleAnalysis.rulerSummary}
            </div>
          </div>
        </div>

        {/* Print Metadata & Action Bar */}
        <div className="p-4 bg-[rgba(15,21,36,0.6)] border-t border-[rgba(125,211,252,0.12)] flex items-center justify-between">
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
                Cell: {scaleAnalysis.cellWidthMm.toFixed(1)} ×{' '}
                {scaleAnalysis.cellHeightMm.toFixed(1)} mm
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[#94a3b8] hover:text-[#f0f6fc] hover:bg-[#7dd3fc]/10 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.02]"
              style={{
                background: '#7dd3fc',
                color: '#0a0e1a',
                boxShadow: '0 0 25px rgba(125, 211, 252, 0.35)',
              }}
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Reference</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
