import { useMemo, useState } from 'react'
import type { LonLat, Pin } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { ForecastTab } from './ForecastView'
import { LEVEL, PHASE } from './forecastLabels'
import { progressOf, type ForecastResult, type ForecastState } from '../lib/forecast'
import type { RegionInfo } from '../lib/regions'
import SeriesChart from './SeriesChart'
import AnalysisBox from './AnalysisBox'
import type { AnalysisState, Range } from '../lib/analysis'
import { buildSeries, mainSeries, valueAt, windowOf, type Series } from '../lib/series'

export type Tab = 'data' | 'forecast' | 'regions'

interface Props {
  open: boolean
  tab: Tab
  onTab: (t: Tab) => void
  /** The analysis of the selected place over the chosen period. */
  analysis: AnalysisState
  /** Data is being processed (analysis or forecast): the place cannot be changed. */
  busy: boolean
  onAnalyze: (r: Range) => void
  onCancel: () => void
  /** Forecast of the selected point. */
  forecast: ForecastState
  onForecast: () => void
  /** The ready-made region being shown, if any. */
  region: { info: RegionInfo; data: ForecastResult } | null
  regions: RegionInfo[]
  onRegion: (id: string | null) => void
  fcYear: number
  onFcYear: (y: number) => void
  nowMs: number
  inspected: LonLat | null
  pins: Pin[]
  selectedPinId: string | null
  onSavePin: () => void
  onSelectPin: (id: string) => void
  onRemovePin: (id: string) => void
  onClear: () => void
}

const fmt = (n: number, d = 4) => n.toFixed(d)
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN
}
const signed = (n: number, d = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d)}`
const day = (ms: number, locale: string) => new Date(ms).toLocaleDateString(locale, { day: '2-digit', month: 'short', timeZone: 'UTC' })
type Translate = (key: string, vars?: Record<string, string | number>) => string

/** Insights computed live from the loaded series (nothing is precomputed). */
function insights(radar: Series[], rain: Series, nowMs: number, t: Translate, locale: string): string[] {
  const out: string[] = []
  const co = radar.find((s) => s.polClass === 'co')
  if (co) {
    const v = valueAt(co, nowMs)
    if (v) out.push(t('Radar {pol} on {date} is {delta} dB against the median of the {n} loaded scenes.', { pol: co.pol, date: day(v.t, locale), delta: signed(v.db - median(co.db)), n: co.t.length }))
  }
  if (rain.t.length) {
    const last = windowOf(rain, nowMs, 30)
    const total = last.reduce((a, x) => a + x.v, 0)
    const months: number[] = []
    for (let k = 1; k <= 5; k++) {
      const w = windowOf(rain, nowMs - k * 30 * 86_400_000, 30)
      if (w.length > 20) months.push(w.reduce((a, x) => a + x.v, 0))
    }
    const avg = months.length ? months.reduce((a, b) => a + b, 0) / months.length : NaN
    if (last.length > 20) {
      out.push(Number.isFinite(avg) && avg > 0
        ? t('Rain in the 30 days before: {total} mm, {delta}% against the previous {months} months.', { total: total.toFixed(0), delta: signed((100 * (total - avg)) / avg, 0), months: months.length })
        : t('Rain in the 30 days before: {total} mm.', { total: total.toFixed(0) }))
    }
    const wet = last.length ? last.reduce((a, b) => (b.v > a.v ? b : a)) : null
    if (wet && wet.v >= 1) out.push(t('Wettest day in that period: {mm} mm on {date}.', { mm: wet.v.toFixed(1), date: day(wet.t, locale) }))
  }
  return out
}

export default function InspectorPanel(p: Props) {
  const { t, locale } = useI18n()
  const [pinsOpen, setPinsOpen] = useState(false)
  const fail = (m?: string) => {
    const url = m?.match(/^Backend not reachable at (\S+)\./)?.[1]
    return url ? t('Backend not reachable at {url}. Start it with: uv run asf-api', { url }) : m
  }
  const rainState = p.analysis.rain
  // Grouping thousands of rows and the insights are computed when the data (or the date, or the language) changes,
  // not on every render of the panel.
  const radar = useMemo(() => mainSeries(buildSeries(p.analysis.radar.rows)), [p.analysis.radar.rows])
  const notes = useMemo(() => (p.inspected ? insights(radar, rainState.series, p.nowMs, t, locale) : []), [p.inspected, radar, rainState.series, p.nowMs, t, locale])
  const regionState: ForecastState | null = p.region ? { status: 'done', phase: '', done: 0, total: 0, result: p.region.data, outcome: null } : null
  const shown = regionState ?? p.forecast
  const hasTarget = p.inspected !== null || p.region !== null
  const loading = p.forecast.status === 'loading' && !p.region
  const level = shown.result?.risk?.available ? shown.result.risk.overall.level : null
  const pct = Math.round(100 * progressOf(p.forecast.phase, p.forecast.done, p.forecast.total))

  return (
    <aside className={`panel right glass inspector ${p.open ? '' : 'collapsed'}`} aria-hidden={!p.open} data-tour="inspector">
      <div className="tabs" role="tablist" data-tour="tabs">
        <button role="tab" aria-selected={p.tab === 'data'} className={p.tab === 'data' ? 'on' : ''} onClick={() => p.onTab('data')}>{t('Data')}</button>
        <button role="tab" aria-selected={p.tab === 'forecast'} className={p.tab === 'forecast' ? 'on' : ''} onClick={() => p.onTab('forecast')}>
          {t('Forecast')}
          {loading && <span className="spin tiny" />}
          {!loading && level && <i className={`dot lvl-${level}`} />}
        </button>
        <button role="tab" aria-selected={p.tab === 'regions'} className={p.tab === 'regions' ? 'on' : ''} onClick={() => p.onTab('regions')}>{t('Regions')}</button>
      </div>

      <div className="tab-body">
        {p.tab === 'data' && (
          <>
            {p.inspected ? (
              <>
                <div className="point">
                  <strong>{fmt(p.inspected.lat, 3)}°, {fmt(p.inspected.lon, 3)}°</strong>
                  <button className="btn primary" onClick={p.onSavePin}>{t('Save')}</button>
                  <button className="btn ghost" disabled={p.busy} title={p.busy ? t('Locked while data is being processed') : undefined} onClick={p.onClear}>{t('Clear')}</button>
                </div>
                <AnalysisBox state={p.analysis} busy={p.busy} onRun={p.onAnalyze} onCancel={p.onCancel} />
                {p.analysis.outcome && !p.busy && p.analysis.outcome.kind !== 'cancelled' && (
                  <button className="btn ghost wide next-step" onClick={() => p.onTab('forecast')}>{t('Next: forecast this place')} →</button>
                )}
                <ul className="series">
                  {(() => {
                    const st = p.analysis.radar
                    if (st.status === 'idle') return null
                    const sensor = st.dataset
                    const main = radar
                    const vals = main.map((s) => ({ pol: s.pol, v: valueAt(s, p.nowMs) }))
                    const any = vals.some((x) => x.v)
                    const ld = st.status === 'loading'
                    return (
                      <li>
                        <div className="head">
                          <span><strong>{sensor ?? t('Radar')}</strong>{sensor && <small>{t(sensor === 'NISAR' ? 'L-band' : 'C-band')}</small>}</span>
                          <span className={`vals ${any ? '' : 'off'}`}>
                            {any
                              ? vals.map((x) => (x.v ? `${x.pol} ${x.v.db.toFixed(1)}` : null)).filter(Boolean).join(' · ') + ' dB'
                              : ld ? t('reading…') : st.status === 'error' ? t('unavailable') : t('no scene near this date')}
                          </span>
                        </div>
                        {ld && (
                          <div className="progress">
                            <div className="bar"><i style={{ width: `${st.total ? (100 * st.done) / st.total : 4}%` }} /></div>
                            <small>{st.total ? t(st.cached ? '{done} of {total} scenes, {cached} cached' : '{done} of {total} scenes', { done: st.done, total: st.total, cached: st.cached }) : t('Searching ASF…')}</small>
                          </div>
                        )}
                        {ld && st.failed > 0 && <div className="note-muted">{t('{n} scene(s) could not be read.', { n: st.failed })}</div>}
                        {main.length > 0 && <SeriesChart series={main} nowMs={p.nowMs} />}
                      </li>
                    )
                  })()}
                  {rainState.status !== 'idle' && rainState.status !== 'skipped' && (() => {
                    const v = valueAt(rainState.series, p.nowMs, 1)
                    const ld = rainState.status === 'loading'
                    return (
                      <li title={t('NASA GPM IMERG daily total, 0.1 degree cell')}>
                        <div className="head">
                          <span><strong>{t('Rain')}</strong><small>IMERG</small></span>
                          <span className={`vals ${v ? '' : 'off'}`}>
                            {v ? `${v.db.toFixed(1)} mm/day` : ld ? t('reading…') : rainState.status === 'error' ? t('unavailable') : t('no data')}
                          </span>
                        </div>
                        {ld && (
                          <div className="progress">
                            <div className="bar"><i style={{ width: `${rainState.total ? (100 * rainState.done) / rainState.total : 4}%` }} /></div>
                            <small>{rainState.total ? t(rainState.cached ? '{done} of {total} days, {cached} cached' : '{done} of {total} days', { done: rainState.done, total: rainState.total, cached: rainState.cached }) : t('Searching…')}</small>
                          </div>
                        )}
                        {rainState.series.t.length > 1 && <SeriesChart series={[rainState.series]} nowMs={p.nowMs} />}
                      </li>
                    )
                  })()}
                </ul>
                {notes.length > 0 && (
                  <>
                    <h4 className="sub">{t('Insights')}</h4>
                    <ul className="insights">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
                  </>
                )}
              </>
            ) : (
              <ol className="howto" aria-label={t('How to start')}>
                <li><i>1</i><span><strong>{t('Click a point on the map')}</strong>{t('or search a city above. This is the place everything is about.')}</span></li>
                <li><i>2</i><span><strong>{t('Choose a period')}</strong>{t('dates, or 30 days to 5 years. The sensor is picked for you.')}</span></li>
                <li><i>3</i><span><strong>{t('Press Analyze')}</strong>{t('radar and rain fill in as they are read, with notes on how far to trust them.')}</span></li>
              </ol>
            )}
            {p.pins.length > 0 && (
              <>
                <button className="sub-toggle" aria-expanded={pinsOpen} onClick={() => setPinsOpen((v) => !v)}>{t('Pins')} <span className="count">{p.pins.length}</span></button>
                {pinsOpen && (
                  <ul className="pins">
                    {p.pins.map((pin) => (
                      <li key={pin.id} className={pin.id === p.selectedPinId ? 'sel' : ''}>
                        <button className="link" onClick={() => p.onSelectPin(pin.id)}>
                          <strong>{pin.label}</strong>
                          <small>{fmt(pin.lat, 3)}°, {fmt(pin.lon, 3)}°</small>
                        </button>
                        <button className="x" aria-label={t('Remove {name}', { name: pin.label })} onClick={() => p.onRemovePin(pin.id)}>×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}

        {p.tab === 'forecast' && <ForecastTab shown={shown} hasTarget={hasTarget} regionName={p.region ? p.region.info.name : null} fail={fail} />}

        {p.tab === 'regions' && (
          <>
            <p className="caption flush">{t('Forecasts computed ahead for whole regions: nothing to wait for.')}</p>
            <ul className="regions">
              {p.regions.length === 0 && <li className="none">{t('The backend has no regions yet.')}</li>}
              {p.regions.map((r) => (
                <li key={r.id} className={p.region?.info.id === r.id ? 'sel' : ''}>
                  <button disabled={!r.ready || p.busy} title={p.busy ? t('Locked while data is being processed') : undefined} onClick={() => p.onRegion(p.region?.info.id === r.id ? null : r.id)}>
                    <strong>{r.name}</strong>
                    <small>{r.ready ? t('{n} sample places', { n: r.samples }) : t('being prepared')}</small>
                    {r.ready && r.overall && <span className={`chip lvl-${r.overall.level}`}>{t(LEVEL[r.overall.level])}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {hasTarget && (p.tab === 'forecast' || p.region !== null || loading) && ( // the forecast button lives on the Forecast tab only; the Data tab has its own button (Analyze)
        <div className="pinned" data-tour="forecast-run">
          {p.region ? (
            <div className="pin-row">
              <span className="pin-label">{p.region.info.name} · {t('ready-made')}</span>
              <button className="btn ghost" onClick={() => p.onRegion(null)}>{t('Close')}</button>
            </div>
          ) : loading ? (
            <div className="pin-progress">
              <div className="pin-row"><span className="pin-label">{t(PHASE[p.forecast.phase] ?? 'Working…')}{p.forecast.total > 1 ? ` ${p.forecast.done}/${p.forecast.total}` : ''}</span><strong>{pct}%</strong></div>
              <div className="bar big"><i style={{ width: `${Math.max(3, pct)}%` }} /></div>
              <button className="btn ghost" onClick={p.onCancel}>{t('Cancel')}</button>
            </div>
          ) : (
            <button className="btn primary wide" onClick={() => { p.onForecast(); p.onTab('forecast') }}>
              {t(p.forecast.status === 'done' ? 'Run forecast again' : p.forecast.status === 'error' ? 'Try the forecast again' : 'Run forecast')}
            </button>
          )}
          {shown.result && (
            <div className="year-row">
              <span>{t('Map year')}</span>
              {[2027, 2028, 2029, 2030].map((y) => <button key={y} className={p.fcYear === y ? 'on' : ''} onClick={() => p.onFcYear(y)}>{y}</button>)}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
