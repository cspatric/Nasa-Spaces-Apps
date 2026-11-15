import * as maplibregl from 'maplibre-gl'
// The worker must be bundled by Vite; MapLibre cannot find it by itself once its code is pre-bundled.
import { tintImage, type IntensityMode } from './tint'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

/**
 * Two tile protocols that make tiles in the browser:
 *  flood://LEVEL/z/x/y  paints the land below LEVEL meters (from the Terrarium elevation tiles) in translucent blue.
 *  clear://URL          fetches a satellite tile and turns its black no-data pixels transparent, so daily
 *                       swaths stack without black stripes.
 */
const TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium'
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'
const DAY = 86_400_000

/**
 * One tile of a daily satellite layer, stacked from the last `days` days (newest on top). A daily layer only
 * holds the swaths flown that day, so a single day looks like bare stripes; stacking the days of one
 * repeat cycle fills the gaps. Days without a tile are skipped.
 */
export async function composeTile(gibsId: string, tms: string, ext: string, date: string, days: number, z: number, y: number, x: number, signal?: AbortSignal, tint?: { color: string; mode: IntensityMode }): Promise<Blob> {
  const t0 = Date.parse(`${date}T00:00:00Z`)
  const bitmaps = await Promise.all(Array.from({ length: days }, async (_, i) => {
    const d = new Date(t0 - i * DAY).toISOString().slice(0, 10)
    try {
      const r = await fetch(`${GIBS}/${gibsId}/default/${d}/${tms}/${z}/${y}/${x}.${ext}`, { signal })
      return r.ok ? await createImageBitmap(await r.blob()) : null
    } catch {
      return null
    }
  }))
  const canvas = new OffscreenCanvas(256, 256)
  const ctx = canvas.getContext('2d', { willReadFrequently: !!tint })!
  for (let i = days - 1; i >= 0; i--) if (bitmaps[i]) ctx.drawImage(bitmaps[i]!, 0, 0, 256, 256) // oldest first
  if (tint) {
    const img = ctx.getImageData(0, 0, 256, 256)
    tintImage(img, tint.color, tint.mode)
    ctx.putImageData(img, 0, 0)
  }
  return canvas.convertToBlob({ type: 'image/png' })
}
let registered = false

async function png(canvas: OffscreenCanvas) {
  return (await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer()) as ArrayBuffer
}

export function registerProtocols() {
  if (registered) return
  registered = true
  maplibregl.setWorkerUrl(workerUrl)

  maplibregl.addProtocol('flood', async (params, abort) => {
    // flood://LEVEL/z/x/y (everywhere) or flood://LEVEL/LON/LAT/RADIUS_KM/z/x/y (only within the radius)
    const parts = params.url.replace('flood://', '').split('/').map(Number)
    const [level, z, x, y] = parts.length === 4 ? parts : [parts[0], parts[4], parts[5], parts[6]]
    const circle = parts.length === 7 ? { lon: parts[1], lat: parts[2], r: parts[3] } : null
    const r = await fetch(`${TERRARIUM}/${z}/${x}/${y}.png`, { signal: abort.signal })
    if (!r.ok) throw new Error(`terrarium ${r.status}`)
    const bmp = await createImageBitmap(await r.blob())
    const canvas = new OffscreenCanvas(256, 256)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(bmp, 0, 0)
    const img = ctx.getImageData(0, 0, 256, 256)
    const d = img.data
    const n = 2 ** z * 256
    for (let i = 0; i < d.length; i += 4) {
      const elev = d[i] * 256 + d[i + 1] + d[i + 2] / 256 - 32768
      let inside = true
      if (circle) {
        const px = (i / 4) % 256, py = Math.floor(i / 4 / 256)
        const lon = ((x * 256 + px + 0.5) / n) * 360 - 180
        const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y * 256 + py + 0.5)) / n))) * 180) / Math.PI
        const dx = (lon - circle.lon) * 111.32 * Math.cos((circle.lat * Math.PI) / 180), dy = (lat - circle.lat) * 110.57
        inside = dx * dx + dy * dy <= circle.r * circle.r
      }
      const wet = inside && elev > 1 && elev < level // above the sea, below the water level, inside the area
      d[i] = 56; d[i + 1] = 170; d[i + 2] = 235; d[i + 3] = wet ? 150 : 0
    }
    ctx.putImageData(img, 0, 0)
    return { data: await png(canvas) }
  })

  // mosaic://DAYS/GIBS_ID/DATE/MATRIX_SET/EXT/COLOR/MODE/z/y/x : the days stacked, then painted in one color
  maplibregl.addProtocol('mosaic', async (params, abort) => {
    const [days, id, date, tms, ext, color, mode, z, y, x] = params.url.replace('mosaic://', '').split('/')
    const blob = await composeTile(id, tms, ext, date, Number(days), Number(z), Number(y), Number(x), abort.signal, { color: `#${color}`, mode: mode as IntensityMode })
    return { data: await blob.arrayBuffer() }
  })

  maplibregl.addProtocol('clear', async (params, abort) => {
    const r = await fetch(params.url.replace('clear://', ''), { signal: abort.signal })
    if (!r.ok) throw new Error(`tile ${r.status}`)
    const bmp = await createImageBitmap(await r.blob())
    const canvas = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(bmp, 0, 0)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] + d[i + 1] + d[i + 2]
      if (lum < 45) d[i + 3] = Math.max(0, Math.min(255, (lum - 12) * 8)) // soft edge on the swath border
    }
    ctx.putImageData(img, 0, 0)
    return { data: await png(canvas) }
  })
}
