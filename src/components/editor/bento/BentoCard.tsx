'use client';

import React, { useState } from 'react';
import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';

export interface BentoCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  cardTheme?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  colSpan?: string;
}

export function BentoCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  children,
  className = '',
  defaultExpanded = true,
  collapsible = false,
  colSpan = '',
}: BentoCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  return (
    <div
      className={`group relative flex flex-col rounded-2xl p-4 sm:p-5 transition-all duration-200 overflow-hidden bg-[#161e27] border border-[#273444] shadow-xl ${colSpan} ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 bg-[#111820] border border-[#273444] text-[#38bdf8]"
          >
            <Icon className="w-4 h-4 stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs text-[#f8fafc] tracking-wide truncate">
                {title}
              </h3>
              {badge && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider font-medium text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/20"
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] text-[#94a3b8] truncate mt-0.5 font-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action and collapse toggles */}
        <div className="flex items-center gap-1.5 shrink-0">
          {action && <div>{action}</div>}
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1 rounded-lg text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#38bdf8]/10 transition-colors"
              title={isExpanded ? 'Collapse card' : 'Expand card'}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      {isExpanded && (
        <div className="space-y-3.5 text-xs text-[#f8fafc] flex-1 flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
}
