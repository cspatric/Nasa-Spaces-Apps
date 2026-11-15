import { useEffect, useReducer, useRef } from 'react'
import { chunkRange, neededChunks, runQueue } from './chunks'
import { API_URL } from './api'
import { openSse } from './stream'
import type { Series } from './series'

export interface RainState {
  status: 'idle' | 'loading' | 'done' | 'error'
  series: Series
  done: number
  total: number
  cached: number
  message?: string
}

const blank = (): Series => ({ id: 'rain', label: 'Rain', pol: 'rain', polClass: 'rain', track: 0, direction: '', burst: '', t: [], db: [] })
const EMPTY: RainState = { status: 'idle', series: blank(), done: 0, total: 0, cached: 0 }

interface RainRow { t: number; mm: number | null }
type Action =
  | { type: 'reset' }
  | { type: 'patch'; patch: Partial<RainState> }
  | { type: 'rows'; rows: RainRow[]; done: number }

function reducer(s: RainState, a: Action): RainState {
  if (a.type === 'reset') return { ...EMPTY, series: blank() }
  if (a.type === 'patch') return { ...s, ...a.patch }
  const byT = new Map(s.series.t.map((t, i) => [t, s.series.db[i]] as const))
  for (const r of a.rows) if (r.mm !== null) byT.set(r.t, r.mm)
  const t = [...byT.keys()].sort((x, y) => x - y)
  return { ...s, done: a.done, series: { ...s.series, t, db: t.map((k) => byT.get(k)!) } }
}

/** Days of rain read before and after the timeline date (the insights compare the last 30 days with the months before). */
const BEFORE = 120
const AFTER = 15
const FROM = Date.UTC(2000, 5, 1)

/**
 * Daily rain (NASA GPM IMERG) for a point, streamed from the backend (`/rain/stream`), newest day
 * first, and only for the days around `dateMs` in 30-day chunks. Moving the date reads the chunks it
 * newly needs. Changing the point starts over.
 */
export function useRain(point: { lon: number; lat: number } | null, dateMs: number, latestMs: number): RainState {
  const [state, dispatch] = useReducer(reducer, EMPTY)
  const lon = point ? Number(point.lon.toFixed(3)) : null
  const lat = point ? Number(point.lat.toFixed(3)) : null
  const pointKey = useRef('')
  const loaded = useRef(new Set<number>())
  const clamped = Math.min(dateMs, latestMs)
  const needKey = neededChunks(clamped, BEFORE, AFTER, FROM, latestMs).join(',')

  useEffect(() => {
    const key = lon === null || lat === null ? '' : `${lon},${lat}`
    if (key !== pointKey.current) {
      pointKey.current = key
      loaded.current = new Set()
      dispatch({ type: 'reset' })
    }
    if (lon === null || lat === null) return
    let cancel = () => {}
    const timer = setTimeout(() => {
      const need = neededChunks(clamped, BEFORE, AFTER, FROM, latestMs).filter((c) => !loaded.current.has(c))
      if (!need.length) return
      dispatch({ type: 'patch', patch: { status: 'loading', message: undefined } })
      cancel = runQueue(need, (chunk, next) => {
        const { start, end } = chunkRange(chunk)
        return openSse(`${API_URL}/rain/stream?${new URLSearchParams({ lon: String(lon), lat: String(lat), start, end })}`, {
          meta: (m) => dispatch({ type: 'patch', patch: { total: m.total, cached: m.cached, done: 0 } }),
          rows: (d) => dispatch({ type: 'rows', rows: d.rows, done: d.done }),
        }, {
          done: () => { loaded.current.add(chunk); next() },
          fatal: (message) => dispatch({ type: 'patch', patch: { status: 'error', message } }),
          unreachable: () => dispatch({ type: 'patch', patch: { status: 'error', message: `Backend not reachable at ${API_URL}. Start it with: uv run asf-api` } }),
        })
      }, () => dispatch({ type: 'patch', patch: { status: 'done' } }))
    }, 350)
    return () => {
      clearTimeout(timer)
      cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lon, lat, needKey])

  return state
}
