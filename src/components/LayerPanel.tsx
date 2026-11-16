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

/** One line icon per base map: a satellite, the Earth, and a calendar day. */
const BASE_ICON: Record<BaseId, React.ReactNode> = {
  satellite: (
    <>
      <rect x="9" y="9" width="6" height="6" transform="rotate(45 12 12)" />
      <path d="M4.5 4.5 8 8M16 16l3.5 3.5M3 8l5-5M16 21l5-5M5.5 9.5 2.5 12.5M14.5 18.5l-3 3" />
    </>
  ),
  bluemarble: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  modis: (
    <>
      <rect x="3.5" y="5" width="17" height="15" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="12" cy="15" r="1.6" />
    </>
  ),
}

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
    <aside className={`panel left glass ${p.open ? '' : 'collapsed'}`} aria-hidden={!p.open} data-tour="layers">
      <Accordion title={t('Base map')} summary={t(BASE_SHORT[p.baseId])} defaultOpen>
        <div className="segmented">
          {(Object.keys(BASE_LAYERS) as BaseId[]).map((id) => (
            <button key={id} className={`icon ${p.baseId === id ? 'on' : ''}`} aria-pressed={p.baseId === id} aria-label={t(BASE_SHORT[id])} title={t(BASE_SHORT[id])} onClick={() => p.onBase(id)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{BASE_ICON[id]}</svg>
            </button>
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
