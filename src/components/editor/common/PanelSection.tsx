'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PanelSectionProps {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const PanelSection = React.memo(function PanelSection({
  title,
  icon: Icon,
  action,
  description,
  children,
  className = '',
}: PanelSectionProps) {
  return (
    <div
      className={`p-3.5 rounded-xl bg-[rgba(15,21,36,0.6)] backdrop-blur-xl border border-[rgba(125,211,252,0.12)] space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.37)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#f0f9ff] uppercase text-[10px] tracking-wider flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#7dd3fc] shrink-0" />}
          <span>{title}</span>
        </span>
        {action && <div>{action}</div>}
      </div>

      {description && (
        <p className="text-[10px] text-slate-400 leading-relaxed">{description}</p>
      )}

      {children}
    </div>
  );
});
