import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { ForecastResult, ForecastSeries, ForecastState, RiskResult } from '../lib/forecast'
import ForecastChart from './ForecastChart'
import { LEVEL, PHASE } from './forecastLabels'
import './forecastView.css'

const RISK_NAME: Record<string, string> = { vegetation_loss: 'Vegetation loss', flood: 'Flood', drought_fire: 'Drought and fire', unusual_change: 'Unusual change' }
const COVER: Record<string, string> = { forest: 'Forest', vegetation: 'Other vegetation', urban: 'City', water: 'Open water' }
const RANK: Record<string, number> = { high: 3, moderate: 2, low: 1 }

type View = 'risks' | 'places' | 'charts'

/** A level as a word with its color (the same three colors everywhere in the panel). */
function Level({ level }: { level: string | null }) {
  const { t } = useI18n()
  if (!level) return null
  return <span className={`fv-lvl ${level.replace('/', '')}`}>{t(LEVEL[level] ?? level)}</span>
}

/** Who and how much: the verdict first, a few facts under it. */
function Summary({ r, name }: { r: ForecastResult; name: string | null }) {
  const { t, locale } = useI18n()
  const risk = r.risk
  const cover = risk?.landCover
  const until = new Date(r.until + '-01').toLocaleDateString(locale, { month: 'short', year: 'numeric' })
  return (
    <header className={`fv-sum ${risk?.available ? risk.overall.level : ''}`}>
      <div className="fv-top">
        <h3>{name ?? t('Selected place')}</h3>
        <span className="fv-ready">{t('Ready')}</span>
      </div>
      {risk?.available ? (
        <div className="fv-verdict" title={t('Overall risk')}>
          <b><Level level={risk.overall.level} /></b>
          {risk.overall.main && <span><strong>{t(RISK_NAME[risk.overall.main] ?? risk.overall.main)}</strong>{risk.overall.place ? ` · ${risk.overall.place}` : ''}</span>}
        </div>
      ) : <p className="fv-na">{t('Risks need both polarizations and at least 30 months of data.')}</p>}
      <div className="fv-facts">
        {cover && <span><b>{t(COVER[cover.class] ?? cover.class)}</b> {Math.round(cover.confidence * 100)}%</span>}
        <span><b>{r.meta.radarScenes}</b> {t('radar scenes')}</span>
        <span><b>{r.meta.rainMonths}</b> {t('months of rain')}</span>
        <span>→ {until}</span>
      </div>
    </header>
  )
}

function Risks({ risk }: { risk: RiskResult }) {
  const { t } = useI18n()
  const [open, setOpen] = useState<string | null>(null)
  if (!risk.available) return null
  const on = risk.risks.filter((x) => x.applicable).sort((a, b) => b.score - a.score)
  const off = risk.risks.filter((x) => !x.applicable)
  return (
    <div className="fv-risks">
      {on.map((x) => {
        const ev = x.evidence.map((e) => t(e.text, e.vars))
        const more = ev.length > 1
        return (
          <article key={x.id} className={`fv-risk ${x.level}`}>
            <div className="fv-rh"><strong>{t(RISK_NAME[x.id] ?? x.id)}</strong><Level level={x.level} /></div>
            <div className="fv-meter"><i style={{ width: `${Math.max(4, Math.round(x.score * 100))}%` }} /></div>
            {ev[0] && <p>{ev[0]}</p>}
            {open === x.id && ev.slice(1).map((e) => <p key={e}>{e}</p>)}
            <footer>
              {x.place && <span>{t('Riskiest place')}: <b>{x.place}</b></span>}
              {more && <button onClick={() => setOpen(open === x.id ? null : x.id)}>{open === x.id ? t('Less') : t('Details')}</button>}
            </footer>
          </article>
        )
      })}
      {off.length > 0 && <p className="fv-off">{t('Not applicable here')}: {off.map((x) => t(RISK_NAME[x.id] ?? x.id)).join(', ')}</p>}
    </div>
  )
}

function Places({ r }: { r: ForecastResult }) {
  const { t } = useI18n()
  const list = [...(r.samples ?? [])].sort((a, b) => (RANK[b.level ?? ''] ?? 0) - (RANK[a.level ?? ''] ?? 0))
  return (
    <ul className="fv-places">
      {list.map((s) => (
        <li key={s.name} className={s.level ?? ''}>
          <i aria-hidden="true" />
          <span><b>{s.name}</b>{s.main && <small>{t(RISK_NAME[s.main] ?? s.main)}</small>}</span>
          <Level level={s.level} />
        </li>
      ))}
    </ul>
  )
}

/** One chart at a time (the three together were too much), with what to read from it. */
function Charts({ r }: { r: ForecastResult }) {
  const { t } = useI18n()
  const { co, cross } = r.backscatter
  const parts = [
    co && { key: 'co', short: `${co.pol ?? 'VV'}`, title: `${t('Radar')} ${co.pol ?? ''} (dB)`, s: co, color: '#5eead4', digits: 1 },
    cross && { key: 'cross', short: `${cross.pol ?? 'VH'}`, title: `${t('Radar')} ${cross.pol ?? ''} (dB)`, s: cross, color: '#fb923c', digits: 1 },
    r.rain && { key: 'rain', short: t('Rain'), title: t('Rain (mm/month)'), s: r.rain, color: '#818cf8', digits: 0 },
  ].filter(Boolean) as { key: string; short: string; title: string; s: ForecastSeries; color: string; digits: number }[]
  const [sel, setSel] = useState(parts[0]?.key ?? 'co')
  const cur = parts.find((p) => p.key === sel) ?? parts[0]
  if (!cur) return null
  const { s, color, digits, title } = cur
  const sk = Math.round(s.backtest.skill * 100)
  const model = /^average of (\d+) places?/i.exec(s.model)
  return (
    <div className="fv-charts">
      <div className="fv-seg" role="tablist">
        {parts.map((p) => <button key={p.key} role="tab" aria-selected={sel === p.key} className={sel === p.key ? 'on' : ''} onClick={() => setSel(p.key)}>{p.short}</button>)}
      </div>
      <div className="fv-ch">
        <div className="fv-chh"><strong>{title}</strong><span className={s.reliable ? 'ok' : 'weak'}>{s.reliable ? t('reliable') : t('weak')}</span></div>
        <ForecastChart history={s.history} forecast={s.forecast} color={color} digits={digits} label={title} />
        <div className="fv-stats">
          <div><small>{t('Error')}</small><b>{s.backtest.mae.toFixed(digits === 0 ? 0 : 2)}</b></div>
          <div><small>{t('vs last year')}</small><b className={sk >= 0 ? 'ok' : 'weak'}>{sk >= 0 ? '+' : '−'}{Math.abs(sk)}%</b></div>
          {s.trendPerDecade !== null && digits !== 0 && <div><small>{t('Trend / decade')}</small><b>{s.trendPerDecade >= 0 ? '+' : '−'}{Math.abs(s.trendPerDecade).toFixed(2)}</b></div>}
        </div>
        <div className="fv-years">
          {s.yearly.filter((y) => y.months >= 12).map((y) => <span key={y.year}><em>{y.year}</em>{digits === 0 ? `${Math.round(y.total)} mm` : y.mean.toFixed(1)}</span>)}
        </div>
        <small className="fv-model">{t('Model')}: {model ? t('Average of {n} places', { n: model[1] }) : s.model}</small>
      </div>
    </div>
  )
}

/** Forecast tab: the verdict, then one view at a time (risks, places, charts). */
export function ForecastTab({ shown, hasTarget, regionName, fail }: { shown: ForecastState; hasTarget: boolean; regionName: string | null; fail: (m?: string) => string | undefined }) {
  const { t } = useI18n()
  const [view, setView] = useState<View>('risks')
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
  const views: [View, string][] = [['risks', 'Risks'], ...(r.samples ? ([['places', 'Places']] as [View, string][]) : []), ['charts', 'Charts']]
  const cur = views.some(([v]) => v === view) ? view : 'risks'
  const notes = r.notes.map((n) => {
    const m = /^Average of (\d+) sample places/.exec(n)
    return m ? t('Average of {n} sample places spread over the region.', { n: m[1] }) : t(n)
  })
  return (
    <div className="fv">
      <Summary r={r} name={regionName} />
      <div className="fv-seg tabs" role="tablist">
        {views.map(([v, label]) => <button key={v} role="tab" aria-selected={cur === v} className={cur === v ? 'on' : ''} onClick={() => setView(v)}>{t(label)}</button>)}
      </div>
      {cur === 'risks' && r.risk && <Risks risk={r.risk} />}
      {cur === 'places' && <Places r={r} />}
      {cur === 'charts' && <Charts r={r} />}
      <details className="fv-about">
        <summary>{t('About this forecast')}</summary>
        {notes.map((n) => <p key={n}>{n}</p>)}
      </details>
    </div>
  )
}
