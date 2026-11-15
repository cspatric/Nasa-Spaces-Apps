import { useCallback, useEffect, useReducer, useRef } from 'react'
import { API_URL } from './api'
import type { LiveRow, Series } from './series'
import { openSse, type FatalInfo } from './stream'

/**
 * The analysis of a place over a period the person chose. One request starts two streams from the backend:
 * the radar series (`/series/stream` with `dataset=auto`: the BACKEND picks NISAR or OPERA from the period) and
 * the daily rain (`/rain/stream`). Rows fill the charts as they arrive; what the backend has to say (the sensor it
 * chose, too little data, scenes it could not read, failures) arrives as `notice` events and is kept for the
 * panel. While either stream runs the analysis is `running`, which is what locks the choice of another place.
 */
export type Sensor = 'NISAR' | 'OPERA'
export type Level = 'info' | 'warning' | 'error'
export type Confidence = 'high' | 'limited' | 'insufficient'
type Vars = Record<string, string | number>

/** A message for the person. `message` is an English template ("{n} scenes"), `vars` fills it, and the page translates it. */
export interface Notice { key: string; level: Level; code: string; message: string; vars?: Vars }
/** Inclusive first and last day, as ISO dates. */
export interface Range { start: string; end: string }
/** The backend's verdict on whether the period gave enough time for a confident analysis (`done.assessment`). */
export interface Assessment { confidence: Confidence; scenes: number; failed: number; periodDays: number; coverage: number; longestGapDays: number }

export type StreamStatus = 'idle' | 'loading' | 'done' | 'error' | 'cancelled' | 'skipped'
export interface RadarState {
  status: StreamStatus
  rows: LiveRow[]
  done: number
  total: number
  cached: number
  failed: number
  /** The sensor the backend chose. */
  dataset: Sensor | null
  assessment: Assessment | null
}
export interface RainState {
  status: StreamStatus
  series: Series
  done: number
  total: number
  cached: number
}
export interface Outcome {
  /** One per finished analysis, so a message is shown once. */
  id: number
  kind: 'done' | 'partial' | 'failed' | 'cancelled'
  dataset: Sensor | null
  scenes: number
  rainDays: number
  confidence: Confidence | null
  range: Range
  radarFailed: boolean
  rainFailed: boolean
}
export interface AnalysisState {
  radar: RadarState
  rain: RainState
  notices: Notice[]
  running: boolean
  range: Range | null
  /** Id of the latest run (from the hook, so it never repeats after a reset). */
  runs: number
  outcome: Outcome | null
}

const blankRain = (): Series => ({ id: 'rain', label: 'Rain', pol: 'rain', polClass: 'rain', track: 0, direction: '', burst: '', t: [], db: [] })
const RADAR_EMPTY: RadarState = { status: 'idle', rows: [], done: 0, total: 0, cached: 0, failed: 0, dataset: null, assessment: null }
const rainEmpty = (): RainState => ({ status: 'idle', series: blankRain(), done: 0, total: 0, cached: 0 })
const initial = (): AnalysisState => ({ radar: RADAR_EMPTY, rain: rainEmpty(), notices: [], running: false, range: null, runs: 0, outcome: null })

/** IMERG rain covers 60S to 60N. */
const RAIN_LAT = 60

interface RainRow { t: number; mm: number | null }
interface BackendNotice { level: Level; code: string; message: string; vars?: Vars }
type Action =
  | { type: 'reset' }
  | { type: 'start'; id: number; range: Range; rain: boolean }
  | { type: 'cancel' }
  | { type: 'notice'; n: Omit<Notice, 'key'> }
  | { type: 'radarMeta'; total: number; cached: number; dataset: Sensor }
  | { type: 'radarRows'; rows: LiveRow[]; done: number; total: number }
  | { type: 'radarScene' }
  | { type: 'radarEnd'; failed: number; assessment: Assessment | null }
  | { type: 'radarError' }
  | { type: 'rainMeta'; total: number; cached: number }
  | { type: 'rainRows'; rows: RainRow[]; done: number }
  | { type: 'rainEnd' }
  | { type: 'rainError' }

const keyOf = (n: Omit<Notice, 'key'>) => `${n.code}|${n.message}|${JSON.stringify(n.vars ?? {})}`

function addNotice(list: Notice[], n: Omit<Notice, 'key'>): Notice[] {
  const key = keyOf(n)
  return list.some((x) => x.key === key) ? list : [...list, { ...n, key }]
}

/** When neither stream is running any more, the analysis is over: say how it ended. */
function settle(s: AnalysisState): AnalysisState {
  if (!s.running || s.radar.status === 'loading' || s.rain.status === 'loading' || !s.range) return s
  const radarFailed = s.radar.status === 'error'
  const rainFailed = s.rain.status === 'error'
  const kind = radarFailed && (rainFailed || s.rain.status === 'skipped') ? 'failed' : radarFailed || rainFailed ? 'partial' : 'done'
  const outcome: Outcome = {
    id: s.runs, kind, dataset: s.radar.dataset, scenes: new Set(s.radar.rows.map((r) => r.scene)).size,
    rainDays: s.rain.series.t.length, confidence: s.radar.assessment?.confidence ?? null, range: s.range, radarFailed, rainFailed,
  }
  return { ...s, running: false, outcome }
}

function step(s: AnalysisState, a: Action): AnalysisState {
  switch (a.type) {
    case 'reset':
      return initial()
    case 'start': {
      const base: AnalysisState = {
        ...initial(), runs: a.id, running: true, range: a.range,
        radar: { ...RADAR_EMPTY, status: 'loading' },
        rain: { ...rainEmpty(), status: a.rain ? 'loading' : 'skipped' },
      }
      return a.rain ? base : {
        ...base,
        notices: addNotice(base.notices, { level: 'info', code: 'rain-coverage', message: 'Rain data (IMERG) covers 60°S to 60°N, so none is shown for this place.' }),
      }
    }
    case 'cancel': {
      if (!s.running) return s
      const stop = <T extends { status: StreamStatus }>(x: T): T => (x.status === 'loading' ? { ...x, status: 'cancelled' } : x)
      return {
        ...s, running: false, radar: stop(s.radar), rain: stop(s.rain),
        outcome: { id: s.runs, kind: 'cancelled', dataset: s.radar.dataset, scenes: new Set(s.radar.rows.map((r) => r.scene)).size, rainDays: s.rain.series.t.length, confidence: null, range: s.range!, radarFailed: false, rainFailed: false },
      }
    }
    case 'notice':
      return { ...s, notices: addNotice(s.notices, a.n) }
    case 'radarMeta':
      // the server answered, so a "busy, trying again" notice is out of date
      return { ...s, notices: s.notices.filter((n) => n.code !== 'busy'), radar: { ...s.radar, total: a.total, cached: a.cached, done: 0, dataset: a.dataset } }
    case 'radarRows': {
      const seen = new Set(s.radar.rows.map((r) => `${r.scene}|${r.pol}`))
      const fresh = a.rows.filter((r) => !seen.has(`${r.scene}|${r.pol}`))
      return { ...s, radar: { ...s.radar, rows: [...s.radar.rows, ...fresh], done: a.done, total: a.total } }
    }
    case 'radarScene':
      return { ...s, radar: { ...s.radar, failed: s.radar.failed + 1 } }
    case 'radarEnd':
      return settle({ ...s, radar: { ...s.radar, status: 'done', failed: a.failed, assessment: a.assessment } })
    case 'radarError':
      return settle({ ...s, radar: { ...s.radar, status: 'error' } })
    case 'rainMeta':
      return { ...s, notices: s.notices.filter((n) => n.code !== 'busy'), rain: { ...s.rain, total: a.total, cached: a.cached, done: 0 } }
    case 'rainRows': {
      const byT = new Map(s.rain.series.t.map((t, i) => [t, s.rain.series.db[i]] as const))
      for (const r of a.rows) if (r.mm !== null) byT.set(r.t, r.mm)
      const t = [...byT.keys()].sort((x, y) => x - y)
      return { ...s, rain: { ...s.rain, done: a.done, series: { ...s.rain.series, t, db: t.map((k) => byT.get(k)!) } } }
    }
    case 'rainEnd':
      return settle({ ...s, rain: { ...s.rain, status: 'done' } })
    case 'rainError':
      return settle({ ...s, rain: { ...s.rain, status: 'error' } })
  }
}

const failure = (message: string, info?: FatalInfo): Omit<Notice, 'key'> => ({ level: info?.level ?? 'error', code: info?.code ?? 'failed', message, vars: info?.vars })
const unreachable = (): Omit<Notice, 'key'> => ({ level: 'error', code: 'backend-unreachable', message: 'Backend not reachable at {url}. Start it with: uv run asf-api', vars: { url: API_URL } })
const busy = (): Omit<Notice, 'key'> => ({ level: 'info', code: 'busy', message: 'The server is busy with other requests; trying again…' })

/**
 * Runs the analysis of a point over a period (`run`), and stops it (`cancel`). Nothing starts by itself: a long
 * period holds many scenes, so the person starts it, and sees when it ends. Changing the point clears everything.
 */
export function useAnalysis(point: { lon: number; lat: number } | null, windowM = 500) {
  const [state, dispatch] = useReducer(step, undefined, initial)
  const seq = useRef(0)
  const closers = useRef<(() => void)[]>([])
  // Rows arrive scene by scene (radar) and batch by batch (rain), many per second on a long period. Each one used to redraw
  // the charts; now they are collected and applied together a few times a second.
  const pending = useRef<{ radar: { rows: LiveRow[]; done: number; total: number } | null; rain: { rows: RainRow[]; done: number } | null }>({ radar: null, rain: null })
  const flushTimer = useRef(0)
  const flush = useCallback(() => {
    clearTimeout(flushTimer.current)
    flushTimer.current = 0
    const { radar, rain } = pending.current
    pending.current = { radar: null, rain: null }
    if (radar) dispatch({ type: 'radarRows', ...radar })
    if (rain) dispatch({ type: 'rainRows', ...rain })
  }, [])
  const later = useCallback(() => {
    if (!flushTimer.current) flushTimer.current = window.setTimeout(flush, 250)
  }, [flush])
  const lon = point ? Number(point.lon.toFixed(4)) : null
  const lat = point ? Number(point.lat.toFixed(4)) : null

  const stop = useCallback(() => {
    closers.current.forEach((c) => c())
    closers.current = []
    clearTimeout(flushTimer.current)
    flushTimer.current = 0
    pending.current = { radar: null, rain: null }
  }, [])

  useEffect(() => {
    dispatch({ type: 'reset' })
    return stop
  }, [lon, lat, windowM, stop])

  const run = useCallback((range: Range) => {
    if (lon === null || lat === null) return
    stop()
    const rain = Math.abs(lat) <= RAIN_LAT
    dispatch({ type: 'start', id: ++seq.current, range, rain })
    const q = (extra: Record<string, string>) => new URLSearchParams({ lon: String(lon), lat: String(lat), start: range.start, end: range.end, ...extra })
    closers.current.push(openSse(`${API_URL}/series/stream?${q({ dataset: 'auto', window_m: String(windowM), workers: '6' })}`, {
      meta: (m) => dispatch({ type: 'radarMeta', total: m.total, cached: m.cached, dataset: m.dataset }),
      notice: (n: BackendNotice) => dispatch({ type: 'notice', n }),
      rows: (d) => {
        const cur = pending.current.radar
        pending.current.radar = { rows: cur ? [...cur.rows, ...d.rows] : d.rows, done: d.done, total: d.total }
        later()
      },
      scene_error: () => dispatch({ type: 'radarScene' }),
    }, {
      done: (d) => { flush(); dispatch({ type: 'radarEnd', failed: d.failed ?? 0, assessment: d.assessment ?? null }) },
      fatal: (message, info) => { flush(); dispatch({ type: 'notice', n: failure(message, info) }); dispatch({ type: 'radarError' }) },
      unreachable: () => { dispatch({ type: 'notice', n: unreachable() }); dispatch({ type: 'radarError' }) },
      busy: () => dispatch({ type: 'notice', n: busy() }),
    }))
    if (rain) {
      closers.current.push(openSse(`${API_URL}/rain/stream?${q({})}`, {
        meta: (m) => dispatch({ type: 'rainMeta', total: m.total, cached: m.cached }),
        notice: (n: BackendNotice) => dispatch({ type: 'notice', n }),
        rows: (d) => {
          const cur = pending.current.rain
          pending.current.rain = { rows: cur ? [...cur.rows, ...d.rows] : d.rows, done: d.done }
          later()
        },
      }, {
        done: () => { flush(); dispatch({ type: 'rainEnd' }) },
        fatal: (message, info) => { flush(); dispatch({ type: 'notice', n: failure(message, info) }); dispatch({ type: 'rainError' }) },
        unreachable: () => { dispatch({ type: 'notice', n: unreachable() }); dispatch({ type: 'rainError' }) },
        busy: () => dispatch({ type: 'notice', n: busy() }),
      }))
    }
  }, [lon, lat, windowM, stop, flush, later])

  const cancel = useCallback(() => {
    flush() // what arrived before the click stays on screen
    stop()
    dispatch({ type: 'cancel' })
  }, [stop, flush])

  return { state, run, cancel }
}

type Line = { text: string; vars?: Vars }
export interface OutcomeMessage {
  level: 'success' | 'warning' | 'error' | 'info'
  /** English templates, translated by the page. */
  lines: Line[]
}

/** What to tell the person when an analysis ends. */
export function describeOutcome(o: Outcome): OutcomeMessage {
  if (o.kind === 'cancelled') return { level: 'info', lines: [{ text: 'Analysis cancelled. What was already read stays on screen.' }] }
  if (o.kind === 'failed') return { level: 'error', lines: [{ text: 'The analysis could not be completed. See the notes below.' }] }
  const vars = { scenes: o.scenes, sensor: o.dataset ?? '', days: o.rainDays, start: o.range.start, end: o.range.end }
  const title: Line = o.kind === 'partial'
    ? { text: o.radarFailed ? 'Analysis finished, but the radar could not be read.' : 'Analysis finished, but the rain could not be read.' }
    : { text: o.rainDays > 0 ? 'Analysis finished: {scenes} {sensor} scene(s) and {days} day(s) of rain, {start} to {end}.' : 'Analysis finished: {scenes} {sensor} scene(s), {start} to {end}.', vars }
  const verdict: Record<Confidence, Line> = {
    high: { text: 'The period has enough data for a confident reading.' },
    limited: { text: 'The data allow a reading, with the caveats in the notes below.' },
    insufficient: { text: 'Not enough data in this period to draw conclusions.' },
  }
  const lines = o.confidence ? [title, verdict[o.confidence]] : [title]
  const level = o.kind === 'partial' || o.confidence === 'limited' || o.confidence === 'insufficient' ? 'warning' : 'success'
  return { level, lines }
}
