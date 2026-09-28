'use client';

import React, { useState } from 'react';
import {
  ExportConfig,
  ExportFormat,
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
} from 'lucide-react';
import {
  createExportCanvas,
  downloadImage,
  downloadPdf,
  canShareFiles,
} from '@/lib/image/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedCanvas: HTMLCanvasElement | null;
  imageName: string;
  grid: GridConfig;
  paper: PaperConfig;
  currentFilterName: string;
}

export function ExportModal({
  isOpen,
  onClose,
  processedCanvas,
  imageName,
  grid,
  paper,
  currentFilterName,
}: ExportModalProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'png',
    includeGrid: true,
    includeLabels: grid.labelMode !== 'none',
    includeScaleWatermark: true,
    quality: 0.95,
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportMethod, setExportMethod] = useState<'share' | 'download'>('download');
  const isMobileShare = typeof window !== 'undefined' && canShareFiles();

  if (!isOpen || !processedCanvas) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      const exportCanvas = createExportCanvas(
        processedCanvas,
        grid,
        config,
        paper,
        currentFilterName
      );

      let result: { method: 'share' | 'download' };
      if (config.format === 'pdf') {
        result = await downloadPdf(exportCanvas, imageName, paper, grid);
      } else {
        result = await downloadImage(exportCanvas, imageName, config.format, config.quality);
      }
      setExportMethod(result.method);
      setExportSuccess(true);
      setTimeout(() => {
        onClose();
        setExportSuccess(false);
      }, 1400);
    } catch (err) {
      console.error('Export error:', err);
      alert('An error occurred during export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden text-[#f0f6fc] shadow-2xl animate-in zoom-in-95 duration-150"
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
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#f0f6fc]">
                Export Reference
              </h2>
              <p className="text-[11px] text-[#94a3b8]">
                High-resolution image or printable PDF
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
        <div className="p-5 space-y-4 text-xs">
          {/* Format Picker */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'png' as ExportFormat, label: 'PNG', sub: 'Lossless quality', icon: FileImage },
                { id: 'jpeg' as ExportFormat, label: 'JPG', sub: 'Compressed image', icon: FileImage },
                { id: 'pdf' as ExportFormat, label: 'PDF', sub: `Ready for ${paper.preset}`, icon: FileText },
              ].map((fmt) => {
                const active = config.format === fmt.id;
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setConfig((prev) => ({ ...prev, format: fmt.id }))}
                    className={`p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all ${
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
          {config.format === 'jpeg' && (
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

          {/* Layer Options */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] mb-2">
              Layers & Markings
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] cursor-pointer hover:bg-[#7dd3fc]/10 transition-colors">
                <span className="font-medium text-[#f0f6fc]">Include Grid Overlay</span>
                <input
                  type="checkbox"
                  checked={config.includeGrid}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, includeGrid: e.target.checked }))
                  }
                  className="rounded w-4 h-4 cursor-pointer accent-[#7dd3fc]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] cursor-pointer hover:bg-[#7dd3fc]/10 transition-colors">
                <span className="font-medium text-[#f0f6fc]">Include Coordinates (A1, B2)</span>
                <input
                  type="checkbox"
                  checked={config.includeLabels}
                  disabled={!config.includeGrid}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, includeLabels: e.target.checked }))
                  }
                  className="rounded w-4 h-4 cursor-pointer accent-[#7dd3fc] disabled:opacity-30"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] cursor-pointer hover:bg-[#7dd3fc]/10 transition-colors">
                <div className="flex flex-col">
                  <span className="font-medium text-[#f0f6fc]">Physical Millimeter Ruler Banner</span>
                  <span className="text-[10px] text-[#94a3b8]">
                    Embeds real-world millimeter ruler on bottom edge
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeScaleWatermark}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      includeScaleWatermark: e.target.checked,
                    }))
                  }
                  className="rounded w-4 h-4 cursor-pointer accent-[#7dd3fc]"
                />
              </label>
            </div>
          </div>

          {/* Export Details */}
          <div className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.12)] flex items-center justify-between text-[11px] text-[#94a3b8]">
            <span>Resolution</span>
            <span className="font-mono text-[#7dd3fc]">
              {processedCanvas.width} × {processedCanvas.height} px
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[rgba(125,211,252,0.12)] flex items-center justify-between gap-2 bg-[rgba(15,21,36,0.5)]">
          <div className="text-[10px] text-[#94a3b8] hidden sm:block">
            {isMobileShare ? '✓ Direct share ready' : '✓ 300 DPI high-res'}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[#94a3b8] hover:text-[#f0f6fc] hover:bg-[#7dd3fc]/10 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || exportSuccess}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-[1.02] disabled:opacity-70"
              style={{
                background: '#7dd3fc',
                color: '#0a0e1a',
                boxShadow: '0 0 25px rgba(125, 211, 252, 0.35)',
              }}
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0a0e1a] border-t-transparent animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{exportMethod === 'share' ? '✓ Shared / Saved!' : '✓ Downloaded!'}</span>
                </>
              ) : isMobileShare ? (
                <>
                  <Share2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Share / Save {config.format.toUpperCase()}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download {config.format.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
