'use client';

import React from 'react';
import {
  GridConfig,
  PaperConfig,
  FilterMode,
  TransformConfig,
} from '@/types/editor';
import { CanvasHeroBentoCard } from './CanvasHeroBentoCard';
import { ImageFitBentoCard } from './ImageFitBentoCard';
import { GridBlueprintBentoCard } from './GridBlueprintBentoCard';
import { PaperRulerBentoCard } from './PaperRulerBentoCard';
import { ModesBentoCard } from './ModesBentoCard';
import { CropTransformBentoCard } from './CropTransformBentoCard';
import { BlueprintStatsBentoCard } from './BlueprintStatsBentoCard';

interface BentoGridDashboardProps {
  processedCanvas: HTMLCanvasElement | null;
  rawImageCanvas: HTMLCanvasElement | null;
  grid: GridConfig;
  onGridChange: (updates: Partial<GridConfig>) => void;
  paper: PaperConfig;
  onPaperChange: (updates: Partial<PaperConfig>) => void;
  mode: FilterMode;
  onModeChange: (newMode: FilterMode) => void;
  transform: TransformConfig;
  onTransformChange: (updates: Partial<TransformConfig>) => void;
  imageName: string;
  imageWidth: number;
  imageHeight: number;
  showCompare: boolean;
  onToggleCompare: () => void;
  isProcessing: boolean;
  showPage: boolean;
  onToggleShowPage: () => void;
  isMovingImage: boolean;
  onToggleMoveImage: () => void;
  onOpenPrint: () => void;
  onOpenExport: () => void;
  onExpandFocus: () => void;
}

export function BentoGridDashboard({
  processedCanvas,
  rawImageCanvas,
  grid,
  onGridChange,
  paper,
  onPaperChange,
  mode,
  onModeChange,
  transform,
  onTransformChange,
  imageName,
  imageWidth,
  imageHeight,
  showCompare,
  onToggleCompare,
  isProcessing,
  showPage,
  onToggleShowPage,
  isMovingImage,
  onToggleMoveImage,
  onOpenPrint,
  onOpenExport,
  onExpandFocus,
}: BentoGridDashboardProps) {
  return (
    <div className="relative flex-1 w-full h-full overflow-y-auto bg-[#0a0e1a] p-3 sm:p-5 md:p-6 no-scrollbar">
      {/* North Star "Frozen Light" Luminous Ambient Under-Glass Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-Right Ice-Blue Aura */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-radial from-[rgba(125,211,252,0.18)] via-[rgba(56,189,248,0.06)] to-transparent blur-3xl" />
        {/* Mid-Left Cyan Light Glow */}
        <div className="absolute top-1/3 -left-40 w-[650px] h-[650px] rounded-full bg-radial from-[rgba(14,165,233,0.15)] via-[rgba(30,58,138,0.08)] to-transparent blur-3xl" />
        {/* Bottom-Right Lavender Ethereal Refraction Orb */}
        <div className="absolute -bottom-32 right-1/4 w-[550px] h-[550px] rounded-full bg-radial from-[rgba(200,160,240,0.12)] via-[rgba(147,51,234,0.04)] to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1840px] mx-auto">
        {/* Bento Grid Structural Layout with Glacier Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto">
          {/* 1. Hero Canvas Viewport (Spans 2 columns on desktop) */}
          <CanvasHeroBentoCard
            processedCanvas={processedCanvas}
            rawImageCanvas={rawImageCanvas}
            grid={grid}
            paper={paper}
            showCompare={showCompare}
            isProcessing={isProcessing}
            showPage={showPage}
            onToggleShowPage={onToggleShowPage}
            isMovingImage={isMovingImage}
            onToggleMoveImage={onToggleMoveImage}
            onPaperChange={onPaperChange}
            imageName={imageName}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onExpandFullscreen={onExpandFocus}
            colSpan="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 row-span-2"
          />

          {/* 2. Image Fit & Custom Length Dimensions */}
          <ImageFitBentoCard
            paper={paper}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onChange={onPaperChange}
            isMovingImage={isMovingImage}
            onToggleMoveImage={onToggleMoveImage}
            colSpan="col-span-1 lg:col-span-1 xl:col-span-1"
          />

          {/* 3. Grid Blueprint & Density (With Grid Number vs Grid Size with Units) */}
          <GridBlueprintBentoCard
            grid={grid}
            onChange={onGridChange}
            paper={paper}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            colSpan="col-span-1 lg:col-span-1 xl:col-span-1"
          />

          {/* 4. Physical Paper & Real-World Ruler */}
          <PaperRulerBentoCard
            paper={paper}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            rows={grid.rows}
            columns={grid.columns}
            onChange={onPaperChange}
            colSpan="col-span-1 lg:col-span-1 xl:col-span-1"
          />

          {/* 5. Tonal & Drawing Modes */}
          <ModesBentoCard
            currentMode={mode}
            onSelectMode={onModeChange}
            colSpan="col-span-1 lg:col-span-1 xl:col-span-1"
          />

          {/* 6. Crop, Orientation & Aspect Ratio */}
          <CropTransformBentoCard
            transform={transform}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onChange={onTransformChange}
            colSpan="col-span-1 lg:col-span-1 xl:col-span-1"
          />

          {/* 7. Blueprint Specs & Export Actions */}
          <BlueprintStatsBentoCard
            grid={grid}
            paper={paper}
            mode={mode}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onOpenPrint={onOpenPrint}
            onOpenExport={onOpenExport}
            showCompare={showCompare}
            onToggleCompare={onToggleCompare}
            colSpan="col-span-1 lg:col-span-1 xl:col-span-1"
          />
        </div>
      </div>
    </div>
  );
}
