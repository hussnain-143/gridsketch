'use client';

import React from 'react';
import { FilterMode } from '@/types/editor';
import { BentoCard } from './BentoCard';
import { Image as ImageIcon, SunMoon, Contrast, Layers, Sparkles } from 'lucide-react';

interface ModesBentoCardProps {
  currentMode: FilterMode;
  onSelectMode: (mode: FilterMode) => void;
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
    id: 'value_study' as FilterMode,
    title: '5-Values',
    badge: 'Academic',
    desc: '5-step Munsell plane shading zones',
    icon: Layers,
  },
  {
    id: 'high_contrast' as FilterMode,
    title: 'Chiaroscuro',
    badge: 'Contrast',
    desc: 'Punchy shadows for dramatic volume',
    icon: Contrast,
  },
  {
    id: 'notan' as FilterMode,
    title: 'Notan',
    badge: '2-Tones',
    desc: 'Pure graphic light vs shadow masses',
    icon: Sparkles,
  },
];

export function ModesBentoCard({
  currentMode,
  onSelectMode,
  colSpan = '',
}: ModesBentoCardProps) {
  const activeModeInfo = MODES.find((m) => m.id === currentMode) || MODES[1];

  return (
    <BentoCard
      title="Tonal Value Structure"
      icon={SunMoon}
      badge={activeModeInfo.badge}
      colSpan={colSpan}
    >
      <div className="space-y-2.5 py-1">
        {/* Grid of Tonal Modes */}
        <div className="grid grid-cols-5 gap-1.5">
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
      </div>
    </BentoCard>
  );
}
