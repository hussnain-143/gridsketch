'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  HardDriveDownload,
  FolderDown,
  Image as ImageIcon,
  X,
  Lock,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';

interface PermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGranted: () => void;
  title?: string;
  description?: string;
}

export const STORAGE_PERMISSION_KEY = 'gridsketch_storage_permission_granted';

/**
 * Checks whether storage permission has already been granted
 */
export async function checkStoragePermissionGranted(): Promise<boolean> {
  if (typeof window === 'undefined') return true;

  // Check localStorage cached consent
  const cached = localStorage.getItem(STORAGE_PERMISSION_KEY);
  if (cached === 'true') return true;

  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Filesystem.checkPermissions();
      if (status.publicStorage === 'granted') {
        localStorage.setItem(STORAGE_PERMISSION_KEY, 'true');
        return true;
      }
    } catch (e) {
      console.warn('Error checking Capacitor filesystem permissions:', e);
    }
  }

  return false;
}

export function PermissionDialog({
  isOpen,
  onClose,
  onGranted,
  title = 'Storage & Media Permission',
  description = 'GridSketch needs storage access to save calibrated drawings and high-resolution blueprints directly to your device.',
}: PermissionDialogProps) {
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const res = await Filesystem.requestPermissions();
          console.log('Filesystem permission result:', res);
        } catch (capErr) {
          console.warn('Capacitor requestPermissions error:', capErr);
        }
      }

      // Mark consent as granted locally
      localStorage.setItem(STORAGE_PERMISSION_KEY, 'true');
      setIsRequesting(false);
      onGranted();
      onClose();
    } catch (err) {
      console.error('Permission request failed:', err);
      setIsRequesting(false);
      // Still allow user to proceed
      onGranted();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in no-print">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-dialog-title"
        className="w-full max-w-md rounded-2xl bg-[#0e141d] border border-[#273444] shadow-2xl overflow-hidden flex flex-col animate-scale-up"
      >
        {/* Header Ribbon with Glowing Cyan Blueprint Shield */}
        <div className="relative pt-6 pb-4 px-6 flex flex-col items-center text-center bg-gradient-to-b from-[#16212e] to-[#0e141d] border-b border-[#273444]/60">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#161e27] transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[#38bdf8] flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(56,189,248,0.25)]">
            <ShieldCheck className="w-7 h-7 stroke-[2]" />
          </div>

          <h2
            id="permission-dialog-title"
            className="text-base font-bold text-[#f8fafc] tracking-tight"
          >
            {title}
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1 max-w-xs leading-relaxed">
            {description}
          </p>
        </div>

        {/* Feature Explanations */}
        <div className="p-5 space-y-3 text-xs bg-[#0e141d]">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#161e27]/80 border border-[#273444]">
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] shrink-0 mt-0.5">
              <FolderDown className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-[#f8fafc]">Direct Device Downloads</div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-normal">
                Saves high-resolution PNG, JPG, and multi-tile PDF reference sheets directly to your device Documents & Downloads folder.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#161e27]/80 border border-[#273444]">
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] shrink-0 mt-0.5">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-[#f8fafc]">Photo & Gallery Access</div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-normal">
                Lets you load custom reference photos and portraits directly onto the calibrated drafting grid.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#161e27]/80 border border-[#273444]">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-emerald-400">100% Private & On-Device</div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-normal">
                Your images never leave your phone. All grid calibration and pixel processing is performed locally on your device.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#111820] border-t border-[#273444] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#161e27] transition-all cursor-pointer"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#38bdf8] hover:bg-[#0284c7] text-[#0b0f14] shadow-lg shadow-[#38bdf8]/25 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isRequesting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0b0f14] border-t-transparent animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <HardDriveDownload className="w-4 h-4 stroke-[2.2]" />
                <span>Allow Storage Access</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
