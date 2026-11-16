import { memo, useEffect, useRef, useState } from 'react'
import { L_BAND_START, SCENARIO_START, TIMELINE_DAYS } from '../lib/catalog'
import { useI18n } from '../lib/i18n'
import { formatDay, indexFromMs, modeAt, msFromIndex } from '../lib/dates'

interface Props {
  index: number
  onIndex: (i: number) => void
  clamped: boolean
}

const pct = (ms: number) => (indexFromMs(ms) / TIMELINE_DAYS) * 100
const YEARS = [2016, 2018, 2020, 2022, 2024, 2026, 2028, 2030]

function Timeline({ index, onIndex, clamped }: Props) {
  const { t, locale } = useI18n()
  // While the thumb is dragged the date and the label follow it at once, but the rest of the page (charts, layers, imagery)
  // is told at most ten times a second, and once more when the thumb is released.
  const [drag, setDrag] = useState<number | null>(null)
  const latest = useRef(index)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const commit = () => {
    clearTimeout(timer.current)
    timer.current = 0
    onIndex(latest.current)
  }
  const release = () => {
    if (drag === null) return
    commit()
    setDrag(null)
  }
  const shown = drag ?? index
  const ms = msFromIndex(shown)
  const mode = modeAt(ms)
  const lB = pct(L_BAND_START)
  const sc = pct(SCENARIO_START)
  return (
    <footer className="timeline glass">
      <div className="when">
        <strong>{formatDay(ms, locale)}</strong>
        <span className={`mode ${mode.key}`}>{t(mode.label)}{clamped && mode.key !== 'scenario' ? t(' · latest imagery') : ''}</span>
      </div>
      <div className="track">
        <div className="rail">
          <div className="bar">
            <div className="c" title={t('C-band, OPERA')} style={{ width: `${lB}%` }} />
            <div className="l" title={t('L-band, NISAR')} style={{ width: `${sc - lB}%` }} />
            <div className="s" title={t('Scenarios (simulation)')} style={{ width: `${100 - sc}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={TIMELINE_DAYS}
            value={shown}
            aria-label={t('Date')}
            onChange={(e) => {
              const v = Number(e.target.value)
              latest.current = v
              setDrag(v)
              if (!timer.current) timer.current = window.setTimeout(commit, 100)
            }}
            onPointerUp={release}
            onKeyUp={release}
            onBlur={release}
          />
        </div>
        <div className="years">
          {YEARS.map((y) => (
            <span key={y} style={{ left: `${pct(Date.UTC(y, 0, 1))}%` }}>{y}</span>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default memo(Timeline)
