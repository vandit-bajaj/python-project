/**
 * Standard CIE color science conversions: sRGB -> Linear RGB -> CIE XYZ (D65) -> CIELAB.
 * All algorithms are pure functions with zero DOM or WebGL dependencies.
 */

// Standard D65 reference white point
const D65_XN = 0.95047;
const D65_YN = 1.00000;
const D65_ZN = 1.08883;

// CIELAB transition threshold: (6/29)^3 = 0.008856451679
const LAB_EPSILON = 0.008856451679;
// (1/3) * (29/6)^2 = 7.787037037
const LAB_KAPPA_DIV_116 = 7.787037037;
const LAB_16_DIV_116 = 16 / 116;

/**
 * Converts a non-linear sRGB channel [0, 255] to linear intensity [0, 1].
 */
export function srgbToLinear(c255: number): number {
  const c = Math.max(0, Math.min(255, c255)) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Converts a linear sRGB channel [0, 1] back to non-linear sRGB [0, 255].
 */
export function linearToSrgb(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  const s = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

/**
 * Converts single sRGB (0-255) to CIELAB coordinates:
 * L* in [0, 100] (perceptual lightness)
 * a* in [-128, 127] (green to red axis; positive is red)
 * b* in [-128, 127] (blue to yellow axis; positive is yellow)
 */
export function srgbToLab(r: number, g: number, b: number): [L: number, a: number, b: number] {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  // Linear sRGB to CIE XYZ using standard D65 illuminant matrix
  const x = (0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin) / D65_XN;
  const y = (0.2126729 * rLin + 0.7151522 * gLin + 0.0721750 * bLin) / D65_YN;
  const z = (0.0193339 * rLin + 0.1191920 * gLin + 0.9503041 * bLin) / D65_ZN;

  const fx = x > LAB_EPSILON ? Math.cbrt(x) : LAB_KAPPA_DIV_116 * x + LAB_16_DIV_116;
  const fy = y > LAB_EPSILON ? Math.cbrt(y) : LAB_KAPPA_DIV_116 * y + LAB_16_DIV_116;
  const fz = z > LAB_EPSILON ? Math.cbrt(z) : LAB_KAPPA_DIV_116 * z + LAB_16_DIV_116;

  const L = Math.max(0, Math.min(100, 116 * fy - 16));
  const a = 500 * (fx - fy);
  const labB = 200 * (fy - fz);

  return [L, a, labB];
}

/**
 * High-performance batch conversion of an RGBA buffer into separate L*, a*, b* Float32Arrays.
 */
export function batchRgbaToLab(
  rgba: Uint8ClampedArray | Uint8Array,
  pixelCount: number,
  outL: Float32Array,
  outA: Float32Array,
  outB: Float32Array
): void {
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = rgba[idx] ?? 0;
    const g = rgba[idx + 1] ?? 0;
    const b = rgba[idx + 2] ?? 0;

    const [L, a, labB] = srgbToLab(r, g, b);
    outL[i] = L;
    outA[i] = a;
    outB[i] = labB;
  }
}
