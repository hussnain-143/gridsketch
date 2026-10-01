'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  MousePointer,
  Eye,
  FileText,
  Move,
  Scaling,
  Ruler,
} from 'lucide-react';
import { GridConfig, PaperConfig } from '@/types/editor';
import { drawGridOverlay, drawGridOverlayOnRect, drawPhysicalRulerMargins } from '@/lib/image/grid-renderer';
import { calculatePageFraming, calculatePaperGridScale } from '@/lib/image/paper-calculator';
import { throttleRaf } from '@/lib/utils/performance';

interface StudioCanvasProps {
  processedCanvas: HTMLCanvasElement | null;
  rawImageCanvas: HTMLCanvasElement | null;
  grid: GridConfig;
  showCompare: boolean;
  isProcessing: boolean;
  paper?: PaperConfig;
  showPage?: boolean;
  onToggleShowPage?: () => void;
  isMovingImage?: boolean;
  onToggleMoveImage?: () => void;
  onPaperChange?: (updates: Partial<PaperConfig>) => void;
}

export function StudioCanvas({
  processedCanvas,
  rawImageCanvas,
  grid,
  showCompare,
  isProcessing,
  paper,
  showPage = true,
  onToggleShowPage,
  isMovingImage,
  onToggleMoveImage,
  onPaperChange,
}: StudioCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  const [internalMoveImage, setInternalMoveImage] = useState<boolean>(false);
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
  const activeMovingImage = isMovingImage ?? internalMoveImage;
  const handleToggleMove = () => {
    if (onToggleMoveImage) {
      onToggleMoveImage();
    } else {
      setInternalMoveImage((prev) => !prev);
    }
  };

  const isDraggingImageRef = useRef<boolean>(false);
  const dragImageStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number }>({
    clientX: 0,
    clientY: 0,
    initX: 0,
    initY: 0,
  });

  // ── Page frame and image positioning ────────────────────────────────
  const pageDims = useMemo(() => {
    const fallback = {
      pageW: 0,
      pageH: 0,
      showPageFrame: false,
      imgDisplayW: 0,
      imgDisplayH: 0,
      imgOffsetX: 0,
      imgOffsetY: 0,
      maxPanX: 0,
      maxPanY: 0,
      zoom: 1,
      fitMode: 'cover' as const,
      backgroundColor: 'transparent',
    };
    if (!processedCanvas) return fallback;

    const imgW = processedCanvas.width;
    const imgH = processedCanvas.height;
    const showPageFrame = !!(showPage && paper);

    if (!showPageFrame) {
      return {
        pageW: imgW,
        pageH: imgH,
        showPageFrame: false,
        imgDisplayW: imgW,
        imgDisplayH: imgH,
        imgOffsetX: 0,
        imgOffsetY: 0,
        maxPanX: 0,
        maxPanY: 0,
        zoom: 1,
        fitMode: 'cover' as const,
        backgroundColor: 'transparent',
      };
    }

    const framing = calculatePageFraming(imgW, imgH, paper!);
    return { ...framing, showPageFrame: true };
  }, [processedCanvas, showPage, paper]);

  // Viewport transformation: scale and translation offsets
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panToolActive, setPanToolActive] = useState<boolean>(false);
  const [spacePressed, setSpacePressed] = useState<boolean>(false);

  // Before/After split position (0 to 1)
  const [splitPos, setSplitPos] = useState<number>(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [holdOriginal, setHoldOriginal] = useState<boolean>(false);

  // Fit image to viewport container with proper mobile clearance
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !processedCanvas) return;
    const isMobile = window.innerWidth < 640;
    // On mobile, allocate ample vertical breathing room:
    // Top header clearance: ~24px
    // Bottom clearance for floating HUD pill + bottom tab bar + Android system gesture bar: ~136px
    const padTop = isMobile ? 24 : 40;
    const padBottom = isMobile ? 136 : 48;
    const padHoriz = isMobile ? 24 : 48;

    const availW = Math.max(80, containerRef.current.clientWidth - padHoriz);
    const availH = Math.max(80, containerRef.current.clientHeight - (padTop + padBottom));

    const targetW = pageDims.showPageFrame && pageDims.pageW > 0 ? pageDims.pageW : processedCanvas.width;
    const targetH = pageDims.showPageFrame && pageDims.pageH > 0 ? pageDims.pageH : processedCanvas.height;

    const scaleX = availW / targetW;
    const scaleY = availH / targetH;
    const newScale = Math.min(scaleX, scaleY, 1.0);

    setScale(newScale);

    // Center cleanly in visible area
    const centerX = (containerRef.current.clientWidth - targetW * newScale) / 2;
    const centerY = padTop + (availH - targetH * newScale) / 2;
    setOffset({ x: centerX, y: centerY });
  }, [processedCanvas, pageDims]);

  // Set 100% 1:1 pixel scale
  const handle100Percent = useCallback(() => {
    if (!containerRef.current || !processedCanvas) return;
    const targetW = pageDims.showPageFrame && pageDims.pageW > 0 ? pageDims.pageW : processedCanvas.width;
    const targetH = pageDims.showPageFrame && pageDims.pageH > 0 ? pageDims.pageH : processedCanvas.height;
    setScale(1.0);
    const centerX = (containerRef.current.clientWidth - targetW) / 2;
    const centerY = (containerRef.current.clientHeight - targetH) / 2;
    setOffset({ x: centerX, y: centerY });
  }, [processedCanvas, pageDims]);

  // Stable tracker to prevent resetting viewport when user moves image or changes edit properties
  const hasFittedRef = useRef<boolean>(false);
  const prevPaperLayoutRef = useRef<string>('');
  const prevImageDimRef = useRef<string>('');

  useEffect(() => {
    if (!processedCanvas) return;

    const currentDim = `${processedCanvas.width}x${processedCanvas.height}`;
    const currentPaper = `${paper?.preset || 'none'}-${paper?.orientation || 'portrait'}-${showPage}`;

    const isInitial = !hasFittedRef.current;
    const isNewImageDim = prevImageDimRef.current !== '' && prevImageDimRef.current !== currentDim;
    const isPaperLayoutChange = prevPaperLayoutRef.current !== '' && prevPaperLayoutRef.current !== currentPaper;

    if (isInitial || isNewImageDim || isPaperLayoutChange) {
      handleFitToScreen();
      hasFittedRef.current = true;
      prevImageDimRef.current = currentDim;
      prevPaperLayoutRef.current = currentPaper;
    }
  }, [processedCanvas, paper?.preset, paper?.orientation, showPage, handleFitToScreen]);

  // Keyboard shortcut listener (Space for Pan tool)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed && e.target === document.body) {
        e.preventDefault();
        setSpacePressed(true);
      } else if (e.key.toLowerCase() === 'f' && e.target === document.body) {
        handleFitToScreen();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, handleFitToScreen]);

  // Focal wheel zoom centered around mouse position (or image zoom if in Move Image mode)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current || !processedCanvas) return;

    // If Move Image mode is active and user scrolls holding Alt/Shift, zoom the image inside the page
    if (activeMovingImage && pageDims.showPageFrame && onPaperChange && (e.altKey || e.shiftKey)) {
      const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
      const currZoom = paper?.imageZoom ?? 1.0;
      const newZoom = Math.max(1.0, Math.min(5.0, parseFloat((currZoom + zoomStep).toFixed(2))));
      onPaperChange({ imageZoom: newZoom });
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(10, Math.max(0.08, scale * zoomFactor));

    // Calculate new offsets to keep mouse focal point stable
    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if middle click or left click with pan tool/space
    if (e.button === 1 || (e.button === 0 && (spacePressed || panToolActive))) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } else if (e.button === 0 && activeMovingImage && pageDims.showPageFrame) {
      // Direct drag to position image inside page
      isDraggingImageRef.current = true;
      setIsDraggingImage(true);
      dragImageStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initX: paper?.imageOffsetX ?? 0,
        initY: paper?.imageOffsetY ?? 0,
      };
    } else if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  // Smooth 60fps/120fps sync for direct image dragging
  const throttledPaperChange = useMemo(() => {
    if (!onPaperChange) return null;
    return throttleRaf((updates: Partial<PaperConfig>) => {
      onPaperChange(updates);
    });
  }, [onPaperChange]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSplit && containerRef.current && processedCanvas) {
      // Handle split slider drag
      const rect = containerRef.current.getBoundingClientRect();
      const canvasDisplayX = offset.x;
      const canvasDisplayW = processedCanvas.width * scale;
      const mouseRelativeX = e.clientX - rect.left - canvasDisplayX;
      const newPos = Math.max(0.02, Math.min(0.98, mouseRelativeX / canvasDisplayW));
      setSplitPos(newPos);
      return;
    }

    if (isDraggingImageRef.current && (throttledPaperChange || onPaperChange)) {
      const dx = (e.clientX - dragImageStartRef.current.clientX) / scale;
      const dy = (e.clientY - dragImageStartRef.current.clientY) / scale;
      let newOffsetX = Math.round(dragImageStartRef.current.initX + dx);
      let newOffsetY = Math.round(dragImageStartRef.current.initY + dy);

      if (pageDims.fitMode === 'cover') {
        const minX = Math.round(pageDims.pageW - pageDims.imgDisplayW);
        const minY = Math.round(pageDims.pageH - pageDims.imgDisplayH);
        newOffsetX = Math.min(0, Math.max(minX, newOffsetX));
        newOffsetY = Math.min(0, Math.max(minY, newOffsetY));
      }

      const updates = {
        imageOffsetX: newOffsetX,
        imageOffsetY: newOffsetY,
      };
      if (throttledPaperChange) {
        throttledPaperChange(updates);
      } else if (onPaperChange) {
        onPaperChange(updates);
      }
      return;
    }

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // Mobile Touch Gestures (Pinch zoom & Touch pan / Move Image)
  const touchStartDist = useRef<number | null>(null);
  const touchStartScale = useRef<number>(1);
  const touchStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      if (activeMovingImage && pageDims.showPageFrame) {
        isDraggingImageRef.current = true;
        setIsDraggingImage(true);
        dragImageStartRef.current = {
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY,
          initX: paper?.imageOffsetX ?? 0,
          initY: paper?.imageOffsetY ?? 0,
        };
      } else {
        setIsDragging(true);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
      }
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      isDraggingImageRef.current = false;
      setIsDraggingImage(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartDist.current = dist;
      touchStartScale.current = scale;
      touchStartOffset.current = { ...offset };
      touchStartPoint.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDraggingImageRef.current && (throttledPaperChange || onPaperChange)) {
      const dx = (e.touches[0].clientX - dragImageStartRef.current.clientX) / scale;
      const dy = (e.touches[0].clientY - dragImageStartRef.current.clientY) / scale;
      let newOffsetX = Math.round(dragImageStartRef.current.initX + dx);
      let newOffsetY = Math.round(dragImageStartRef.current.initY + dy);

      if (pageDims.fitMode === 'cover') {
        const minX = Math.round(pageDims.pageW - pageDims.imgDisplayW);
        const minY = Math.round(pageDims.pageH - pageDims.imgDisplayH);
        newOffsetX = Math.min(0, Math.max(minX, newOffsetX));
        newOffsetY = Math.min(0, Math.max(minY, newOffsetY));
      }

      const updates = {
        imageOffsetX: newOffsetX,
        imageOffsetY: newOffsetY,
      };
      if (throttledPaperChange) {
        throttledPaperChange(updates);
      } else if (onPaperChange) {
        onPaperChange(updates);
      }
      return;
    }

    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStartDist.current && containerRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const pinchRatio = dist / touchStartDist.current;
      const newScale = Math.min(10, Math.max(0.08, touchStartScale.current * pinchRatio));

      const rect = containerRef.current.getBoundingClientRect();
      const midX = touchStartPoint.current.x - rect.left;
      const midY = touchStartPoint.current.y - rect.top;

      const newOffsetX = midX - (midX - touchStartOffset.current.x) * (newScale / touchStartScale.current);
      const newOffsetY = midY - (midY - touchStartOffset.current.y) * (newScale / touchStartScale.current);

      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    isDraggingImageRef.current = false;
    setIsDraggingImage(false);
    touchStartDist.current = null;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingSplit(false);
    isDraggingImageRef.current = false;
    setIsDraggingImage(false);
  };

  // Render image-only onto the main viewport canvas (no grid here)
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas || !processedCanvas) return;

    const width = processedCanvas.width;
    const height = processedCanvas.height;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (holdOriginal && rawImageCanvas) {
      // Hold-to-view original: draw raw image only
      ctx.drawImage(rawImageCanvas, 0, 0);
    } else if (showCompare && rawImageCanvas) {
      // Split Before / After Mode — grid stays on image half for alignment
      const splitX = Math.round(width * splitPos);

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, height);
      ctx.clip();
      ctx.drawImage(rawImageCanvas, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, width - splitX, height);
      ctx.clip();
      ctx.drawImage(processedCanvas, 0, 0);
      drawGridOverlay(ctx, width, height, grid, true, paper);
      ctx.restore();

      // Splitter line
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(2, 2 / scale);
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, height);
      ctx.stroke();
      ctx.restore();
    } else {
      // Normal: image only — grid is drawn on the separate page grid canvas
      ctx.drawImage(processedCanvas, 0, 0);
    }
  }, [processedCanvas, rawImageCanvas, grid, showCompare, splitPos, holdOriginal, scale, paper]);

  // Draw grid on page canvas (matches page dimensions or image boundary based on gridTarget)
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas || !processedCanvas) return;

    const { pageW, pageH, imgOffsetX, imgOffsetY, imgDisplayW, imgDisplayH, showPageFrame } = pageDims;
    if (pageW === 0) return;

    canvas.width = pageW;
    canvas.height = pageH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, pageW, pageH);

    if (!showCompare && !holdOriginal) {
      const isCustomOrContain = paper?.fitMode && paper.fitMode !== 'cover';
      const defaultTarget = isCustomOrContain ? 'image' : 'paper';
      const target = paper?.gridTarget || defaultTarget;

      if (target === 'image' && showPageFrame && imgDisplayW > 0 && imgDisplayH > 0) {
        drawGridOverlayOnRect(ctx, imgOffsetX, imgOffsetY, imgDisplayW, imgDisplayH, grid, true, paper);
      } else {
        drawGridOverlay(ctx, pageW, pageH, grid, true, paper);
      }

      if (paper?.showRulerMargins) {
        const scaleInfo = calculatePaperGridScale(pageW, pageH, grid.rows, grid.columns, paper, 0, grid);
        const rulerThickness = Math.max(26, Math.round(Math.min(pageW, pageH) * 0.035));
        drawPhysicalRulerMargins(
          ctx,
          rulerThickness,
          rulerThickness,
          pageW - rulerThickness,
          pageH - rulerThickness,
          scaleInfo.paperWidthMm,
          scaleInfo.paperHeightMm,
          { theme: 'dark', rulerThickness }
        );
      }
    }
  }, [processedCanvas, pageDims, grid, paper, showCompare, holdOriginal]);

  const isPanningCursor = spacePressed || panToolActive || isDragging;
  const canvasCursor = activeMovingImage
    ? isDraggingImage
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : isPanningCursor
    ? 'cursor-grab active:cursor-grabbing'
    : 'cursor-crosshair';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative flex-1 h-full w-full overflow-hidden checkerboard-bg select-none touch-none ${canvasCursor}`}
    >
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(15,21,36,0.75)] backdrop-blur-xl border border-[rgba(125,211,252,0.25)] text-xs text-[#7dd3fc] font-medium shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_15px_rgba(125,211,252,0.15)]">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-[#7dd3fc] border-t-transparent animate-spin" />
          <span>Processing pixels...</span>
        </div>
      )}

      {/* Floating Move Image Active Banner */}
      {pageDims.showPageFrame && activeMovingImage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(15,21,36,0.92)] backdrop-blur-2xl border border-[rgba(125,211,252,0.4)] text-[11px] text-[#bae6fd] font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_24px_rgba(125,211,252,0.2)] animate-in fade-in max-w-[92vw]">
          <Move className="w-3.5 h-3.5 text-[#7dd3fc] animate-pulse shrink-0" />
          <span className="truncate">Drag photo to frame inside {paper?.preset}</span>
          <button
            onClick={handleToggleMove}
            className="ml-1 px-2.5 py-0.5 rounded-full bg-[#7dd3fc] hover:bg-[#bae6fd] text-[#0a0e1a] font-bold text-[10px] transition-colors shrink-0 shadow-[0_0_15px_rgba(125,211,252,0.4)]"
          >
            Done
          </button>
        </div>
      )}

      {/* Main Scaled & Panned Image Canvas */}
      {processedCanvas && (() => {
        const {
          pageW, pageH, showPageFrame,
          imgDisplayW, imgDisplayH, imgOffsetX, imgOffsetY,
        } = pageDims;
        const pageLabel = showPageFrame ? `${paper!.preset} · ${paper!.orientation} (${paper!.fitMode || 'cover'})` : '';

        return (
          <div
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging || isDraggingImage ? 'none' : 'transform 0.05s ease-out',
              width: pageW,
              height: pageH,
              backgroundColor: showPageFrame && pageDims.backgroundColor !== 'transparent' ? pageDims.backgroundColor : 'transparent',
              // clip image that overflows the page boundary
              overflow: showPageFrame ? 'hidden' : 'visible',
              boxShadow: showPageFrame ? '0 8px 60px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)' : '0 2px 20px rgba(0,0,0,0.4)',
              borderRadius: showPageFrame ? 2 : 0,
            }}
            className="absolute top-0 left-0"
          >
            {/* White Paper Page Frame (decorative) */}
            {showPageFrame && (
              <div
                className={`absolute inset-0 pointer-events-none z-10 transition-all ${
                  activeMovingImage
                    ? 'border-2 border-[#7dd3fc] ring-4 ring-[#7dd3fc]/20 shadow-2xl'
                    : ''
                }`}
              >
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#7dd3fc]/60" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#7dd3fc]/60" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#7dd3fc]/60" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#7dd3fc]/60" />
                {pageLabel && (
                  <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[8px] font-mono font-bold text-white/40 uppercase tracking-widest select-none">
                    <FileText style={{ width: 8, height: 8 }} />
                    {pageLabel}
                  </div>
                )}
              </div>
            )}

            {/* Image — CSS cover-positioned inside the page */}
            <canvas
              ref={mainCanvasRef}
              className="block absolute"
              style={{
                left: imgOffsetX,
                top: imgOffsetY,
                imageRendering: scale > 1 ? 'pixelated' : 'auto',
                width: imgDisplayW,
                height: imgDisplayH,
              }}
            />

            {/* Grid overlay — spans the full page */}
            {!showCompare && !holdOriginal && (
              <canvas
                ref={gridCanvasRef}
                className="absolute top-0 left-0 pointer-events-none z-5"
                style={{
                  width: pageW,
                  height: pageH,
                  imageRendering: scale > 1 ? 'pixelated' : 'auto',
                }}
              />
            )}

            {/* Split Handle when in compare mode */}
            {showCompare && !holdOriginal && (
              <>
                <div className="absolute top-3 left-3 pointer-events-none z-10 px-2 py-1 rounded bg-[rgba(15,21,36,0.75)] backdrop-blur-md text-[10px] font-semibold text-[#bae6fd] border border-[rgba(125,211,252,0.2)] shadow">
                  Original Photo
                </div>
                <div className="absolute top-3 right-3 pointer-events-none z-10 px-2 py-1 rounded bg-[#7dd3fc]/20 backdrop-blur-md text-[10px] font-semibold text-[#7dd3fc] border border-[#7dd3fc]/40 shadow">
                  Processed + Grid
                </div>
                <div
                  onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSplit(true); }}
                  style={{ left: `${splitPos * 100}%` }}
                  className="absolute top-0 bottom-0 -ml-3 w-6 flex items-center justify-center cursor-ew-resize group z-10"
                >
                  <div className="w-6 h-6 rounded-full bg-[#7dd3fc] text-[#0a0e1a] flex items-center justify-center shadow-[0_0_15px_rgba(125,211,252,0.6)] group-hover:scale-110 transition-transform">
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-2.5 bg-[#0a0e1a] rounded-full" />
                      <div className="w-0.5 h-2.5 bg-[#0a0e1a] rounded-full" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}


      {/* Floating Canvas HUD Controls — Compact capsule in Glacier Glass */}
      <div
        className="absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[rgba(15,21,36,0.75)] backdrop-blur-2xl border border-[rgba(125,211,252,0.18)] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(125,211,252,0.08)] text-[#bae6fd] max-w-[calc(100vw-1.5rem)] select-none"
      >
        {/* Fit to Screen */}
        <button
          onClick={handleFitToScreen}
          className="p-1.5 rounded-full hover:bg-[#7dd3fc]/15 hover:text-[#f0f9ff] text-[#bae6fd] transition-colors shrink-0 active:scale-95"
          title="Fit to screen (F)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* 100% 1:1 Scale (Desktop only; on mobile tap % readout) */}
        <button
          onClick={handle100Percent}
          className="hidden sm:inline-flex px-2 py-0.5 rounded-full hover:bg-[#7dd3fc]/15 hover:text-[#f0f9ff] text-[#bae6fd] text-[11px] font-semibold font-mono transition-colors shrink-0 active:scale-95"
          title="Zoom to 100% (1:1 actual pixels)"
        >
          100%
        </button>

        <div className="w-px h-3.5 bg-[rgba(125,211,252,0.15)] mx-0.5 shrink-0" />

        {/* Zoom Out */}
        <button
          onClick={() => {
            setScale((prev) => Math.max(0.08, prev * 0.85));
          }}
          className="p-1.5 rounded-full hover:bg-[#7dd3fc]/15 hover:text-[#f0f9ff] text-[#bae6fd] transition-colors shrink-0 active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Readout (Clickable to toggle 100% / Fit) */}
        <button
          onClick={() => {
            if (Math.abs(scale - 1) < 0.05) {
              handleFitToScreen();
            } else {
              handle100Percent();
            }
          }}
          className="w-10 sm:w-12 text-center text-[10px] sm:text-[11px] font-mono font-medium text-[#bae6fd] hover:text-[#7dd3fc] shrink-0 transition-colors"
          title="Click to toggle 100% / Fit"
        >
          {Math.round(scale * 100)}%
        </button>

        {/* Zoom In */}
        <button
          onClick={() => {
            setScale((prev) => Math.min(10, prev * 1.15));
          }}
          className="p-1.5 rounded-full hover:bg-[#7dd3fc]/15 hover:text-[#f0f9ff] text-[#bae6fd] transition-colors shrink-0 active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-[rgba(125,211,252,0.15)] mx-0.5 shrink-0" />

        {/* Pan Tool Toggle (Desktop; Mobile touch swipe pans natively) */}
        <button
          onClick={() => setPanToolActive((prev) => !prev)}
          className={`hidden sm:inline-flex p-1.5 rounded-full transition-colors shrink-0 ${
            panToolActive || spacePressed
              ? 'bg-[#7dd3fc]/25 text-[#7dd3fc] border border-[#7dd3fc]/30'
              : 'hover:bg-[#7dd3fc]/15 hover:text-[#f0f9ff] text-[#bae6fd]'
          }`}
          title="Pan Tool (or hold Spacebar)"
        >
          {panToolActive ? <Hand className="w-3.5 h-3.5" /> : <MousePointer className="w-3.5 h-3.5" />}
        </button>

        {/* Hold to Compare Original (Icon Only) */}
        <button
          onMouseDown={() => setHoldOriginal(true)}
          onMouseUp={() => setHoldOriginal(false)}
          onMouseLeave={() => setHoldOriginal(false)}
          onTouchStart={() => setHoldOriginal(true)}
          onTouchEnd={() => setHoldOriginal(false)}
          className={`p-1.5 rounded-full transition-all shrink-0 active:scale-95 ${
            holdOriginal
              ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold shadow-[0_0_12px_rgba(125,211,252,0.4)]'
              : 'hover:bg-[#7dd3fc]/15 text-[#bae6fd]'
          }`}
          title="Press & hold to view original photo"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Page Toggle — only when a paper preset is selected (Icon Only) */}
        {paper && paper.preset !== 'Custom' && onToggleShowPage && (
          <>
            <div className="hidden sm:block w-px h-3.5 bg-[rgba(125,211,252,0.15)] mx-0.5 shrink-0" />
            <button
              onClick={onToggleShowPage}
              className={`p-1.5 rounded-full transition-colors shrink-0 active:scale-95 ${
                showPage
                  ? 'bg-[#7dd3fc]/20 text-[#7dd3fc] border border-[#7dd3fc]/30'
                  : 'hover:bg-[#7dd3fc]/15 text-[#64748b]'
              }`}
              title={showPage ? `Hide page frame (${paper.preset})` : `Show page frame (${paper.preset})`}
            >
              <FileText className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Move / Frame Image inside Page Button (Icon Only) */}
        {pageDims.showPageFrame && (
          <>
            <div className="w-px h-3.5 bg-[rgba(125,211,252,0.15)] mx-0.5 shrink-0" />
            <button
              onClick={handleToggleMove}
              className={`p-1.5 rounded-full transition-all shrink-0 active:scale-95 ${
                activeMovingImage
                  ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold shadow-[0_0_12px_rgba(125,211,252,0.4)]'
                  : 'hover:bg-[#7dd3fc]/15 text-[#bae6fd]'
              }`}
              title={activeMovingImage ? 'Done moving photo' : 'Move / frame photo inside page'}
            >
              <Move className="w-4 h-4" />
            </button>

            {/* Physical Ruler Margins Direct Verification Toggle */}
            {onPaperChange && (
              <button
                onClick={() => onPaperChange({ showRulerMargins: !paper?.showRulerMargins })}
                className={`p-1.5 rounded-full transition-all shrink-0 active:scale-95 ${
                  paper?.showRulerMargins
                    ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold shadow-[0_0_12px_rgba(125,211,252,0.4)]'
                    : 'hover:bg-[#7dd3fc]/15 text-[#bae6fd]'
                }`}
                title={paper?.showRulerMargins ? 'Hide physical ruler margins' : 'Show physical ruler margins (1:1 mm)'}
              >
                <Ruler className="w-4 h-4" />
              </button>
            )}

            {/* Quick Fit Mode Toggle Button (Icon Only) */}
            {onPaperChange && (
              <button
                onClick={() => {
                  const modes: ('cover' | 'contain' | 'auto' | 'custom')[] = ['cover', 'contain', 'auto', 'custom'];
                  const currIdx = modes.indexOf(paper?.fitMode || 'cover');
                  const nextMode = modes[(currIdx + 1) % modes.length];
                  onPaperChange({ fitMode: nextMode });
                }}
                className="hidden md:flex p-1.5 rounded-full bg-[rgba(125,211,252,0.08)] hover:bg-[#7dd3fc]/15 text-[#7dd3fc] border border-[rgba(125,211,252,0.2)] transition-colors shrink-0 active:scale-95"
                title={`Fit Mode: ${paper?.fitMode || 'cover'} (Click to cycle)`}
              >
                <Scaling className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
