'use client';

import React from 'react';
import { AspectRatioPreset, TransformConfig } from '@/types/editor';
import { BentoCard } from './BentoCard';
import {
  Crop as CropIcon,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Tv,
  Ratio,
} from 'lucide-react';

interface CropTransformBentoCardProps {
  transform: TransformConfig;
  imageWidth: number;
  imageHeight: number;
  onChange: (updates: Partial<TransformConfig>) => void;
  colSpan?: string;
}

const ASPECT_RATIOS: { id: AspectRatioPreset; label: string; icon: any; ratio?: number }[] = [
  { id: 'original', label: 'Original', icon: ImageIcon },
  { id: '1:1', label: '1:1 Square', icon: Square, ratio: 1 },
  { id: '4:3', label: '4:3 Classic', icon: RectangleHorizontal, ratio: 4 / 3 },
  { id: '3:4', label: '3:4 Portrait', icon: RectangleVertical, ratio: 3 / 4 },
  { id: '16:9', label: '16:9 Cinema', icon: Tv, ratio: 16 / 9 },
  { id: '3:2', label: '3:2 Canvas', icon: Ratio, ratio: 3 / 2 },
];

export function CropTransformBentoCard({
  transform,
  imageWidth,
  imageHeight,
  onChange,
  colSpan = '',
}: CropTransformBentoCardProps) {
  const handleRotateCW = () => {
    const next = ((transform.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    onChange({ rotation: next });
  };

  const handleRotateCCW = () => {
    const next = ((transform.rotation + 270) % 360) as 0 | 90 | 180 | 270;
    onChange({ rotation: next });
  };

  const handleSelectAspectRatio = (preset: AspectRatioPreset) => {
    if (preset === 'original') {
      onChange({ aspectRatio: 'original', crop: null });
      return;
    }

    const item = ASPECT_RATIOS.find((a) => a.id === preset);
    if (!item || !item.ratio) return;

    const targetRatio = item.ratio;
    const currentRatio = imageWidth / Math.max(1, imageHeight);

    let cropW = 1.0;
    let cropH = 1.0;
    let cropX = 0;
    let cropY = 0;

    if (currentRatio > targetRatio) {
      cropW = targetRatio / currentRatio;
      cropX = (1 - cropW) / 2;
    } else {
      cropH = currentRatio / targetRatio;
      cropY = (1 - cropH) / 2;
    }

    onChange({
      aspectRatio: preset,
      crop: {
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH,
      },
    });
  };

  return (
    <BentoCard
      title="Crop & Transform"
      icon={CropIcon}
      badge={transform.aspectRatio}
      colSpan={colSpan}
    >
      {/* 4 Geometric Operations (Icons Only) */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={handleRotateCW}
          className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.12)] hover:border-[#7dd3fc]/40 flex items-center justify-center transition-all text-[#7dd3fc]"
          title="Rotate 90° Clockwise"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleRotateCCW}
          className="p-3 rounded-xl bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/15 border border-[rgba(125,211,252,0.12)] hover:border-[#7dd3fc]/40 flex items-center justify-center transition-all text-[#7dd3fc]"
          title="Rotate 90° Counter-Clockwise"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onChange({ flipH: !transform.flipH })}
          className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
            transform.flipH
              ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold border-[#7dd3fc] shadow-[0_0_15px_rgba(125,211,252,0.3)]'
              : 'bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/15 border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
          }`}
          title="Flip Horizontal"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onChange({ flipV: !transform.flipV })}
          className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
            transform.flipV
              ? 'bg-[#7dd3fc] text-[#0a0e1a] font-bold border-[#7dd3fc] shadow-[0_0_15px_rgba(125,211,252,0.3)]'
              : 'bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/15 border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
          }`}
          title="Flip Vertical"
        >
          <FlipVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Aspect Ratio Selector (Icons Only) */}
      <div>
        <div className="flex items-center mb-1.5 text-[#7dd3fc]" title="Aspect Ratio Preset Lock">
          <Square className="w-3.5 h-3.5" />
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {ASPECT_RATIOS.map((item) => {
            const active = transform.aspectRatio === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectAspectRatio(item.id)}
                title={item.label}
                className={`py-2 px-1 rounded-xl border flex items-center justify-center transition-all ${
                  active
                    ? 'bg-[#7dd3fc] text-[#0a0e1a] font-semibold border-[#7dd3fc] shadow-[0_0_15px_rgba(125,211,252,0.25)]'
                    : 'bg-[rgba(10,14,26,0.6)] hover:bg-[#7dd3fc]/10 border-[rgba(125,211,252,0.12)] text-[#94a3b8] hover:text-[#f0f6fc]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
    </BentoCard>
  );
}
