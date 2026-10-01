'use client';

import React from 'react';
import { FilterMode, AdjustmentConfig, DEFAULT_ADJUSTMENTS } from '@/types/editor';
import { BentoCard } from './BentoCard';
import { RangeSlider } from '@/components/editor/common/RangeSlider';
import {
  Image as ImageIcon,
  SunMoon,
  Contrast,
  Sparkles,
  Feather,
  SlidersHorizontal,
  RotateCcw,
  Sun,
  Moon,
  Activity,
  Layers,
  Palette,
  PenTool,
} from 'lucide-react';

export interface ModesBentoCardProps {
  currentMode: FilterMode;
  onSelectMode: (mode: FilterMode) => void;
  adjustments?: AdjustmentConfig;
  onAdjustmentsChange?: (patch: Partial<AdjustmentConfig>) => void;
  colSpan?: string;
}

const MODES = [
  {
    id: 'original' as FilterMode,
    title: 'Color',
    badge: 'Full RGB',
    desc: 'Unfiltered chromatic reference',
    icon: ImageIcon,
  },
  {
    id: 'grayscale' as FilterMode,
    title: 'Grayscale',
    badge: 'Luminance',
    desc: 'Calibrated continuous tonal values',
    icon: SunMoon,
  },
  {
    id: 'charcoal' as FilterMode,
    title: 'Master Charcoal',
    badge: 'Deep Tonal',
    desc: 'Velvety shadows, brilliant lights & rich textures',
    icon: Sparkles,
  },
  {
    id: 'graphite' as FilterMode,
    title: 'Fine Graphite',
    badge: 'Pencil Sketch',
    desc: 'Silvery pencil midtones, fine shading & delicate detail',
    icon: Feather,
  },
  {
    id: 'ink' as FilterMode,
    title: 'Pen & Ink',
    badge: 'GPU Ink',
    desc: 'Contour line drawing & high-contrast ink sketch (WebGL)',
    icon: PenTool,
  },
  {
    id: 'high_contrast' as FilterMode,
    title: 'Chiaroscuro',
    badge: 'Contrast',
    desc: 'Punchy shadows for dramatic volumetric planes',
    icon: Contrast,
  },
];

export function ModesBentoCard({
  currentMode,
  onSelectMode,
  adjustments = DEFAULT_ADJUSTMENTS,
  onAdjustmentsChange,
  colSpan = '',
}: ModesBentoCardProps) {
  const activeModeInfo = MODES.find((m) => m.id === currentMode) || MODES[1];

  const isModified =
    (adjustments.modeIntensity !== undefined && adjustments.modeIntensity !== 100) ||
    (adjustments.textureDetail !== undefined && adjustments.textureDetail !== 75) ||
    adjustments.shadows !== 0 ||
    adjustments.highlights !== 0 ||
    adjustments.contrast !== 0 ||
    adjustments.exposure !== 0 ||
    adjustments.brightness !== 0 ||
    adjustments.saturation !== 0 ||
    adjustments.sharpness !== 0;

  const handleResetValues = () => {
    onAdjustmentsChange?.({
      modeIntensity: 100,
      textureDetail: 75,
      shadows: 0,
      highlights: 0,
      contrast: 0,
      exposure: 0,
      brightness: 0,
      saturation: 0,
      sharpness: 0,
    });
  };

  return (
    <BentoCard
      title="Tonal Value Structure"
      icon={SunMoon}
      badge={activeModeInfo.badge}
      colSpan={colSpan}
    >
      <div className="space-y-3 py-1">
        {/* Grid of Tonal Modes */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {MODES.map((item) => {
            const active = currentMode === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMode(item.id)}
                title={`${item.title} (${item.badge}): ${item.desc}`}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
                  active
                    ? 'bg-[#7dd3fc] text-[#0a0e1a] border-[#7dd3fc] shadow-[0_0_15px_rgba(125,211,252,0.35)] scale-[1.03]'
                    : 'bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/15 border-[rgba(125,211,252,0.12)] text-[#7dd3fc]/70 hover:text-[#f0f6fc]'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Mode Descriptor Pill */}
        <div className="px-3 py-1.5 rounded-lg bg-[rgba(15,21,36,0.6)] border border-[rgba(125,211,252,0.1)] flex items-center justify-between text-[11px]">
          <span className="text-[#bae6fd] font-medium truncate">
            {activeModeInfo.desc}
          </span>
          <span className="text-[10px] font-mono text-[#7dd3fc] uppercase font-bold shrink-0 ml-2">
            {activeModeInfo.badge}
          </span>
        </div>

        {/* Dynamic Mode Value Range Sliders */}
        {onAdjustmentsChange && (
          <div className="pt-2 border-t border-[rgba(125,211,252,0.12)] space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-semibold text-[#f0f9ff]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#7dd3fc]" />
                <span>Fine-Tune Values & Textures</span>
              </span>
              {isModified && (
                <button
                  type="button"
                  onClick={handleResetValues}
                  className="flex items-center gap-1 text-[10px] text-[#7dd3fc] hover:text-[#38bdf8] font-mono transition-colors"
                  title="Reset mode values to defaults"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Charcoal Sliders */}
            {currentMode === 'charcoal' && (
              <div className="space-y-2">
                <RangeSlider
                  label="Tone Intensity"
                  value={adjustments.modeIntensity ?? 100}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  icon={Sparkles}
                  leftLabel="Subtle"
                  rightLabel="Deep Velvet"
                  onChange={(val) => onAdjustmentsChange({ modeIntensity: val })}
                />
                <RangeSlider
                  label="Skin & Cloth Texture"
                  value={adjustments.textureDetail ?? 75}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  icon={Activity}
                  leftLabel="Soft"
                  rightLabel="Hyper Detail"
                  onChange={(val) => onAdjustmentsChange({ textureDetail: val })}
                />
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <RangeSlider
                    label="Highlights"
                    value={adjustments.highlights ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Sun}
                    onChange={(val) => onAdjustmentsChange({ highlights: val })}
                  />
                  <RangeSlider
                    label="Shadows"
                    value={adjustments.shadows ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Moon}
                    onChange={(val) => onAdjustmentsChange({ shadows: val })}
                  />
                </div>
              </div>
            )}

            {/* Graphite Sliders */}
            {currentMode === 'graphite' && (
              <div className="space-y-2">
                <RangeSlider
                  label="Pencil Intensity"
                  value={adjustments.modeIntensity ?? 100}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  icon={Feather}
                  leftLabel="Light (2H)"
                  rightLabel="Dark (6B)"
                  onChange={(val) => onAdjustmentsChange({ modeIntensity: val })}
                />
                <RangeSlider
                  label="Shading Detail & Tooth"
                  value={adjustments.textureDetail ?? 75}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  icon={Layers}
                  leftLabel="Smooth"
                  rightLabel="Crosshatch"
                  onChange={(val) => onAdjustmentsChange({ textureDetail: val })}
                />
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <RangeSlider
                    label="Paper Highlights"
                    value={adjustments.highlights ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Sun}
                    onChange={(val) => onAdjustmentsChange({ highlights: val })}
                  />
                  <RangeSlider
                    label="Shadow Depth"
                    value={adjustments.shadows ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Moon}
                    onChange={(val) => onAdjustmentsChange({ shadows: val })}
                  />
                </div>
              </div>
            )}

            {/* Grayscale Sliders */}
            {currentMode === 'grayscale' && (
              <div className="space-y-2">
                <RangeSlider
                  label="Tonal Contrast"
                  value={adjustments.contrast ?? 0}
                  min={-100}
                  max={100}
                  step={1}
                  icon={Contrast}
                  leftLabel="Flat"
                  rightLabel="Dynamic"
                  onChange={(val) => onAdjustmentsChange({ contrast: val })}
                />
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <RangeSlider
                    label="Lights / Highlights"
                    value={adjustments.highlights ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Sun}
                    onChange={(val) => onAdjustmentsChange({ highlights: val })}
                  />
                  <RangeSlider
                    label="Darks / Shadows"
                    value={adjustments.shadows ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Moon}
                    onChange={(val) => onAdjustmentsChange({ shadows: val })}
                  />
                </div>
              </div>
            )}

            {/* Chiaroscuro High Contrast Sliders */}
            {currentMode === 'high_contrast' && (
              <div className="space-y-2">
                <RangeSlider
                  label="Dramatic Contrast"
                  value={adjustments.contrast ?? 0}
                  min={-100}
                  max={100}
                  step={1}
                  icon={Contrast}
                  leftLabel="Soft"
                  rightLabel="Harsh"
                  onChange={(val) => onAdjustmentsChange({ contrast: val })}
                />
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <RangeSlider
                    label="Shadow Plunge"
                    value={adjustments.shadows ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Moon}
                    onChange={(val) => onAdjustmentsChange({ shadows: val })}
                  />
                  <RangeSlider
                    label="Specular Lights"
                    value={adjustments.highlights ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Sun}
                    onChange={(val) => onAdjustmentsChange({ highlights: val })}
                  />
                </div>
              </div>
            )}

            {/* Original Color Sliders */}
            {currentMode === 'original' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <RangeSlider
                    label="Contrast"
                    value={adjustments.contrast ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Contrast}
                    onChange={(val) => onAdjustmentsChange({ contrast: val })}
                  />
                  <RangeSlider
                    label="Saturation"
                    value={adjustments.saturation ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Palette}
                    onChange={(val) => onAdjustmentsChange({ saturation: val })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <RangeSlider
                    label="Highlights"
                    value={adjustments.highlights ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Sun}
                    onChange={(val) => onAdjustmentsChange({ highlights: val })}
                  />
                  <RangeSlider
                    label="Shadows"
                    value={adjustments.shadows ?? 0}
                    min={-100}
                    max={100}
                    step={1}
                    icon={Moon}
                    onChange={(val) => onAdjustmentsChange({ shadows: val })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
