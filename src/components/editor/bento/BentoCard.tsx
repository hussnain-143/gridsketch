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
      className={`group relative flex flex-col rounded-2xl p-4 sm:p-5 transition-all duration-200 overflow-hidden ${colSpan} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(15, 21, 36, 0.65) 35%, rgba(10, 14, 26, 0.75) 100%)',
        backdropFilter: 'blur(24px) saturate(190%)',
        WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        border: '1px solid rgba(125, 211, 252, 0.16)',
        borderTop: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 16px 40px 0 rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), inset 0 0 24px 0 rgba(125, 211, 252, 0.04)',
      }}
    >
      {/* Specular top edge luminous reflection */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#7dd3fc]/50 via-white/40 to-transparent pointer-events-none" />

      {/* Subtle corner light refraction glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-radial from-[#7dd3fc]/15 to-transparent blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{
              background: 'rgba(125, 211, 252, 0.08)',
              border: '1px solid rgba(125, 211, 252, 0.2)',
              color: '#7dd3fc',
            }}
          >
            <Icon className="w-4 h-4 stroke-[1.9]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs text-[#f0f6fc] tracking-wide truncate">
                {title}
              </h3>
              {badge && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider font-medium"
                  style={{
                    color: '#7dd3fc',
                    background: 'rgba(125, 211, 252, 0.08)',
                    border: '1px solid rgba(125, 211, 252, 0.18)',
                  }}
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
              className="p-1 rounded-lg text-[#94a3b8] hover:text-[#7dd3fc] hover:bg-[#7dd3fc]/10 transition-colors"
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
        <div className="space-y-3.5 text-xs text-[#f0f6fc] flex-1 flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
}
