import { useEffect, useReducer, useRef } from 'react'
import { chunkRange, neededChunks, runQueue } from './chunks'
import type { LiveRow } from './series'

import { API_URL } from './api'
import { openSse } from './stream'

export { API_URL }

export type Sensor = 'NISAR' | 'OPERA'

export interface LiveState {
  status: 'idle' | 'loading' | 'done' | 'error'
  rows: LiveRow[]
  /** Progress of the chunk being read. */
  done: number
  total: number
  cached: number
  failed: number
  message?: string
}

const EMPTY: LiveState = { status: 'idle', rows: [], done: 0, total: 0, cached: 0, failed: 0 }
type State = Record<Sensor, LiveState>
type Action =
  | { type: 'reset' }
  | { type: 'patch'; sensor: Sensor; patch: Partial<LiveState> }
  | { type: 'fail'; sensor: Sensor }
  | { type: 'rows'; sensor: Sensor; rows: LiveRow[]; done: number; total: number }

function reducer(s: State, a: Action): State {
  if (a.type === 'reset') return { NISAR: EMPTY, OPERA: EMPTY }
  const cur = s[a.sensor]
  if (a.type === 'patch') return { ...s, [a.sensor]: { ...cur, ...a.patch } }
  if (a.type === 'fail') return { ...s, [a.sensor]: { ...cur, failed: cur.failed + 1 } }
  const seen = new Set(cur.rows.map((r) => `${r.scene}|${r.pol}`))
  const fresh = a.rows.filter((r) => !seen.has(`${r.scene}|${r.pol}`))
  return { ...s, [a.sensor]: { ...cur, rows: [...cur.rows, ...fresh], done: a.done, total: a.total } }
}

/** Earliest day each sensor can have data for. */
const FROM: Record<Sensor, number> = { NISAR: Date.UTC(2025, 9, 1), OPERA: Date.UTC(2016, 0, 1) }
/** Days read before and after the timeline date. NISAR scenes take about a minute and a half each, so its window is tighter. */
const WINDOW: Record<Sensor, [number, number]> = { NISAR: [30, 10], OPERA: [60, 20] }
const WORKERS: Record<Sensor, string> = { NISAR: '3', OPERA: '6' }

/**
 * Streams the cleaned radar series for a point from the backend while ASF is read, but only for the
 * days around `dateMs` (30-day chunks). Moving the date reads the chunks it newly needs; changing the
 * point starts over. Rows arrive scene by scene (Server-Sent Events).
 */
export function useLiveSeries(point: { lon: number; lat: number } | null, dateMs: number, latestMs: number, windowM = 500): State {
  const [state, dispatch] = useReducer(reducer, { NISAR: EMPTY, OPERA: EMPTY })
  const lon = point ? Number(point.lon.toFixed(4)) : null
  const lat = point ? Number(point.lat.toFixed(4)) : null
  const pointKey = useRef('')
  const loaded = useRef<Record<Sensor, Set<number>>>({ NISAR: new Set(), OPERA: new Set() })
  const clamped = Math.min(dateMs, latestMs)
  const needKey = (['NISAR', 'OPERA'] as const)
    .map((k) => neededChunks(clamped, WINDOW[k][0], WINDOW[k][1], FROM[k], latestMs).join(','))
    .join('|')

  useEffect(() => {
    const key = lon === null || lat === null ? '' : `${lon},${lat},${windowM}`
    if (key !== pointKey.current) {
      pointKey.current = key
      loaded.current = { NISAR: new Set(), OPERA: new Set() }
      dispatch({ type: 'reset' })
    }
    if (lon === null || lat === null) return
    const cancels: (() => void)[] = []
    const timer = setTimeout(() => {
      for (const sensor of ['NISAR', 'OPERA'] as const) {
        const need = neededChunks(clamped, WINDOW[sensor][0], WINDOW[sensor][1], FROM[sensor], latestMs).filter((c) => !loaded.current[sensor].has(c))
        if (!need.length) continue
        dispatch({ type: 'patch', sensor, patch: { status: 'loading', message: undefined } })
        cancels.push(runQueue(need, (chunk, next) => {
          const { start, end } = chunkRange(chunk)
          const q = new URLSearchParams({ lon: String(lon), lat: String(lat), dataset: sensor, window_m: String(windowM), workers: WORKERS[sensor], start, end })
          return openSse(`${API_URL}/series/stream?${q}`, {
            meta: (m) => dispatch({ type: 'patch', sensor, patch: { total: m.total, cached: m.cached, done: 0 } }),
            rows: (d) => dispatch({ type: 'rows', sensor, rows: d.rows, done: d.done, total: d.total }),
            scene_error: () => dispatch({ type: 'fail', sensor }),
          }, {
            done: () => { loaded.current[sensor].add(chunk); next() },
            fatal: (message) => dispatch({ type: 'patch', sensor, patch: { status: 'error', message } }),
            unreachable: () => dispatch({ type: 'patch', sensor, patch: { status: 'error', message: `Backend not reachable at ${API_URL}. Start it with: uv run asf-api` } }),
          })
        }, () => dispatch({ type: 'patch', sensor, patch: { status: 'done' } })))
      }
    }, 350)
    return () => {
      clearTimeout(timer)
      cancels.forEach((c) => c())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lon, lat, needKey, windowM])

  return state
}
