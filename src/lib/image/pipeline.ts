import {
  AdjustmentConfig,
  FilterMode,
  TransformConfig,
} from '@/types/editor';

/**
 * Applies geometric transformation (rotation, flips, crop) to source image
 * and returns an off-screen HTMLCanvasElement containing the transformed pixels.
 */
export function applyTransforms(
  image: HTMLImageElement,
  transform: TransformConfig
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2d context');

  const { rotation, flipH, flipV, crop } = transform;
  const isRotated90or270 = rotation === 90 || rotation === 270;

  // Set initial dimensions based on rotation
  const baseWidth = isRotated90or270 ? image.naturalHeight : image.naturalWidth;
  const baseHeight = isRotated90or270 ? image.naturalWidth : image.naturalHeight;

  // Create temporary canvas for full transformed image
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = Math.max(1, baseWidth);
  fullCanvas.height = Math.max(1, baseHeight);
  const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true });
  if (!fullCtx) throw new Error('Could not get full 2d context');

  // Center coordinate system for transforms
  fullCtx.save();
  fullCtx.translate(baseWidth / 2, baseHeight / 2);

  if (rotation !== 0) {
    fullCtx.rotate((rotation * Math.PI) / 180);
  }

  const scaleX = flipH ? -1 : 1;
  const scaleY = flipV ? -1 : 1;
  fullCtx.scale(scaleX, scaleY);

  // Draw original image centered
  fullCtx.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2
  );
  fullCtx.restore();

  // If crop is active, carve out cropped region
  if (crop && crop.width > 0 && crop.height > 0) {
    const cropX = Math.round(crop.x * baseWidth);
    const cropY = Math.round(crop.y * baseHeight);
    const cropW = Math.max(1, Math.round(crop.width * baseWidth));
    const cropH = Math.max(1, Math.round(crop.height * baseHeight));

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.drawImage(
      fullCanvas,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );
  } else {
    canvas.width = baseWidth;
    canvas.height = baseHeight;
    ctx.drawImage(fullCanvas, 0, 0);
  }

  return canvas;
}

/**
 * Fast separable 1D box blur
 */
function applyFastBoxBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): void {
  if (radius <= 0) return;
  const len = data.length;
  const copy = new Uint8ClampedArray(data);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let k = -radius; k <= radius; k++) {
        const nx = x + k;
        if (nx >= 0 && nx < width) {
          const idx = rowOffset + nx * 4;
          r += copy[idx];
          g += copy[idx + 1];
          b += copy[idx + 2];
          count++;
        }
      }
      const outIdx = rowOffset + x * 4;
      data[outIdx] = r / count;
      data[outIdx + 1] = g / count;
      data[outIdx + 2] = b / count;
    }
  }

  copy.set(data);

  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let k = -radius; k <= radius; k++) {
        const ny = y + k;
        if (ny >= 0 && ny < height) {
          const idx = (ny * width + x) * 4;
          r += copy[idx];
          g += copy[idx + 1];
          b += copy[idx + 2];
          count++;
        }
      }
      const outIdx = (y * width + x) * 4;
      data[outIdx] = r / count;
      data[outIdx + 1] = g / count;
      data[outIdx + 2] = b / count;
    }
  }
}

/**
 * Fast 3x3 unsharp mask sharpening
 */
function applySharpen(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number
): void {
  if (amount <= 0) return;
  const strength = (amount / 100) * 1.5;
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    const prevRow = (y - 1) * width * 4;
    const currRow = y * width * 4;
    const nextRow = (y + 1) * width * 4;

    for (let x = 1; x < width - 1; x++) {
      const idx = currRow + x * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const up = copy[prevRow + x * 4 + c];
        const down = copy[nextRow + x * 4 + c];
        const left = copy[currRow + (x - 1) * 4 + c];
        const right = copy[currRow + (x + 1) * 4 + c];

        const laplacian = 4 * center - (up + down + left + right);
        const val = center + strength * laplacian;
        data[idx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }
}


/**
 * Main pure image processing pipeline:
 * Takes transformed canvas and applies adjustments and active filter mode.
 */
export function processImageCanvas(
  sourceCanvas: HTMLCanvasElement,
  mode: FilterMode,
  adjustments: AdjustmentConfig
): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get output canvas 2d context');

  // Draw base transformed image
  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Photographic Adjustments Look-Up Precomputations
  const {
    brightness,
    contrast,
    exposure,
    shadows,
    highlights,
    saturation,
    sharpness,
    blur,
    threshold,
    posterizeLevels,
  } = adjustments;

  // Pre-calculate adjustment factors
  const brightnessOffset = (brightness / 100) * 255;
  const contrastFactor =
    contrast >= 0
      ? (259 * (contrast + 255)) / (255 * (259 - contrast))
      : (contrast + 100) / 100;
  const exposureMult = Math.pow(2, exposure / 50);
  const satFactor = (saturation + 100) / 100;

  const hasAdjustments =
    exposure !== 0 ||
    brightness !== 0 ||
    contrast !== 0 ||
    shadows !== 0 ||
    highlights !== 0 ||
    saturation !== 0;

  // Apply pixel-wise photographic adjustments only when values are modified
  if (hasAdjustments) {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Exposure
      if (exposure !== 0) {
        r *= exposureMult;
        g *= exposureMult;
        b *= exposureMult;
      }

      // Brightness
      if (brightness !== 0) {
        r += brightnessOffset;
        g += brightnessOffset;
        b += brightnessOffset;
      }

      // Contrast
      if (contrast !== 0) {
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
      }

      // Shadows & Highlights shaping
      if (shadows !== 0 || highlights !== 0) {
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        if (lum < 0.5 && shadows !== 0) {
          const shadowCurve = (1 - lum * 2) * (shadows / 100) * 80;
          r += shadowCurve;
          g += shadowCurve;
          b += shadowCurve;
        } else if (lum >= 0.5 && highlights !== 0) {
          const highlightCurve = ((lum - 0.5) * 2) * (highlights / 100) * 80;
          r += highlightCurve;
          g += highlightCurve;
          b += highlightCurve;
        }
      }

      // Saturation
      if (saturation !== 0 && mode === 'original') {
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = gray + satFactor * (r - gray);
        g = gray + satFactor * (g - gray);
        b = gray + satFactor * (b - gray);
      }

      // Clamp
      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
  }

  // 2. Convolution: Blur / Sharpen
  if (blur > 0) {
    applyFastBoxBlur(data, width, height, Math.round(blur));
  }
  if (sharpness > 0) {
    applySharpen(data, width, height, sharpness);
  }

  // 3. Modes
  switch (mode) {
    case 'original':
      break;

    case 'grayscale': {
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      break;
    }

    case 'high_contrast': {
      // S-curve contrast enhancement using fast precomputed 256-byte LUT
      const lut = new Uint8Array(256);
      for (let v = 0; v < 256; v++) {
        const norm = v / 255;
        lut[v] = Math.min(255, Math.max(0, Math.round(norm * norm * (3 - 2 * norm) * 255)));
      }

      for (let i = 0; i < data.length; i += 4) {
        const gray =
          (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) | 0;
        const finalVal = lut[gray];
        data[i] = finalVal;
        data[i + 1] = finalVal;
        data[i + 2] = finalVal;
      }
      break;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}
