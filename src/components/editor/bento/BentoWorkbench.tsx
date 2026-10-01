'use client';

import React, { useState } from 'react';
import {
  GridConfig,
  PaperConfig,
  FilterMode,
  TransformConfig,
  AdjustmentConfig,
} from '@/types/editor';
import { ImageFitBentoCard } from './ImageFitBentoCard';
import { GridBlueprintBentoCard } from './GridBlueprintBentoCard';
import { PaperRulerBentoCard } from './PaperRulerBentoCard';
import { ModesBentoCard } from './ModesBentoCard';
import { CropTransformBentoCard } from './CropTransformBentoCard';
import { BlueprintStatsBentoCard } from './BlueprintStatsBentoCard';
import {
  Layers,
  Scaling,
  Grid3X3,
  Ruler,
  SunMoon,
  Crop as CropIcon,
  Sparkles,
} from 'lucide-react';

interface BentoWorkbenchProps {
  grid: GridConfig;
  onGridChange: (updates: Partial<GridConfig>) => void;
  paper: PaperConfig;
  onPaperChange: (updates: Partial<PaperConfig>) => void;
  mode: FilterMode;
  onModeChange: (newMode: FilterMode) => void;
  adjustments?: AdjustmentConfig;
  onAdjustmentsChange?: (updates: Partial<AdjustmentConfig>) => void;
  transform: TransformConfig;
  onTransformChange: (updates: Partial<TransformConfig>) => void;
  imageWidth: number;
  imageHeight: number;
  isMovingImage?: boolean;
  onToggleMoveImage?: () => void;
  onCloseMobileDrawer?: () => void;
  onOpenPrint?: () => void;
  onOpenExport?: () => void;
  showCompare?: boolean;
  onToggleCompare?: () => void;
}

type BentoFilter = 'all' | 'fit' | 'grid' | 'paper' | 'modes' | 'crop' | 'stats';

export function BentoWorkbench({
  grid,
  onGridChange,
  paper,
  onPaperChange,
  mode,
  onModeChange,
  adjustments,
  onAdjustmentsChange,
  transform,
  onTransformChange,
  imageWidth,
  imageHeight,
  isMovingImage,
  onToggleMoveImage,
  onCloseMobileDrawer,
  onOpenPrint,
  onOpenExport,
  showCompare = false,
  onToggleCompare,
}: BentoWorkbenchProps) {
  const [activeFilter, setActiveFilter] = useState<BentoFilter>('all');

  const filterTabs: {
    id: BentoFilter;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'fit', label: 'Fit', icon: Scaling },
    { id: 'grid', label: 'Grid', icon: Grid3X3 },
    { id: 'paper', label: 'Paper', icon: Ruler },
    { id: 'modes', label: 'Modes', icon: SunMoon },
    { id: 'crop', label: 'Crop', icon: CropIcon },
    { id: 'stats', label: 'Specs', icon: Sparkles },
  ];

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{
        background: 'rgba(10, 14, 26, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Bento Top Header & Minimalist Filter Chips */}
      <div className="p-3 border-b border-[rgba(125,211,252,0.1)] bg-[rgba(15,21,36,0.5)] backdrop-blur-md shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7dd3fc] shadow-[0_0_10px_#7dd3fc]" />
            <h2 className="text-xs font-semibold text-[#f0f6fc] tracking-wider uppercase">
              Glacier Studio Cards
            </h2>
          </div>
          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="md:hidden px-2.5 py-0.5 rounded-lg bg-[#7dd3fc] text-[#0a0e1a] text-xs font-semibold shadow-xs"
            >
              Done
            </button>
          )}
        </div>

        {/* Minimalist Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                title={tab.label}
                className={`p-1.5 rounded-lg transition-all shrink-0 ${
                  active
                    ? 'bg-[#7dd3fc] text-[#0a0e1a] shadow-[0_0_15px_rgba(125,211,252,0.3)]'
                    : 'bg-[rgba(15,21,36,0.6)] hover:bg-[#7dd3fc]/15 text-[#94a3b8] hover:text-[#f0f6fc] border border-[rgba(125,211,252,0.1)]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bento Cards Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        {/* Card 1: Image Fit & Sizing Card */}
        {(activeFilter === 'all' || activeFilter === 'fit') && (
          <ImageFitBentoCard
            paper={paper}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onChange={onPaperChange}
            isMovingImage={isMovingImage}
            onToggleMoveImage={onToggleMoveImage}
          />
        )}

        {/* Card 2: Grid Blueprint Card */}
        {(activeFilter === 'all' || activeFilter === 'grid') && (
          <GridBlueprintBentoCard
            grid={grid}
            onChange={onGridChange}
            paper={paper}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        )}

        {/* Card 3: Paper & Ruler Card */}
        {(activeFilter === 'all' || activeFilter === 'paper') && (
          <PaperRulerBentoCard
            paper={paper}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            rows={grid.rows}
            columns={grid.columns}
            onChange={onPaperChange}
            grid={grid}
          />
        )}

        {/* Card 4: Drawing Modes Card */}
        {(activeFilter === 'all' || activeFilter === 'modes') && (
          <ModesBentoCard
            currentMode={mode}
            onSelectMode={onModeChange}
            adjustments={adjustments}
            onAdjustmentsChange={onAdjustmentsChange}
          />
        )}

        {/* Card 5: Crop & Transform Card */}
        {(activeFilter === 'all' || activeFilter === 'crop') && (
          <CropTransformBentoCard
            transform={transform}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onChange={onTransformChange}
          />
        )}

        {/* Card 6: Blueprint Stats Card */}
        {(activeFilter === 'all' || activeFilter === 'stats') && onOpenPrint && onOpenExport && onToggleCompare && (
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
          />
        )}
      </div>
    </div>
  );
}
