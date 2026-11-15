/**
 * Wind over the Amazon for the "air currents" layer: the real wind at 850 hPa (about 1.5 km up, the level of the moisture
 * rivers that cross the basin) on a coarse grid, read live from Open-Meteo (free, no key). If it cannot be read, a typical
 * trade-wind field is used and the layer says so.
 */
export interface WindGrid {
  west: number
  south: number
  east: number
  north: number
  step: number
  nx: number
  ny: number
  u: Float32Array // eastward m/s
  v: Float32Array // northward m/s
  live: boolean
}

const BOX = { west: -78, east: -42, south: -20, north: 10 }
const STEP = 4

function lattice() {
  const nx = Math.round((BOX.east - BOX.west) / STEP) + 1
  const ny = Math.round((BOX.north - BOX.south) / STEP) + 1
  const pts: [number, number][] = []
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) pts.push([BOX.west + i * STEP, BOX.south + j * STEP])
  return { nx, ny, pts }
}

/** Trade winds: from the east, turning toward the equator from both hemispheres, a little stronger over the Atlantic side. */
function typical(): WindGrid {
  const { nx, ny, pts } = lattice()
  const u = new Float32Array(nx * ny), v = new Float32Array(nx * ny)
  pts.forEach(([lon, lat], k) => {
    u[k] = -4.5 - 2.5 * ((lon - BOX.west) / (BOX.east - BOX.west)) * (1 - Math.abs(lat + 5) / 30)
    v[k] = lat > -2 ? -1.8 * Math.min(1, (lat + 2) / 8) : 1.6 * Math.min(1, (-2 - lat) / 8)
  })
  return { ...BOX, step: STEP, nx, ny, u, v, live: false }
}

let cache: { at: number; grid: WindGrid } | null = null

export async function loadWind(): Promise<WindGrid> {
  if (cache && Date.now() - cache.at < 30 * 60_000) return cache.grid
  const { nx, ny, pts } = lattice()
  try {
    const q = new URLSearchParams({
      latitude: pts.map((p) => p[1]).join(','), longitude: pts.map((p) => p[0]).join(','),
      hourly: 'wind_speed_850hPa,wind_direction_850hPa', forecast_hours: '1', wind_speed_unit: 'ms', timezone: 'UTC',
    })
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { signal: AbortSignal.timeout(12_000) })
    if (!r.ok) throw new Error(String(r.status))
    const data = (await r.json()) as { hourly: { wind_speed_850hPa: number[]; wind_direction_850hPa: number[] } }[]
    const u = new Float32Array(nx * ny), v = new Float32Array(nx * ny)
    data.forEach((d, k) => {
      const s = d.hourly.wind_speed_850hPa[0], dir = (d.hourly.wind_direction_850hPa[0] * Math.PI) / 180 // direction the wind comes FROM
      u[k] = -s * Math.sin(dir)
      v[k] = -s * Math.cos(dir)
    })
    const grid = { ...BOX, step: STEP, nx, ny, u, v, live: true }
    cache = { at: Date.now(), grid }
    return grid
  } catch {
    return typical()
  }
}

/** Wind (m/s) at a point, interpolated between the four nearest grid points; null outside the grid. */
export function windAt(g: WindGrid, lon: number, lat: number): { u: number; v: number } | null {
  if (lon < g.west || lon > g.east || lat < g.south || lat > g.north) return null
  const fx = (lon - g.west) / g.step, fy = (lat - g.south) / g.step
  const i = Math.min(g.nx - 2, Math.floor(fx)), j = Math.min(g.ny - 2, Math.floor(fy))
  const tx = fx - i, ty = fy - j
  const at = (arr: Float32Array, a: number, b: number) => arr[(j + b) * g.nx + (i + a)]
  const mix = (arr: Float32Array) => (at(arr, 0, 0) * (1 - tx) + at(arr, 1, 0) * tx) * (1 - ty) + (at(arr, 0, 1) * (1 - tx) + at(arr, 1, 1) * tx) * ty
  return { u: mix(g.u), v: mix(g.v) }
}
