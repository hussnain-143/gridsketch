'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  GridConfig,
  AdjustmentConfig,
  DEFAULT_ADJUSTMENTS,
  FilterMode,
  TransformConfig,
  PaperConfig,
  EditorHistoryEntry,
} from '@/types/editor';
import { applyTransforms, processImageCanvas } from '@/lib/image/pipeline';
import { debounce } from '@/lib/utils/performance';
import { StudioHeader, LayoutMode } from '@/components/editor/StudioHeader';
import { StudioCanvas } from '@/components/editor/StudioCanvas';
import { BentoWorkbench } from '@/components/editor/bento/BentoWorkbench';
import { BentoGridDashboard } from '@/components/editor/bento/BentoGridDashboard';
import { MobileMenuDrawer } from '@/components/editor/MobileMenuDrawer';
import { MobileEditDrawer, MobileEditTab } from '@/components/editor/MobileEditDrawer';
import { ExportModal } from '@/components/editor/ExportModal';
import { PrintModal } from '@/components/editor/PrintModal';
import { PermissionDialog } from '@/components/editor/PermissionDialog';

const DEFAULT_GRID: GridConfig = {
  rows: 8,
  columns: 8,
  color: '#ffffff',
  opacity: 0.75,
  thickness: 2,
  labelMode: 'alphanumeric',
  labelColor: '#ffffff',
  labelSize: 14,
  showCenterLines: true,
  showDiagonals: false,
  showFullDiagonals: false,
  subdivisions: 1,
  lockAspectRatio: true,
};

const DEFAULT_TRANSFORM: TransformConfig = {
  rotation: 0,
  flipH: false,
  flipV: false,
  crop: null,
  aspectRatio: 'original',
};

const DEFAULT_PAPER: PaperConfig = {
  preset: 'A4',
  orientation: 'portrait',
  customWidthMm: 210,
  customHeightMm: 297,
  fitMode: 'cover',
  fitCustomWidth: 400,
  fitCustomHeight: 300,
  fitCustomUnit: 'px',
  fitLockAspect: false,
  fitAlignment: 'center',
  canvasBackground: '#0a0e1a',
  gridTarget: 'paper',
};

export default function EditorPage() {
  // Image State (Clean empty drafting canvas by default)
  const [imageName, setImageName] = useState<string>('');
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Editor Settings
  const [grid, setGrid] = useState<GridConfig>(DEFAULT_GRID);
  const [mode, setMode] = useState<FilterMode>('grayscale');
  const [adjustments, setAdjustments] = useState<AdjustmentConfig>(DEFAULT_ADJUSTMENTS);
  const [transform, setTransform] = useState<TransformConfig>(DEFAULT_TRANSFORM);
  const [paper, setPaper] = useState<PaperConfig>(DEFAULT_PAPER);

  // Structural Layout Mode ('bento' for Bento Grid Dashboard, 'split' for Split Studio, 'focus' for Canvas Focus)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('bento');

  // UI State
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const [mobileMenuDrawerOpen, setMobileMenuDrawerOpen] = useState<boolean>(false);
  const [mobileEditDrawerOpen, setMobileEditDrawerOpen] = useState<boolean>(false);
  const [mobileEditTab, setMobileEditTab] = useState<MobileEditTab>('grid');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showPage, setShowPage] = useState<boolean>(true);
  const [isMovingImage, setIsMovingImage] = useState<boolean>(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<EditorHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryAction = useRef<boolean>(false);

  // Rendered Canvases
  const rawTransformedCanvas = useMemo(() => {
    if (!loadedImage) return null;
    try {
      return applyTransforms(loadedImage, transform);
    } catch (err) {
      console.error('Error applying geometric transform:', err);
      return null;
    }
  }, [loadedImage, transform]);
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);

  // Latest state reference for stable history pushes without re-renders
  const stateRef = useRef({ grid, mode, adjustments, transform, paper, historyIndex });
  useEffect(() => {
    stateRef.current = { grid, mode, adjustments, transform, paper, historyIndex };
  }, [grid, mode, adjustments, transform, paper, historyIndex]);

  // Record History State
  const pushHistory = useCallback(() => {
    if (isHistoryAction.current) {
      isHistoryAction.current = false;
      return;
    }
    const { grid: g, mode: m, adjustments: a, transform: t, paper: p, historyIndex: hIdx } = stateRef.current;
    const currentEntry: EditorHistoryEntry = {
      grid: { ...g },
      adjustments: { ...a },
      mode: m,
      transform: { ...t },
      paper: { ...p },
    };

    setHistory((prev) => {
      const updated = prev.slice(0, hIdx + 1);
      return [...updated, currentEntry];
    });
    setHistoryIndex((prev) => prev + 1);
  }, []);

  const debouncedHistoryRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    debouncedHistoryRef.current = debounce(() => {
      pushHistory();
    }, 350);
    return () => {
      debouncedHistoryRef.current = null;
    };
  }, [pushHistory]);

  // Debounced history for sliders and drags
  const pushHistoryDebounced = useCallback(() => {
    debouncedHistoryRef.current?.();
  }, []);

  // Mode & Tone Adjustments Change Handler
  const handleAdjustmentsChange = useCallback((patch: Partial<AdjustmentConfig>) => {
    setAdjustments((prev) => ({ ...prev, ...patch }));
    pushHistoryDebounced();
  }, [pushHistoryDebounced]);

  // Load uploaded image from session storage if transferred from splash / landing
  useEffect(() => {
    try {
      const storedUpload = sessionStorage.getItem('gridsketch_custom_upload');
      const storedName = sessionStorage.getItem('gridsketch_custom_name');
      if (storedUpload) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setLoadedImage(img);
          setImageName(storedName || 'Uploaded Reference');
          sessionStorage.removeItem('gridsketch_custom_upload');
          sessionStorage.removeItem('gridsketch_custom_name');
        };
        img.src = storedUpload;
      }
    } catch (e) {
      console.warn('Session storage check skipped:', e);
    }
  }, []);

  // Undo Action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryAction.current = true;
      const targetEntry = history[historyIndex - 1];
      setGrid(targetEntry.grid);
      setMode(targetEntry.mode);
      if (targetEntry.adjustments) {
        setAdjustments(targetEntry.adjustments);
      }
      setTransform(targetEntry.transform);
      setPaper(targetEntry.paper);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex, history]);

  // Redo Action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isHistoryAction.current = true;
      const targetEntry = history[historyIndex + 1];
      setGrid(targetEntry.grid);
      setMode(targetEntry.mode);
      if (targetEntry.adjustments) {
        setAdjustments(targetEntry.adjustments);
      }
      setTransform(targetEntry.transform);
      setPaper(targetEntry.paper);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcut listener for undo / redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Capacitor Native Android Hardware Back Button Listener
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('backButton', () => {
          if (isExportOpen) {
            setIsExportOpen(false);
          } else if (isPrintOpen) {
            setIsPrintOpen(false);
          } else if (mobileMenuDrawerOpen) {
            setMobileMenuDrawerOpen(false);
          } else if (mobileEditDrawerOpen) {
            setMobileEditDrawerOpen(false);
          } else if (layoutMode !== 'bento') {
            setLayoutMode('bento');
          } else {
            App.exitApp();
          }
        });
        removeListener = () => {
          listener.remove();
        };
      } catch {
        // Web environment: no hardware back button
      }
    };

    setupBackButton();
    return () => {
      removeListener?.();
    };
  }, [isExportOpen, isPrintOpen, mobileMenuDrawerOpen, mobileEditDrawerOpen, layoutMode]);

  // Upload handler with validation, memory protection and error handling
  const handleUploadImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      showToast('Could not read image file. Please try another.', 'error');
    };
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        showToast('Failed to decode image data.', 'error');
      };
      img.onload = () => {
        const MAX_DIM = 4096;
        if (img.naturalWidth > MAX_DIM || img.naturalHeight > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / img.naturalWidth, MAX_DIM / img.naturalHeight);
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.round(img.naturalWidth * ratio);
          scaledCanvas.height = Math.round(img.naturalHeight * ratio);
          const ctx = scaledCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);
            const scaledImg = new Image();
            scaledImg.onload = () => {
              setLoadedImage(scaledImg);
              setImageName(file.name.replace(/\.[^/.]+$/, ''));
              setTransform(DEFAULT_TRANSFORM);
              pushHistory();
              showToast(`Loaded ${file.name} (calibrated to studio resolution)`, 'success');
            };
            scaledImg.src = scaledCanvas.toDataURL('image/png');
            return;
          }
        }
        setLoadedImage(img);
        setImageName(file.name.replace(/\.[^/.]+$/, ''));
        setTransform(DEFAULT_TRANSFORM);
        pushHistory();
        showToast(`Loaded ${file.name}`, 'success');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Reset all
  const handleResetAll = () => {
    setGrid(DEFAULT_GRID);
    setMode('original');
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setTransform(DEFAULT_TRANSFORM);
    setPaper(DEFAULT_PAPER);
    pushHistory();
    showToast('Studio settings reset to defaults', 'info');
  };

  // Pixel Processing Pipeline
  useEffect(() => {
    if (!rawTransformedCanvas) return;

    let canceled = false;
    const timer = setTimeout(() => {
      if (canceled) return;
      setIsProcessing(true);
      try {
        const outCanvas = processImageCanvas(
          rawTransformedCanvas,
          mode,
          adjustments
        );
        if (!canceled) {
          setProcessedCanvas(outCanvas);
        }
      } catch (err) {
        console.error('Error in pixel processing pipeline:', err);
      } finally {
        if (!canceled) {
          setIsProcessing(false);
        }
      }
    }, 10);

    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [rawTransformedCanvas, mode, adjustments]);

  const currentFilterTitle =
    mode === 'original'
      ? 'Original Photo'
      : mode === 'grayscale'
      ? 'Grayscale'
      : mode === 'charcoal'
      ? 'Master Charcoal'
      : mode === 'graphite'
      ? 'Fine Graphite'
      : mode === 'ink'
      ? 'Pen & Ink'
      : 'Chiaroscuro';

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-[#0b0f14] text-[#f8fafc]">
      {/* Studio Header */}
      <StudioHeader
        imageName={imageName}
        imageWidth={processedCanvas?.width || loadedImage?.naturalWidth || 0}
        imageHeight={processedCanvas?.height || loadedImage?.naturalHeight || 0}
        onUploadImage={handleUploadImage}
        onResetAll={handleResetAll}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        showCompare={showCompare}
        onToggleCompare={() => setShowCompare((prev) => !prev)}
        onOpenPrint={() => setIsPrintOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        layoutMode={layoutMode}
        onSelectLayout={(mode) => setLayoutMode(mode)}
        onOpenMobileDrawer={() => setMobileMenuDrawerOpen(true)}
      />

      {/* Floating Toast Notification HUD */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className={`no-print fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 border backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none ${
            toast.type === 'error'
              ? 'bg-[#ef4444]/20 border-[#ef4444]/40 text-[#fca5a5] shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              : toast.type === 'success'
              ? 'bg-[#22c55e]/20 border-[#22c55e]/40 text-[#4ade80] shadow-[0_0_20px_rgba(34,197,94,0.2)]'
              : 'bg-[#161e27] border-[#273444] text-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.15)]'
          }`}
        >
          <span>{toast.message}</span>
        </aside>
      )}

      {/* 1. Mobile Fixed-Canvas Layout with Bottom Edit Sheet Drawer (md:hidden) */}
      <div className="md:hidden flex-1 relative flex flex-col overflow-hidden no-print">
        {/* Full-bleed Fixed Canvas Viewport */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          <StudioCanvas
            processedCanvas={processedCanvas}
            rawImageCanvas={rawTransformedCanvas}
            grid={grid}
            showCompare={showCompare}
            isProcessing={isProcessing}
            paper={paper}
            showPage={showPage}
            onToggleShowPage={() => setShowPage((prev) => !prev)}
            isMovingImage={isMovingImage}
            onToggleMoveImage={() => setIsMovingImage((prev) => !prev)}
            onPaperChange={(updates) => {
              setPaper((prev) => ({ ...prev, ...updates }));
            }}
            onUploadImage={handleUploadImage}
            onTriggerUpload={() => {
              const fileInput = (document.getElementById('studio-file-input') ||
                document.querySelector('input[type="file"]')) as HTMLInputElement;
              fileInput?.click();
            }}
          />
        </div>

        {/* Mobile Interactive Bottom Sheet Edit Drawer */}
        {!mobileMenuDrawerOpen && (
          <MobileEditDrawer
            grid={grid}
            onGridChange={(updates) => {
              setGrid((prev) => ({ ...prev, ...updates }));
              pushHistoryDebounced();
            }}
            paper={paper}
            onPaperChange={(updates) => {
              setPaper((prev) => ({ ...prev, ...updates }));
              pushHistoryDebounced();
            }}
            mode={mode}
            onModeChange={(newMode) => {
              setMode(newMode);
              pushHistory();
            }}
            adjustments={adjustments}
            onAdjustmentsChange={handleAdjustmentsChange}
            transform={transform}
            onTransformChange={(updates) => {
              setTransform((prev) => ({ ...prev, ...updates }));
              pushHistoryDebounced();
            }}
            imageWidth={processedCanvas?.width || loadedImage?.naturalWidth || 800}
            imageHeight={processedCanvas?.height || loadedImage?.naturalHeight || 800}
            isMovingImage={isMovingImage}
            onToggleMoveImage={() => setIsMovingImage((prev) => !prev)}
            isOpen={mobileEditDrawerOpen}
            onToggleOpen={() => setMobileEditDrawerOpen((prev) => !prev)}
            activeTab={mobileEditTab}
            onSelectTab={(tab) => {
              setMobileEditTab(tab);
              setMobileEditDrawerOpen(true);
            }}
          />
        )}
      </div>

      {/* 2. Desktop Studio Viewport (hidden md:flex) */}
      <div className="hidden md:flex flex-1 overflow-hidden relative no-print">
        {layoutMode === 'bento' ? (
          /* Structural Bento Grid Dashboard: Asymmetric Multi-Column Content Cards */
          <BentoGridDashboard
            processedCanvas={processedCanvas}
            rawImageCanvas={rawTransformedCanvas}
            grid={grid}
            onGridChange={(updates) => {
              setGrid((prev) => ({ ...prev, ...updates }));
              pushHistoryDebounced();
            }}
            paper={paper}
            onPaperChange={(updates) => {
              setPaper((prev) => ({ ...prev, ...updates }));
              pushHistoryDebounced();
            }}
            mode={mode}
            onModeChange={(newMode) => {
              setMode(newMode);
              pushHistory();
            }}
            adjustments={adjustments}
            onAdjustmentsChange={handleAdjustmentsChange}
            transform={transform}
            onTransformChange={(updates) => {
              setTransform((prev) => ({ ...prev, ...updates }));
              pushHistoryDebounced();
            }}
            imageName={imageName}
            imageWidth={processedCanvas?.width || loadedImage?.naturalWidth || 800}
            imageHeight={processedCanvas?.height || loadedImage?.naturalHeight || 800}
            showCompare={showCompare}
            onToggleCompare={() => setShowCompare((prev) => !prev)}
            isProcessing={isProcessing}
            showPage={showPage}
            onToggleShowPage={() => setShowPage((prev) => !prev)}
            isMovingImage={isMovingImage}
            onToggleMoveImage={() => setIsMovingImage((prev) => !prev)}
            onOpenPrint={() => setIsPrintOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
            onExpandFocus={() => setLayoutMode('focus')}
            onUploadImage={handleUploadImage}
            onTriggerUpload={() => {
              const fileInput = (document.getElementById('studio-file-input') ||
                document.querySelector('input[type="file"]')) as HTMLInputElement;
              fileInput?.click();
            }}
          />
        ) : (
          /* Studio Split & Zen Focus Layouts */
          <div className="flex-1 flex overflow-hidden relative">
            {/* Bento Workbench Sidebar */}
            <aside
              className={`no-print flex flex-col bg-[rgba(15,21,36,0.75)] backdrop-blur-2xl border-r border-[rgba(125,211,252,0.1)] z-40 shrink-0 transition-all duration-300 ease-in-out
                ${layoutMode === 'split' ? 'md:w-96 lg:w-[440px]' : 'hidden'}
              `}
            >
              <BentoWorkbench
                grid={grid}
                onGridChange={(updates) => {
                  setGrid((prev) => ({ ...prev, ...updates }));
                  pushHistoryDebounced();
                }}
                paper={paper}
                onPaperChange={(updates) => {
                  setPaper((prev) => ({ ...prev, ...updates }));
                  pushHistoryDebounced();
                }}
                mode={mode}
                onModeChange={(newMode) => {
                  setMode(newMode);
                  pushHistory();
                }}
                adjustments={adjustments}
                onAdjustmentsChange={handleAdjustmentsChange}
                transform={transform}
                onTransformChange={(updates) => {
                  setTransform((prev) => ({ ...prev, ...updates }));
                  pushHistoryDebounced();
                }}
                imageWidth={processedCanvas?.width || loadedImage?.naturalWidth || 800}
                imageHeight={processedCanvas?.height || loadedImage?.naturalHeight || 800}
                isMovingImage={isMovingImage}
                onToggleMoveImage={() => setIsMovingImage((prev) => !prev)}
                onCloseMobileDrawer={() => setLayoutMode('bento')}
                onOpenPrint={() => setIsPrintOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
                showCompare={showCompare}
                onToggleCompare={() => setShowCompare((prev) => !prev)}
              />
            </aside>

            {/* Center Canvas Viewport */}
            <main className="flex-1 h-full relative overflow-hidden flex flex-col">
              <StudioCanvas
                processedCanvas={processedCanvas}
                rawImageCanvas={rawTransformedCanvas}
                grid={grid}
                showCompare={showCompare}
                isProcessing={isProcessing}
                paper={paper}
                showPage={showPage}
                onToggleShowPage={() => setShowPage((prev) => !prev)}
                isMovingImage={isMovingImage}
                onToggleMoveImage={() => setIsMovingImage((prev) => !prev)}
                onPaperChange={(updates) => {
                  setPaper((prev) => ({ ...prev, ...updates }));
                }}
                onUploadImage={handleUploadImage}
                onTriggerUpload={() => {
                  const fileInput = (document.getElementById('studio-file-input') ||
                    document.querySelector('input[type="file"]')) as HTMLInputElement;
                  fileInput?.click();
                }}
              />
            </main>
          </div>
        )}
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      <MobileMenuDrawer
        isOpen={mobileMenuDrawerOpen}
        onClose={() => setMobileMenuDrawerOpen(false)}
        onUploadImage={handleUploadImage}
        onTriggerUpload={() => {
          const fileInput = (document.getElementById('studio-file-input') ||
            document.querySelector('input[type="file"]')) as HTMLInputElement;
          fileInput?.click();
        }}
        currentImageName={imageName}
        onResetAll={handleResetAll}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenPrint={() => setIsPrintOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        showCompare={showCompare}
        onToggleCompare={() => setShowCompare((prev) => !prev)}
        onOpenPermissions={() => setIsPermissionDialogOpen(true)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        processedCanvas={processedCanvas}
        rawImageCanvas={rawTransformedCanvas}
        imageName={imageName}
        grid={grid}
        paper={paper}
        currentFilterName={currentFilterTitle}
      />

      {/* Print Modal */}
      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        processedCanvas={processedCanvas}
        rawImageCanvas={rawTransformedCanvas}
        imageName={imageName}
        grid={grid}
        paper={paper}
      />

      {/* Storage & Media Permission Dialog */}
      <PermissionDialog
        isOpen={isPermissionDialogOpen}
        onClose={() => setIsPermissionDialogOpen(false)}
        onGranted={() => {
          setIsPermissionDialogOpen(false);
          showToast('Storage permission granted', 'success');
        }}
      />
    </div>
  );
}
