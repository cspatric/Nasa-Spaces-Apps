import { useId, useMemo, useState } from 'react'
import { nearest, smoothPath } from '../lib/chart'
import { useI18n } from '../lib/i18n'
import type { Series } from '../lib/series'

interface Props {
  series: Series[]
  nowMs: number
}

const W = 268
const H = 118
const PAD = { l: 30, r: 8, t: 10, b: 18 }
const COLOR: Record<string, string> = { co: '#3be0c5', cross: '#f59e42', rain: '#8b9cff', tmax: '#fb7185', soil: '#a3e635' }

/** Radar or rain series: smooth lines with a glow and a soft fill, a marker for the date on the timeline, and a crosshair on hover. */
export default function SeriesChart({ series, nowMs }: Props) {
  const { t: tr, locale } = useI18n()
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const m = useMemo(() => {
    const ts = series.flatMap((s) => s.t)
    const ys = series.flatMap((s) => s.db)
    const t0 = Math.min(...ts), t1 = Math.max(...ts)
    let y0 = Math.min(...ys), y1 = Math.max(...ys)
    const pad = (y1 - y0) * 0.12 || 1
    y0 -= pad; y1 += pad
    return { t0, t1, y0, y1 }
  }, [series])
  const x = (t: number) => PAD.l + ((t - m.t0) / (m.t1 - m.t0 || 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - m.y0) / (m.y1 - m.y0)) * (H - PAD.t - PAD.b)
  const nx = nowMs >= m.t0 && nowMs <= m.t1 ? x(nowMs) : null
  const short = m.t1 - m.t0 < 400 * 86_400_000
  const fmt = (t: number) => new Date(t).toLocaleDateString(locale, short ? { month: 'short', year: '2-digit', timeZone: 'UTC' } : { year: 'numeric', timeZone: 'UTC' })
  const full = (t: number) => new Date(t).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const digits = m.y1 - m.y0 < 4 ? 2 : m.y1 - m.y0 < 12 ? 1 : 0
  const lead = series[0]
  const base = H - PAD.b

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const t = m.t0 + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (m.t1 - m.t0)
    setHover(lead.t.length ? lead.t[nearest(lead.t, t)] : null)
  }
  const hx = hover !== null ? x(hover) : null
  const tipLeft = hx !== null && hx > W * 0.6

  return (
    <svg className="chart modern" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={tr('Backscatter series')} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <defs>
        <filter id={`${uid}-glow`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.2" /></filter>
        {series.map((s, k) => {
          const c = COLOR[s.polClass] ?? '#9ca3af'
          return <linearGradient key={k} id={`${uid}-f${k}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={c} stopOpacity={k === 0 ? 0.34 : 0.14} /><stop offset="1" stopColor={c} stopOpacity="0" /></linearGradient>
        })}
      </defs>
      {[0.1, 0.5, 0.9].map((f) => {
        const v = m.y0 + (m.y1 - m.y0) * f
        return (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="rgba(150,180,255,0.1)" strokeDasharray="2 4" />
            <text x={PAD.l - 5} y={y(v) + 3} textAnchor="end" fontSize="8" fill="#6f7f9c" fontFamily="ui-monospace,Menlo,monospace">{v.toFixed(digits)}</text>
          </g>
        )
      })}
      {series.map((s, k) => {
        const c = COLOR[s.polClass] ?? '#9ca3af'
        const pts = s.t.map((t, i) => [x(t), y(s.db[i])] as [number, number])
        const line = smoothPath(pts)
        if (!pts.length) return null
        return (
          <g key={s.id}>
            {pts.length > 1 && <path d={`${line}L${pts[pts.length - 1][0].toFixed(1)},${base}L${pts[0][0].toFixed(1)},${base}Z`} fill={`url(#${uid}-f${k})`} />}
            <path d={line} fill="none" stroke={c} strokeWidth="3" opacity=".45" filter={`url(#${uid}-glow)`} />
            <path className="draw" pathLength={1} d={line} fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
            {pts.length <= 70 && pts.map((p, i) => <rect key={i} x={p[0] - 1.4} y={p[1] - 1.4} width="2.8" height="2.8" fill="#04121a" stroke={c} strokeWidth="1" />)}
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={c}><animate attributeName="r" values="2.5;5;2.5" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;.35;1" dur="2s" repeatCount="indefinite" /></circle>
          </g>
        )
      })}
      {nx !== null && <g><line x1={nx} x2={nx} y1={PAD.t} y2={base} stroke="#fff" strokeOpacity=".45" strokeDasharray="3 3" /><rect x={nx - 1.5} y={PAD.t - 2} width="3" height="3" fill="#fff" /></g>}
      {hx !== null && hover !== null && (
        <g pointerEvents="none">
          <line x1={hx} x2={hx} y1={PAD.t} y2={base} stroke="#cfe3ff" strokeOpacity=".55" />
          {series.map((s) => { const i = s.t.indexOf(hover); return i < 0 ? null : <circle key={s.id} cx={hx} cy={y(s.db[i])} r="3.2" fill={COLOR[s.polClass] ?? '#9ca3af'} stroke="#04121a" strokeWidth="1" /> })}
          <g transform={`translate(${tipLeft ? hx - 6 : hx + 6},${PAD.t})`}>
            <rect x={tipLeft ? -78 : 0} y="0" width="78" height={14 + series.length * 11} fill="rgba(6,10,18,0.94)" stroke="rgba(120,170,255,0.4)" />
            <text x={tipLeft ? -72 : 6} y="10" fontSize="8" fill="#9fb0cc" fontFamily="ui-monospace,Menlo,monospace">{full(hover)}</text>
            {series.map((s, k) => { const i = s.t.indexOf(hover); return i < 0 ? null : <text key={s.id} x={tipLeft ? -72 : 6} y={21 + k * 11} fontSize="9" fontWeight="700" fill={COLOR[s.polClass] ?? '#9ca3af'}>{s.pol} {s.db[i].toFixed(digits === 0 ? 1 : 2)}</text> })}
          </g>
        </g>
      )}
      <text x={PAD.l} y={H - 4} fontSize="8.5" fill="#6f7f9c" fontFamily="ui-monospace,Menlo,monospace">{fmt(m.t0)}</text>
      <text x={W - PAD.r} y={H - 4} fontSize="8.5" fill="#6f7f9c" fontFamily="ui-monospace,Menlo,monospace" textAnchor="end">{fmt(m.t1)}</text>
    </svg>
  )
}
