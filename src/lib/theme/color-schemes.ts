export interface ColorScheme {
  id: string;
  name: string;
  badge: string;
  accent: string; // Primary hex
  accentHover: string;
  accentLight: string;
  accentDark: string;
  accentGlow: string;
  accentContrastText: string;
  bgDark: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  borderSubtle: string;
  isDark: boolean;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'amber',
    name: 'Obsidian Amber',
    badge: 'Classic Studio',
    accent: '#f59e0b',
    accentHover: '#fbbf24',
    accentLight: '#fde68a',
    accentDark: '#d97706',
    accentGlow: 'rgba(245, 158, 11, 0.28)',
    accentContrastText: '#0b0f19',
    bgDark: '#0d0f14',
    surfacePrimary: '#151821',
    surfaceSecondary: '#1e2230',
    surfaceTertiary: '#2a3042',
    borderSubtle: '#272d3d',
    isDark: true,
  },
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    badge: 'Electric Teal',
    accent: '#06b6d4',
    accentHover: '#22d3ee',
    accentLight: '#a5f3fc',
    accentDark: '#0891b2',
    accentGlow: 'rgba(6, 182, 212, 0.28)',
    accentContrastText: '#04151f',
    bgDark: '#070d14',
    surfacePrimary: '#0f1724',
    surfaceSecondary: '#162334',
    surfaceTertiary: '#203248',
    borderSubtle: '#1d324b',
    isDark: true,
  },
  {
    id: 'emerald',
    name: 'Emerald Atelier',
    badge: 'Botanical Sage',
    accent: '#10b981',
    accentHover: '#34d399',
    accentLight: '#a7f3d0',
    accentDark: '#059669',
    accentGlow: 'rgba(16, 185, 129, 0.28)',
    accentContrastText: '#021f14',
    bgDark: '#08110e',
    surfacePrimary: '#0f1f1a',
    surfaceSecondary: '#172e27',
    surfaceTertiary: '#214238',
    borderSubtle: '#1f4035',
    isDark: true,
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    badge: 'Velvet Amethyst',
    accent: '#8b5cf6',
    accentHover: '#a78bfa',
    accentLight: '#ddd6fe',
    accentDark: '#7c3aed',
    accentGlow: 'rgba(139, 92, 246, 0.28)',
    accentContrastText: '#ffffff',
    bgDark: '#0c0a17',
    surfacePrimary: '#161326',
    surfaceSecondary: '#201d36',
    surfaceTertiary: '#2d284d',
    borderSubtle: '#2e284f',
    isDark: true,
  },
  {
    id: 'crimson',
    name: 'Crimson Noir',
    badge: 'Vermilion Red',
    accent: '#ef4444',
    accentHover: '#f87171',
    accentLight: '#fecaca',
    accentDark: '#dc2626',
    accentGlow: 'rgba(239, 68, 68, 0.28)',
    accentContrastText: '#ffffff',
    bgDark: '#12090b',
    surfacePrimary: '#1f1013',
    surfaceSecondary: '#2d181c',
    surfaceTertiary: '#3e2227',
    borderSubtle: '#3e2126',
    isDark: true,
  },
  {
    id: 'rose',
    name: 'Sunset Rose',
    badge: 'Warm Coral',
    accent: '#f43f5e',
    accentHover: '#fb7185',
    accentLight: '#fecdd3',
    accentDark: '#e11d48',
    accentGlow: 'rgba(244, 63, 94, 0.28)',
    accentContrastText: '#ffffff',
    bgDark: '#120a10',
    surfacePrimary: '#1e111a',
    surfaceSecondary: '#2b1926',
    surfaceTertiary: '#3c2335',
    borderSubtle: '#3d2035',
    isDark: true,
  },
  {
    id: 'lime',
    name: 'Electric Lime',
    badge: 'Bauhaus Studio',
    accent: '#84cc16',
    accentHover: '#a3e635',
    accentLight: '#d9f99d',
    accentDark: '#65a30d',
    accentGlow: 'rgba(132, 204, 22, 0.28)',
    accentContrastText: '#0f1705',
    bgDark: '#0c1008',
    surfacePrimary: '#161c10',
    surfaceSecondary: '#202a18',
    surfaceTertiary: '#2c3a22',
    borderSubtle: '#2d3b20',
    isDark: true,
  },
  {
    id: 'light',
    name: 'Studio Light',
    badge: 'Architectural Clean',
    accent: '#0284c7',
    accentHover: '#0369a1',
    accentLight: '#38bdf8',
    accentDark: '#075985',
    accentGlow: 'rgba(2, 132, 199, 0.25)',
    accentContrastText: '#ffffff',
    bgDark: '#f8fafc',
    surfacePrimary: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    surfaceTertiary: '#e2e8f0',
    borderSubtle: '#cbd5e1',
    isDark: false,
  },
];

export const CANVAS_BACKGROUND_PRESETS = [
  { id: 'white', label: 'Gallery White', color: '#ffffff', textColor: '#000000' },
  { id: 'charcoal', label: 'Dark Charcoal', color: '#12151d', textColor: '#ffffff' },
  { id: 'navy', label: 'Blueprint Navy', color: '#0f172a', textColor: '#ffffff' },
  { id: 'parchment', label: 'Warm Parchment', color: '#f6f3eb', textColor: '#262626' },
  { id: 'transparent', label: 'Checkerboard', color: 'transparent', textColor: '#94a3b8' },
];

/**
 * Calculates lighter and darker variations of a hex color
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function adjustHexBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const factor = 1 + percent / 100;
  const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function createCustomColorScheme(hex: string): ColorScheme {
  const accent = hex.startsWith('#') ? hex : `#${hex}`;
  const rgb = hexToRgb(accent) || { r: 245, g: 158, b: 11 };
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  const contrastText = brightness > 150 ? '#0b0f19' : '#ffffff';

  return {
    id: 'custom',
    name: 'Custom Palette',
    badge: 'User Custom',
    accent,
    accentHover: adjustHexBrightness(accent, 15),
    accentLight: adjustHexBrightness(accent, 35),
    accentDark: adjustHexBrightness(accent, -20),
    accentGlow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`,
    accentContrastText: contrastText,
    bgDark: '#0d0f14',
    surfacePrimary: '#151821',
    surfaceSecondary: '#1e2230',
    surfaceTertiary: '#2a3042',
    borderSubtle: '#272d3d',
    isDark: true,
  };
}

const STORAGE_KEY_SCHEME = 'gridsketch_color_scheme';
const STORAGE_KEY_CUSTOM_HEX = 'gridsketch_custom_hex';

export function getSavedTheme(): { schemeId: string; customHex?: string } {
  if (typeof window === 'undefined') return { schemeId: 'amber' };
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SCHEME) || 'amber';
    const hex = localStorage.getItem(STORAGE_KEY_CUSTOM_HEX) || '#f59e0b';
    return { schemeId: saved, customHex: hex };
  } catch {
    return { schemeId: 'amber' };
  }
}

export function applyTheme(schemeId: string, customHex?: string): ColorScheme {
  let scheme = COLOR_SCHEMES.find((s) => s.id === schemeId);
  if (schemeId === 'custom' && customHex) {
    scheme = createCustomColorScheme(customHex);
  } else if (!scheme) {
    scheme = COLOR_SCHEMES[0];
  }

  if (typeof document !== 'undefined') {
    const root = document.documentElement;

    root.style.setProperty('--theme-accent', scheme.accent);
    root.style.setProperty('--theme-accent-hover', scheme.accentHover);
    root.style.setProperty('--theme-accent-light', scheme.accentLight);
    root.style.setProperty('--theme-accent-dark', scheme.accentDark);
    root.style.setProperty('--theme-accent-glow', scheme.accentGlow);
    root.style.setProperty('--theme-accent-text', scheme.accentContrastText);

    // Also update generic color variables
    root.style.setProperty('--color-amber-300', scheme.accentLight);
    root.style.setProperty('--color-amber-400', scheme.accentHover);
    root.style.setProperty('--color-amber-500', scheme.accent);
    root.style.setProperty('--color-amber-600', scheme.accentDark);

    if (!scheme.isDark) {
      root.style.setProperty('--background', scheme.bgDark);
      root.style.setProperty('--foreground', '#0f172a');
      root.style.setProperty('--surface-primary', scheme.surfacePrimary);
      root.style.setProperty('--surface-secondary', scheme.surfaceSecondary);
      root.style.setProperty('--surface-tertiary', scheme.surfaceTertiary);
      root.style.setProperty('--border-subtle', scheme.borderSubtle);
      document.body.classList.add('theme-light');
    } else {
      root.style.setProperty('--background', scheme.bgDark);
      root.style.setProperty('--foreground', '#f1f5f9');
      root.style.setProperty('--surface-primary', scheme.surfacePrimary);
      root.style.setProperty('--surface-secondary', scheme.surfaceSecondary);
      root.style.setProperty('--surface-tertiary', scheme.surfaceTertiary);
      root.style.setProperty('--border-subtle', scheme.borderSubtle);
      document.body.classList.remove('theme-light');
    }

    try {
      localStorage.setItem(STORAGE_KEY_SCHEME, schemeId);
      if (customHex) localStorage.setItem(STORAGE_KEY_CUSTOM_HEX, customHex);
    } catch {
      // Ignore storage errors
    }
  }

  return scheme;
}
