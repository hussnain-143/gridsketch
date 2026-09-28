export type FilterMode = 'original' | 'grayscale' | 'high_contrast';

export type LabelMode = 'alphanumeric' | 'numeric' | 'none';

export type GridSizeMode = 'number' | 'size';
export type GridSizeUnit = 'mm' | 'cm' | 'in' | 'px';

export interface GridConfig {
  rows: number;
  columns: number;
  color: string;
  opacity: number; // 0 to 1
  thickness: number; // 1 to 10 px
  labelMode: LabelMode;
  labelColor: string;
  labelSize: number; // 10 to 32 px
  showCenterLines: boolean;
  showDiagonals: boolean;
  subdivisions: number; // 1 (none), 2 (half-cells), 4 (quarter-cells)
  lockAspectRatio: boolean;
  gridMode?: GridSizeMode;
  sizeUnit?: GridSizeUnit;
  cellSize?: number;
}

export interface AdjustmentConfig {
  brightness: number; // -100 to 100 (0 default)
  contrast: number; // -100 to 100 (0 default)
  exposure: number; // -100 to 100 (0 default)
  shadows: number; // -100 to 100 (0 default)
  highlights: number; // -100 to 100 (0 default)
  saturation: number; // -100 to 100 (0 default)
  sharpness: number; // 0 to 100 (0 default)
  blur: number; // 0 to 20 (0 default)
  threshold: number; // 0 to 255 (128 default, used in B&W mode)
  posterizeLevels: number; // 3 to 8 (4 default, used in Value Study)
}

export interface CropRect {
  x: number; // 0 to 1 normalized
  y: number;
  width: number;
  height: number;
}

export type AspectRatioPreset =
  | 'original'
  | '1:1'
  | '4:3'
  | '3:4'
  | '16:9'
  | '9:16'
  | '2:3'
  | '3:2'
  | 'custom';

export interface TransformConfig {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  crop: CropRect | null;
  aspectRatio: AspectRatioPreset;
}

export type PaperPreset = 'A4' | 'A3' | 'A2' | 'Letter' | 'Legal' | 'Custom';
export type PaperOrientation = 'portrait' | 'landscape';

export type ImageFitMode = 'cover' | 'contain' | 'auto' | 'custom';
export type ImageAlignment =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';
export type FitLengthUnit = 'px' | '%' | 'mm' | 'cm';
export type GridTarget = 'image' | 'paper';

export interface PaperConfig {
  preset: PaperPreset;
  orientation: PaperOrientation;
  customWidthMm: number;
  customHeightMm: number;
  imageOffsetX?: number; // horizontal pan offset in px relative to center
  imageOffsetY?: number; // vertical pan offset in px relative to center
  imageZoom?: number; // zoom multiplier (1.0 = default cover fit, up to 4.0)
  fitMode?: ImageFitMode; // 'cover' (fills container), 'contain' (fits completely), 'auto', 'custom' (specific lengths)
  fitCustomWidth?: number; // specific width (e.g. 100)
  fitCustomHeight?: number; // specific height (e.g. 50)
  fitCustomUnit?: FitLengthUnit; // 'px', '%', 'mm', 'cm'
  fitLockAspect?: boolean; // lock aspect ratio when setting specific lengths
  fitAlignment?: ImageAlignment; // alignment inside container
  canvasBackground?: string; // background color when letterboxed (e.g. '#ffffff', '#12151d', 'transparent')
  gridTarget?: GridTarget; // 'image' (grid covers the photo) or 'paper' (grid covers full paper sheet)
}

export type ExportFormat = 'png' | 'jpeg' | 'pdf';

export interface ExportConfig {
  format: ExportFormat;
  includeGrid: boolean;
  includeLabels: boolean;
  includeScaleWatermark: boolean;
  quality: number; // 0.1 to 1.0
}

export interface ImageState {
  src: string;
  name: string;
  naturalWidth: number;
  naturalHeight: number;
}

export interface EditorHistoryEntry {
  grid: GridConfig;
  adjustments: AdjustmentConfig;
  mode: FilterMode;
  transform: TransformConfig;
  paper: PaperConfig;
}
