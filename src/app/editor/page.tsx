'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  GridConfig,
  AdjustmentConfig,
  FilterMode,
  TransformConfig,
  PaperConfig,
  EditorHistoryEntry,
} from '@/types/editor';
import { SAMPLE_IMAGES } from '@/lib/image/sample-images';
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
  subdivisions: 1,
  lockAspectRatio: true,
};

const BASE_ADJUSTMENTS: AdjustmentConfig = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  shadows: 0,
  highlights: 0,
  saturation: 0,
  sharpness: 0,
  blur: 0,
  threshold: 128,
  posterizeLevels: 4,
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
  canvasBackground: '#12151d',
  gridTarget: 'image',
};

export default function EditorPage() {
  // Image State
  const [imageName, setImageName] = useState<string>('Classical Sculpture Bust');
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Editor Settings
  const [grid, setGrid] = useState<GridConfig>(DEFAULT_GRID);
  const [mode, setMode] = useState<FilterMode>('grayscale');
  const [transform, setTransform] = useState<TransformConfig>(DEFAULT_TRANSFORM);
  const [paper, setPaper] = useState<PaperConfig>(DEFAULT_PAPER);

  // Structural Layout Mode ('bento' for Bento Grid Dashboard, 'split' for Split Studio, 'focus' for Canvas Focus)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('bento');

  // UI State
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [mobileMenuDrawerOpen, setMobileMenuDrawerOpen] = useState<boolean>(false);
  const [mobileEditDrawerOpen, setMobileEditDrawerOpen] = useState<boolean>(false);
  const [mobileEditTab, setMobileEditTab] = useState<MobileEditTab>('grid');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showPage, setShowPage] = useState<boolean>(true);
  const [isMovingImage, setIsMovingImage] = useState<boolean>(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<EditorHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryAction = useRef<boolean>(false);

  // Rendered Canvases
  const [rawTransformedCanvas, setRawTransformedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);

  // Latest state reference for stable history pushes without re-renders
  const stateRef = useRef({ grid, mode, transform, paper, historyIndex });
  stateRef.current = { grid, mode, transform, paper, historyIndex };

  // Record History State
  const pushHistory = useCallback(() => {
    if (isHistoryAction.current) {
      isHistoryAction.current = false;
      return;
    }
    const { grid: g, mode: m, transform: t, paper: p, historyIndex: hIdx } = stateRef.current;
    const currentEntry: EditorHistoryEntry = {
      grid: { ...g },
      adjustments: BASE_ADJUSTMENTS,
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

  // Debounced history for sliders and drags
  const pushHistoryDebounced = useMemo(
    () => debounce(pushHistory, 350),
    [pushHistory]
  );

  // Load initial sample image or uploaded image from landing page / URL
  useEffect(() => {
    try {
      const storedUpload = sessionStorage.getItem('gridsketch_custom_upload');
      const storedName = sessionStorage.getItem('gridsketch_custom_name');
      if (storedUpload) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setLoadedImage(img);
          setImageName(storedName || 'Uploaded Image');
          sessionStorage.removeItem('gridsketch_custom_upload');
          sessionStorage.removeItem('gridsketch_custom_name');
        };
        img.src = storedUpload;
        return;
      }
    } catch (e) {
      console.warn('Session storage check skipped:', e);
    }

    // Check if a specific sample was requested in the URL
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedSampleId = urlParams.get('sample');
      if (requestedSampleId) {
        const found = SAMPLE_IMAGES.find((s) => s.id === requestedSampleId);
        if (found) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            setLoadedImage(img);
            setImageName(found.title);
          };
          img.src = found.dataUrl;
          return;
        }
      }
    } catch (e) {
      console.warn('URL params check skipped:', e);
    }

    const defaultSample = SAMPLE_IMAGES[0];
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImage(img);
      setImageName(defaultSample.title);
    };
    img.src = defaultSample.dataUrl;
  }, []);

  // Undo Action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryAction.current = true;
      const targetEntry = history[historyIndex - 1];
      setGrid(targetEntry.grid);
      setMode(targetEntry.mode);
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

  // Upload handler
  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setLoadedImage(img);
        setImageName(file.name.replace(/\.[^/.]+$/, ''));
        setTransform(DEFAULT_TRANSFORM);
        pushHistory();
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Sample select handler
  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_IMAGES.find((s) => s.id === sampleId);
    if (!sample) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImage(img);
      setImageName(sample.title);
      setTransform(DEFAULT_TRANSFORM);
      pushHistory();
    };
    img.src = sample.dataUrl;
  };

  // Reset all
  const handleResetAll = () => {
    setGrid(DEFAULT_GRID);
    setMode('original');
    setTransform(DEFAULT_TRANSFORM);
    setPaper(DEFAULT_PAPER);
    pushHistory();
  };

  // Step 1: Geometric Transform Pipeline
  useEffect(() => {
    if (!loadedImage) return;

    try {
      const transformed = applyTransforms(loadedImage, transform);
      setRawTransformedCanvas(transformed);
    } catch (err) {
      console.error('Error applying geometric transform:', err);
    }
  }, [loadedImage, transform]);

  // Step 2: Pixel Processing Pipeline
  useEffect(() => {
    if (!rawTransformedCanvas) return;

    setIsProcessing(true);
    const timer = setTimeout(() => {
      try {
        const outCanvas = processImageCanvas(
          rawTransformedCanvas,
          mode,
          BASE_ADJUSTMENTS
        );
        setProcessedCanvas(outCanvas);
      } catch (err) {
        console.error('Error in pixel processing pipeline:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [rawTransformedCanvas, mode]);

  const currentFilterTitle =
    mode === 'original'
      ? 'Original Photo'
      : mode === 'grayscale'
      ? 'Grayscale'
      : 'High Contrast';

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-[#0a0e1a] text-[#f0f6fc]">
      {/* Studio Header */}
      <StudioHeader
        imageName={imageName}
        imageWidth={processedCanvas?.width || loadedImage?.naturalWidth || 0}
        imageHeight={processedCanvas?.height || loadedImage?.naturalHeight || 0}
        onUploadImage={handleUploadImage}
        onSelectSample={handleSelectSample}
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
        mobileSidebarOpen={mobileSidebarOpen}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        onOpenMobileDrawer={() => setMobileMenuDrawerOpen(true)}
      />

      {/* 1. Mobile Fixed-Canvas Layout with Bottom Edit Sheet Drawer (md:hidden) */}
      <div className="md:hidden flex-1 relative flex flex-col overflow-hidden">
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
          />
        </div>

        {/* Mobile Interactive Bottom Sheet Edit Drawer */}
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
      </div>

      {/* 2. Desktop Studio Viewport (hidden md:flex) */}
      <div className="hidden md:flex flex-1 overflow-hidden relative">
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
                transform={transform}
                onTransformChange={(updates) => {
                  setTransform((prev) => ({ ...prev, ...updates }));
                  pushHistoryDebounced();
                }}
                imageWidth={processedCanvas?.width || loadedImage?.naturalWidth || 800}
                imageHeight={processedCanvas?.height || loadedImage?.naturalHeight || 800}
                isMovingImage={isMovingImage}
                onToggleMoveImage={() => setIsMovingImage((prev) => !prev)}
                onCloseMobileDrawer={() => setMobileSidebarOpen(false)}
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
              />
            </main>
          </div>
        )}
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      <MobileMenuDrawer
        isOpen={mobileMenuDrawerOpen}
        onClose={() => setMobileMenuDrawerOpen(false)}
        onTriggerUpload={() => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          fileInput?.click();
        }}
        onSelectSample={handleSelectSample}
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
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        processedCanvas={processedCanvas}
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
        grid={grid}
        paper={paper}
      />
    </div>
  );
}
