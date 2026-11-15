import type { GibsLayer } from './catalog'
import { composeTile } from './protocols'
import { intensityOf } from './tint'

/**
 * Close-up view of coarse NASA layers (rain, temperature, soil moisture: kilometer-wide pixels). Up close the
 * raster would be big blocks, so the layer is also sampled on a grid sized to the view and drawn as a smooth glow
 * (a heatmap) in the layer's own color. Same color and same strength rule as the raster, only smoother.
 */
export interface View { lon: number; lat: number; zoom: number }
export interface GlowPoint { type: 'Feature'; properties: { w: number }; geometry: { type: 'Point'; coordinates: [number, number] } }

const GRID = 36
const TILE = 256
const MAX_TILES = 9
const pixels = new Map<string, Promise<ImageData | null>>()

async function decode(load: () => Promise<Blob>): Promise<ImageData | null> {
  try {
    const bmp = await createImageBitmap(await load())
    const c = new OffscreenCanvas(TILE, TILE)
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.drawImage(bmp, 0, 0, TILE, TILE)
    return g.getImageData(0, 0, TILE, TILE)
  } catch {
    return null
  }
}

function tile(key: string, load: () => Promise<Blob>) {
  let p = pixels.get(key)
  if (!p) {
    p = decode(load)
    pixels.set(key, p)
    if (pixels.size > 60) pixels.delete(pixels.keys().next().value!)
    void p.then((d) => { if (!d) pixels.delete(key) }) // do not remember failures or aborted reads
  }
  return p
}

const mercY = (lat: number) => (1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2
const lonToX = (lon: number) => (lon + 180) / 360

/** Weighted points (weight 0 to 1) on a grid over the view, for a heatmap. */
export async function sampleGlow(layer: GibsLayer, date: string, view: View, signal: AbortSignal): Promise<GlowPoint[]> {
  const mode = layer.intensity ?? 'rain'
  const cosLat = Math.cos((view.lat * Math.PI) / 180)
  const spanLon = (2.8 * 360) / 2 ** view.zoom // wide enough for the tilted view, which reaches far past the center
  const cell = spanLon / GRID
  let z = Math.max(2, Math.min(layer.maxLevel, Math.ceil(Math.log2(360 / (TILE * (cell / 2))))))
  const lon0 = Math.floor((view.lon - spanLon / 2) / cell) * cell
  const lat0 = Math.floor((view.lat - (spanLon / 2) * cosLat) / cell) * cell
  const n = GRID + 1
  const span = (zz: number) => {
    const t = 2 ** zz
    const x0 = Math.floor(lonToX(lon0) * t), x1 = Math.floor(lonToX(lon0 + n * cell) * t)
    const y0 = Math.floor(mercY(lat0 + n * cell) * t), y1 = Math.floor(mercY(lat0) * t)
    return { x0, x1, y0, y1, count: (x1 - x0 + 1) * (y1 - y0 + 1) }
  }
  let sp = span(z)
  while (sp.count > MAX_TILES && z > 2) sp = span(--z)
  if (sp.count > MAX_TILES) return []

  const t = 2 ** z
  const loaded = new Map<string, ImageData | null>()
  const jobs: Promise<void>[] = []
  for (let x = sp.x0; x <= sp.x1; x++) for (let y = sp.y0; y <= sp.y1; y++) {
    const tx = ((x % t) + t) % t
    jobs.push(tile(`${layer.id}|${date}|${z}/${tx}/${y}`, () => composeTile(layer.gibsId, layer.tileMatrixSet, layer.format, date, layer.timeAware ? layer.composite ?? 1 : 1, z, y, tx, signal))
      .then((d) => void loaded.set(`${x}/${y}`, d)))
  }
  await Promise.all(jobs)
  if (signal.aborted) return []

  const at = (lon: number, lat: number) => {
    const px = lonToX(lon) * t * TILE, py = mercY(lat) * t * TILE
    const d = loaded.get(`${Math.floor(px / TILE)}/${Math.floor(py / TILE)}`)
    if (!d) return 0
    const i = (Math.floor(py % TILE) * TILE + Math.floor(px % TILE)) * 4
    return intensityOf(mode, d.data[i], d.data[i + 1], d.data[i + 2], d.data[i + 3])
  }

  const out: GlowPoint[] = []
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
    const lon = lon0 + (i + 0.5) * cell, lat = lat0 + (j + 0.5) * cell
    const w = at(lon, lat)
    if (w > 0) out.push({ type: 'Feature', properties: { w }, geometry: { type: 'Point', coordinates: [lon, lat] } })
  }
  return out
}
