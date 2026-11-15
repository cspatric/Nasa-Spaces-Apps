/**
 * Every NASA layer is drawn in ONE color (its color in the catalog), at every zoom: the pixel palette of the
 * source tile only decides how strong each pixel is. `intensityOf` reads a source pixel and answers 0 (nothing
 * there) to 1 (strongest); the raster protocol and the close-up sampler both use it, so a layer looks the same
 * from far away and up close.
 */
export type IntensityMode = 'water' | 'alert' | 'rain' | 'heat' | 'wet' | 'luma'

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

export function intensityOf(mode: IntensityMode, r: number, g: number, b: number, a: number): number {
  if (a < 40 || r + g + b < 24) return 0
  const chroma = Math.max(r, g, b) - Math.min(r, g, b)
  switch (mode) {
    case 'water': // open water is pure blue or cyan; white and gray are land, cloud or snow
      return b >= 180 && r <= 140 ? 1 : 0
    case 'alert': // alerts are colored; the background is gray
      return chroma >= 40 ? 1 : 0
    case 'rain':
      return 0.45 + 0.55 * (chroma / 255)
    case 'heat': // yellow (mild) to red (hot)
      return clamp((255 - g) / 200, 0.15, 1)
    case 'wet': // yellow (dry) to blue (wet)
      return clamp(((255 - r) / 255) * 0.7 + (b / 255) * 0.3, 0.15, 1)
    case 'luma':
      return 0.35 + 0.65 * ((0.3 * r + 0.59 * g + 0.11 * b) / 255)
  }
}

/** Repaints a tile in one color; alpha carries the intensity. */
export function tintImage(img: ImageData, color: string, mode: IntensityMode): void {
  const [cr, cg, cb] = hexToRgb(color)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const v = intensityOf(mode, d[i], d[i + 1], d[i + 2], d[i + 3])
    d[i] = cr
    d[i + 1] = cg
    d[i + 2] = cb
    d[i + 3] = v === 0 ? 0 : Math.round(255 * (0.3 + 0.7 * v))
  }
}
