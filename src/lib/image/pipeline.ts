import {
  AdjustmentConfig,
  FilterMode,
  TransformConfig,
} from '@/types/editor';
import { processWithWebGL } from './webgl-pipeline';

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
 * Fast local luminance blur using separable 1D passes
 */
function computeLuminanceBlur(
  lum: Float32Array,
  width: number,
  height: number,
  radius: number
): Float32Array {
  const pixelCount = width * height;
  const out = new Float32Array(pixelCount);
  const temp = new Float32Array(pixelCount);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let k = -radius; k <= radius; k++) {
        const nx = x + k;
        if (nx >= 0 && nx < width) {
          sum += lum[rowOffset + nx];
          count++;
        }
      }
      temp[rowOffset + x] = sum / count;
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let count = 0;
      for (let k = -radius; k <= radius; k++) {
        const ny = y + k;
        if (ny >= 0 && ny < height) {
          sum += temp[ny * width + x];
          count++;
        }
      }
      out[y * width + x] = sum / count;
    }
  }

  return out;
}

/**
 * Fine Art Charcoal Drawing Filter:
 * Recreates the dramatic sculptural lighting and rich textural depth of master charcoal drawings:
 * - Deep, velvety blacks in shadows
 * - Luminous, brilliant highlights on facial planes and specular points (sweat drops, earrings, nose bridge)
 * - Enhanced high-frequency micro-textures (pores, stubble, wrinkles, fabric weave)
 * - Authentic paper-tooth midtone texture
 */
export function applyCharcoalDrawing(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  adjustments?: AdjustmentConfig
): void {
  const pixelCount = width * height;
  const lum = new Float32Array(pixelCount);

  // 1. Extract base luminance
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    lum[i] = (0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]) / 255;
  }

  // 2. Compute smooth local background luminance using separable box blur
  const blurRadius = Math.max(3, Math.min(10, Math.round(Math.min(width, height) * 0.01)));
  const baseBlur = computeLuminanceBlur(lum, width, height, blurRadius);

  const intensity = (adjustments?.modeIntensity ?? 100) / 100;
  const textureScale = (adjustments?.textureDetail ?? 75) / 50;

  // 3. Process each pixel: dramatic charcoal curve + boosted micro-texture + tooth grain
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const i = rowOffset + x;
      const idx = i * 4;

      const rawL = lum[i];
      const baseL = baseBlur[i];

      // High-frequency detail (skin pores, stubble, fabric weave, specular edges)
      const detail = rawL - baseL;

      // Sculpted Charcoal S-Curve on base luminance:
      // Deepens shadows into velvety charcoal black, lifts highlights cleanly
      let curvedBase: number;
      if (baseL < 0.35) {
        // Deep shadow compression: smooth plunge to rich black
        curvedBase = Math.pow(baseL / 0.35, 1.45) * 0.20;
      } else if (baseL > 0.65) {
        // Luminous highlight expansion: glowing paper white
        const normH = (baseL - 0.65) / 0.35;
        curvedBase = 0.55 + Math.pow(normH, 0.78) * 0.45;
      } else {
        // Sculpted anatomical midtones with S-curve contrast
        const t = (baseL - 0.35) / 0.30;
        const smoothT = t * t * (3 - 2 * t);
        curvedBase = 0.20 + smoothT * (0.55 - 0.20);
      }

      // Blend between natural luminance and curved base according to intensity slider
      const targetBase = rawL * (1 - intensity) + curvedBase * intensity;

      // Dynamic detail amplification scaled by textureDetail slider
      let detailGain = 2.4 * textureScale;
      if (baseL > 0.60 && detail > 0) {
        detailGain = 3.2 * textureScale; // Extra pop for specular highlights!
      } else if (baseL < 0.22) {
        detailGain = 1.3 * textureScale; // Preserve deep shadow mood
      }

      let finalL = targetBase + detail * detailGain * intensity;

      // Authentic charcoal paper tooth (organic grain concentrated in midtones)
      const midtoneWeight = Math.sin(Math.PI * Math.min(1, Math.max(0, finalL)));
      if (midtoneWeight > 0.1 && intensity > 0.1) {
        const tooth = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1);
        finalL += (tooth - 0.5) * 0.04 * midtoneWeight * intensity;
      }

      const byteVal = Math.min(255, Math.max(0, Math.round(finalL * 255)));
      data[idx] = byteVal;
      data[idx + 1] = byteVal;
      data[idx + 2] = byteVal;
    }
  }
}

/**
 * Fine Graphite Pencil Sketch Filter:
 * Recreates the silvery tones and delicate crosshatch tooth of graphite pencil drawings:
 * - Smooth, extended midtone values for soft facial planes
 * - Luminous paper highlights
 * - Fine-grained pencil texture
 */
export function applyGraphiteSketch(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  adjustments?: AdjustmentConfig
): void {
  const pixelCount = width * height;
  const lum = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    lum[i] = (0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]) / 255;
  }

  const blurRadius = Math.max(2, Math.min(8, Math.round(Math.min(width, height) * 0.008)));
  const baseBlur = computeLuminanceBlur(lum, width, height, blurRadius);

  const intensity = (adjustments?.modeIntensity ?? 100) / 100;
  const textureScale = (adjustments?.textureDetail ?? 75) / 50;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const i = rowOffset + x;
      const idx = i * 4;

      const rawL = lum[i];
      const baseL = baseBlur[i];
      const detail = rawL - baseL;

      // Graphite gentle S-curve (silvery pencil gradation, non-harsh shadows)
      const norm = baseL;
      const curvedBase =
        norm < 0.5
          ? Math.pow(norm * 2, 1.25) * 0.45
          : 0.45 + (1 - Math.pow((1 - norm) * 2, 1.25)) * 0.55;

      const shapedBase = rawL * (1 - intensity) + curvedBase * intensity;

      let finalL = shapedBase + detail * 1.85 * textureScale * intensity;

      // Fine pencil paper grain in midtones
      const midtone = Math.sin(Math.PI * Math.min(1, Math.max(0, finalL)));
      if (midtone > 0.1 && intensity > 0.1) {
        const grain = (((Math.sin(x * 37.1 + y * 91.7) * 23421.631) % 1) - 0.5) * 0.03 * midtone * intensity;
        finalL += grain;
      }

      const byteVal = Math.min(255, Math.max(0, Math.round(finalL * 255)));
      data[idx] = byteVal;
      data[idx + 1] = byteVal;
      data[idx + 2] = byteVal;
    }
  }
}

/**
 * Pen & Ink Contour Sketch (CPU Fallback when WebGL is unavailable)
 */
export function applyInkSketch(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  adjustments?: AdjustmentConfig
): void {
  const pixelCount = width * height;
  const lum = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    lum[i] = (0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]) / 255;
  }

  const intensity = (adjustments?.modeIntensity ?? 100) / 100;
  const copy = new Float32Array(lum);

  for (let y = 1; y < height - 1; y++) {
    const prevRow = (y - 1) * width;
    const currRow = y * width;
    const nextRow = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = currRow + x;
      const gx =
        -copy[prevRow + x - 1] - 2 * copy[currRow + x - 1] - copy[nextRow + x - 1] +
        copy[prevRow + x + 1] + 2 * copy[currRow + x + 1] + copy[nextRow + x + 1];
      const gy =
        -copy[prevRow + x - 1] - 2 * copy[prevRow + x] - copy[prevRow + x + 1] +
        copy[nextRow + x - 1] + 2 * copy[nextRow + x] + copy[nextRow + x + 1];
      const edge = Math.hypot(gx, gy);
      const inkVal = Math.max(0, Math.min(1, copy[idx] - edge * 1.5 * intensity));
      const byteVal = Math.round(inkVal * 255);
      const pixelIdx = idx * 4;
      data[pixelIdx] = byteVal;
      data[pixelIdx + 1] = byteVal;
      data[pixelIdx + 2] = byteVal;
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
  // 1. Hardware-accelerated GPU WebGL pass using glfx library
  const webGLCanvas = processWithWebGL(sourceCanvas, mode, adjustments);
  if (webGLCanvas) {
    return webGLCanvas;
  }

  // 2. High-precision CPU 2D canvas fallback
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
      // Perceptually calibrated sRGB grayscale LUT with lifted midtone clarity
      // Prevents facial planes from collapsing into muddy gray sludge
      const grayLut = new Uint8Array(256);
      for (let v = 0; v < 256; v++) {
        const norm = v / 255;
        // Mild tone curve adjustment to open up delicate shadow details
        const adjusted = Math.pow(norm, 0.95);
        grayLut[v] = Math.min(255, Math.max(0, Math.round(adjusted * 255)));
      }

      for (let i = 0; i < data.length; i += 4) {
        const rawGray =
          (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) | 0;
        const gray = grayLut[rawGray];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      break;
    }

    case 'high_contrast': {
      // Chiaroscuro S-curve contrast enhancement using fast precomputed 256-byte LUT
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

    case 'charcoal': {
      applyCharcoalDrawing(data, width, height, adjustments);
      break;
    }

    case 'graphite': {
      applyGraphiteSketch(data, width, height, adjustments);
      break;
    }

    case 'ink': {
      applyInkSketch(data, width, height, adjustments);
      break;
    }

    // Backwards-compatibility fallback if previous session had 'value_study' or 'notan'
    case 'value_study' as FilterMode:
    case 'notan' as FilterMode: {
      applyCharcoalDrawing(data, width, height, adjustments);
      break;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}
