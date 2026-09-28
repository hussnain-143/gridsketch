'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  icon?: LucideIcon;
  formatValue?: (val: number) => string;
  onChange: (val: number) => void;
  onCommit?: () => void;
  disabled?: boolean;
  leftLabel?: string;
  centerLabel?: string;
  rightLabel?: string;
  className?: string;
  iconOnly?: boolean;
}

export const RangeSlider = React.memo(function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  icon: Icon,
  formatValue,
  onChange,
  onCommit,
  disabled = false,
  leftLabel,
  centerLabel,
  rightLabel,
  className = '',
  iconOnly = false,
}: RangeSliderProps) {
  const displayVal = formatValue
    ? formatValue(value)
    : `${value}${unit ? ` ${unit}` : ''}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-[11px] text-[#bae6fd]/70">
        <span
          className="flex items-center gap-1.5 font-medium text-[#7dd3fc]"
          title={label}
        >
          {Icon && <Icon className="w-3.5 h-3.5 text-[#7dd3fc] shrink-0 stroke-[2]" />}
          {!iconOnly && <span className="text-[#e0f2fe]">{label}</span>}
        </span>
        <span className="font-mono text-[#f0f9ff] font-semibold text-xs">{displayVal}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        onKeyUp={onCommit}
        className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {(leftLabel || centerLabel || rightLabel) && (
        <div className="flex justify-between text-[9px] text-[#7dd3fc]/50 font-mono select-none px-0.5">
          <span>{leftLabel || ''}</span>
          <span>{centerLabel || ''}</span>
          <span>{rightLabel || ''}</span>
        </div>
      )}
    </div>
  );
});
