import { GridConfig } from '@/types/editor';

/**
 * Converts zero-indexed column number to Excel-style alphabet label (0 -> A, 25 -> Z, 26 -> AA)
 */
export function getColumnLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/**
 * Draws the grid overlay, center crosshair, diagonals, subdivisions, and labels
 * onto the target 2D canvas context.
 */
export function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  grid: GridConfig,
  renderLabels: boolean = true
): void {
  const {
    rows,
    columns,
    color,
    opacity,
    thickness,
    labelMode,
    labelColor,
    labelSize,
    showCenterLines,
    showDiagonals,
    showFullDiagonals,
    subdivisions,
    lockAspectRatio,
  } = grid;

  if (rows <= 0 || columns <= 0 || opacity <= 0) return;

  // When lockAspectRatio is enabled, guarantee perfect 1:1 square cells
  let cellWidth = width / columns;
  let cellHeight = height / rows;
  let startX = 0;
  let startY = 0;

  if (lockAspectRatio) {
    // If the cell aspect ratio is already close to square (within 6%),
    // stretch to cover full width/height so no empty slivers or gaps appear on borders
    const rawRatio = (width / columns) / (height / rows);
    if (rawRatio >= 0.94 && rawRatio <= 1.06) {
      cellWidth = width / columns;
      cellHeight = height / rows;
      startX = 0;
      startY = 0;
    } else {
      const cellSize = Math.min(width / columns, height / rows);
      cellWidth = cellSize;
      cellHeight = cellSize;
      startX = Math.max(0, (width - columns * cellWidth) / 2);
      startY = Math.max(0, (height - rows * cellHeight) / 2);
    }
  }

  ctx.save();
  ctx.globalAlpha = opacity;

  // 1. Draw Minor Subdivisions if enabled
  if (subdivisions > 1) {
    const subColWidth = cellWidth / subdivisions;
    const subRowHeight = cellHeight / subdivisions;

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.75, thickness * 0.4);
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    for (let c = 0; c <= columns * subdivisions; c++) {
      if (c % subdivisions !== 0) {
        const x = Math.round(startX + c * subColWidth);
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + rows * cellHeight);
      }
    }
    for (let r = 0; r <= rows * subdivisions; r++) {
      if (r % subdivisions !== 0) {
        const y = Math.round(startY + r * subRowHeight);
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + columns * cellWidth, y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
  }

  // 2. Draw Full Diagonals (Corner-to-Corner X across the grid area)
  if (showFullDiagonals) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, thickness * 0.75);
    ctx.beginPath();
    const gridRight = startX + columns * cellWidth;
    const gridBottom = startY + rows * cellHeight;
    ctx.moveTo(startX, startY);
    ctx.lineTo(gridRight, gridBottom);
    ctx.moveTo(gridRight, startY);
    ctx.lineTo(startX, gridBottom);
    ctx.stroke();
  }

  // 3. Draw Diagonal Cross in Each Grid Cell (X in every square)
  if (showDiagonals) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.75, thickness * 0.5);
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const y1 = startY + r * cellHeight;
      const y2 = startY + (r + 1) * cellHeight;
      for (let c = 0; c < columns; c++) {
        const x1 = startX + c * cellWidth;
        const x2 = startX + (c + 1) * cellWidth;
        // Corner to corner diagonals within each individual cell
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.moveTo(x2, y1);
        ctx.lineTo(x1, y2);
      }
    }
    ctx.stroke();
  }

  // 4. Draw Major Grid Lines
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;

  ctx.beginPath();
  // Vertical lines
  for (let c = 0; c <= columns; c++) {
    const x = Math.round(startX + c * cellWidth);
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + rows * cellHeight);
  }
  // Horizontal lines
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(startY + r * cellHeight);
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + columns * cellWidth, y);
  }
  ctx.stroke();

  // 5. Center Crosshair Lines (High visibility)
  if (showCenterLines) {
    ctx.strokeStyle = '#ef4444'; // Studio crimson accent
    ctx.lineWidth = Math.max(1.5, thickness * 1.3);
    ctx.beginPath();
    // Mid X
    const midX = width / 2;
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, height);
    // Mid Y
    const midY = height / 2;
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();
  }

  ctx.restore();

  // 5. Draw Labels (Outside or Inside Cells with high-contrast pills)
  if (renderLabels && labelMode !== 'none') {
    ctx.save();
    // Dynamic label size based on cell size to prevent overflow
    const maxAllowedSize = Math.min(cellWidth * 0.35, cellHeight * 0.35);
    const computedFontSize = Math.max(9, Math.min(labelSize, maxAllowedSize));
    ctx.font = `bold ${computedFontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = 3;
    const pillRadius = 3;

    // Draw Column Labels (Top edge of each column)
    for (let c = 0; c < columns; c++) {
      const colText = labelMode === 'alphanumeric' ? getColumnLabel(c) : String(c + 1);
      const textMetrics = ctx.measureText(colText);
      const textWidth = textMetrics.width;
      const textHeight = computedFontSize;

      const badgeX = startX + c * cellWidth + cellWidth / 2;
      const badgeY = Math.min(height - textHeight / 2 - 4, Math.max(textHeight / 2 + 4, startY + cellHeight * 0.15));

      // Draw dark semi-transparent pill for crystal clarity against any background
      ctx.fillStyle = 'rgba(15, 17, 23, 0.75)';
      ctx.beginPath();
      ctx.roundRect(
        badgeX - textWidth / 2 - padding,
        badgeY - textHeight / 2 - padding / 2,
        textWidth + padding * 2,
        textHeight + padding,
        pillRadius
      );
      ctx.fill();

      // Draw label text
      ctx.fillStyle = labelColor || '#ffffff';
      ctx.fillText(colText, badgeX, badgeY);
    }

    // Draw Row Labels (Left edge of each row)
    for (let r = 0; r < rows; r++) {
      const rowText = String(r + 1);
      const textMetrics = ctx.measureText(rowText);
      const textWidth = textMetrics.width;
      const textHeight = computedFontSize;

      const badgeX = Math.min(width - textWidth / 2 - 4, Math.max(textWidth / 2 + 4, startX + cellWidth * 0.12));
      const badgeY = startY + r * cellHeight + cellHeight / 2;

      // Dark pill
      ctx.fillStyle = 'rgba(15, 17, 23, 0.75)';
      ctx.beginPath();
      ctx.roundRect(
        badgeX - textWidth / 2 - padding,
        badgeY - textHeight / 2 - padding / 2,
        textWidth + padding * 2,
        textHeight + padding,
        pillRadius
      );
      ctx.fill();

      // Text
      ctx.fillStyle = labelColor || '#ffffff';
      ctx.fillText(rowText, badgeX, badgeY);
    }

    ctx.restore();
  }
}

/**
 * Draws the grid overlay restricted to a specific rectangular subregion (e.g. image boundary).
 */
export function drawGridOverlayOnRect(
  ctx: CanvasRenderingContext2D,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number,
  grid: GridConfig,
  renderLabels: boolean = true
): void {
  if (rectW <= 0 || rectH <= 0) return;
  ctx.save();
  ctx.translate(rectX, rectY);
  drawGridOverlay(ctx, rectW, rectH, grid, renderLabels);
  ctx.restore();
}

export interface PhysicalRulerOptions {
  theme?: 'dark' | 'light';
  rulerThickness?: number;
  showInches?: boolean;
}

/**
 * Draws physical millimeter and centimeter calibration ruler margins along borders
 * for direct wooden or steel ruler verification on physical prints or digital screens.
 */
export function drawPhysicalRulerMargins(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  widthPx: number,
  heightPx: number,
  widthMm: number,
  heightMm: number,
  options: PhysicalRulerOptions = {}
): void {
  if (widthPx <= 0 || heightPx <= 0 || widthMm <= 0 || heightMm <= 0) return;

  const { theme = 'light', rulerThickness = 28 } = options;
  const isDark = theme === 'dark';

  const bgColor = isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff';
  const borderColor = isDark ? 'rgba(125, 211, 252, 0.35)' : '#cbd5e1';
  const majorTickColor = isDark ? '#7dd3fc' : '#1e293b';
  const minorTickColor = isDark ? 'rgba(148, 163, 184, 0.6)' : '#64748b';
  const textColor = isDark ? '#f0f6fc' : '#0f172a';
  const subtextColor = isDark ? '#94a3b8' : '#475569';

  ctx.save();

  const pxPerMmh = widthPx / widthMm;
  const pxPerMmv = heightPx / heightMm;

  // 1. Top Horizontal Ruler Strip
  const topRulerY = originY - rulerThickness;
  ctx.fillStyle = bgColor;
  ctx.fillRect(originX, topRulerY, widthPx, rulerThickness);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(originX, topRulerY, widthPx, rulerThickness);

  // Top ticks
  for (let mm = 0; mm <= Math.floor(widthMm); mm++) {
    const x = originX + mm * pxPerMmh;
    const isCm = mm % 10 === 0;
    const isHalfCm = mm % 5 === 0 && !isCm;

    const tickH = isCm ? rulerThickness * 0.55 : isHalfCm ? rulerThickness * 0.35 : rulerThickness * 0.2;
    ctx.strokeStyle = isCm ? majorTickColor : minorTickColor;
    ctx.lineWidth = isCm ? 1.5 : 0.75;

    ctx.beginPath();
    ctx.moveTo(x, originY);
    ctx.lineTo(x, originY - tickH);
    ctx.stroke();

    if (isCm && mm > 0 && mm < widthMm) {
      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.max(8, Math.min(11, rulerThickness * 0.36))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${mm / 10}`, x, topRulerY + 2.5);
    }
  }

  // 2. Left Vertical Ruler Strip
  const leftRulerX = originX - rulerThickness;
  ctx.fillStyle = bgColor;
  ctx.fillRect(leftRulerX, originY, rulerThickness, heightPx);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(leftRulerX, originY, rulerThickness, heightPx);

  // Left ticks
  for (let mm = 0; mm <= Math.floor(heightMm); mm++) {
    const y = originY + mm * pxPerMmv;
    const isCm = mm % 10 === 0;
    const isHalfCm = mm % 5 === 0 && !isCm;

    const tickW = isCm ? rulerThickness * 0.55 : isHalfCm ? rulerThickness * 0.35 : rulerThickness * 0.2;
    ctx.strokeStyle = isCm ? majorTickColor : minorTickColor;
    ctx.lineWidth = isCm ? 1.5 : 0.75;

    ctx.beginPath();
    ctx.moveTo(originX, y);
    ctx.lineTo(originX - tickW, y);
    ctx.stroke();

    if (isCm && mm > 0 && mm < heightMm) {
      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.max(8, Math.min(11, rulerThickness * 0.36))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${mm / 10}`, leftRulerX + 2.5, y);
    }
  }

  // 3. Top-Left Corner Block (0,0 cm origin tag)
  ctx.fillStyle = bgColor;
  ctx.fillRect(leftRulerX, topRulerY, rulerThickness, rulerThickness);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(leftRulerX, topRulerY, rulerThickness, rulerThickness);

  ctx.fillStyle = subtextColor;
  ctx.font = `bold ${Math.max(7, rulerThickness * 0.3)}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('cm', leftRulerX + rulerThickness / 2, topRulerY + rulerThickness / 2);

  ctx.restore();
}

export interface DrafterSpecParams {
  title: string;
  artistName?: string;
  sheetPreset: string;
  orientation: string;
  dimensionsMm: string;
  gridMatrix: string;
  cellSizeMm: string;
  cellSizeIn: string;
  filterMode: string;
  dateStr?: string;
  scaleNote?: string;
}

/**
 * Draws an authentic architectural / engineering Drafter's Spec Legend
 * formatted as a professional margin title block for record-keeping and measurement specs.
 */
export function drawDraftersSpecLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  specs: DrafterSpecParams,
  theme: 'dark' | 'light' = 'light'
): void {
  if (width <= 0 || height <= 0) return;

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0b1120' : '#ffffff';
  const borderColor = isDark ? 'rgba(125, 211, 252, 0.4)' : '#334155';
  const headerBg = isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const accentColor = isDark ? '#7dd3fc' : '#0284c7';

  ctx.save();

  // Background container
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, width, height);

  // Outer border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);

  // Layout partitions: 4 horizontal columns / blocks
  // 1. Project Title & Brand (32%)
  // 2. Paper & Dimensions (24%)
  // 3. Grid & Cell Calibration (24%)
  // 4. Studio Spec / Date / Sign (20%)
  const col1W = Math.round(width * 0.32);
  const col2W = Math.round(width * 0.24);
  const col3W = Math.round(width * 0.24);

  const col1X = x;
  const col2X = col1X + col1W;
  const col3X = col2X + col2W;
  const col4X = col3X + col3W;

  // Vertical column divider lines
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(col2X, y);
  ctx.lineTo(col2X, y + height);
  ctx.moveTo(col3X, y);
  ctx.lineTo(col3X, y + height);
  ctx.moveTo(col4X, y);
  ctx.lineTo(col4X, y + height);
  ctx.stroke();

  // Top header label row inside each column
  const headerH = Math.min(18, Math.round(height * 0.3));
  ctx.fillStyle = headerBg;
  ctx.fillRect(x, y, width, headerH);

  ctx.beginPath();
  ctx.moveTo(x, y + headerH);
  ctx.lineTo(x + width, y + headerH);
  ctx.stroke();

  const labelFont = `bold ${Math.max(7.5, Math.round(headerH * 0.55))}px ui-sans-serif, system-ui, sans-serif`;
  const valFontBold = `bold ${Math.max(9, Math.round(height * 0.24))}px ui-sans-serif, system-ui, sans-serif`;
  const valFontMono = `500 ${Math.max(8.5, Math.round(height * 0.21))}px ui-monospace, Menlo, monospace`;

  // Col 1 Header & Content: ARTWORK SPEC
  ctx.font = labelFont;
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('GRIDSKETCH STUDIO SPEC', col1X + 8, y + headerH / 2);

  ctx.font = valFontBold;
  ctx.fillStyle = textPrimary;
  const displayTitle = specs.title.length > 28 ? specs.title.slice(0, 26) + '…' : specs.title;
  ctx.fillText(displayTitle, col1X + 8, y + headerH + (height - headerH) * 0.36);

  ctx.font = valFontMono;
  ctx.fillStyle = textSecondary;
  const artistText = specs.artistName ? `Artist: ${specs.artistName}` : `Mode: ${specs.filterMode}`;
  ctx.fillText(artistText, col1X + 8, y + headerH + (height - headerH) * 0.72);

  // Col 2 Header & Content: PAPER STANDARD
  ctx.font = labelFont;
  ctx.fillStyle = textSecondary;
  ctx.fillText('PAPER STANDARD', col2X + 8, y + headerH / 2);

  ctx.font = valFontBold;
  ctx.fillStyle = textPrimary;
  ctx.fillText(`${specs.sheetPreset} (${specs.orientation})`, col2X + 8, y + headerH + (height - headerH) * 0.36);

  ctx.font = valFontMono;
  ctx.fillStyle = textSecondary;
  ctx.fillText(specs.dimensionsMm, col2X + 8, y + headerH + (height - headerH) * 0.72);

  // Col 3 Header & Content: GRID CALIBRATION
  ctx.font = labelFont;
  ctx.fillStyle = textSecondary;
  ctx.fillText('CALIBRATED MATRIX', col3X + 8, y + headerH / 2);

  ctx.font = valFontBold;
  ctx.fillStyle = textPrimary;
  ctx.fillText(`Grid: ${specs.gridMatrix}`, col3X + 8, y + headerH + (height - headerH) * 0.36);

  ctx.font = valFontMono;
  ctx.fillStyle = accentColor;
  ctx.fillText(`${specs.cellSizeMm} (${specs.cellSizeIn})`, col3X + 8, y + headerH + (height - headerH) * 0.72);

  // Col 4 Header & Content: DRAFTER RECORD
  ctx.font = labelFont;
  ctx.fillStyle = textSecondary;
  ctx.fillText('RECORD & DATE', col4X + 8, y + headerH / 2);

  ctx.font = valFontMono;
  ctx.fillStyle = textPrimary;
  const dateStr = specs.dateStr || new Date().toISOString().slice(0, 10);
  ctx.fillText(dateStr, col4X + 8, y + headerH + (height - headerH) * 0.36);

  ctx.font = valFontMono;
  ctx.fillStyle = textSecondary;
  ctx.fillText('Scale: Verified 1:1', col4X + 8, y + headerH + (height - headerH) * 0.72);

  ctx.restore();
}

