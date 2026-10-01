import { GridConfig, PaperConfig, PaperPreset } from '@/types/editor';

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
  name: string;
}

export const PAPER_SIZES: Record<PaperPreset, { widthMm: number; heightMm: number; name: string }> = {
  A4: { widthMm: 210, heightMm: 297, name: 'A4 (210 × 297 mm)' },
  A3: { widthMm: 297, heightMm: 420, name: 'A3 (297 × 420 mm)' },
  A2: { widthMm: 420, heightMm: 594, name: 'A2 (420 × 594 mm)' },
  Letter: { widthMm: 215.9, heightMm: 279.4, name: 'US Letter (8.5 × 11 in)' },
  Legal: { widthMm: 215.9, heightMm: 355.6, name: 'US Legal (8.5 × 14 in)' },
  Custom: { widthMm: 200, heightMm: 200, name: 'Custom Dimensions' },
};

export interface GridScaleAnalysis {
  paperWidthMm: number;
  paperHeightMm: number;
  paperOrientation: 'portrait' | 'landscape';
  printableWidthMm: number;
  printableHeightMm: number;
  cellWidthMm: number;
  cellHeightMm: number;
  cellWidthIn: number;
  cellHeightIn: number;
  marginMm: number;
  aspectRatioMismatch: boolean;
  aspectDifferencePercent: number;
  rulerSummary: string;
  isExactGrid?: boolean;
  remainderColMm?: number;
  remainderRowMm?: number;
}

export function calculatePaperGridScale(
  imageWidth: number,
  imageHeight: number,
  rows: number,
  columns: number,
  paper: PaperConfig,
  marginMm: number = 0,
  grid?: GridConfig
): GridScaleAnalysis {
  let baseWidth: number;
  let baseHeight: number;

  if (paper.preset === 'Custom') {
    baseWidth = Math.max(10, paper.customWidthMm || 200);
    baseHeight = Math.max(10, paper.customHeightMm || 200);
  } else {
    baseWidth = PAPER_SIZES[paper.preset]?.widthMm ?? 210;
    baseHeight = PAPER_SIZES[paper.preset]?.heightMm ?? 297;
  }

  // Handle orientation
  const isLandscape = paper.orientation === 'landscape';
  const paperWidthMm = isLandscape ? Math.max(baseWidth, baseHeight) : Math.min(baseWidth, baseHeight);
  const paperHeightMm = isLandscape ? Math.min(baseWidth, baseHeight) : Math.max(baseWidth, baseHeight);

  // The grid spans the full sheet of paper (cover-fit page view in studio)
  const printableW = Math.max(1, paperWidthMm - marginMm * 2);
  const printableH = Math.max(1, paperHeightMm - marginMm * 2);

  const isExactMode =
    (grid?.gridMode === 'size' || !!grid?.exactCellSize) &&
    typeof grid?.cellSize === 'number' &&
    grid.cellSize > 0;

  let cellWidthMm: number;
  let cellHeightMm: number;
  let isExactGrid = false;
  let remainderColMm = 0;
  let remainderRowMm = 0;

  if (isExactMode && grid) {
    let targetMm = grid.cellSize!;
    if (grid.sizeUnit === 'cm') targetMm = grid.cellSize! * 10;
    else if (grid.sizeUnit === 'in') targetMm = grid.cellSize! * 25.4;
    else if (grid.sizeUnit === 'px') {
      const pxRatio = printableW / Math.max(1, imageWidth);
      targetMm = grid.cellSize! * pxRatio;
    }

    cellWidthMm = targetMm;
    cellHeightMm = targetMm;
    isExactGrid = true;
    remainderColMm = Math.max(0, printableW - (columns - 1) * targetMm);
    remainderRowMm = Math.max(0, printableH - (rows - 1) * targetMm);
  } else {
    cellWidthMm = printableW / Math.max(1, columns);
    cellHeightMm = printableH / Math.max(1, rows);
    remainderColMm = cellWidthMm;
    remainderRowMm = cellHeightMm;
  }

  const cellWidthIn = cellWidthMm / 25.4;
  const cellHeightIn = cellHeightMm / 25.4;

  const aspectDifferencePercent = isExactGrid
    ? 0
    : Math.abs((cellWidthMm - cellHeightMm) / Math.max(cellWidthMm, cellHeightMm)) * 100;
  const aspectRatioMismatch = aspectDifferencePercent > 5;

  const hasRemainder =
    isExactGrid &&
    (Math.abs(remainderColMm - cellWidthMm) > 0.1 || Math.abs(remainderRowMm - cellHeightMm) > 0.1);

  const rulerSummary = isExactGrid
    ? `${columns} × ${rows} Grid on ${paper.preset} (${paper.orientation}): Exact ${cellWidthMm.toFixed(
        1
      )} × ${cellHeightMm.toFixed(1)} mm per square${
        hasRemainder
          ? ` (Last Col: ${remainderColMm.toFixed(1)} mm, Last Row: ${remainderRowMm.toFixed(1)} mm)`
          : ''
      }.`
    : `${columns} × ${rows} Grid on ${paper.preset} (${paper.orientation}): Each square measures ${cellWidthMm.toFixed(
        1
      )} × ${cellHeightMm.toFixed(1)} mm (${(cellWidthMm / 10).toFixed(2)} × ${(cellHeightMm / 10).toFixed(2)} cm • ${cellWidthIn.toFixed(2)}″ × ${cellHeightIn.toFixed(2)}″).`;

  return {
    paperWidthMm,
    paperHeightMm,
    paperOrientation: paper.orientation,
    printableWidthMm: printableW,
    printableHeightMm: printableH,
    cellWidthMm,
    cellHeightMm,
    cellWidthIn,
    cellHeightIn,
    marginMm,
    aspectRatioMismatch,
    aspectDifferencePercent,
    rulerSummary,
    isExactGrid,
    remainderColMm,
    remainderRowMm,
  };
}

export interface PageFraming {
  pageW: number;
  pageH: number;
  imgDisplayW: number;
  imgDisplayH: number;
  imgOffsetX: number;
  imgOffsetY: number;
  maxPanX: number;
  maxPanY: number;
  zoom: number;
  fitMode: 'cover' | 'contain' | 'auto' | 'custom';
  backgroundColor: string;
}

/**
 * Calculates page dimensions and image positioning inside the page boundary.
 * Supports:
 * - cover (fills container)
 * - contain (fits completely without cropping)
 * - auto (1:1 original pixel scale)
 * - custom (specific lengths, e.g. 100px 50px)
 * Plus alignment, panning, and zooming.
 */
export function calculatePageFraming(
  imgW: number,
  imgH: number,
  paper: PaperConfig
): PageFraming {
  const preset = paper.preset;
  const isLandscape = paper.orientation === 'landscape';

  const baseWidth =
    preset === 'Custom'
      ? Math.max(10, paper.customWidthMm || 200)
      : PAPER_SIZES[preset]?.widthMm ?? 210;
  const baseHeight =
    preset === 'Custom'
      ? Math.max(10, paper.customHeightMm || 200)
      : PAPER_SIZES[preset]?.heightMm ?? 297;

  const baseAspect = Math.min(baseWidth, baseHeight) / Math.max(baseWidth, baseHeight);
  const pageAspect = isLandscape ? 1 / baseAspect : baseAspect;

  const imgLarger = Math.max(imgW, imgH);
  let pageW: number;
  let pageH: number;
  if (pageAspect <= 1) {
    pageH = imgLarger;
    pageW = Math.round(imgLarger * pageAspect);
  } else {
    pageW = imgLarger;
    pageH = Math.round(imgLarger / pageAspect);
  }

  const fitMode = paper.fitMode || 'cover';
  const zoom = Math.max(0.1, Math.min(5.0, paper.imageZoom ?? 1.0));
  const alignment = paper.fitAlignment || 'center';
  const backgroundColor = paper.canvasBackground || '#0a0e1a';

  let imgDisplayW: number;
  let imgDisplayH: number;

  if (fitMode === 'cover') {
    // Fills container completely (may overflow and crop outside page boundary)
    const coverScale = Math.max(pageW / Math.max(1, imgW), pageH / Math.max(1, imgH)) * zoom;
    imgDisplayW = Math.max(pageW, Math.ceil(imgW * coverScale));
    imgDisplayH = Math.max(pageH, Math.ceil(imgH * coverScale));
  } else if (fitMode === 'contain') {
    // Fits completely inside container with no cropping (letterboxed)
    const containScale = Math.min(pageW / Math.max(1, imgW), pageH / Math.max(1, imgH)) * zoom;
    imgDisplayW = Math.round(imgW * containScale);
    imgDisplayH = Math.round(imgH * containScale);
  } else if (fitMode === 'auto') {
    // Natural 1:1 image size relative to canvas
    imgDisplayW = Math.round(imgW * zoom);
    imgDisplayH = Math.round(imgH * zoom);
  } else {
    // Custom specific lengths (e.g. 100px 50px or % or mm)
    const unit = paper.fitCustomUnit || 'px';
    const rawW = Math.max(1, paper.fitCustomWidth ?? Math.round(imgW * 0.5));
    const rawH = Math.max(1, paper.fitCustomHeight ?? Math.round(imgH * 0.5));

    if (unit === 'px') {
      imgDisplayW = Math.round(rawW * zoom);
      imgDisplayH = Math.round(rawH * zoom);
    } else if (unit === '%') {
      imgDisplayW = Math.round((pageW * (rawW / 100)) * zoom);
      imgDisplayH = Math.round((pageH * (rawH / 100)) * zoom);
    } else {
      // mm or cm
      const pxPerMm = pageW / (isLandscape ? Math.max(baseWidth, baseHeight) : Math.min(baseWidth, baseHeight));
      const factor = unit === 'cm' ? 10 : 1;
      imgDisplayW = Math.round(rawW * factor * pxPerMm * zoom);
      imgDisplayH = Math.round(rawH * factor * pxPerMm * zoom);
    }
  }

  // Calculate base offset according to alignment
  let baseOffsetX = 0;
  let baseOffsetY = 0;

  switch (alignment) {
    case 'top-left':
      baseOffsetX = 0;
      baseOffsetY = 0;
      break;
    case 'top':
      baseOffsetX = Math.round((pageW - imgDisplayW) / 2);
      baseOffsetY = 0;
      break;
    case 'top-right':
      baseOffsetX = pageW - imgDisplayW;
      baseOffsetY = 0;
      break;
    case 'left':
      baseOffsetX = 0;
      baseOffsetY = Math.round((pageH - imgDisplayH) / 2);
      break;
    case 'right':
      baseOffsetX = pageW - imgDisplayW;
      baseOffsetY = Math.round((pageH - imgDisplayH) / 2);
      break;
    case 'bottom-left':
      baseOffsetX = 0;
      baseOffsetY = pageH - imgDisplayH;
      break;
    case 'bottom':
      baseOffsetX = Math.round((pageW - imgDisplayW) / 2);
      baseOffsetY = pageH - imgDisplayH;
      break;
    case 'bottom-right':
      baseOffsetX = pageW - imgDisplayW;
      baseOffsetY = pageH - imgDisplayH;
      break;
    case 'center':
    default:
      baseOffsetX = Math.round((pageW - imgDisplayW) / 2);
      baseOffsetY = Math.round((pageH - imgDisplayH) / 2);
      break;
  }

  // Pan range allowance
  const maxPanX = Math.max(pageW, Math.round(Math.abs(imgDisplayW - pageW) / 2) + 400);
  const maxPanY = Math.max(pageH, Math.round(Math.abs(imgDisplayH - pageH) / 2) + 400);

  const userPanX = paper.imageOffsetX ?? 0;
  const userPanY = paper.imageOffsetY ?? 0;

  let imgOffsetX = Math.round(baseOffsetX + userPanX);
  let imgOffsetY = Math.round(baseOffsetY + userPanY);

  if (fitMode === 'cover') {
    // In cover mode, the image must completely cover the paper canvas:
    // Left edge (imgOffsetX) cannot exceed 0 (no left gap).
    // Right edge (imgOffsetX + imgDisplayW) cannot be less than pageW (no right gap).
    const minX = pageW - imgDisplayW;
    const maxX = 0;
    imgOffsetX = Math.min(maxX, Math.max(minX, imgOffsetX));

    // Top edge (imgOffsetY) cannot exceed 0 (no top gap).
    // Bottom edge (imgOffsetY + imgDisplayH) cannot be less than pageH (no bottom gap).
    const minY = pageH - imgDisplayH;
    const maxY = 0;
    imgOffsetY = Math.min(maxY, Math.max(minY, imgOffsetY));
  }

  return {
    pageW,
    pageH,
    imgDisplayW,
    imgDisplayH,
    imgOffsetX,
    imgOffsetY,
    maxPanX,
    maxPanY,
    zoom,
    fitMode,
    backgroundColor,
  };
}
