'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  cols?: number;
  size?: 'sm' | 'md';
  iconsOnly?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  cols,
  size = 'md',
  iconsOnly = false,
  className = '',
}: SegmentedControlProps<T>) {
  const colCount = cols || (options.length === 2 ? 2 : options.length === 4 ? 4 : 3);
  const colClassMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };
  const gridColClass = colClassMap[colCount] || 'grid-cols-3';

  const padClass = size === 'sm' ? 'py-1.5 px-2 text-[11px]' : 'py-2 px-2.5 text-xs';

  return (
    <div
      className={`grid ${gridColClass} gap-1.5 p-1 rounded-xl bg-[rgba(10,16,32,0.6)] backdrop-blur-md border border-[rgba(125,211,252,0.12)] ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        const showIconOnly = iconsOnly && !!Icon;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={`${padClass} rounded-lg font-medium border flex items-center justify-center gap-1.5 transition-all duration-150 ${
              active
                ? 'bg-[#7dd3fc] text-[#060e1e] border-[#7dd3fc] font-bold shadow-[0_0_18px_rgba(125,211,252,0.35)] scale-[1.01]'
                : 'bg-[rgba(125,211,252,0.04)] hover:bg-[rgba(125,211,252,0.12)] border-[rgba(125,211,252,0.08)] text-[#bae6fd]/80 hover:text-[#f0f9ff]'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            {!showIconOnly && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
