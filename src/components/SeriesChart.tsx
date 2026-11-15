import { useMemo } from 'react'
import { useI18n } from '../lib/i18n'
import type { Series } from '../lib/series'

interface Props {
  series: Series[]
  nowMs: number
}

const W = 268
const H = 92
const PAD = { l: 26, r: 6, t: 8, b: 16 }
const COLOR: Record<string, string> = { co: '#5eead4', cross: '#fb923c', rain: '#818cf8', tmax: '#fb7185', soil: '#a3e635' }

export default function SeriesChart({ series, nowMs }: Props) {
  const { t: tr, locale } = useI18n()
  const m = useMemo(() => {
    const ts = series.flatMap((s) => s.t)
    const ys = series.flatMap((s) => s.db)
    const t0 = Math.min(...ts), t1 = Math.max(...ts)
    let y0 = Math.min(...ys), y1 = Math.max(...ys)
    const pad = (y1 - y0) * 0.1 || 1
    y0 -= pad; y1 += pad
    return { t0, t1, y0, y1 }
  }, [series])
  const x = (t: number) => PAD.l + ((t - m.t0) / (m.t1 - m.t0 || 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - m.y0) / (m.y1 - m.y0)) * (H - PAD.t - PAD.b)
  const nx = nowMs >= m.t0 && nowMs <= m.t1 ? x(nowMs) : null
  const short = m.t1 - m.t0 < 400 * 86_400_000
  const fmt = (t: number) =>
    short
      ? new Date(t).toLocaleDateString(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' })
      : String(new Date(t).getUTCFullYear())
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={tr('Backscatter series')}>
      {[m.y0 + (m.y1 - m.y0) * 0.1, (m.y0 + m.y1) / 2, m.y1 - (m.y1 - m.y0) * 0.1].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.07)" />
          <text x={PAD.l - 4} y={y(v) + 3} textAnchor="end" fontSize="8.5" fill="#7d8894">{v.toFixed(m.y1 - m.y0 < 4 ? 2 : m.y1 - m.y0 < 12 ? 1 : 0)}</text>
        </g>
      ))}
      {series.map((s) => (
        <polyline key={s.id} fill="none" stroke={COLOR[s.polClass] ?? '#9ca3af'} strokeWidth="1.3" strokeLinejoin="round"
          points={s.t.map((t, i) => `${x(t).toFixed(1)},${y(s.db[i]).toFixed(1)}`).join(' ')} />
      ))}
      {nx !== null && <line x1={nx} x2={nx} y1={PAD.t} y2={H - PAD.b} stroke="#fff" strokeOpacity=".6" strokeDasharray="3 3" />}
      <text x={PAD.l} y={H - 3} fontSize="9" fill="#7d8894">{fmt(m.t0)}</text>
      <text x={W - PAD.r} y={H - 3} fontSize="9" fill="#7d8894" textAnchor="end">{fmt(m.t1)}</text>
    </svg>
  )
}
