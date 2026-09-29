'use client';

import React, { useState } from 'react';
import {
  GridConfig,
  PaperConfig,
  FilterMode,
  TransformConfig,
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
  Sparkles,
  Menu,
} from 'lucide-react';

export type MobileEditTab = 'grid' | 'fit' | 'paper' | 'modes' | 'crop';

interface MobileEditDrawerProps {
  grid: GridConfig;
  onGridChange: (updates: Partial<GridConfig>) => void;
  paper: PaperConfig;
  onPaperChange: (updates: Partial<PaperConfig>) => void;
  mode: FilterMode;
  onModeChange: (newMode: FilterMode) => void;
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
    { id: 'fit', label: 'Fit', icon: Scaling },
    { id: 'paper', label: 'Paper', icon: Ruler },
    { id: 'modes', label: 'Modes', icon: SunMoon },
    { id: 'crop', label: 'Transform', icon: CropIcon },
  ];

  return (
    <div
      className={`md:hidden no-print fixed inset-x-0 bottom-0 z-40 flex flex-col pointer-events-none transition-all duration-300 ease-in-out ${
        isMovingImage ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Drawer Overlay Container (pointer-events-auto) */}
      <div
        className={`w-full pointer-events-auto transition-all duration-300 ease-in-out flex flex-col shadow-2xl ${
          isOpen
            ? 'h-[58dvh] max-h-[520px] rounded-t-3xl border-t border-[rgba(125,211,252,0.25)]'
            : 'h-auto rounded-none border-t border-[rgba(125,211,252,0.12)]'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(15, 21, 36, 0.94) 0%, rgba(10, 14, 26, 0.98) 100%)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Expanded Drawer Top Header with Drag Handle & Close */}
        {isOpen && (
          <div className="pt-2 px-3 pb-2 border-b border-[rgba(125,211,252,0.12)] bg-[rgba(15,21,36,0.6)] shrink-0 flex flex-col gap-1.5">
            {/* Centered Drag Indicator Handle */}
            <div
              onClick={onToggleOpen}
              className="w-12 h-1.5 rounded-full bg-[rgba(125,211,252,0.35)] mx-auto cursor-pointer hover:bg-[#7dd3fc] transition-colors"
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
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                        isActive
                          ? 'bg-[#7dd3fc] text-[#0a0e1a] shadow-[0_0_15px_rgba(125,211,252,0.35)]'
                          : 'bg-[rgba(10,14,26,0.6)] text-[#94a3b8] hover:text-[#f0f6fc] border border-[rgba(125,211,252,0.1)]'
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
                  className="p-1.5 rounded-xl bg-[rgba(10,14,26,0.6)] border border-[rgba(125,211,252,0.15)] text-[#7dd3fc] hover:bg-[#7dd3fc]/15 active:scale-95 transition-all"
                  title="Minimize Drawer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Tool Panel Content (when drawer is open) */}
        {isOpen ? (
          <div className="flex-1 overflow-y-auto p-3.5 pb-[max(calc(env(safe-area-inset-bottom)+36px),56px)] no-scrollbar">
            {activeTab === 'grid' && (
              <GridBlueprintBentoCard
                grid={grid}
                onChange={onGridChange}
                paper={paper}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
              />
            )}

            {activeTab === 'fit' && (
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
              />
            )}

            {activeTab === 'modes' && (
              <ModesBentoCard
                currentMode={mode}
                onSelectMode={onModeChange}
              />
            )}

            {activeTab === 'crop' && (
              <CropTransformBentoCard
                transform={transform}
                onChange={onTransformChange}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
              />
            )}
          </div>
        ) : (
          /* Minimized Bottom Tool Bar (Safe-Area compliant) */
          <nav className="flex items-center justify-around px-2 py-2 pb-[max(env(safe-area-inset-bottom),16px)]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
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
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-medium transition-all text-[#94a3b8] hover:text-[#7dd3fc] active:scale-95 touch-manipulation"
                >
                  <div className="p-1.5 rounded-xl bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.1)] group-hover:border-[#7dd3fc]/30">
                    <Icon className="w-4 h-4 text-[#7dd3fc]" />
                  </div>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}

            {onOpenMenu && (
              <button
                onClick={onOpenMenu}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-medium transition-all text-[#94a3b8] hover:text-[#7dd3fc] active:scale-95 touch-manipulation"
                title="Studio Menu"
                aria-label="Studio Menu"
              >
                <div className="p-1.5 rounded-xl bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.1)] hover:border-[#7dd3fc]/30">
                  <Menu className="w-4 h-4 text-[#7dd3fc]" />
                </div>
                <span className="truncate">Menu</span>
              </button>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
