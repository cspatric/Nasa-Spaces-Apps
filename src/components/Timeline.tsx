import { L_BAND_START, SCENARIO_START, TIMELINE_DAYS, TIMELINE_START } from '../lib/catalog'
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
  const ms = msFromIndex(index)
  const mode = modeAt(ms)
  const lB = pct(L_BAND_START)
  const sc = pct(SCENARIO_START)
  return (
    <footer className="timeline glass">
      <button className="play" onClick={onPlay} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? (
          <svg viewBox="0 0 14 14" width="14" height="14"><path fill="currentColor" d="M2.5 1h3.2v12H2.5zM8.3 1h3.2v12H8.3z" /></svg>
        ) : (
          <svg viewBox="0 0 14 14" width="14" height="14"><path fill="currentColor" d="M3 1v12l10-6z" /></svg>
        )}
      </button>
      <div className="when">
        <strong>{formatDay(ms)}</strong>
        <span className={`chip ${mode.key}`}>{mode.label}</span>
      </div>
      <div className="track">
        <div className="bar">
          <div className="seg c" style={{ width: `${lB}%` }}>C-band · OPERA</div>
          <div className="seg l" style={{ width: `${sc - lB}%` }}>L</div>
          <div className="seg s" style={{ width: `${100 - sc}%` }}>Scenarios</div>
        </div>
        <input
          type="range"
          min={0}
          max={TIMELINE_DAYS}
          value={index}
          aria-label="Date"
          onChange={(e) => onIndex(Number(e.target.value))}
        />
        <div className="years">
          {YEARS.map((y) => (
            <span key={y} style={{ left: `${pct(Date.UTC(y, 0, 1))}%` }}>{y}</span>
          ))}
        </div>
      </div>
      <div className="hint">
        {clamped ? 'Showing the latest available imagery' : `Imagery of ${formatDay(ms)}`}
        <small>{formatDay(TIMELINE_START)} to 2030</small>
      </div>
    </footer>
  )
}
