import { ExportConfig, GridConfig, PaperConfig, PosterSplitConfig } from '@/types/editor';
import {
  drawGridOverlay,
  drawGridOverlayOnRect,
  drawPhysicalRulerMargins,
  drawDraftersSpecLegend,
  DrafterSpecParams,
} from './grid-renderer';
import { calculatePaperGridScale, calculatePageFraming } from './paper-calculator';
import confetti from 'canvas-confetti';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Creates a high-resolution export canvas with support for:
 * 1. Standard Reference (image + grid)
 * 2. Matching Blank Grid Sheet (skipping manual ruler drawing)
 * 3. Side-by-Side Dual Reference (oil painters & portrait colorists)
 * 4. Physical Ruler Margins (direct wooden ruler verification)
 * 5. Drafter's Spec Legend (margin footer title block)
 */
export function createExportCanvas(
  processedCanvas: HTMLCanvasElement,
  grid: GridConfig,
  exportConfig: ExportConfig,
  paper: PaperConfig,
  filterName: string,
  rawImageCanvas?: HTMLCanvasElement | null
): HTMLCanvasElement {
  const {
    exportMode = 'standard',
    includeGrid = true,
    includeLabels = true,
    includeScaleWatermark = true,
    includeRulerMargins = false,
    includeDrafterLegend = false,
  } = exportConfig;

  // 1. If Side-by-Side Dual Export is requested
  if (exportMode === 'side_by_side') {
    return createSideBySideCanvas(
      rawImageCanvas || processedCanvas,
      processedCanvas,
      grid,
      exportConfig,
      paper,
      filterName
    );
  }

  const isBlankGrid = exportMode === 'blank_grid';
  const isPage = paper && paper.preset !== 'Custom';

  let exportW: number;
  let exportH: number;
  let drawImgX = 0;
  let drawImgY = 0;
  let drawImgW = processedCanvas.width;
  let drawImgH = processedCanvas.height;
  let bgFillColor = '#ffffff';

  if (isPage) {
    const framing = calculatePageFraming(processedCanvas.width, processedCanvas.height, paper);
    exportW = framing.pageW;
    exportH = framing.pageH;
    drawImgX = framing.imgOffsetX;
    drawImgY = framing.imgOffsetY;
    drawImgW = framing.imgDisplayW;
    drawImgH = framing.imgDisplayH;
    if (!isBlankGrid && framing.backgroundColor && framing.backgroundColor !== 'transparent') {
      bgFillColor = framing.backgroundColor;
    }
  } else {
    exportW = processedCanvas.width;
    exportH = processedCanvas.height;
  }

  // Physical Ruler Margin allowance
  const rulerThickness = includeRulerMargins ? Math.max(28, Math.round(Math.min(exportW, exportH) * 0.038)) : 0;

  // Drafter's Spec Legend or Standard Footer height
  const drafterLegendHeight = includeDrafterLegend ? Math.max(68, Math.round(exportH * 0.08)) : 0;
  const standardFooterHeight = !includeDrafterLegend && includeScaleWatermark ? Math.max(36, Math.round(exportH * 0.05)) : 0;
  const bottomFooterHeight = drafterLegendHeight || standardFooterHeight;

  const totalW = exportW + rulerThickness;
  const totalH = exportH + rulerThickness + bottomFooterHeight;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = totalW;
  exportCanvas.height = totalH;

  const ctx = exportCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not get export canvas 2d context');

  // Fill canvas background
  ctx.fillStyle = isBlankGrid ? '#ffffff' : bgFillColor;
  ctx.fillRect(0, 0, totalW, totalH);

  const contentOriginX = rulerThickness;
  const contentOriginY = rulerThickness;

  // Draw processed image if NOT a matching blank grid sheet
  if (!isBlankGrid) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(contentOriginX, contentOriginY, exportW, exportH);
    ctx.clip();
    ctx.drawImage(processedCanvas, contentOriginX + drawImgX, contentOriginY + drawImgY, drawImgW, drawImgH);
    ctx.restore();
  }

  // Draw Grid Overlay
  // For blank grid sheet, guarantee high-contrast dark lines if grid color was white
  const effectiveGrid: GridConfig = isBlankGrid
    ? {
        ...grid,
        color: grid.color === '#ffffff' ? '#1e293b' : grid.color,
        opacity: Math.max(0.65, grid.opacity),
        labelColor: grid.labelColor === '#ffffff' ? '#0f172a' : grid.labelColor,
      }
    : grid;

  if (includeGrid || isBlankGrid) {
    const isCustomOrContain = paper?.fitMode && paper.fitMode !== 'cover';
    const target = paper?.gridTarget || (isCustomOrContain ? 'image' : 'paper');

    ctx.save();
    ctx.translate(contentOriginX, contentOriginY);
    if (!isBlankGrid && target === 'image' && isPage && drawImgW > 0 && drawImgH > 0) {
      drawGridOverlayOnRect(ctx, drawImgX, drawImgY, drawImgW, drawImgH, effectiveGrid, includeLabels, paper);
    } else {
      drawGridOverlay(ctx, exportW, exportH, effectiveGrid, includeLabels, paper);
    }
    ctx.restore();
  }

  // Draw Physical Ruler Margins if enabled
  const scaleInfo = calculatePaperGridScale(exportW, exportH, grid.rows, grid.columns, paper, 0, grid);
  if (includeRulerMargins && rulerThickness > 0) {
    drawPhysicalRulerMargins(
      ctx,
      contentOriginX,
      contentOriginY,
      exportW,
      exportH,
      scaleInfo.paperWidthMm,
      scaleInfo.paperHeightMm,
      { theme: isBlankGrid ? 'light' : 'light', rulerThickness }
    );
  }

  // Draw Drafter's Spec Legend if enabled
  if (includeDrafterLegend && drafterLegendHeight > 0) {
    const drafterSpecs: DrafterSpecParams = {
      title: exportConfig.drafterTitle || (isBlankGrid ? 'Matching Blank Grid Sheet' : 'Studio Reference Drawing'),
      artistName: exportConfig.artistName || 'GridSketch Drafter',
      sheetPreset: paper.preset,
      orientation: paper.orientation === 'portrait' ? 'Portrait' : 'Landscape',
      dimensionsMm: `${scaleInfo.paperWidthMm} × ${scaleInfo.paperHeightMm} mm`,
      gridMatrix: `${grid.columns} × ${grid.rows} (${grid.columns * grid.rows} Cells)`,
      cellSizeMm: `${scaleInfo.cellWidthMm.toFixed(1)} × ${scaleInfo.cellHeightMm.toFixed(1)} mm`,
      cellSizeIn: `${scaleInfo.cellWidthIn.toFixed(2)}″ × ${scaleInfo.cellHeightIn.toFixed(2)}″`,
      filterMode: isBlankGrid ? 'Clean Blank Grid' : filterName,
      dateStr: new Date().toISOString().slice(0, 10),
    };
    drawDraftersSpecLegend(
      ctx,
      0,
      contentOriginY + exportH,
      totalW,
      drafterLegendHeight,
      drafterSpecs,
      isBlankGrid ? 'light' : 'light'
    );
  } else if (includeScaleWatermark && standardFooterHeight > 0) {
    // Fallback standard metadata footer
    const footerY = contentOriginY + exportH;
    ctx.fillStyle = '#181b23';
    ctx.fillRect(0, footerY, totalW, standardFooterHeight);

    const fontSize = Math.max(11, Math.round(standardFooterHeight * 0.35));
    ctx.font = `500 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const textY = footerY + standardFooterHeight / 2;
    const title = isBlankGrid
      ? `GridSketch Blank Grid Sheet • ${grid.columns}×${grid.rows} • Direct Canvas Verification`
      : `GridSketch Reference • Grid: ${grid.columns}×${grid.rows} • Mode: ${filterName}`;
    ctx.fillText(title, 20, textY);

    ctx.textAlign = 'right';
    const scaleText = `${paper.preset}: ${scaleInfo.cellWidthMm.toFixed(1)}×${scaleInfo.cellHeightMm.toFixed(1)}mm per square`;
    ctx.fillText(scaleText, totalW - 20, textY);
  }

  return exportCanvas;
}

/**
 * Creates a Side-by-Side Dual Export Canvas:
 * Left panel: Clean Reference Photo (uncluttered tonal/color study)
 * Right panel: Calibrated Grid Overlay (proportions & coordinates)
 */
export function createSideBySideCanvas(
  cleanCanvas: HTMLCanvasElement,
  griddedCanvas: HTMLCanvasElement,
  grid: GridConfig,
  exportConfig: ExportConfig,
  paper: PaperConfig,
  filterName: string
): HTMLCanvasElement {
  const panelW = cleanCanvas.width;
  const panelH = cleanCanvas.height;
  const gap = Math.max(24, Math.round(panelW * 0.03));
  const headerHeight = Math.max(38, Math.round(panelH * 0.055));

  const drafterLegendHeight = exportConfig.includeDrafterLegend ? Math.max(68, Math.round(panelH * 0.08)) : 0;
  const standardFooterHeight = !exportConfig.includeDrafterLegend && exportConfig.includeScaleWatermark ? Math.max(36, Math.round(panelH * 0.05)) : 0;
  const bottomFooterHeight = drafterLegendHeight || standardFooterHeight;

  const totalW = panelW * 2 + gap + 32; // 16px padding on outer sides
  const totalH = panelH + headerHeight + bottomFooterHeight + 16;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get side-by-side canvas 2d context');

  // Fill studio matte background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, totalW, totalH);

  const leftX = 16;
  const rightX = leftX + panelW + gap;
  const contentY = headerHeight + 8;

  // Header 1: Left Clean Panel
  ctx.fillStyle = '#38bdf8';
  ctx.font = `bold ${Math.max(12, Math.round(headerHeight * 0.38))}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('1. TONAL & COLOR REFERENCE (CLEAN)', leftX, headerHeight / 2);

  // Header 2: Right Gridded Panel
  ctx.fillStyle = '#c8a0f0';
  ctx.fillText('2. CALIBRATED GRID OVERLAY (MEASUREMENT)', rightX, headerHeight / 2);

  // Draw Left Clean Image
  ctx.fillStyle = '#000000';
  ctx.fillRect(leftX, contentY, panelW, panelH);
  ctx.drawImage(cleanCanvas, leftX, contentY, panelW, panelH);

  // Draw Right Gridded Image
  ctx.fillRect(rightX, contentY, panelW, panelH);
  ctx.drawImage(griddedCanvas, rightX, contentY, panelW, panelH);

  // Draw Grid Overlay onto the Right panel
  ctx.save();
  ctx.translate(rightX, contentY);
  drawGridOverlay(ctx, panelW, panelH, grid, exportConfig.includeLabels, paper);
  ctx.restore();

  // Draw Center Divider Line
  const dividerX = leftX + panelW + gap / 2;
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(dividerX, 8);
  ctx.lineTo(dividerX, contentY + panelH);
  ctx.stroke();

  // Footer: Drafter's Spec Legend or Watermark Banner
  const scaleInfo = calculatePaperGridScale(panelW, panelH, grid.rows, grid.columns, paper, 0, grid);
  const footerY = contentY + panelH + 8;

  if (exportConfig.includeDrafterLegend && drafterLegendHeight > 0) {
    const drafterSpecs: DrafterSpecParams = {
      title: exportConfig.drafterTitle || 'Dual Reference: Color Study & Calibrated Grid',
      artistName: exportConfig.artistName || 'GridSketch Artist',
      sheetPreset: paper.preset,
      orientation: 'Side-by-Side Dual',
      dimensionsMm: `${scaleInfo.paperWidthMm * 2} × ${scaleInfo.paperHeightMm} mm (Combined)`,
      gridMatrix: `${grid.columns} × ${grid.rows} (${grid.columns * grid.rows} Cells)`,
      cellSizeMm: `${scaleInfo.cellWidthMm.toFixed(1)} × ${scaleInfo.cellHeightMm.toFixed(1)} mm`,
      cellSizeIn: `${scaleInfo.cellWidthIn.toFixed(2)}″ × ${scaleInfo.cellHeightIn.toFixed(2)}″`,
      filterMode: filterName,
      dateStr: new Date().toISOString().slice(0, 10),
    };
    drawDraftersSpecLegend(ctx, 0, footerY, totalW, drafterLegendHeight, drafterSpecs, 'dark');
  } else if (exportConfig.includeScaleWatermark && standardFooterHeight > 0) {
    ctx.fillStyle = '#181b23';
    ctx.fillRect(0, footerY, totalW, standardFooterHeight);

    const fontSize = Math.max(11, Math.round(standardFooterHeight * 0.35));
    ctx.font = `500 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const textY = footerY + standardFooterHeight / 2;
    ctx.fillText(`GridSketch Dual Reference • Left: Clean Study • Right: Calibrated ${grid.columns}×${grid.rows} Grid`, 20, textY);

    ctx.textAlign = 'right';
    ctx.fillText(`${paper.preset}: ${scaleInfo.cellWidthMm.toFixed(1)}×${scaleInfo.cellHeightMm.toFixed(1)}mm per square`, totalW - 20, textY);
  }

  return canvas;
}

/**
 * Safely detect if Web Share or Capacitor Native Share is supported
 */
export function canShareFiles(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
}

/**
 * Safely trigger a download without prematurely revoking the Blob URL.
 * Modern browsers (Chrome, Safari, Firefox) process downloads asynchronously;
 * revoking the blob URL synchronously causes the download to fail or show "blob:... Failed".
 */
export function triggerFileDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.target = '_self';
  document.body.appendChild(link);

  try {
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    link.dispatchEvent(clickEvent);
  } catch {
    link.click();
  }

  // Delay revocation by 60 seconds so browser download manager has finished reading the blob
  setTimeout(() => {
    try {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    } catch {
      // Ignore if already revoked
    }
  }, 60000);
}

/**
 * Helper to obtain a Blob from the canvas across modern browsers and webviews.
 */
export function getCanvasBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else {
              const dataUrl = canvas.toDataURL(mimeType, quality);
              fetch(dataUrl)
                .then((res) => res.blob())
                .then(resolve)
                .catch(reject);
            }
          },
          mimeType,
          quality
        );
      } else {
        const dataUrl = canvas.toDataURL(mimeType, quality);
        fetch(dataUrl)
          .then((res) => res.blob())
          .then(resolve)
          .catch(reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Direct Download: Saves image directly to device filesystem (Documents & Downloads)
 * without triggering the Share sheet.
 */
export async function downloadImage(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' | 'jpeg',
  quality: number = 0.95
): Promise<{ method: 'download'; path?: string; filename: string }> {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const cleanFilename = filename.replace(/\.[^/.]+$/, '') + `_gridsketch.${ext}`;

  // Native Capacitor App (Android APK / iOS app)
  if (Capacitor.isNativePlatform()) {
    try {
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const base64Data = dataUrl.split(',')[1];

      let savedUri = cleanFilename;

      // 1. Write file to Documents directory (standard accessible storage on Android)
      try {
        const docRes = await Filesystem.writeFile({
          path: `GridSketch/${cleanFilename}`,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
        savedUri = docRes.uri || `Documents/GridSketch/${cleanFilename}`;
      } catch {
        const docRes = await Filesystem.writeFile({
          path: cleanFilename,
          data: base64Data,
          directory: Directory.Documents,
        });
        savedUri = docRes.uri || `Documents/${cleanFilename}`;
      }

      // 2. Also write to ExternalStorage Download folder for immediate Downloads visibility
      try {
        await Filesystem.writeFile({
          path: `Download/${cleanFilename}`,
          data: base64Data,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
      } catch (e) {
        console.warn('ExternalStorage copy skipped:', e);
      }

      // 3. Trigger web download in WebView as extra assurance
      try {
        triggerFileDownload(dataUrl, cleanFilename);
      } catch {
        // Fallback
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      return { method: 'download', path: savedUri, filename: cleanFilename };
    } catch (capErr: unknown) {
      console.warn('Capacitor native download failed, trying Web fallback:', capErr);
    }
  }

  // Web Browser Download fallback
  const blob = await getCanvasBlob(canvas, mimeType, quality);
  try {
    const url = URL.createObjectURL(blob);
    triggerFileDownload(url, cleanFilename);
  } catch (err) {
    console.warn('Blob URL download failed, using dataURL fallback:', err);
    const dataUrl = canvas.toDataURL(mimeType, quality);
    triggerFileDownload(dataUrl, cleanFilename);
  }

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 },
  });

  return { method: 'download', filename: cleanFilename };
}

/**
 * Share Image: Explicitly opens the Android Native Share sheet or Web Share API.
 */
export async function shareImage(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' | 'jpeg',
  quality: number = 0.95
): Promise<{ method: 'share'; filename: string }> {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const cleanFilename = filename.replace(/\.[^/.]+$/, '') + `_gridsketch.${ext}`;

  if (Capacitor.isNativePlatform()) {
    const dataUrl = canvas.toDataURL(mimeType, quality);
    const base64Data = dataUrl.split(',')[1];
    const cached = await Filesystem.writeFile({
      path: cleanFilename,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'GridSketch Reference',
      text: `GridSketch reference: ${cleanFilename}`,
      url: cached.uri,
      dialogTitle: 'Share Reference',
    });

    confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
    return { method: 'share', filename: cleanFilename };
  }

  // Web Share
  const blob = await getCanvasBlob(canvas, mimeType, quality);
  if (canShareFiles()) {
    try {
      const file = new File([blob], cleanFilename, { type: mimeType });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'GridSketch Reference',
          text: `Calibrated drawing reference: ${cleanFilename}`,
        });
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
        return { method: 'share', filename: cleanFilename };
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
        return { method: 'share', filename: cleanFilename };
      }
    }
  }

  // Fallback to direct download
  await downloadImage(canvas, filename, format, quality);
  return { method: 'share', filename: cleanFilename };
}

/**
 * Multi-page Poster PDF Split for large canvas drawings on home printers.
 * Slices the gridded artwork across standard home printer pages (A4 / Letter)
 * with overlap glue borders, registration crosshairs, and tile coordinates.
 */
export async function downloadPosterPdf(
  canvas: HTMLCanvasElement,
  filename: string,
  paper: PaperConfig,
  grid: GridConfig,
  posterConfig?: PosterSplitConfig
): Promise<{ method: 'download' | 'share'; filename: string; path?: string }> {
  const { jsPDF } = await import('jspdf');

  const rows = Math.max(1, Math.min(6, posterConfig?.rows || 2));
  const cols = Math.max(1, Math.min(6, posterConfig?.columns || 2));
  const overlapMm = Math.max(5, Math.min(30, posterConfig?.overlapMm || 10));
  const totalSheets = rows * cols;

  const isLandscape = paper.orientation === 'landscape';
  const format =
    paper.preset === 'Custom'
      ? [paper.customWidthMm || 210, paper.customHeightMm || 297]
      : paper.preset.toLowerCase();

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12; // 12mm page margin

  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2 - 14;

  const tileW = canvas.width / cols;
  const tileH = canvas.height / rows;

  const offscreenTile = document.createElement('canvas');
  offscreenTile.width = Math.round(tileW);
  offscreenTile.height = Math.round(tileH);
  const tileCtx = offscreenTile.getContext('2d');

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sheetIndex = r * cols + c + 1;
      if (sheetIndex > 1) {
        doc.addPage(format, isLandscape ? 'landscape' : 'portrait');
      }

      // Slice out current tile from the main gridded canvas
      if (tileCtx) {
        tileCtx.clearRect(0, 0, offscreenTile.width, offscreenTile.height);
        tileCtx.drawImage(
          canvas,
          Math.round(c * tileW),
          Math.round(r * tileH),
          Math.round(tileW),
          Math.round(tileH),
          0,
          0,
          offscreenTile.width,
          offscreenTile.height
        );
      }

      // 1. Header Banner
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(
        `GRIDSKETCH POSTER MULTI-TILE SYSTEM • SHEET ${sheetIndex} OF ${totalSheets}`,
        margin,
        margin - 2
      );

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Tile [Row ${r + 1} of ${rows}, Col ${c + 1} of ${cols}] • Overlap: ${overlapMm} mm`,
        pageWidth - margin,
        margin - 2,
        { align: 'right' }
      );

      // Fit tile within printable area
      const tileRatio = tileW / tileH;
      let renderW = maxW;
      let renderH = maxW / tileRatio;
      if (renderH > maxH) {
        renderH = maxH;
        renderW = maxH * tileRatio;
      }

      const posX = (pageWidth - renderW) / 2;
      const posY = margin + 4;

      // 2. Add Sliced Tile Image
      const tileDataUrl = offscreenTile.toDataURL('image/jpeg', 0.95);
      doc.addImage(tileDataUrl, 'JPEG', posX, posY, renderW, renderH);

      // 3. Draw Cut/Glue Registration Guides & Corner Crosshairs
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([2, 2], 0);
      doc.setLineWidth(0.3);
      doc.rect(posX, posY, renderW, renderH);

      // Corner Crosshairs for physical alignment
      const crossSize = 3;
      doc.setLineDashPattern([], 0);
      doc.setDrawColor(2, 132, 199);
      doc.setLineWidth(0.4);

      // 4 corners
      const corners = [
        [posX, posY],
        [posX + renderW, posY],
        [posX, posY + renderH],
        [posX + renderW, posY + renderH],
      ];
      for (const [cx, cy] of corners) {
        doc.line(cx - crossSize, cy, cx + crossSize, cy);
        doc.line(cx, cy - crossSize, cx, cy + crossSize);
      }

      // 4. Poster Sheet Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const footerMsg = `✂ Cut along dashed lines • Align registration crosshairs (+) • Assembly: ${cols} across × ${rows} down`;
      doc.text(footerMsg, pageWidth / 2, pageHeight - 4, { align: 'center' });
    }
  }

  const cleanFilename = filename.replace(/\.[^/.]+$/, '') + `_poster_${cols}x${rows}.pdf`;

  // Native Mobile APK (Direct Save to Documents & Downloads without opening share sheet)
  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.split(',')[1];

      try {
        await Filesystem.writeFile({
          path: `GridSketch/${cleanFilename}`,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch {
        await Filesystem.writeFile({
          path: cleanFilename,
          data: base64Data,
          directory: Directory.Documents,
        });
      }

      try {
        await Filesystem.writeFile({
          path: `Download/${cleanFilename}`,
          data: base64Data,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
      } catch (e) {
        console.warn('Documents save fallback:', e);
      }

      try {
        doc.save(cleanFilename);
      } catch {
        // Ignore webview save
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      return { method: 'download', filename: cleanFilename };
    } catch (capErr: unknown) {
      console.warn('Capacitor native poster export failed, using web fallback:', capErr);
    }
  }

  // Direct Browser Download
  doc.save(cleanFilename);
  confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  return { method: 'download', filename: cleanFilename };
}

/**
 * Explicit Share action for Multi-Tile Poster PDF.
 */
export async function sharePosterPdf(
  canvas: HTMLCanvasElement,
  filename: string,
  paper: PaperConfig,
  grid: GridConfig,
  posterConfig?: PosterSplitConfig
): Promise<{ method: 'share'; filename: string }> {
  const { jsPDF } = await import('jspdf');

  const rows = Math.max(1, Math.min(6, posterConfig?.rows || 2));
  const cols = Math.max(1, Math.min(6, posterConfig?.columns || 2));
  const overlapMm = Math.max(5, Math.min(30, posterConfig?.overlapMm || 10));
  const totalSheets = rows * cols;

  const isLandscape = paper.orientation === 'landscape';
  const format =
    paper.preset === 'Custom'
      ? [paper.customWidthMm || 210, paper.customHeightMm || 297]
      : paper.preset.toLowerCase();

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2 - 14;

  const tileW = canvas.width / cols;
  const tileH = canvas.height / rows;

  const offscreenTile = document.createElement('canvas');
  offscreenTile.width = Math.round(tileW);
  offscreenTile.height = Math.round(tileH);
  const tileCtx = offscreenTile.getContext('2d');

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sheetIndex = r * cols + c + 1;
      if (sheetIndex > 1) {
        doc.addPage(format, isLandscape ? 'landscape' : 'portrait');
      }

      if (tileCtx) {
        tileCtx.clearRect(0, 0, offscreenTile.width, offscreenTile.height);
        tileCtx.drawImage(
          canvas,
          Math.round(c * tileW),
          Math.round(r * tileH),
          Math.round(tileW),
          Math.round(tileH),
          0,
          0,
          offscreenTile.width,
          offscreenTile.height
        );
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(
        `GRIDSKETCH POSTER MULTI-TILE SYSTEM • SHEET ${sheetIndex} OF ${totalSheets}`,
        margin,
        margin - 2
      );

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Tile [Row ${r + 1} of ${rows}, Col ${c + 1} of ${cols}] • Overlap: ${overlapMm} mm`,
        pageWidth - margin,
        margin - 2,
        { align: 'right' }
      );

      const tileRatio = tileW / tileH;
      let renderW = maxW;
      let renderH = maxW / tileRatio;
      if (renderH > maxH) {
        renderH = maxH;
        renderW = maxH * tileRatio;
      }

      const posX = (pageWidth - renderW) / 2;
      const posY = margin + 4;

      const tileDataUrl = offscreenTile.toDataURL('image/jpeg', 0.95);
      doc.addImage(tileDataUrl, 'JPEG', posX, posY, renderW, renderH);

      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([2, 2], 0);
      doc.setLineWidth(0.3);
      doc.rect(posX, posY, renderW, renderH);

      const crossSize = 3;
      doc.setLineDashPattern([], 0);
      doc.setDrawColor(2, 132, 199);
      doc.setLineWidth(0.4);

      const corners = [
        [posX, posY],
        [posX + renderW, posY],
        [posX, posY + renderH],
        [posX + renderW, posY + renderH],
      ];
      for (const [cx, cy] of corners) {
        doc.line(cx - crossSize, cy, cx + crossSize, cy);
        doc.line(cx, cy - crossSize, cx, cy + crossSize);
      }

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const footerMsg = `✂ Cut along dashed lines • Align registration crosshairs (+) • Assembly: ${cols} across × ${rows} down`;
      doc.text(footerMsg, pageWidth / 2, pageHeight - 4, { align: 'center' });
    }
  }

  const cleanFilename = filename.replace(/\.[^/.]+$/, '') + `_poster_${cols}x${rows}.pdf`;

  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.split(',')[1];

      const cached = await Filesystem.writeFile({
        path: cleanFilename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'GridSketch Poster PDF',
        text: `Multi-tile poster sheet (${cols}×${rows}): ${cleanFilename}`,
        url: cached.uri,
        dialogTitle: 'Share Multi-Tile Poster PDF',
      });

      confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
      return { method: 'share', filename: cleanFilename };
    } catch (capErr: unknown) {
      if (
        capErr instanceof Error &&
        (capErr.name === 'AbortError' ||
          capErr.message?.includes('canceled') ||
          capErr.message?.includes('closed') ||
          capErr.message?.includes('dismissed'))
      ) {
        return { method: 'share', filename: cleanFilename };
      }
    }
  }

  if (canShareFiles()) {
    try {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'GridSketch Poster Reference',
          text: `Printable multi-tile poster (${cols}×${rows}): ${cleanFilename}`,
        });
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
        return { method: 'share', filename: cleanFilename };
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
        return { method: 'share', filename: cleanFilename };
      }
    }
  }

  // Fallback to direct download
  const res = await downloadPosterPdf(canvas, filename, paper, grid, posterConfig);
  return { method: 'share', filename: res.filename };
}

/**
 * Export high-resolution PDF formatted for standard artist paper (A4, Letter, etc.)
 * Supports standard single reference, matching blank grid sheets, side-by-side dual,
 * and delegates to downloadPosterPdf if poster mode is selected.
 */
export async function downloadPdf(
  canvas: HTMLCanvasElement,
  filename: string,
  paper: PaperConfig,
  grid: GridConfig,
  exportConfig?: ExportConfig
): Promise<{ method: 'download' | 'share'; filename: string; path?: string }> {
  // If Poster Multi-Tile Split is requested, route to downloadPosterPdf
  if (exportConfig?.exportMode === 'poster') {
    return downloadPosterPdf(
      canvas,
      filename,
      paper,
      grid,
      exportConfig.posterConfig
    );
  }

  // Dynamically import jsPDF to keep initial bundle size lean
  const { jsPDF } = await import('jspdf');

  const isLandscape = paper.orientation === 'landscape';
  const format =
    paper.preset === 'Custom'
      ? [paper.customWidthMm || 200, paper.customHeightMm || 200]
      : paper.preset.toLowerCase();

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10; // 10mm margins

  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2 - 12; // Extra room for header & footer info

  const imgRatio = canvas.width / canvas.height;
  let renderW = maxW;
  let renderH = maxW / imgRatio;

  if (renderH > maxH) {
    renderH = maxH;
    renderW = maxH * imgRatio;
  }

  const posX = (pageWidth - renderW) / 2;
  const posY = margin + 6;

  // Title header on PDF
  const isBlank = exportConfig?.exportMode === 'blank_grid';
  const isDual = exportConfig?.exportMode === 'side_by_side';
  const headerTitle = isBlank
    ? 'GridSketch — Matching Blank Grid Sheet (Calibrated)'
    : isDual
    ? 'GridSketch — Side-by-Side Dual Reference (Color & Grid)'
    : 'GridSketch — Digital Drawing Assistant Reference';

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(headerTitle, margin, margin);

  // Add high-resolution image
  const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgDataUrl, 'JPEG', posX, posY, renderW, renderH);

  // Artist scale footer
  const scaleInfo = calculatePaperGridScale(canvas.width, canvas.height, grid.rows, grid.columns, paper, 0, grid);
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  const footerText = `${scaleInfo.rulerSummary} | Printable size: ${renderW.toFixed(1)} × ${renderH.toFixed(1)} mm`;
  doc.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });

  const modeSuffix = isBlank ? '_blank_grid' : isDual ? '_dual_reference' : '';
  const cleanFilename = filename.replace(/\.[^/.]+$/, '') + `${modeSuffix}_gridsketch.pdf`;

  // Native Capacitor App (Android APK / iOS app) - Direct Save to Documents & Downloads
  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.split(',')[1];

      let savedUri = cleanFilename;

      try {
        const docRes = await Filesystem.writeFile({
          path: `GridSketch/${cleanFilename}`,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
        savedUri = docRes.uri || `Documents/GridSketch/${cleanFilename}`;
      } catch {
        const docRes = await Filesystem.writeFile({
          path: cleanFilename,
          data: base64Data,
          directory: Directory.Documents,
        });
        savedUri = docRes.uri || `Documents/${cleanFilename}`;
      }

      try {
        await Filesystem.writeFile({
          path: `Download/${cleanFilename}`,
          data: base64Data,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
      } catch (docErr) {
        console.warn('Downloads save copy skipped:', docErr);
      }

      try {
        doc.save(cleanFilename);
      } catch {
        // Ignore webview save
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      return { method: 'download', filename: cleanFilename, path: savedUri };
    } catch (capErr: unknown) {
      console.warn('Capacitor native PDF export failed, trying Web fallback:', capErr);
    }
  }

  // Fallback: standard jsPDF save
  doc.save(cleanFilename);

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 },
  });

  return { method: 'download', filename: cleanFilename };
}

/**
 * Explicit Share action for single-sheet PDF reference.
 */
export async function sharePdf(
  canvas: HTMLCanvasElement,
  filename: string,
  paper: PaperConfig,
  grid: GridConfig,
  exportConfig?: ExportConfig
): Promise<{ method: 'share'; filename: string }> {
  if (exportConfig?.exportMode === 'poster') {
    return sharePosterPdf(
      canvas,
      filename,
      paper,
      grid,
      exportConfig.posterConfig
    );
  }

  const { jsPDF } = await import('jspdf');

  const isLandscape = paper.orientation === 'landscape';
  const format =
    paper.preset === 'Custom'
      ? [paper.customWidthMm || 200, paper.customHeightMm || 200]
      : paper.preset.toLowerCase();

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2 - 12;

  const imgRatio = canvas.width / canvas.height;
  let renderW = maxW;
  let renderH = maxW / imgRatio;

  if (renderH > maxH) {
    renderH = maxH;
    renderW = maxH * imgRatio;
  }

  const posX = (pageWidth - renderW) / 2;
  const posY = margin + 6;

  const isBlank = exportConfig?.exportMode === 'blank_grid';
  const isDual = exportConfig?.exportMode === 'side_by_side';
  const headerTitle = isBlank
    ? 'GridSketch — Matching Blank Grid Sheet (Calibrated)'
    : isDual
    ? 'GridSketch — Side-by-Side Dual Reference (Color & Grid)'
    : 'GridSketch — Digital Drawing Assistant Reference';

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(headerTitle, margin, margin);

  const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgDataUrl, 'JPEG', posX, posY, renderW, renderH);

  const scaleInfo = calculatePaperGridScale(canvas.width, canvas.height, grid.rows, grid.columns, paper, 0, grid);
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  const footerText = `${scaleInfo.rulerSummary} | Printable size: ${renderW.toFixed(1)} × ${renderH.toFixed(1)} mm`;
  doc.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });

  const modeSuffix = isBlank ? '_blank_grid' : isDual ? '_dual_reference' : '';
  const cleanFilename = filename.replace(/\.[^/.]+$/, '') + `${modeSuffix}_gridsketch.pdf`;

  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.split(',')[1];

      const cached = await Filesystem.writeFile({
        path: cleanFilename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'GridSketch PDF Reference',
        text: `GridSketch printable reference: ${cleanFilename}`,
        url: cached.uri,
        dialogTitle: 'Share PDF Reference',
      });

      confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
      return { method: 'share', filename: cleanFilename };
    } catch (capErr: unknown) {
      if (
        capErr instanceof Error &&
        (capErr.name === 'AbortError' ||
          capErr.message?.includes('canceled') ||
          capErr.message?.includes('closed') ||
          capErr.message?.includes('dismissed'))
      ) {
        return { method: 'share', filename: cleanFilename };
      }
    }
  }

  if (canShareFiles()) {
    try {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'GridSketch PDF Reference',
          text: `Printable drawing reference sheet: ${cleanFilename}`,
        });
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
        return { method: 'share', filename: cleanFilename };
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
        return { method: 'share', filename: cleanFilename };
      }
    }
  }

  // Fallback to direct download
  const res = await downloadPdf(canvas, filename, paper, grid, exportConfig);
  return { method: 'share', filename: res.filename };
}


