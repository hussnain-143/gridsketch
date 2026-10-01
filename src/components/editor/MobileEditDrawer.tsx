'use client';

import React from 'react';
import {
  GridConfig,
  PaperConfig,
  FilterMode,
  TransformConfig,
  AdjustmentConfig,
} from '@/types/editor';
import { ImageFitBentoCard } from './bento/ImageFitBentoCard';
import { GridBlueprintBentoCard } from './bento/GridBlueprintBentoCard';
import { PaperRulerBentoCard } from './bento/PaperRulerBentoCard';
import { ModesBentoCard } from './bento/ModesBentoCard';
import { CropTransformBentoCard } from './bento/CropTransformBentoCard';
import {
  Grid3X3,
  Scaling,
  Ruler,
  SunMoon,
  Crop as CropIcon,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

export type MobileEditTab = 'grid' | 'frame' | 'paper' | 'mode' | 'transform';

interface MobileEditDrawerProps {
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
  isOpen: boolean;
  onToggleOpen: () => void;
  activeTab: MobileEditTab;
  onSelectTab: (tab: MobileEditTab) => void;
  onOpenMenu?: () => void;
}

export function MobileEditDrawer({
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
  isOpen,
  onToggleOpen,
  activeTab,
  onSelectTab,
  onOpenMenu,
}: MobileEditDrawerProps) {
  const tabs: { id: MobileEditTab; label: string; icon: React.ElementType }[] = [
    { id: 'grid', label: 'Grid', icon: Grid3X3 },
    { id: 'frame', label: 'Frame', icon: Scaling },
    { id: 'paper', label: 'Paper', icon: Ruler },
    { id: 'mode', label: 'Mode', icon: SunMoon },
    { id: 'transform', label: 'Transform', icon: CropIcon },
  ];

  return (
    <div
      className={`md:hidden no-print fixed inset-x-0 bottom-0 z-40 flex flex-col pointer-events-none transition-all duration-300 ease-in-out ${
        isMovingImage ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Contextual Bottom Sheet Container (pointer-events-auto) */}
      <div
        className={`w-full pointer-events-auto transition-all duration-300 ease-in-out flex flex-col shadow-2xl bg-[#161e27] ${
          isOpen
            ? 'h-[58dvh] max-h-[520px] rounded-t-3xl border-t border-[#273444]'
            : 'h-auto rounded-none border-t border-[#273444]'
        }`}
      >
        {/* Expanded Drawer Top Header with Drag Handle & Close */}
        {isOpen && (
          <div className="pt-2.5 px-3 pb-2 border-b border-[#273444] bg-[#111820]/90 shrink-0 flex flex-col gap-1.5">
            {/* Centered Drag Indicator Handle */}
            <div
              onClick={onToggleOpen}
              className="w-12 h-1 rounded-full bg-[#334155] mx-auto cursor-pointer hover:bg-[#38bdf8] transition-colors"
            />

            {/* Quick Tab Selector Ribbon */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 pr-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onSelectTab(tab.id)}
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                        isActive
                          ? 'bg-[#38bdf8] text-[#0b0f14] font-bold shadow-md shadow-[#38bdf8]/20'
                          : 'bg-[#161e27] text-[#94a3b8] hover:text-[#f8fafc] border border-[#273444]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: Minimize Drawer */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onToggleOpen}
                  className="p-1.5 rounded-xl bg-[#161e27] border border-[#273444] text-[#38bdf8] hover:bg-[#38bdf8]/10 active:scale-95 transition-all"
                  title="Minimize Drawer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Contextual Tool Panel Content (when sheet is open) */}
        {isOpen ? (
          <div className="flex-1 overflow-y-auto p-3.5 pb-[max(calc(env(safe-area-inset-bottom)+36px),56px)] no-scrollbar bg-[#161e27]">
            {activeTab === 'grid' && (
              <GridBlueprintBentoCard
                grid={grid}
                onChange={onGridChange}
                paper={paper}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
              />
            )}

            {activeTab === 'frame' && (
              <ImageFitBentoCard
                paper={paper}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                onChange={onPaperChange}
                isMovingImage={isMovingImage}
                onToggleMoveImage={onToggleMoveImage}
              />
            )}

            {activeTab === 'paper' && (
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

            {activeTab === 'mode' && (
              <ModesBentoCard
                currentMode={mode}
                onSelectMode={onModeChange}
                adjustments={adjustments}
                onAdjustmentsChange={onAdjustmentsChange}
              />
            )}

            {activeTab === 'transform' && (
              <CropTransformBentoCard
                transform={transform}
                onChange={onTransformChange}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
              />
            )}
          </div>
        ) : (
          /* Minimized Bottom Tool Dock: Grid | Frame | Paper | Mode | Transform | More */
          <nav className="flex items-center justify-around px-1 py-1.5 pb-[max(env(safe-area-inset-bottom),14px)] bg-[#161e27]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isOpen && activeTab === tab.id) {
                      onToggleOpen();
                    } else {
                      onSelectTab(tab.id);
                    }
                  }}
                  className={`flex-1 min-w-[50px] min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-all active:scale-95 touch-manipulation ${
                    isActive ? 'text-[#38bdf8]' : 'text-[#94a3b8] hover:text-[#f8fafc]'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[#38bdf8]'
                        : 'bg-[#111820] border border-[#273444] text-[#94a3b8]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}

            {/* 6. More (Secondary Actions Drawer) */}
            {onOpenMenu && (
              <button
                onClick={onOpenMenu}
                className="flex-1 min-w-[50px] min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-all text-[#94a3b8] hover:text-[#38bdf8] active:scale-95 touch-manipulation"
                title="More Studio Actions"
                aria-label="More Studio Actions"
              >
                <div className="p-1.5 rounded-xl bg-[#111820] border border-[#273444] text-[#94a3b8]">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <span className="truncate">More</span>
              </button>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
