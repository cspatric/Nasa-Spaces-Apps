import { useHover } from '../lib/hover'
import { useI18n } from '../lib/i18n'
import { heightForZoom, type GibsLayer } from '../lib/catalog'

interface Props {
  active: GibsLayer[]
  blocked: string[]
  scenario: boolean
  wind: 'live' | 'typical' | null
  onZoomIn: () => void
  onZoomOut: () => void
  onNorth: () => void
  onTilt: () => void
}

const fmtHeight = (m: number) => (m >= 10_000 ? `${Math.round(m / 1000).toLocaleString('en-US')} km` : `${Math.round(m).toLocaleString('en-US')} m`)

export default function Hud({ active, blocked, scenario, wind, onZoomIn, onZoomOut, onNorth, onTilt }: Props) {
  const h = useHover()
  const { t } = useI18n()
  return (
    <div className="hud">
      {h.loading && <div className="loading-pill glass"><span className="spin" />{t('Loading imagery…')}</div>}
      {wind && <div className="legend glass"><span><i style={{ background: '#9ff3e6' }} />{t('Air currents')} · 850 hPa · {t(wind === 'live' ? 'live' : 'typical trade winds')}</span></div>}
      {active.length > 0 && (
        <div className="legend glass">
          {active.map((l) => (
            <span key={l.id} className={blocked.includes(l.id) ? 'off' : ''} title={blocked.includes(l.id) ? t(scenario ? 'No observed data in a scenario period' : 'No data for this period') : undefined}>
              <i style={{ background: l.color }} />{t(l.label)}
            </span>
          ))}
        </div>
      )}
      <div className="readout glass" data-tour="zoom">
        {h.lat !== null && h.lon !== null && <span className="pos coords">{`${h.lat.toFixed(3)}°, ${h.lon.toFixed(3)}°`}</span>}
        <span className="pos">{fmtHeight(heightForZoom(h.zoom, h.lat ?? -5))}</span>
        <div className="zoom">
          <button onClick={onZoomIn} aria-label={t('Zoom in')}>+</button>
          <button onClick={onZoomOut} aria-label={t('Zoom out')}>−</button>
          <button onClick={onNorth} aria-label={t('North up')} title={t('North up')}>N</button>
          <button className={`tilt ${h.tilted ? 'on' : ''}`} onClick={onTilt} aria-label={t('Toggle 3D tilt')} title={t('Tilt the camera for a 3D view')}>3D</button>
        </div>
      </div>
    </div>
  )
}
