import type { LonLat } from './types'

/**
 * Natural disaster simulations: simple physical models that turn a few parameters into damage zones on the map,
 * with their area (and, in the map, the buildings inside). They are screening what-ifs to see the dimensions of
 * an event, not forecasts, and every result is labeled as a simulation.
 *
 *  earthquake  shaking intensity (MMI) falls with distance from the focus: I = 1.5 M - 2.5 log10(R) + 1, R the
 *              distance to the focus in km (a standard attenuation shape). Zones: IX+, VII-VIII, VI, V.
 *  flood       the water rises `rise` meters above the ground at the chosen point; everything lower than that
 *              level within 20 km is flooded (bathtub model, no flow dynamics) using the terrain of the map.
 *  wildfire    a wind-driven ellipse (length-to-width from the wind speed, Anderson 1983, flame-height wind = 40 % of the 10 m wind) that grows with the
 *              hours; the base spread rate is scaled by how dry the fuel is.
 *  storm       a swath of damaging wind along a track; the radius grows with the peak gust.
 */
export type DisasterKind = 'earthquake' | 'flood' | 'wildfire' | 'storm'

export interface DisasterParams {
  magnitude: number // earthquake, 5 to 9
  depth: number // km
  rise: number // flood, meters above the ground
  hours: number // wildfire
  wind: number // m/s
  windDir: number // degrees the wind blows FROM
  dryness: number // fuel dryness, 0.4 to 1.6
  gust: number // storm, km/h
  track: number // storm direction, degrees
}

export const DEFAULT_PARAMS: DisasterParams = { magnitude: 7, depth: 20, rise: 6, hours: 24, wind: 6, windDir: 90, dryness: 1, gust: 150, track: 60 }
export const KINDS: DisasterKind[] = ['earthquake', 'flood', 'wildfire', 'storm']

export interface Zone {
  id: string
  label: string
  color: string
  areaKm2: number
  /** Polygon ring (lon, lat) at growth progress k from 0 to 1. Empty for the flood, which is drawn as a raster. */
  ring: (k: number) => number[][]
  contains: (lon: number, lat: number) => boolean
}

export interface Disaster {
  tick: number
  kind: DisasterKind
  center: LonLat
  params: DisasterParams
}

export interface ZoneStats { id: string; label: string; color: string; areaKm2: number; buildings: number | null }

const KM_PER_DEG = 110.57
const kmPerLon = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180)
const toXY = (c: LonLat, lon: number, lat: number): [number, number] => [(lon - c.lon) * kmPerLon(c.lat), (lat - c.lat) * KM_PER_DEG]

/** Ellipse (semi-axes a, b in km; `bearing` of the long axis in degrees from north; its center `offset` km along it). */
function ellipse(c: LonLat, a: number, b: number, bearing: number, offset: number) {
  const br = (bearing * Math.PI) / 180
  const ux = Math.sin(br), uy = Math.cos(br) // unit vector of the long axis (x east, y north)
  const ring = (k: number) => {
    const pts: number[][] = []
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2
      const x = offset * k + a * k * Math.cos(th), y = b * k * Math.sin(th)
      const ex = x * ux - y * uy, ey = x * uy + y * ux
      pts.push([c.lon + ex / kmPerLon(c.lat), c.lat + ey / KM_PER_DEG])
    }
    return pts
  }
  const contains = (lon: number, lat: number) => {
    const [x, y] = toXY(c, lon, lat)
    const along = x * ux + y * uy - offset
    const across = -x * uy + y * ux
    return (along / a) ** 2 + (across / b) ** 2 <= 1
  }
  return { ring, contains, areaKm2: Math.PI * a * b }
}

export function earthquakeZones(c: LonLat, p: DisasterParams): Zone[] {
  const radius = (mmi: number) => {
    const hyp = 10 ** ((1.5 * p.magnitude + 1 - mmi) / 2.5)
    return Math.sqrt(Math.max(0, hyp * hyp - p.depth * p.depth))
  }
  const defs = [
    { id: 'severe', label: 'Destructive (MMI IX or more)', color: '#ef4444', mmi: 9 },
    { id: 'heavy', label: 'Heavy damage (MMI VII to VIII)', color: '#f97316', mmi: 7 },
    { id: 'moderate', label: 'Moderate damage (MMI VI)', color: '#fbbf24', mmi: 6 },
    { id: 'light', label: 'Felt, light damage (MMI V)', color: '#fde68a', mmi: 5 },
  ]
  return defs.flatMap((d) => {
    const r = radius(d.mmi)
    if (r < 0.2) return []
    const e = ellipse(c, r, r, 0, 0)
    return [{ id: d.id, label: d.label, color: d.color, ...e }]
  })
}

/** Anderson (1983) length-to-width ratio of a wind-driven fire; wind in m/s. */
export function fireLengthToWidth(windMs: number): number {
  const mph = windMs * 0.4 * 2.237 // the formula wants the wind at flame height: about 40 % of the 10 m wind
  return 0.936 * Math.exp(0.2566 * mph) + 0.461 * Math.exp(-0.1548 * mph) - 0.397
}

export function wildfireZones(c: LonLat, p: DisasterParams): Zone[] {
  const base = 0.35 * p.dryness // km/h with no wind
  const head = base * (1 + 0.4 * p.wind) * p.hours // km reached by the head of the fire
  const lb = Math.max(1, fireLengthToWidth(p.wind))
  const root = Math.sqrt(lb * lb - 1)
  const hb = (lb + root) / (lb - root || 1e-9) // head to back spread ratio
  const a = (head * (1 + 1 / hb)) / 2
  const b = a / lb
  const bearing = (p.windDir + 180) % 360
  const burned = ellipse(c, a, b, bearing, head - a)
  const embers = ellipse(c, a * 1.6, b * 1.9, bearing, (head - a) * 1.6)
  return [
    { id: 'embers', label: 'Embers and smoke zone', color: '#fbbf24', ...embers },
    { id: 'burned', label: 'Burned area', color: '#ef4444', ...burned },
  ]
}

export function stormZones(c: LonLat, p: DisasterParams): Zone[] {
  const reach = 12 * (p.gust / 120) ** 1.3 // km, radius of damaging wind
  const defs = [
    { id: 'damaging', label: 'Damaging wind (90 km/h or more)', color: '#fde68a', s: 1, min: 90 },
    { id: 'severe', label: 'Severe wind (120 km/h or more)', color: '#f97316', s: 0.65, min: 120 },
    { id: 'destructive', label: 'Destructive wind (170 km/h or more)', color: '#ef4444', s: 0.35, min: 170 },
  ]
  return defs.filter((d) => p.gust >= d.min).map((d) => ({ id: d.id, label: d.label, color: d.color, ...ellipse(c, reach * d.s * 3.2, reach * d.s, p.track, 0) }))
}

export function zonesFor(d: Disaster): Zone[] {
  if (d.kind === 'earthquake') return earthquakeZones(d.center, d.params)
  if (d.kind === 'wildfire') return wildfireZones(d.center, d.params)
  if (d.kind === 'storm') return stormZones(d.center, d.params)
  return []
}

/** Flood: cells (about 0.5 km) within `radiusKm` that lie below `level`; `elevationAt` returns meters or null where terrain is not loaded. */
export function floodArea(c: LonLat, level: number, radiusKm: number, elevationAt: (lon: number, lat: number) => number | null) {
  const n = 41
  const cell = (2 * radiusKm) / (n - 1)
  let wet = 0, known = 0
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = -radiusKm + i * cell, y = -radiusKm + j * cell
    if (x * x + y * y > radiusKm * radiusKm) continue
    const e = elevationAt(c.lon + x / kmPerLon(c.lat), c.lat + y / KM_PER_DEG)
    if (e === null) continue
    known++
    if (e > 1 && e < level) wet++
  }
  return { areaKm2: wet * cell * cell, sampled: known }
}

export const FLOOD_RADIUS_KM = 20
export const bbox = (ring: number[][]): [[number, number], [number, number]] => {
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1])
  return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]]
}
