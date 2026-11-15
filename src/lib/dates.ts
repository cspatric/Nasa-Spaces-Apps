import { useMemo } from 'react'
import { DAY_MS, L_BAND_START, LATEST_IMAGERY, OVERLAYS, SCENARIO_START, TIMELINE_START } from './catalog'

export const msFromIndex = (i: number) => TIMELINE_START + i * DAY_MS
export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)
export const indexFromMs = (ms: number) => Math.round((ms - TIMELINE_START) / DAY_MS)

// Building an Intl formatter costs about a millisecond; the label of the timeline is redrawn while the thumb is dragged,
// so each locale's formatter is made once.
const dayFormats = new Map<string, Intl.DateTimeFormat>()
export const formatDay = (ms: number, locale = 'en-GB') => {
  let f = dayFormats.get(locale)
  if (!f) { f = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }); dayFormats.set(locale, f) }
  return f.format(ms)
}

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

/** Ids of the layers with no real data on a date; the list keeps its identity while the set does not change. */
export function useBlockedLayers(ms: number): string[] {
  const key = OVERLAYS.filter((o) => overlayStatus(o, ms) !== 'ok').map((o) => o.id).join(',')
  return useMemo(() => (key ? key.split(',') : []), [key])
}
