'use client';

import React from 'react';
import { AspectRatioPreset, TransformConfig } from '@/types/editor';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop as CropIcon,
  Check,
  X,
} from 'lucide-react';

interface CropTransformPanelProps {
  transform: TransformConfig;
  imageWidth: number;
  imageHeight: number;
  onChange: (updates: Partial<TransformConfig>) => void;
}

const ASPECT_RATIOS: { id: AspectRatioPreset; label: string; ratio?: number }[] = [
  { id: 'original', label: 'Original' },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '4:3', label: '4:3 Classic', ratio: 4 / 3 },
  { id: '3:4', label: '3:4 Portrait', ratio: 3 / 4 },
  { id: '16:9', label: '16:9 Cinema', ratio: 16 / 9 },
  { id: '9:16', label: '9:16 Story', ratio: 9 / 16 },
  { id: '3:2', label: '3:2 Canvas', ratio: 3 / 2 },
  { id: '2:3', label: '2:3 Canvas', ratio: 2 / 3 },
];

export function CropTransformPanel({
  transform,
  imageWidth,
  imageHeight,
  onChange,
}: CropTransformPanelProps) {
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
      // Image is wider than target: trim horizontal sides
      cropW = targetRatio / currentRatio;
      cropX = (1 - cropW) / 2;
    } else {
      // Image is taller than target: trim vertical sides
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

  const handleResetCrop = () => {
    onChange({ crop: null, aspectRatio: 'original' });
  };

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      {/* Geometric Rotations & Flips */}
      <div>
        <label className="font-semibold text-slate-300 uppercase text-[11px] tracking-wider mb-2.5 block">
          Orientation & Mirroring
        </label>
        <div className="grid grid-cols-4 gap-2">
          {/* Rotate CW */}
          <button
            onClick={handleRotateCW}
            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#141721] hover:bg-[#1b202e] border border-[#232838] hover:border-slate-600 transition-colors"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-slate-300">+90°</span>
          </button>

          {/* Rotate CCW */}
          <button
            onClick={handleRotateCCW}
            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#141721] hover:bg-[#1b202e] border border-[#232838] hover:border-slate-600 transition-colors"
            title="Rotate 90° Counter-Clockwise"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-slate-300">-90°</span>
          </button>

          {/* Flip Horizontal */}
          <button
            onClick={() => onChange({ flipH: !transform.flipH })}
            className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-colors ${
              transform.flipH
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                : 'bg-[#141721] hover:bg-[#1b202e] border-[#232838] text-slate-300'
            }`}
            title="Flip Horizontal (Mirror)"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span className="text-[10px]">Flip H</span>
          </button>

          {/* Flip Vertical */}
          <button
            onClick={() => onChange({ flipV: !transform.flipV })}
            className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-colors ${
              transform.flipV
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                : 'bg-[#141721] hover:bg-[#1b202e] border-[#232838] text-slate-300'
            }`}
            title="Flip Vertical"
          >
            <FlipVertical className="w-4 h-4" />
            <span className="text-[10px]">Flip V</span>
          </button>
        </div>
      </div>

      {/* Aspect Ratio Presets */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="font-semibold text-slate-300 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <CropIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Canvas Aspect Ratio</span>
          </label>
          {transform.crop && (
            <button
              onClick={handleResetCrop}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-medium"
            >
              Reset Crop
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ASPECT_RATIOS.map((item) => {
            const active = transform.aspectRatio === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectAspectRatio(item.id)}
                className={`py-2 px-3 rounded-lg text-left border flex items-center justify-between transition-all ${
                  active
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-md shadow-amber-500/20'
                    : 'bg-[#141721] hover:bg-[#1b202e] border-[#232838] text-slate-300'
                }`}
              >
                <span>{item.label}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Crop Status Card */}
      {transform.crop ? (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
          <span>Active Crop: {transform.aspectRatio}</span>
          <button
            onClick={handleResetCrop}
            className="p-1 hover:bg-amber-500/20 rounded text-amber-400 transition-colors"
            title="Clear crop"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Select an aspect ratio matching your physical canvas or sketchpad (e.g. 1:1, 4:3, or 3:4).
        </p>
      )}
    </div>
  );
}
