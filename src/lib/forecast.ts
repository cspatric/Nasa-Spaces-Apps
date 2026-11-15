import { useCallback, useEffect, useReducer, useRef } from 'react'
import { API_URL } from './api'
import { openSse } from './stream'

export interface ForecastPoint { t: number; v: number; lo?: number; hi?: number }
export interface ForecastSeries {
  model: string
  reliable: boolean
  pol?: string
  trendPerDecade: number | null
  history: ForecastPoint[]
  forecast: ForecastPoint[]
  backtest: { mae: number; naiveMae: number; skill: number; folds: number }
  yearly: { year: number; mean: number; total: number; months: number }[]
  places?: number
}
export interface RiskItem {
  id: string
  applicable: boolean
  score: number
  level: 'low' | 'moderate' | 'high' | 'n/a'
  evidence: { text: string; vars: Record<string, string | number> }[]
  /** Regions: the sample place that is riskiest for this risk. */
  place?: string
}
export interface RiskResult {
  available: boolean
  reason?: string
  landCover?: { class: string; confidence: number; cvAccuracy: number; trainedOn: number } | null
  risks: RiskItem[]
  overall: { score: number; level: 'low' | 'moderate' | 'high'; main: string | null }
  note: string
}
export interface ForecastResult {
  risk?: RiskResult
  until: string
  backscatter: Record<string, ForecastSeries>
  rain?: ForecastSeries
  notes: string[]
  meta: { radarScenes: number; rainMonths: number }
  /** Ready-made regions only. */
  samples?: { name: string; lon: number; lat: number; level: 'low' | 'moderate' | 'high' | null; main: string | null; cover: string | null; years?: Record<string, { rain?: number; vv?: number }> }[]
  region?: { id: string; name: string; center: [number, number]; zoom: number; bounds: [number, number, number, number] }
  builtAt?: string
}

export interface ForecastState {
  status: 'idle' | 'loading' | 'done' | 'error'
  phase: string
  done: number
  total: number
  result: ForecastResult | null
  message?: string
}
const EMPTY: ForecastState = { status: 'idle', phase: '', done: 0, total: 0, result: null }

type Action =
  | { type: 'reset' }
  | { type: 'start' }
  | { type: 'progress'; phase: string; done: number; total: number }
  | { type: 'result'; result: ForecastResult }
  | { type: 'end'; status: 'done' | 'error'; message?: string }

function reducer(s: ForecastState, a: Action): ForecastState {
  if (a.type === 'reset') return EMPTY
  if (a.type === 'start') return { ...EMPTY, status: 'loading' }
  if (a.type === 'progress') return { ...s, phase: a.phase, done: a.done, total: a.total }
  if (a.type === 'result') return { ...s, result: a.result }
  return { ...s, status: s.result ? 'done' : a.status, message: a.message }
}

/**
 * Forecast to 2030 for a point, computed by the backend (`/forecast/stream`). It reads years of history, so it
 * only starts when asked (`run`); progress streams in while it works. Changing the point cancels and clears it.
 */
export function useForecast(point: { lon: number; lat: number } | null, windowM = 500): { state: ForecastState; run: () => void } {
  const [state, dispatch] = useReducer(reducer, EMPTY)
  const es = useRef<{ close: () => void } | null>(null)
  const lon = point ? Number(point.lon.toFixed(3)) : null
  const lat = point ? Number(point.lat.toFixed(3)) : null

  useEffect(() => {
    dispatch({ type: 'reset' })
    return () => es.current?.close()
  }, [lon, lat, windowM])

  const run = useCallback(() => {
    if (lon === null || lat === null) return
    es.current?.close()
    dispatch({ type: 'start' })
    const close = openSse(`${API_URL}/forecast/stream?${new URLSearchParams({ lon: String(lon), lat: String(lat), until: '2030-12', window_m: String(windowM) })}`, {
      progress: (d) => dispatch({ type: 'progress', phase: d.phase, done: d.done, total: d.total }),
      result: (r) => dispatch({ type: 'result', result: r }),
    }, {
      done: () => dispatch({ type: 'end', status: 'done' }),
      fatal: (message) => dispatch({ type: 'end', status: 'error', message }),
      unreachable: () => dispatch({ type: 'end', status: 'error', message: `Backend not reachable at ${API_URL}. Start it with: uv run asf-api` }),
    })
    es.current = { close }
  }, [lon, lat, windowM])

  return { state, run }
}

/** Where the forecast is, from 0 to 1 over all its phases (radar history is the longest part). */
const PHASES: Record<string, [number, number]> = {
  'radar-search': [0, 0.03], radar: [0.03, 0.63], 'rain-monthly': [0.63, 0.78], 'rain-daily': [0.78, 0.9], model: [0.9, 1],
}
export function progressOf(phase: string, done: number, total: number): number {
  const [a, b] = PHASES[phase] ?? [0, 0.02]
  return a + (b - a) * (total > 0 ? Math.min(1, done / total) : 0)
}
