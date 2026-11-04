/**
 * Computes variance of the Laplacian operator on an RGBA pixel buffer.
 * Lower variance indicates an out-of-focus or motion-blurred capture.
 */
export function computeLaplacianVariance(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): number {
  if (width < 3 || height < 3) {
    return 0;
  }

  // Convert to grayscale luminance array
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = rgba[idx] ?? 0;
    const g = rgba[idx + 1] ?? 0;
    const b = rgba[idx + 2] ?? 0;
    // Standard perceptual luminance
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // 3x3 Laplacian Kernel:
  // [ 0,  1,  0]
  // [ 1, -4,  1]
  // [ 0,  1,  0]
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    const prevRowOffset = (y - 1) * width;
    const nextRowOffset = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const current = gray[rowOffset + x] ?? 0;
      const top = gray[prevRowOffset + x] ?? 0;
      const bottom = gray[nextRowOffset + x] ?? 0;
      const left = gray[rowOffset + (x - 1)] ?? 0;
      const right = gray[rowOffset + (x + 1)] ?? 0;

      const lap = top + bottom + left + right - 4 * current;
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.max(0, variance);
}
