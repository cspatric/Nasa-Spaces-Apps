import { BASE_LAYERS, OVERLAYS, type BaseId, type OverlayId } from '../lib/catalog'
import { useI18n } from '../lib/i18n'
import Accordion from './Accordion'
import DisasterSection, { type DisasterUi } from './DisasterSection'
import type { OverlayState } from '../lib/types'

interface Props {
  open: boolean
  baseId: BaseId
  onBase: (b: BaseId) => void
  overlays: OverlayState
  onOverlay: (id: OverlayId, patch: Partial<OverlayState[OverlayId]>) => void
  cities: boolean
  onCities: (v: boolean) => void
  buildings: boolean
  onBuildings: (v: boolean) => void
  wind: boolean
  onWindToggle: (v: boolean) => void
  exaggeration: number
  onExaggeration: (n: number) => void
  disaster: DisasterUi
}

const BASE_SHORT: Record<BaseId, string> = { satellite: 'Satellite', bluemarble: 'Blue Marble', modis: 'Daily' }

function Toggle({ on, onChange, label, hint, color }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string; color: string }) {
  return (
    <div className={`layer ${on ? 'on' : ''}`} title={hint}>
      <label className="row">
        <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
        <span className="swatch" style={{ background: color }} />
        <span className="grow"><strong>{label}</strong></span>
      </label>
    </div>
  )
}

/** The left panel is a set of folded groups: base map and NASA layers first, the rest on demand. */
export default function LayerPanel(p: Props) {
  const { t } = useI18n()
  const on = OVERLAYS.filter((o) => p.overlays[o.id as OverlayId].on).length
  const extras = [p.buildings, p.cities, p.wind].filter(Boolean).length
  return (
    <aside className={`panel left glass ${p.open ? '' : 'collapsed'}`} aria-hidden={!p.open}>
      <Accordion title={t('Base map')} summary={t(BASE_SHORT[p.baseId])} defaultOpen>
        <div className="segmented">
          {(Object.keys(BASE_LAYERS) as BaseId[]).map((id) => (
            <button key={id} className={p.baseId === id ? 'on' : ''} onClick={() => p.onBase(id)}>{t(BASE_SHORT[id])}</button>
          ))}
        </div>
        <p className="caption">{t(BASE_LAYERS[p.baseId].hint)}</p>
      </Accordion>

      <Accordion title={t('NASA layers')} summary={on ? t('{n} on', { n: on }) : t('none on')} defaultOpen>
        {OVERLAYS.map((o) => {
          const s = p.overlays[o.id as OverlayId]
          return (
            <div key={o.id} className={`layer ${s.on ? 'on' : ''}`} title={t(o.hint)}>
              <label className="row">
                <input type="checkbox" checked={s.on} onChange={(e) => p.onOverlay(o.id as OverlayId, { on: e.target.checked })} />
                <span className="swatch" style={{ background: o.color }} />
                <span className="grow"><strong>{t(o.label)}</strong></span>
              </label>
              {s.on && (
                <input className="range" type="range" min={0.1} max={1} step={0.05} value={s.opacity}
                  aria-label={t(o.label)}
                  onChange={(e) => p.onOverlay(o.id as OverlayId, { opacity: Number(e.target.value) })} />
              )}
            </div>
          )
        })}
      </Accordion>

      <Accordion title={t('3D view')} summary={t('{n} of 3 on', { n: extras })}>
        <Toggle on={p.buildings} onChange={p.onBuildings} label={t('3D buildings and streets')} hint={t('OpenStreetMap, visible close to cities')} color="#c3c9d0" />
        <Toggle on={p.wind} onChange={p.onWindToggle} label={t('Air currents')} hint={t('Wind at 850 hPa over the Amazon (Open-Meteo)')} color="#9ff3e6" />
        <Toggle on={p.cities} onChange={p.onCities} label={t('City names')} color="#fff" />
        <div className="layer">
          <div className="row">
            <span className="grow">
              <strong>{t('Exaggeration')}</strong>
              <small>{p.exaggeration.toFixed(1)}×</small>
            </span>
          </div>
          <input className="range" style={{ marginLeft: 0, width: '100%' }} type="range" min={1} max={10} step={0.5} value={p.exaggeration}
            aria-label={t('Terrain exaggeration')} onChange={(e) => p.onExaggeration(Number(e.target.value))} />
        </div>
      </Accordion>

      <Accordion title={t('Natural disasters')} summary={p.disaster.running ? t('running') : t('simulations')}>
        <DisasterSection {...p.disaster} />
      </Accordion>
    </aside>
  )
}
