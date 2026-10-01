declare module 'glfx-es6' {
  export interface GLFXTexture {
    loadContentsOf(element: HTMLImageElement | HTMLCanvasElement): void;
    destroy(): void;
  }

  export interface GLFXCanvas extends HTMLCanvasElement {
    texture(element: HTMLImageElement | HTMLCanvasElement): GLFXTexture;
    draw(texture: GLFXTexture): GLFXCanvas;
    update(): GLFXCanvas;
    replace(element: HTMLCanvasElement): GLFXCanvas;
    brightnessContrast(brightness: number, contrast: number): GLFXCanvas;
    hueSaturation(hue: number, saturation: number): GLFXCanvas;
    unsharpMask(radius: number, strength: number): GLFXCanvas;
    triangleBlur(radius: number): GLFXCanvas;
    denoise(exponent: number): GLFXCanvas;
    noise(amount: number): GLFXCanvas;
    sepia(amount: number): GLFXCanvas;
    vignette(size: number, amount: number): GLFXCanvas;
    vibrance(amount: number): GLFXCanvas;
    curves(red: [number, number][], green: [number, number][], blue: [number, number][]): GLFXCanvas;
    ink(strength: number): GLFXCanvas;
    edgeWork(radius: number): GLFXCanvas;
    dotScreen(centerX: number, centerY: number, angle: number, size: number): GLFXCanvas;
    colorHalftone(centerX: number, centerY: number, angle: number, size: number): GLFXCanvas;
  }

  export function canvas(): GLFXCanvas;
  export function splineInterpolate(points: [number, number][]): (x: number) => number;
}
