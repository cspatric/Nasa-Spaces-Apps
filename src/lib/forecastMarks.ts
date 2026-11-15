import type { ForecastResult } from './forecast'

/** A label on the map for a forecast: where, how risky, and the forecast values of one year. */
export interface ForecastMark { lon: number; lat: number; level: 'low' | 'moderate' | 'high'; label: string }

const sumYear = (s: { year: number; total: number }[] | undefined, y: number) => s?.find((x) => x.year === y)?.total
const meanYear = (s: { year: number; mean: number }[] | undefined, y: number) => s?.find((x) => x.year === y)?.mean

/** One line of forecast values for a year: rain per year and the co-polarized backscatter. */
export function yearLine(r: ForecastResult, year: number): string {
  const rain = sumYear(r.rain?.yearly, year)
  const vv = meanYear(r.backscatter.co?.yearly, year)
  return [rain !== undefined ? `${Math.round(rain).toLocaleString('en-US')} mm` : null, vv !== undefined ? `${vv.toFixed(1)} dB` : null].filter(Boolean).join(' · ')
}

/** Marks to draw: one for a point, one per sample place for a region. */
export function marksFor(r: ForecastResult | null, at: { lon: number; lat: number } | null, year: number): ForecastMark[] {
  if (!r?.risk?.available) return []
  const line = yearLine(r, year)
  if (r.samples?.length) {
    return r.samples.filter((s) => s.level).map((s) => {
      const y = s.years?.[String(year)]
      const own = y ? [y.rain !== undefined ? `${y.rain.toLocaleString('en-US')} mm` : null, y.vv !== undefined ? `${y.vv.toFixed(1)} dB` : null].filter(Boolean).join(' · ') : line
      return { lon: s.lon, lat: s.lat, level: s.level as ForecastMark['level'], label: `${s.name}\n${year}: ${own}` }
    })
  }
  return at ? [{ lon: at.lon, lat: at.lat, level: r.risk.overall.level, label: `${year}: ${line}` }] : []
}
