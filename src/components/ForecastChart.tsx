import { memo, useId, useMemo, useState } from 'react'
import { nearest, smoothPath } from '../lib/chart'
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
const H = 126
const PAD = { l: 32, r: 8, t: 12, b: 18 }

/** Observed months (muted), the forecast (colored) inside its 80 % band, where the data ends, and a crosshair on hover. */
type Box = { t0: number; t1: number; y0: number; y1: number }

/** The lines, band and axes of the chart: they change only with the data, not with the mouse, so they are drawn once (the blur filter is not cheap). */
const Lines = memo(function Lines({ history, forecast, color, digits, uid, m }: { history: ForecastPoint[]; forecast: ForecastPoint[]; color: string; digits: number; uid: string; m: Box }) {
  const { locale } = useI18n()
  const x = (t: number) => PAD.l + ((t - m.t0) / (m.t1 - m.t0 || 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - m.y0) / (m.y1 - m.y0)) * (H - PAD.t - PAD.b)
  const base = H - PAD.b
  const hist = history.map((p) => [x(p.t), y(p.v)] as [number, number])
  const fc = forecast.map((p) => [x(p.t), y(p.v)] as [number, number])
  const up = forecast.map((p) => [x(p.t), y(p.hi ?? p.v)] as [number, number])
  const lo = forecast.map((p) => [x(p.t), y(p.lo ?? p.v)] as [number, number]).reverse()
  const band = `${smoothPath(up)}L${lo[0][0].toFixed(1)},${lo[0][1].toFixed(1)}${smoothPath(lo).replace(/^M[^C]*/, '')}Z`
  const year = (t: number) => new Date(t).toLocaleDateString(locale, { year: 'numeric', timeZone: 'UTC' })
  const split = x(history[history.length - 1].t)
  const mono = 'ui-monospace,Menlo,monospace'
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-h`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8fa3c7" stopOpacity=".22" /><stop offset="1" stopColor="#8fa3c7" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${uid}-b`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".38" /><stop offset="1" stopColor={color} stopOpacity=".1" /></linearGradient>
        <filter id={`${uid}-g`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.4" /></filter>
      </defs>
      {[0.1, 0.5, 0.9].map((f) => {
        const v = m.y0 + (m.y1 - m.y0) * f
        return (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="rgba(150,180,255,0.1)" strokeDasharray="2 4" />
            <text x={PAD.l - 5} y={y(v) + 3} textAnchor="end" fontSize="8" fill="#6f7f9c" fontFamily={mono}>{v.toFixed(digits)}</text>
          </g>
        )
      })}
      <rect x={split} y={PAD.t} width={W - PAD.r - split} height={base - PAD.t} fill={color} opacity=".035" />
      <path d={`${smoothPath(hist)}L${hist[hist.length - 1][0].toFixed(1)},${base}L${hist[0][0].toFixed(1)},${base}Z`} fill={`url(#${uid}-h)`} />
      <path d={smoothPath(hist)} fill="none" stroke="#8fa3c7" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={band} fill={`url(#${uid}-b)`} />
      <path d={smoothPath(fc)} fill="none" stroke={color} strokeWidth="3" opacity=".5" filter={`url(#${uid}-g)`} />
      <path className="draw" pathLength={1} d={smoothPath(fc)} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <line x1={split} x2={split} y1={PAD.t - 4} y2={base} stroke="#fff" strokeOpacity=".4" strokeDasharray="3 3" />
      <text x={split + 4} y={PAD.t + 4} fontSize="7.5" fill="#9fb0cc" fontFamily={mono}>{year(history[history.length - 1].t)} ▸</text>
    </>
  )
})

function ForecastChart({ history, forecast, color, digits = 1, label }: Props) {
  const { locale } = useI18n()
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const m = useMemo(() => {
    const all = [...history, ...forecast]
    const ts = all.map((p) => p.t)
    const ys = [...history.map((p) => p.v), ...forecast.flatMap((p) => [p.lo ?? p.v, p.hi ?? p.v])]
    let y0 = Math.min(...ys), y1 = Math.max(...ys)
    const pad = (y1 - y0) * 0.1 || 1
    y0 -= pad; y1 += pad
    return { t0: Math.min(...ts), t1: Math.max(...ts), y0, y1 }
  }, [history, forecast])
  if (!history.length || !forecast.length) return null
  const x = (t: number) => PAD.l + ((t - m.t0) / (m.t1 - m.t0 || 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - m.y0) / (m.y1 - m.y0)) * (H - PAD.t - PAD.b)
  const base = H - PAD.b
  const year = (t: number) => new Date(t).toLocaleDateString(locale, { year: 'numeric', timeZone: 'UTC' })
  const full = (t: number) => new Date(t).toLocaleDateString(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' })
  const mono = 'ui-monospace,Menlo,monospace'

  const all = [...history, ...forecast]
  const xs = all.map((p) => p.t)
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const t = m.t0 + ((((e.clientX - r.left) / r.width) * W - PAD.l) / (W - PAD.l - PAD.r)) * (m.t1 - m.t0)
    setHover(nearest(xs, t))
  }
  const hp = hover !== null ? all[hover] : null
  const isF = hp ? hp.t > history[history.length - 1].t : false
  const hx = hp ? x(hp.t) : null
  const tipLeft = hx !== null && hx > W * 0.55
  return (
    <svg className="chart modern" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <Lines history={history} forecast={forecast} color={color} digits={digits} uid={uid} m={m} />
      {hp && hx !== null && (
        <g pointerEvents="none">
          <line x1={hx} x2={hx} y1={PAD.t} y2={base} stroke="#cfe3ff" strokeOpacity=".55" />
          <circle cx={hx} cy={y(hp.v)} r="3.4" fill={isF ? color : '#cfe3ff'} stroke="#04121a" strokeWidth="1" />
          <g transform={`translate(${tipLeft ? hx - 6 : hx + 6},${PAD.t + 12})`}>
            <rect x={tipLeft ? -86 : 0} y="0" width="86" height={isF && hp.lo !== undefined ? 36 : 25} fill="rgba(6,10,18,0.95)" stroke="rgba(120,170,255,0.4)" />
            <text x={tipLeft ? -80 : 6} y="10" fontSize="8" fill="#9fb0cc" fontFamily={mono}>{full(hp.t)}{isF ? ' · ▸' : ''}</text>
            <text x={tipLeft ? -80 : 6} y="21" fontSize="10" fontWeight="700" fill={isF ? color : '#dfe8f7'}>{hp.v.toFixed(digits === 0 ? 0 : 2)}</text>
            {isF && hp.lo !== undefined && <text x={tipLeft ? -80 : 6} y="31" fontSize="8" fill="#9fb0cc" fontFamily={mono}>{hp.lo.toFixed(digits === 0 ? 0 : 2)} … {hp.hi?.toFixed(digits === 0 ? 0 : 2)}</text>}
          </g>
        </g>
      )}
      <text x={PAD.l} y={H - 4} fontSize="8.5" fill="#6f7f9c" fontFamily={mono}>{year(m.t0)}</text>
      <text x={W - PAD.r} y={H - 4} fontSize="8.5" fill="#6f7f9c" fontFamily={mono} textAnchor="end">{year(m.t1)}</text>
    </svg>
  )
}

export default memo(ForecastChart)
