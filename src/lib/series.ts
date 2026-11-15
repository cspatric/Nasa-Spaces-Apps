/** Series drawn in the inspector, built from rows streamed by the backend API. */
export interface Series {
  id: string
  label: string
  pol: string
  polClass: 'co' | 'cross' | string
  track: number
  direction: string
  burst: string
  t: number[]
  db: number[]
}

export interface LiveRow {
  scene: string
  sensor: string
  band: string
  t: number
  burst: string
  track: number | null
  direction: string
  pol: string
  polClass: string
  db: number | null
  valid: number | null
}

const MIN_VALID = 0.8

/** Groups rows by burst, track, direction and polarization; sorted by time. */
export function buildSeries(rows: LiveRow[]): Series[] {
  const groups = new Map<string, Series>()
  for (const r of rows) {
    if (r.db === null || (r.valid ?? 0) < MIN_VALID) continue
    const key = `${r.burst}|${r.track}|${r.direction}|${r.pol}`
    let s = groups.get(key)
    if (!s) {
      s = { id: key, label: `${r.pol} · track ${r.track} · ${r.direction.toLowerCase()}`, pol: r.pol, polClass: r.polClass,
        track: r.track ?? 0, direction: r.direction, burst: r.burst, t: [], db: [] }
      groups.set(key, s)
    }
    s.t.push(r.t)
    s.db.push(r.db)
  }
  return [...groups.values()].map((s) => {
    const order = s.t.map((_, i) => i).sort((a, b) => s.t[a] - s.t[b])
    return { ...s, t: order.map((i) => s.t[i]), db: order.map((i) => s.db[i]) }
  })
}

/** Scene nearest to the date, if within `maxDays` (OPERA revisits every 12 days). */
export function valueAt(s: Series, ms: number, maxDays = 20) {
  let best = -1
  let gap = Infinity
  for (let i = 0; i < s.t.length; i++) {
    const g = Math.abs(s.t[i] - ms)
    if (g < gap) { gap = g; best = i }
  }
  return best < 0 || gap > maxDays * 86_400_000 ? null : { db: s.db[best], t: s.t[best] }
}

/** One representative series per polarization (the one with the most scenes). */
export function mainSeries(all: Series[]) {
  const byPol = new Map<string, Series>()
  for (const s of all) if (!byPol.has(s.pol) || s.t.length > byPol.get(s.pol)!.t.length) byPol.set(s.pol, s)
  return [...byPol.values()].sort((a, b) => a.pol.localeCompare(b.pol))
}

/** Values of a series in the `days` days up to and including `endMs`. */
export function windowOf(s: Series, endMs: number, days: number) {
  const out: { t: number; v: number }[] = []
  for (let i = 0; i < s.t.length; i++) if (s.t[i] <= endMs && s.t[i] > endMs - days * 86_400_000) out.push({ t: s.t[i], v: s.db[i] })
  return out
}
