export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const DEFAULT_ACCENT: RgbColor = { r: 29, g: 185, b: 84 };

export function clampByte(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function rgbToCss(color: RgbColor): string {
  return `rgb(${clampByte(color.r)} ${clampByte(color.g)} ${clampByte(color.b)})`;
}

export function mixWithWhite(color: RgbColor, amount = 0.25): RgbColor {
  return {
    r: color.r + (255 - color.r) * amount,
    g: color.g + (255 - color.g) * amount,
    b: color.b + (255 - color.b) * amount,
  };
}

export function hslToRgb(h: number, s: number, l: number): RgbColor {
  const hue = ((h % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = hue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (huePrime < 1) [r, g, b] = [chroma, x, 0];
  else if (huePrime < 2) [r, g, b] = [x, chroma, 0];
  else if (huePrime < 3) [r, g, b] = [0, chroma, x];
  else if (huePrime < 4) [r, g, b] = [0, x, chroma];
  else if (huePrime < 5) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];

  const match = l - chroma / 2;
  return {
    r: (r + match) * 255,
    g: (g + match) * 255,
    b: (b + match) * 255,
  };
}

export function accentFromSeed(seed: string): RgbColor {
  if (!seed) return DEFAULT_ACCENT;

  const hue = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return hslToRgb(hue, 0.58, 0.46);
}

export function averageRgb(pixels: Uint8ClampedArray): RgbColor | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha < 32) continue;

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const brightness = (red + green + blue) / 3;

    // Skip near-black / near-white so the player accent stays colorful.
    if (brightness < 24 || brightness > 232) continue;

    r += red;
    g += green;
    b += blue;
    count += 1;
  }

  if (count === 0) return null;
  return { r: r / count, g: g / count, b: b / count };
}

export function extractDominantColorFromImageData(imageData: ImageData): RgbColor | null {
  return averageRgb(imageData.data);
}

export async function extractDominantColor(imageUrl: string): Promise<RgbColor | null> {
  if (typeof window === "undefined" || !imageUrl) return null;

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0, size, size);
        const sampled = context.getImageData(0, 0, size, size);
        resolve(extractDominantColorFromImageData(sampled));
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = imageUrl;
  });
}
