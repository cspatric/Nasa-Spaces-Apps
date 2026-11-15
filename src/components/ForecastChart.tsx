import { useMemo } from 'react'
import { useI18n } from '../lib/i18n'
import type { ForecastPoint } from '../lib/forecast'

interface Props {
  history: ForecastPoint[]
  forecast: ForecastPoint[]
  color: string
  digits?: number
  label: string
}

const W = 268
const H = 112
const PAD = { l: 30, r: 6, t: 8, b: 16 }

/** Observed months (muted), the forecast (colored) and its 80 % band, with a marker where the data ends. */
export default function ForecastChart({ history, forecast, color, digits = 1, label }: Props) {
  const { locale } = useI18n()
  const m = useMemo(() => {
    const all = [...history, ...forecast]
    const ts = all.map((p) => p.t)
    const ys = [...history.map((p) => p.v), ...forecast.flatMap((p) => [p.lo ?? p.v, p.hi ?? p.v])]
    let y0 = Math.min(...ys), y1 = Math.max(...ys)
    const pad = (y1 - y0) * 0.08 || 1
    y0 -= pad; y1 += pad
    return { t0: Math.min(...ts), t1: Math.max(...ts), y0, y1 }
  }, [history, forecast])
  if (!history.length || !forecast.length) return null
  const x = (t: number) => PAD.l + ((t - m.t0) / (m.t1 - m.t0 || 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - m.y0) / (m.y1 - m.y0)) * (H - PAD.t - PAD.b)
  const line = (pts: ForecastPoint[]) => pts.map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const band = [...forecast.map((p) => `${x(p.t).toFixed(1)},${y(p.hi ?? p.v).toFixed(1)}`), ...[...forecast].reverse().map((p) => `${x(p.t).toFixed(1)},${y(p.lo ?? p.v).toFixed(1)}`)].join(' ')
  const year = (t: number) => new Date(t).toLocaleDateString(locale, { year: 'numeric', timeZone: 'UTC' })
  const split = x(history[history.length - 1].t)
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label}>
      {[0.1, 0.5, 0.9].map((f) => {
        const v = m.y0 + (m.y1 - m.y0) * f
        return (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.07)" />
            <text x={PAD.l - 4} y={y(v) + 3} textAnchor="end" fontSize="8.5" fill="#7d8894">{v.toFixed(digits)}</text>
          </g>
        )
      })}
      <polyline fill="none" stroke="#8691a0" strokeWidth="1.1" strokeLinejoin="round" points={line(history)} />
      <polygon fill={color} fillOpacity=".18" points={band} />
      <polyline fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" points={line(forecast)} />
      <line x1={split} x2={split} y1={PAD.t} y2={H - PAD.b} stroke="#fff" strokeOpacity=".35" strokeDasharray="3 3" />
      <text x={PAD.l} y={H - 3} fontSize="9" fill="#7d8894">{year(m.t0)}</text>
      <text x={W - PAD.r} y={H - 3} fontSize="9" fill="#7d8894" textAnchor="end">{year(m.t1)}</text>
    </svg>
  )
}
