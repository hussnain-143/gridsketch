import { ExportConfig, GridConfig, PaperConfig } from '@/types/editor';
import { drawGridOverlay, drawGridOverlayOnRect } from './grid-renderer';
import { calculatePaperGridScale, calculatePageFraming } from './paper-calculator';
import confetti from 'canvas-confetti';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Creates a high-resolution export canvas with the processed image,
 * optional grid overlay, optional labels, and optional metadata footer banner.
 */
export function createExportCanvas(
  processedCanvas: HTMLCanvasElement,
  grid: GridConfig,
  exportConfig: ExportConfig,
  paper: PaperConfig,
  filterName: string
): HTMLCanvasElement {
  const { includeGrid, includeLabels, includeScaleWatermark } = exportConfig;
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
    if (framing.backgroundColor && framing.backgroundColor !== 'transparent') {
      bgFillColor = framing.backgroundColor;
    }
  } else {
    exportW = processedCanvas.width;
    exportH = processedCanvas.height;
  }

  const footerHeight = includeScaleWatermark ? Math.max(36, Math.round(exportH * 0.05)) : 0;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = exportW;
  exportCanvas.height = exportH + footerHeight;

  const ctx = exportCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not get export canvas 2d context');

  // Fill background with chosen canvas/matting color
  ctx.fillStyle = bgFillColor;
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Draw processed image (clipped to page frame if page standard selected)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, exportW, exportH);
  ctx.clip();
  ctx.drawImage(processedCanvas, drawImgX, drawImgY, drawImgW, drawImgH);
  ctx.restore();

  // Draw grid & labels if requested
  if (includeGrid) {
    const isCustomOrContain = paper?.fitMode && paper.fitMode !== 'cover';
    const target = paper?.gridTarget || (isCustomOrContain ? 'image' : 'paper');
    if (target === 'image' && isPage && drawImgW > 0 && drawImgH > 0) {
      drawGridOverlayOnRect(ctx, drawImgX, drawImgY, drawImgW, drawImgH, grid, includeLabels);
    } else {
      drawGridOverlay(ctx, exportW, exportH, grid, includeLabels);
    }
  }

  // Draw metadata footer banner if requested
  if (includeScaleWatermark && footerHeight > 0) {
    const scaleInfo = calculatePaperGridScale(exportW, exportH, grid.rows, grid.columns, paper);
    ctx.fillStyle = '#181b23';
    ctx.fillRect(0, exportH, exportW, footerHeight);

    const fontSize = Math.max(11, Math.round(footerHeight * 0.35));
    ctx.font = `500 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const textY = exportH + footerHeight / 2;
    const title = `GridSketch Reference • Grid: ${grid.columns}×${grid.rows} • Mode: ${filterName}`;
    ctx.fillText(title, 20, textY);

    ctx.textAlign = 'right';
    const scaleText = `${paper.preset}: ${scaleInfo.cellWidthMm.toFixed(1)}×${scaleInfo.cellHeightMm.toFixed(1)}mm per square`;
    ctx.fillText(scaleText, exportW - 20, textY);
  }

  return exportCanvas;
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
 * Download or Share canvas as PNG or JPG file.
 * On native mobile APK (Capacitor Android/iOS), saves directly to the device filesystem
 * and triggers Android native Share sheet so the user can save to Photos, Files, or Google Drive.
 */
export async function downloadImage(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' | 'jpeg',
  quality: number = 0.95,
  preferShareOnMobile: boolean = true
): Promise<{ method: 'share' | 'download' }> {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const cleanFilename = filename.replace(/\.[^/.]+$/, '') + `_gridsketch.${ext}`;

  // Native Capacitor App (Android APK / iOS app)
  if (Capacitor.isNativePlatform()) {
    try {
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const base64Data = dataUrl.split(',')[1];

      // 1. Write file to Cache directory (guaranteed accessible for Android file sharing)
      const cached = await Filesystem.writeFile({
        path: cleanFilename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // 2. Also write to Documents directory so file is saved locally on device
      try {
        await Filesystem.writeFile({
          path: cleanFilename,
          data: base64Data,
          directory: Directory.Documents,
        });
      } catch (docErr) {
        console.warn('Could not save duplicate to Documents:', docErr);
      }

      // 3. Open Android Native Share Intent (allowing user to save to Photos, Google Drive, Downloads, WhatsApp)
      await Share.share({
        title: 'GridSketch Reference',
        text: `GridSketch reference: ${cleanFilename}`,
        url: cached.uri,
        dialogTitle: 'Save or Share Reference',
      });

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });

      return { method: 'share' };
    } catch (capErr: unknown) {
      if (
        capErr instanceof Error &&
        (capErr.name === 'AbortError' ||
          capErr.message?.includes('canceled') ||
          capErr.message?.includes('closed') ||
          capErr.message?.includes('dismissed'))
      ) {
        return { method: 'share' };
      }
      console.warn('Capacitor native export failed, trying Web fallback:', capErr);
    }
  }

  // Helper to obtain a Blob from the canvas
  const getBlob = (): Promise<Blob> => {
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
  };

  const blob = await getBlob();

  // Try Web Share API on mobile browsers
  if (preferShareOnMobile && canShareFiles()) {
    try {
      const file = new File([blob], cleanFilename, { type: mimeType });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'GridSketch Reference',
          text: `Calibrated drawing reference: ${cleanFilename}`,
        });
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
        });
        return { method: 'share' };
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
        return { method: 'share' };
      }
      console.warn('Web Share failed, falling back to direct download:', err);
    }
  }

  // Fallback: standard file download via blob URL or data URL
  try {
    const url = URL.createObjectURL(blob);
    triggerFileDownload(url, cleanFilename);
  } catch (err) {
    console.warn('Blob URL download failed, using dataURL fallback:', err);
    const dataUrl = canvas.toDataURL(mimeType, quality);
    triggerFileDownload(dataUrl, cleanFilename);
  }

  confetti({
    particleCount: 40,
    spread: 50,
    origin: { y: 0.8 },
  });

  return { method: 'download' };
}

/**
 * Export high-resolution PDF formatted for standard artist paper (A4, Letter, etc.)
 * On native mobile APK (Capacitor Android/iOS), saves directly to the device filesystem
 * and triggers Android native Share sheet so the user can save to Files, Google Drive, or Print.
 */
export async function downloadPdf(
  canvas: HTMLCanvasElement,
  filename: string,
  paper: PaperConfig,
  grid: GridConfig,
  preferShareOnMobile: boolean = true
): Promise<{ method: 'share' | 'download' }> {
  // Dynamically import jsPDF to keep initial bundle size lean
  const { jsPDF } = await import('jspdf');

  const isLandscape = paper.orientation === 'landscape';
  const format = paper.preset === 'Custom' ? [paper.customWidthMm || 200, paper.customHeightMm || 200] : paper.preset.toLowerCase();

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
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('GridSketch — Digital Drawing Assistant Reference', margin, margin);

  // Add high-resolution image
  const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgDataUrl, 'JPEG', posX, posY, renderW, renderH);

  // Artist scale footer
  const scaleInfo = calculatePaperGridScale(canvas.width, canvas.height, grid.rows, grid.columns, paper);
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  const footerText = `${scaleInfo.rulerSummary} | Printable size: ${renderW.toFixed(1)} × ${renderH.toFixed(1)} mm`;
  doc.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });

  const cleanFilename = filename.replace(/\.[^/.]+$/, '') + `_gridsketch.pdf`;

  // Native Capacitor App (Android APK / iOS app)
  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.split(',')[1];

      // 1. Write file to Cache
      const cached = await Filesystem.writeFile({
        path: cleanFilename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // 2. Also write to Documents
      try {
        await Filesystem.writeFile({
          path: cleanFilename,
          data: base64Data,
          directory: Directory.Documents,
        });
      } catch (docErr) {
        console.warn('Could not save duplicate PDF to Documents:', docErr);
      }

      // 3. Open Android Share Sheet
      await Share.share({
        title: 'GridSketch PDF Reference',
        text: `GridSketch printable reference: ${cleanFilename}`,
        url: cached.uri,
        dialogTitle: 'Save or Share PDF Reference',
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      return { method: 'share' };
    } catch (capErr: unknown) {
      if (
        capErr instanceof Error &&
        (capErr.name === 'AbortError' ||
          capErr.message?.includes('canceled') ||
          capErr.message?.includes('closed') ||
          capErr.message?.includes('dismissed'))
      ) {
        return { method: 'share' };
      }
      console.warn('Capacitor native PDF export failed, trying Web fallback:', capErr);
    }
  }

  // On mobile web / supported devices, try Web Share API with the PDF file
  if (preferShareOnMobile && canShareFiles()) {
    try {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'GridSketch PDF Reference',
          text: `Printable drawing reference sheet: ${cleanFilename}`,
        });
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
        return { method: 'share' };
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
        return { method: 'share' };
      }
      console.warn('PDF Web Share failed, falling back to doc.save:', err);
    }
  }

  // Fallback: standard jsPDF save
  doc.save(cleanFilename);

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 },
  });

  return { method: 'download' };
}
