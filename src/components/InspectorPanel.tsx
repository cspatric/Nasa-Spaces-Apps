import { useState } from 'react'
import type { Area, LonLat, Pin } from '../lib/types'
import { useI18n } from '../lib/i18n'
import ForecastChart from './ForecastChart'
import { progressOf, type ForecastResult, type ForecastState, type RiskResult } from '../lib/forecast'
import type { RegionInfo } from '../lib/regions'
import SeriesChart from './SeriesChart'
import type { LiveState, Sensor } from '../lib/live'
import type { RainState } from '../lib/rain'
import { buildSeries, mainSeries, valueAt, windowOf, type Series } from '../lib/series'

export type Tab = 'data' | 'forecast' | 'regions'

interface Props {
  open: boolean
  tab: Tab
  onTab: (t: Tab) => void
  live: Record<Sensor, LiveState>
  rain: RainState
  /** Forecast of the selected point or area. */
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
  area: Area | null
  areaKm: { w: number; h: number; windowM: number } | null
  selectMode: boolean
  onSelectMode: (v: boolean) => void
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

const PHASE: Record<string, string> = {
  'radar-search': 'Searching radar scenes…', radar: 'Reading radar history', 'rain-monthly': 'Reading monthly rain',
  'rain-daily': 'Reading recent rain', model: 'Training the model…',
}
const RISK_NAME: Record<string, string> = { vegetation_loss: 'Vegetation loss', flood: 'Flood', drought_fire: 'Drought and fire', unusual_change: 'Unusual change' }
const LEVEL: Record<string, string> = { low: 'Low', moderate: 'Moderate', high: 'High', 'n/a': 'Not applicable' }
const COVER: Record<string, string> = { forest: 'Forest', vegetation: 'Other vegetation', urban: 'City', water: 'Open water' }

function RiskBlock({ risk }: { risk: RiskResult }) {
  const { t } = useI18n()
  if (!risk.available) return <p className="fine">{t('Risks need both polarizations and at least 30 months of data.')}</p>
  const cover = risk.landCover
  return (
    <div className="risk">
      <div className="risk-head">
        <span className={`chip lvl-${risk.overall.level}`}>{t(LEVEL[risk.overall.level])}</span>
        <small>{risk.overall.main ? t(RISK_NAME[risk.overall.main]) : ''}</small>
      </div>
      {cover && <small className="fine-row">{t('Land cover')}: {t(COVER[cover.class] ?? cover.class)} ({Math.round(cover.confidence * 100)}%)</small>}
      <ul className="risk-list">
        {risk.risks.map((r) => (
          <li key={r.id} className={r.applicable ? '' : 'na'}>
            <div className="head">
              <strong>{t(RISK_NAME[r.id] ?? r.id)}</strong>
              <span className={`chip lvl-${r.level.replace('/', '')}`}>{t(LEVEL[r.level])}</span>
            </div>
            {r.applicable && <div className="meter"><i className={`lvl-${r.level}`} style={{ width: `${Math.max(4, Math.round(r.score * 100))}%` }} /></div>}
            {r.applicable && r.evidence.slice(0, 2).map((e) => <small className="fine-row" key={e.text}>{t(e.text, e.vars)}</small>)}
            {r.applicable && r.place && <small className="fine-row place">{t('Riskiest place')}: {r.place}</small>}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The charts of a finished forecast: one card per series, with its yearly values. */
function Charts({ r }: { r: ForecastResult }) {
  const { t, locale } = useI18n()
  const co = r.backscatter.co
  const cross = r.backscatter.cross
  const parts = [
    co && { key: 'co', title: `${t('Radar')} ${co.pol ?? ''} (dB)`, s: co, color: '#5eead4', digits: 1 },
    cross && { key: 'cross', title: `${t('Radar')} ${cross.pol ?? ''} (dB)`, s: cross, color: '#fb923c', digits: 1 },
    r.rain && { key: 'rain', title: t('Rain (mm/month)'), s: r.rain, color: '#818cf8', digits: 0 },
  ].filter(Boolean) as { key: string; title: string; s: NonNullable<typeof co>; color: string; digits: number }[]
  return (
    <>
      <ul className="series forecast">
        {parts.map(({ key, title, s, color, digits }) => {
          const sk = Math.round(s.backtest.skill * 100)
          return (
            <li key={key}>
              <div className="head">
                <strong>{title}</strong>
                <span className={`vals ${s.reliable ? '' : 'off'}`}>{s.reliable ? t('reliable') : t('weak')}</span>
              </div>
              <ForecastChart history={s.history} forecast={s.forecast} color={color} digits={digits} label={title} />
              <small className="fine-row">
                {t('Model')}: {s.model} · {t('error')} {s.backtest.mae.toFixed(digits === 0 ? 0 : 2)} · {sk >= 0 ? t('{n}% better than last year', { n: sk }) : t('{n}% worse than last year', { n: -sk })}
                {s.trendPerDecade !== null && digits !== 0 && ` · ${s.trendPerDecade >= 0 ? '+' : '−'}${Math.abs(s.trendPerDecade).toFixed(2)}/${t('decade')}`}
              </small>
              <div className="yearly">
                {s.yearly.filter((y) => y.months >= 12).map((y) => (
                  <span key={y.year}><em>{y.year}</em>{digits === 0 ? `${Math.round(y.total)} mm` : y.mean.toFixed(1)}</span>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="fine">{t('{a} radar scenes, {b} months of rain. Band: 80 %. Forecast until {date}.', { a: r.meta.radarScenes, b: r.meta.rainMonths, date: new Date(r.until + '-01').toLocaleDateString(locale, { month: 'short', year: 'numeric' }) })}</p>
    </>
  )
}

/** Forecast tab: what to do when there is nothing yet, otherwise risks first, then the charts. */
function ForecastTab({ shown, hasTarget, regionName, fail }: { shown: ForecastState; hasTarget: boolean; regionName: string | null; fail: (m?: string) => string | undefined }) {
  const { t } = useI18n()
  const r = shown.result
  if (!r) {
    if (shown.status === 'error') return <div className="err">{fail(shown.message)}</div>
    if (shown.status === 'loading') {
      return (
        <div className="working">
          <span className="spin" />
          <strong>{t(PHASE[shown.phase] ?? 'Working…')}</strong>
          <small>{t('The first forecast of a place reads years of satellite scenes; the next ones are instant.')}</small>
        </div>
      )
    }
    return <p className="empty">{hasTarget ? t('Learns from this place since 2016 and projects radar and rain to 2030. The button below starts it.') : t('Select a point or an area on the map, or open a ready-made region.')}</p>
  }
  return (
    <>
      {regionName && <h4 className="sub">{regionName}</h4>}
      {r.risk && <RiskBlock risk={r.risk} />}
      {r.samples && (
        <>
          <h4 className="sub">{t('Sample places')}</h4>
          <ul className="samples">
            {r.samples.map((s) => (
              <li key={s.name}>
                <span>{s.name}</span>
                {s.main && <small>{t(RISK_NAME[s.main] ?? s.main)}</small>}
                {s.level && <span className={`chip lvl-${s.level}`}>{t(LEVEL[s.level])}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      <Charts r={r} />
      {r.notes.slice(0, 2).map((n) => <p className="fine" key={n}>{t(n)}</p>)}
    </>
  )
}

export default function InspectorPanel(p: Props) {
  const { t, locale } = useI18n()
  const [pinsOpen, setPinsOpen] = useState(false)
  const fail = (m?: string) => {
    const url = m?.match(/^Backend not reachable at (\S+)\./)?.[1]
    return url ? t('Backend not reachable at {url}. Start it with: uv run asf-api', { url }) : m
  }
  const radar = [...mainSeries(buildSeries(p.live.OPERA.rows)), ...mainSeries(buildSeries(p.live.NISAR.rows))]
  const notes = p.inspected ? insights(radar, p.rain.series, p.nowMs, t, locale) : []
  const regionState: ForecastState | null = p.region ? { status: 'done', phase: '', done: 0, total: 0, result: p.region.data } : null
  const shown = regionState ?? p.forecast
  const hasTarget = p.inspected !== null || p.region !== null
  const loading = p.forecast.status === 'loading' && !p.region
  const level = shown.result?.risk?.available ? shown.result.risk.overall.level : null
  const pct = Math.round(100 * progressOf(p.forecast.phase, p.forecast.done, p.forecast.total))

  return (
    <aside className={`panel right glass inspector ${p.open ? '' : 'collapsed'}`} aria-hidden={!p.open}>
      <div className="tabs" role="tablist">
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
            <div className="segmented two" role="group" aria-label={t('Selection mode')}>
              <button className={!p.selectMode ? 'on' : ''} onClick={() => p.onSelectMode(false)}>{t('Point')}</button>
              <button className={p.selectMode ? 'on' : ''} onClick={() => p.onSelectMode(true)}>{t('Area')}</button>
            </div>
            {p.selectMode && <p className="caption">{t('Drag a rectangle on the map.')}</p>}
            {p.inspected ? (
              <>
                <div className="point">
                  <strong>
                    {p.areaKm ? `${t('Area')} ${p.areaKm.w.toFixed(1)} × ${p.areaKm.h.toFixed(1)} km` : `${fmt(p.inspected.lat, 3)}°, ${fmt(p.inspected.lon, 3)}°`}
                  </strong>
                  <button className="btn primary" onClick={p.onSavePin}>{t('Save')}</button>
                  <button className="btn ghost" onClick={p.onClear}>{t('Clear')}</button>
                </div>
                {p.areaKm && <small className="fine-row">{t('Centered at {lat}, {lon}. Radar window {m} m; rain is the IMERG cell of the center.', { lat: fmt(p.inspected.lat, 3), lon: fmt(p.inspected.lon, 3), m: Math.round(p.areaKm.windowM) })}</small>}
                <ul className="series">
                  {(['NISAR', 'OPERA'] as const).map((sensor) => {
                    const st = p.live[sensor]
                    if (st.status === 'idle') return null
                    const band = sensor === 'NISAR' ? 'L-band' : 'C-band'
                    const main = mainSeries(buildSeries(st.rows))
                    const vals = main.map((s) => ({ pol: s.pol, v: valueAt(s, p.nowMs) }))
                    const any = vals.some((x) => x.v)
                    const ld = st.status === 'loading'
                    return (
                      <li key={sensor}>
                        <div className="head">
                          <span><strong>{sensor}</strong><small>{t(band)}</small></span>
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
                        {st.status === 'error' && <div className="err">{fail(st.message)}</div>}
                        {st.status === 'done' && st.rows.length === 0 && <div className="note-muted">{t('No scenes near this date.')}</div>}
                        {st.failed > 0 && <div className="note-muted">{t('{n} scene(s) could not be read.', { n: st.failed })}</div>}
                        {main.length > 0 && <SeriesChart series={main} nowMs={p.nowMs} />}
                      </li>
                    )
                  })}
                  {p.rain.status !== 'idle' && (() => {
                    const v = valueAt(p.rain.series, p.nowMs, 1)
                    const ld = p.rain.status === 'loading'
                    return (
                      <li title={t('NASA GPM IMERG daily total, 0.1 degree cell')}>
                        <div className="head">
                          <span><strong>{t('Rain')}</strong><small>IMERG</small></span>
                          <span className={`vals ${v ? '' : 'off'}`}>
                            {v ? `${v.db.toFixed(1)} mm/day` : ld ? t('reading…') : p.rain.status === 'error' ? t('unavailable') : t('no data')}
                          </span>
                        </div>
                        {ld && (
                          <div className="progress">
                            <div className="bar"><i style={{ width: `${p.rain.total ? (100 * p.rain.done) / p.rain.total : 4}%` }} /></div>
                            <small>{p.rain.total ? t(p.rain.cached ? '{done} of {total} days, {cached} cached' : '{done} of {total} days', { done: p.rain.done, total: p.rain.total, cached: p.rain.cached }) : t('Searching…')}</small>
                          </div>
                        )}
                        {p.rain.status === 'error' && <div className="err">{fail(p.rain.message)}</div>}
                        {p.rain.series.t.length > 1 && <SeriesChart series={[p.rain.series]} nowMs={p.nowMs} />}
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
              <p className="empty">{t(p.selectMode ? 'Drag a rectangle on the map.' : 'Click the map or search a city.')}</p>
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
                  <button disabled={!r.ready} onClick={() => p.onRegion(p.region?.info.id === r.id ? null : r.id)}>
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

      {hasTarget && (
        <div className="pinned">
          {p.region ? (
            <div className="pin-row">
              <span className="pin-label">{p.region.info.name} · {t('ready-made')}</span>
              <button className="btn ghost" onClick={() => p.onRegion(null)}>{t('Close')}</button>
            </div>
          ) : loading ? (
            <div className="pin-progress">
              <div className="pin-row"><span className="pin-label">{t(PHASE[p.forecast.phase] ?? 'Working…')}{p.forecast.total > 1 ? ` ${p.forecast.done}/${p.forecast.total}` : ''}</span><strong>{pct}%</strong></div>
              <div className="bar big"><i style={{ width: `${Math.max(3, pct)}%` }} /></div>
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
