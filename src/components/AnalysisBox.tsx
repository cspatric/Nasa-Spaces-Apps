import { useState } from 'react'
import { DAY_MS, TIMELINE_START } from '../lib/catalog'
import { describeOutcome, type AnalysisState, type Level, type Range } from '../lib/analysis'
import { isoDay } from '../lib/dates'
import { useI18n } from '../lib/i18n'

interface Props {
  state: AnalysisState
  /** Something is being processed (the analysis or a forecast): the place is locked. */
  busy: boolean
  onRun: (range: Range) => void
  onCancel: () => void
}

const MIN_DAY = isoDay(TIMELINE_START)
const MAX_DAYS = 366 * 12
const PRESETS = [{ label: '30 days', days: 30 }, { label: '6 months', days: 182 }, { label: '1 year', days: 365 }, { label: '5 years', days: 1826 }]
const ORDER: Record<Level, number> = { error: 0, warning: 1, info: 2 }

const lastDays = (days: number): Range => ({ start: isoDay(Date.now() - days * DAY_MS), end: isoDay(Date.now()) })

/** Why a period cannot be analysed, if it cannot (the backend limits it to 12 years and the data starts in 2016). */
function problem(r: Range, today: string): { text: string; vars?: Record<string, string> } | null {
  if (!r.start || !r.end || r.start >= r.end) return { text: 'Choose a start before the end.' }
  if (r.start < MIN_DAY || r.end > today) return { text: 'Choose dates between {min} and today.', vars: { min: MIN_DAY } }
  if ((Date.parse(r.end) - Date.parse(r.start)) / DAY_MS > MAX_DAYS) return { text: 'The period can be at most 12 years.' }
  return null
}

/**
 * The period of the analysis and what came of it. The sensor is not chosen here: the backend picks it from the
 * period. While something is processed the button turns into Cancel and the place is locked; when it ends, the
 * outcome and every note the backend sent are listed (errors first).
 */
export default function AnalysisBox({ state, busy, onRun, onCancel }: Props) {
  const { t } = useI18n()
  const [range, setRange] = useState<Range>(() => lastDays(90))
  const [today] = useState(() => isoDay(Date.now()))
  const bad = problem(range, today)
  const outcome = !busy && state.outcome ? describeOutcome(state.outcome) : null
  const notes = [...state.notices].sort((a, b) => ORDER[a.level] - ORDER[b.level])

  return (
    <section className="analysis" aria-label={t('Analysis period')} data-tour="analysis">
      <h4 className="sub">{t('Analysis period')}</h4>
      <div className="range-row">
        <label><span>{t('From')}</span><input type="date" value={range.start} min={MIN_DAY} max={today} disabled={busy} onChange={(e) => setRange({ ...range, start: e.target.value })} /></label>
        <label><span>{t('To')}</span><input type="date" value={range.end} min={MIN_DAY} max={today} disabled={busy} onChange={(e) => setRange({ ...range, end: e.target.value })} /></label>
      </div>
      <div className="presets-row" role="group" aria-label={t('Analysis period')}>
        {PRESETS.map((p) => <button key={p.label} disabled={busy} onClick={() => setRange(lastDays(p.days))}>{t(p.label)}</button>)}
      </div>
      {bad && !busy && <small className="range-err">{t(bad.text, bad.vars)}</small>}
      {busy ? (
        <>
          <p className="lock-note">{t('Processing data. The place is locked until it ends; cancel to choose another.')}</p>
          <button className="btn wide" onClick={onCancel}>{t('Cancel')}</button>
        </>
      ) : (
        <button className="btn primary wide" disabled={bad !== null} onClick={() => onRun(range)}>{t(state.outcome ? 'Analyze again' : 'Analyze this period')}</button>
      )}
      <small className="fine-row">{t('The sensor is chosen automatically from the period: NISAR (L-band) when it is all from October 2025 on, otherwise OPERA (C-band).')}</small>
      {outcome && (
        <div className={`outcome ${outcome.level}`} role="status">
          {outcome.lines.map((l, i) => (i === 0 ? <strong key={l.text}>{t(l.text, l.vars)}</strong> : <span key={l.text}>{t(l.text, l.vars)}</span>))}
        </div>
      )}
      {notes.length > 0 && (
        <ul className="notices" aria-label={t('Notes')}>
          {notes.map((n) => <li key={n.key} className={n.level}>{t(n.message, n.vars)}</li>)}
        </ul>
      )}
    </section>
  )
}
