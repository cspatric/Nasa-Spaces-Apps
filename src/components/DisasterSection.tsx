import { DEFAULT_PARAMS, KINDS, fireLengthToWidth, type DisasterKind, type DisasterParams, type ZoneStats } from '../lib/disasters'
import { useI18n } from '../lib/i18n'

export interface DisasterUi {
  kind: DisasterKind
  params: DisasterParams
  running: boolean
  stats: ZoneStats[] | null
  /** Drought risk score (0 to 1) of the inspected point, when known: sets how dry the fuel is. */
  droughtScore: number | null
  hasPoint: boolean
  onKind: (k: DisasterKind) => void
  onParams: (p: DisasterParams) => void
  onRun: () => void
  onClear: () => void
}

const NAME: Record<DisasterKind, string> = { earthquake: 'Earthquake', flood: 'Flood', wildfire: 'Wildfire', storm: 'Storm' }

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="layer">
      <div className="row">
        <span className="grow"><strong>{label}</strong><small>{value}{unit ? ` ${unit}` : ''}</small></span>
      </div>
      <input className="range" style={{ marginLeft: 0, width: '100%' }} type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

const fmtKm2 = (v: number, locale: string) => `${v >= 100 ? Math.round(v).toLocaleString(locale) : v.toLocaleString(locale, { maximumFractionDigits: 1 })} km²`

export default function DisasterSection(p: DisasterUi) {
  const { t, locale } = useI18n()
  const set = (patch: Partial<DisasterParams>) => p.onParams({ ...p.params, ...patch })
  const fuel = p.droughtScore === null ? null : Number((0.7 + 0.9 * p.droughtScore).toFixed(2))
  return (
    <div>
      <div className="segmented four">
        {KINDS.map((k) => (
          <button key={k} className={p.kind === k ? 'on' : ''} onClick={() => p.onKind(k)}>{t(NAME[k])}</button>
        ))}
      </div>
      {p.kind === 'earthquake' && (
        <>
          <Slider label={t('Magnitude')} value={p.params.magnitude} min={5} max={9} step={0.1} onChange={(v) => set({ magnitude: v })} />
          <Slider label={t('Depth')} value={p.params.depth} min={5} max={100} step={5} unit="km" onChange={(v) => set({ depth: v })} />
        </>
      )}
      {p.kind === 'flood' && <Slider label={t('Water rise')} value={p.params.rise} min={1} max={30} step={1} unit="m" onChange={(v) => set({ rise: v })} />}
      {p.kind === 'wildfire' && (
        <>
          <Slider label={t('Duration')} value={p.params.hours} min={1} max={96} step={1} unit="h" onChange={(v) => set({ hours: v })} />
          <Slider label={t('Wind')} value={p.params.wind} min={0} max={20} step={1} unit="m/s" onChange={(v) => set({ wind: v })} />
          <Slider label={t('Wind from')} value={p.params.windDir} min={0} max={359} step={5} unit="°" onChange={(v) => set({ windDir: v })} />
          <Slider label={t('Fuel dryness')} value={p.params.dryness} min={0.4} max={1.6} step={0.05} onChange={(v) => set({ dryness: v })} />
          {fuel !== null && (
            <button className="btn wide ghost" onClick={() => set({ dryness: fuel })}>{t('Use this point\'s drought risk ({v})', { v: fuel })}</button>
          )}
          <small className="fine-row">{t('Length to width {r}', { r: fireLengthToWidth(p.params.wind).toFixed(1) })}</small>
        </>
      )}
      {p.kind === 'storm' && (
        <>
          <Slider label={t('Peak gust')} value={p.params.gust} min={90} max={240} step={5} unit="km/h" onChange={(v) => set({ gust: v })} />
          <Slider label={t('Track direction')} value={p.params.track} min={0} max={359} step={5} unit="°" onChange={(v) => set({ track: v })} />
        </>
      )}
      <div className="actions-row">
        <button className="btn primary" onClick={p.onRun}>{t(p.hasPoint ? 'Simulate here' : 'Simulate at the center')}</button>
        {p.running && <button className="btn" onClick={p.onClear}>{t('Clear')}</button>}
      </div>
      {p.running && (
        <div className="damage">
          <div className="note">{t('Simulation, not a forecast')}</div>
          {p.stats === null ? <small className="fine-row">{t('Working…')}</small> : (
            <ul>
              {p.stats.map((z) => (
                <li key={z.id}>
                  <i style={{ background: z.color }} />
                  <span className="z-label">{t(z.label)}</span>
                  <span className="z-num">{fmtKm2(z.areaKm2, locale)}</span>
                  <span className="z-num b">{z.buildings === null ? '—' : `${z.buildings.toLocaleString(locale)} ${t('buildings')}`}</span>
                </li>
              ))}
            </ul>
          )}
          {p.stats?.some((z) => z.buildings === null) && <small className="fine-row">{t('Zoom in to count the buildings in each zone.')}</small>}
        </div>
      )}
    </div>
  )
}

export { DEFAULT_PARAMS }
