'use client';

import React from 'react';
import { FilterMode } from '@/types/editor';
import {
  Image as ImageIcon,
  SunMoon,
  Contrast,
  Check,
} from 'lucide-react';

interface ModesPanelProps {
  currentMode: FilterMode;
  onSelectMode: (mode: FilterMode) => void;
}

interface ModeCard {
  id: FilterMode;
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

const MODES: ModeCard[] = [
  {
    id: 'original',
    title: 'Original Photo',
    badge: 'Color',
    description: 'Natural reference with full color palette and original values.',
    icon: ImageIcon,
  },
  {
    id: 'grayscale',
    title: 'Grayscale Reference',
    badge: 'Tonal Value',
    description: 'Pure luminance values for analyzing shadow and light masses.',
    icon: SunMoon,
  },
  {
    id: 'high_contrast',
    title: 'High Contrast',
    badge: 'Chiaroscuro',
    description: 'Boosted dynamic range emphasizing dramatic lighting and form shadows.',
    icon: Contrast,
  },
];

export function ModesPanel({
  currentMode,
  onSelectMode,
}: ModesPanelProps) {
  return (
    <div className="space-y-4 text-slate-200 text-xs">
      <div>
        <h3 className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider mb-1">
          Drawing Reference Modes
        </h3>
        <p className="text-[11px] text-slate-400">
          Switch between natural color and high-clarity monochrome drawing modes.
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="space-y-2">
        {MODES.map((mode) => {
          const active = currentMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                active
                  ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/10'
                  : 'bg-[#141721] hover:bg-[#191d2a] border-[#232838]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-[#1b202e] text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold text-xs ${
                        active ? 'text-amber-400 font-bold' : 'text-slate-200'
                      }`}
                    >
                      {mode.title}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2330] text-slate-400 font-medium">
                      {mode.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {mode.description}
                  </p>
                </div>

                {active && (
                  <Check className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
