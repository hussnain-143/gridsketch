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
    subdivisions,
  } = grid;

  if (rows <= 0 || columns <= 0 || opacity <= 0) return;

  const cellWidth = width / columns;
  const cellHeight = height / rows;

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
    for (let c = 0; c < columns * subdivisions; c++) {
      if (c % subdivisions !== 0) {
        const x = Math.round(c * subColWidth);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
    }
    for (let r = 0; r < rows * subdivisions; r++) {
      if (r % subdivisions !== 0) {
        const y = Math.round(r * subRowHeight);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
  }

  // 2. Draw Diagonal Cross in Each Grid Cell (X in every square)
  if (showDiagonals) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.75, thickness * 0.5);
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const y1 = r * cellHeight;
      const y2 = (r + 1) * cellHeight;
      for (let c = 0; c < columns; c++) {
        const x1 = c * cellWidth;
        const x2 = (c + 1) * cellWidth;
        // Corner to corner diagonals within each individual cell
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.moveTo(x2, y1);
        ctx.lineTo(x1, y2);
      }
    }
    ctx.stroke();
  }

  // 3. Draw Major Grid Lines
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;

  ctx.beginPath();
  // Vertical lines
  for (let c = 0; c <= columns; c++) {
    const x = Math.round(c * cellWidth);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  // Horizontal lines
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(r * cellHeight);
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 4. Center Crosshair Lines (High visibility)
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

      const badgeX = c * cellWidth + cellWidth / 2;
      const badgeY = Math.min(height - textHeight / 2 - 4, Math.max(textHeight / 2 + 4, cellHeight * 0.15));

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

      const badgeX = Math.min(width - textWidth / 2 - 4, Math.max(textWidth / 2 + 4, cellWidth * 0.12));
      const badgeY = r * cellHeight + cellHeight / 2;

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

