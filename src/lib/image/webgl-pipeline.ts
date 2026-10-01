import * as fx from 'glfx-es6';
import { FilterMode, AdjustmentConfig } from '@/types/editor';

let cachedFXCanvas: fx.GLFXCanvas | null = null;
let webGLFailed = false;

/**
 * Checks whether WebGL is available and functional in the current browser/webview.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  if (webGLFailed) return false;
  try {
    const testCanvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Returns or creates a singleton glfx WebGL canvas.
 */
function getFXCanvas(): fx.GLFXCanvas | null {
  if (typeof window === 'undefined' || webGLFailed) return null;
  if (!cachedFXCanvas) {
    try {
      cachedFXCanvas = fx.canvas();
    } catch (err) {
      console.warn('Could not initialize glfx WebGL canvas, falling back to 2D canvas:', err);
      webGLFailed = true;
      return null;
    }
  }
  return cachedFXCanvas;
}

/**
 * GPU-accelerated WebGL image processing using glfx library.
 * Supports:
 * - Ultra-fast GPU Grayscale & Tone curves
 * - Pen & Ink drawing line work
 * - High-Contrast Chiaroscuro
 * - Real-time GPU Brightness, Contrast, Saturation
 * - GPU Triangle Blur & Unsharp Mask sharpening
 *
 * Returns an HTMLCanvasElement with the rendered output, or null if WebGL is unavailable.
 */
export function processWithWebGL(
  sourceCanvas: HTMLCanvasElement,
  mode: FilterMode,
  adjustments: AdjustmentConfig
): HTMLCanvasElement | null {
  // If charcoal or graphite are selected, let the specialized multi-frequency
  // CPU shader handle the delicate paper tooth and micro-texture grain
  if (mode === 'charcoal' || mode === 'graphite') {
    return null;
  }

  const fxCanvas = getFXCanvas();
  if (!fxCanvas) return null;

  try {
    // Check maximum texture size supported by GPU
    const gl = fxCanvas.getContext('webgl') as WebGLRenderingContext | null;
    if (gl) {
      const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
      if (sourceCanvas.width > maxTexSize || sourceCanvas.height > maxTexSize) {
        return null; // Image exceeds GPU texture dimensions, fallback to 2D
      }
    }

    const texture = fxCanvas.texture(sourceCanvas);
    fxCanvas.draw(texture);

    const {
      brightness = 0,
      contrast = 0,
      saturation = 0,
      sharpness = 0,
      blur = 0,
    } = adjustments;

    // 1. Photographic Brightness & Contrast (glfx range: -1 to 1)
    if (brightness !== 0 || contrast !== 0) {
      const bNorm = Math.max(-1, Math.min(1, brightness / 100));
      const cNorm = Math.max(-1, Math.min(1, contrast / 100));
      fxCanvas.brightnessContrast(bNorm, cNorm);
    }

    // 2. Mode-specific WebGL GPU Shaders
    switch (mode) {
      case 'original': {
        // Full RGB Color
        if (saturation !== 0) {
          const sNorm = Math.max(-1, Math.min(1, saturation / 100));
          fxCanvas.hueSaturation(0, sNorm);
        }
        break;
      }

      case 'grayscale': {
        // High-precision GPU desaturation
        fxCanvas.hueSaturation(0, -1);

        // Gentle tonal lift curve for midtone clarity
        fxCanvas.curves(
          [
            [0, 0],
            [0.25, 0.28],
            [0.75, 0.76],
            [1, 1],
          ],
          [
            [0, 0],
            [0.25, 0.28],
            [0.75, 0.76],
            [1, 1],
          ],
          [
            [0, 0],
            [0.25, 0.28],
            [0.75, 0.76],
            [1, 1],
          ]
        );
        break;
      }

      case 'high_contrast': {
        // Chiaroscuro: GPU desaturation + dramatic S-curve
        fxCanvas.hueSaturation(0, -1);
        fxCanvas.curves(
          [
            [0, 0],
            [0.32, 0.12],
            [0.68, 0.88],
            [1, 1],
          ],
          [
            [0, 0],
            [0.32, 0.12],
            [0.68, 0.88],
            [1, 1],
          ],
          [
            [0, 0],
            [0.32, 0.12],
            [0.68, 0.88],
            [1, 1],
          ]
        );
        break;
      }

      case 'ink': {
        // Pen & Ink contour drawing filter
        const intensity = (adjustments.modeIntensity ?? 100) / 100;
        const inkStrength = Math.max(0.05, Math.min(0.65, 0.35 * intensity));
        fxCanvas.ink(inkStrength);
        fxCanvas.hueSaturation(0, -1);
        break;
      }
    }

    // 3. GPU Triangle Blur (glfx blur radius: 0 to 20)
    if (blur > 0) {
      fxCanvas.triangleBlur(Math.max(1, Math.min(25, Math.round(blur))));
    }

    // 4. GPU Unsharp Mask Sharpening
    if (sharpness > 0) {
      const radius = 2.0;
      const strength = Math.max(0.1, Math.min(3.0, (sharpness / 100) * 2.2));
      fxCanvas.unsharpMask(radius, strength);
    }

    // Commit shader pipeline to canvas
    fxCanvas.update();

    // Copy to a standard 2D canvas output
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = fxCanvas.width;
    outputCanvas.height = fxCanvas.height;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) {
      texture.destroy();
      return null;
    }

    ctx.drawImage(fxCanvas, 0, 0);
    texture.destroy();

    return outputCanvas;
  } catch (err) {
    console.warn('WebGL filter processing failed, falling back to 2D CPU pipeline:', err);
    return null;
  }
}
