import { DAY_MS, L_BAND_START, LATEST_IMAGERY, SCENARIO_START, TIMELINE_START } from './catalog'

export const msFromIndex = (i: number) => TIMELINE_START + i * DAY_MS
export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)
export const indexFromMs = (ms: number) => Math.round((ms - TIMELINE_START) / DAY_MS)

export const formatDay = (ms: number, locale = 'en-GB') =>
  new Date(ms).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Imagery date actually requested: never newer than the latest available. */
export const imageryMs = (i: number) => Math.min(msFromIndex(i), LATEST_IMAGERY)

export type Mode = { key: 'c' | 'l' | 'scenario'; label: string }
export function modeAt(ms: number): Mode {
  if (ms >= SCENARIO_START) return { key: 'scenario', label: 'Scenario · simulation' }
  if (ms >= L_BAND_START) return { key: 'l', label: 'L-band · NISAR' }
  return { key: 'c', label: 'C-band · OPERA' }
}

/** Whether a NASA layer has real data on a timeline date: it must exist yet, and scenarios are never real imagery. */
export function overlayStatus(layer: { from?: number }, ms: number): 'ok' | 'before' | 'scenario' {
  if (ms >= SCENARIO_START) return 'scenario'
  if (layer.from !== undefined && ms < layer.from) return 'before'
  return 'ok'
}
