'use client';

import React from 'react';
import { FilterMode } from '@/types/editor';
import { BentoCard } from './BentoCard';
import { Image as ImageIcon, SunMoon, Contrast, Check } from 'lucide-react';

interface ModesBentoCardProps {
  currentMode: FilterMode;
  onSelectMode: (mode: FilterMode) => void;
  colSpan?: string;
}

const MODES = [
  {
    id: 'original' as FilterMode,
    title: 'Original Photo',
    badge: 'Full Color',
    desc: 'Unfiltered chromatic reference',
    icon: ImageIcon,
  },
  {
    id: 'grayscale' as FilterMode,
    title: 'Grayscale Reference',
    badge: 'Luminance',
    desc: 'Pure values for shadow & form masses',
    icon: SunMoon,
  },
  {
    id: 'high_contrast' as FilterMode,
    title: 'High Contrast',
    badge: 'Chiaroscuro',
    desc: 'Boosted dynamic range for dramatic shadows',
    icon: Contrast,
  },
];

export function ModesBentoCard({
  currentMode,
  onSelectMode,
  colSpan = '',
}: ModesBentoCardProps) {
  return (
    <BentoCard
      title="Tonal Modes"
      icon={SunMoon}
      badge={currentMode}
      colSpan={colSpan}
    >
      {/* 3 Pure Icon Mode Cards */}
      <div className="grid grid-cols-3 gap-2 py-1">
        {MODES.map((item) => {
          const active = currentMode === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMode(item.id)}
              title={`${item.title} (${item.badge}): ${item.desc}`}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 ${
                active
                  ? 'bg-[#7dd3fc] text-[#0a0e1a] border-[#7dd3fc] shadow-[0_0_20px_rgba(125,211,252,0.35)] scale-[1.03]'
                  : 'bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/15 border-[rgba(125,211,252,0.12)] text-[#7dd3fc]/70 hover:text-[#f0f6fc]'
              }`}
            >
              <Icon className="w-6 h-6 stroke-[2]" />
            </button>
          );
        })}
      </div>
    </BentoCard>
  );
}
