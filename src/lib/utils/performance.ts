/**
 * Debounce a function call by delay milliseconds.
 */
export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  wait: number
): ((...args: Args) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * Throttle a function execution to the browser's requestAnimationFrame cycle.
 * Perfect for 60fps/120fps smooth drag, pan, and interactive canvas manipulations.
 */
export function throttleRaf<Args extends unknown[]>(
  func: (...args: Args) => void
): ((...args: Args) => void) & { cancel: () => void } {
  let rafId: number | null = null;
  let latestArgs: Args | null = null;

  const throttled = (...args: Args) => {
    latestArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs) {
          func(...latestArgs);
          latestArgs = null;
        }
        rafId = null;
      });
    }
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    latestArgs = null;
  };

  return throttled;
}

/**
 * Pre-computes a 256-value 8-bit lookup table for pixel transformations.
 * Eliminates millions of floating-point math calls inside pixel loops.
 */
export function createLUT(transformFn: (val: number) => number): Uint8Array {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.min(255, Math.max(0, Math.round(transformFn(i))));
  }
  return lut;
}
