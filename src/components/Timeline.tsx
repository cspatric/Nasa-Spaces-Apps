import { L_BAND_START, SCENARIO_START, TIMELINE_DAYS } from '../lib/catalog'
import { useI18n } from '../lib/i18n'
import { formatDay, indexFromMs, modeAt, msFromIndex } from '../lib/dates'

interface Props {
  index: number
  onIndex: (i: number) => void
  playing: boolean
  onPlay: () => void
  clamped: boolean
}

const pct = (ms: number) => (indexFromMs(ms) / TIMELINE_DAYS) * 100
const YEARS = [2016, 2018, 2020, 2022, 2024, 2026, 2028, 2030]

export default function Timeline({ index, onIndex, playing, onPlay, clamped }: Props) {
  const { t, locale } = useI18n()
  const ms = msFromIndex(index)
  const mode = modeAt(ms)
  const lB = pct(L_BAND_START)
  const sc = pct(SCENARIO_START)
  return (
    <footer className="timeline glass">
      <button className="play" onClick={onPlay} aria-label={playing ? t('Pause') : t('Play')}>
        {playing ? (
          <svg viewBox="0 0 14 14" width="14" height="14"><path fill="currentColor" d="M2.5 1h3.2v12H2.5zM8.3 1h3.2v12H8.3z" /></svg>
        ) : (
          <svg viewBox="0 0 14 14" width="14" height="14"><path fill="currentColor" d="M3 1v12l10-6z" /></svg>
        )}
      </button>
      <div className="when">
        <strong>{formatDay(ms, locale)}</strong>
        <span className={`mode ${mode.key}`}>{t(mode.label)}{clamped && mode.key !== 'scenario' ? t(' · latest imagery') : ''}</span>
      </div>
      <div className="track">
        <div className="bar">
          <div className="c" title={t('C-band, OPERA')} style={{ width: `${lB}%` }} />
          <div className="l" title={t('L-band, NISAR')} style={{ width: `${sc - lB}%` }} />
          <div className="s" title={t('Scenarios (simulation)')} style={{ width: `${100 - sc}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={TIMELINE_DAYS}
          value={index}
          aria-label={t('Date')}
          onChange={(e) => onIndex(Number(e.target.value))}
        />
        <div className="years">
          {YEARS.map((y) => (
            <span key={y} style={{ left: `${pct(Date.UTC(y, 0, 1))}%` }}>{y}</span>
          ))}
        </div>
      </div>
    </footer>
  )
}
