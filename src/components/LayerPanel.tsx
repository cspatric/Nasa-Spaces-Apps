import { BASE_LAYERS, HAS_TERRAIN_TOKEN, OVERLAYS, type BaseId, type OverlayId } from '../lib/catalog'
import type { OverlayState } from './CesiumMap'

interface Props {
  baseId: BaseId
  onBase: (b: BaseId) => void
  overlays: OverlayState
  onOverlay: (id: OverlayId, patch: Partial<OverlayState[OverlayId]>) => void
  flood: { on: boolean; level: number }
  onFlood: (f: { on: boolean; level: number }) => void
  exaggeration: number
  onExaggeration: (n: number) => void
}

export default function LayerPanel(p: Props) {
  return (
    <aside className="panel left glass">
      <section>
        <h3>Base imagery</h3>
        <div className="seg">
          {(Object.keys(BASE_LAYERS) as BaseId[]).map((id) => (
            <button key={id} className={p.baseId === id ? 'on' : ''} onClick={() => p.onBase(id)}>
              <strong>{BASE_LAYERS[id].label}</strong>
              <span>{BASE_LAYERS[id].hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>NASA layers</h3>
        {OVERLAYS.map((o) => {
          const s = p.overlays[o.id as OverlayId]
          return (
            <div key={o.id} className={`layer ${s.on ? 'on' : ''}`}>
              <label className="row">
                <input type="checkbox" checked={s.on} onChange={(e) => p.onOverlay(o.id as OverlayId, { on: e.target.checked })} />
                <span className="swatch" style={{ background: o.color }} />
                <span className="grow">
                  <strong>{o.label}</strong>
                  <small>{o.hint}</small>
                </span>
              </label>
              {s.on && (
                <input
                  className="range"
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={s.opacity}
                  aria-label={`${o.label} opacity`}
                  onChange={(e) => p.onOverlay(o.id as OverlayId, { opacity: Number(e.target.value) })}
                />
              )}
            </div>
          )
        })}
      </section>

      <section>
        <h3>SARIS analysis</h3>
        {['Change map', 'Anomaly score'].map((n) => (
          <div key={n} className="layer disabled">
            <label className="row">
              <input type="checkbox" disabled />
              <span className="swatch hatch" />
              <span className="grow">
                <strong>{n}</strong>
                <small>Awaiting data</small>
              </span>
            </label>
          </div>
        ))}
      </section>

      <section>
        <h3>Simulation</h3>
        <div className={`layer ${p.flood.on ? 'on' : ''} ${HAS_TERRAIN_TOKEN ? '' : 'disabled'}`}>
          <label className="row">
            <input
              type="checkbox"
              disabled={!HAS_TERRAIN_TOKEN}
              checked={p.flood.on}
              onChange={(e) => p.onFlood({ ...p.flood, on: e.target.checked })}
            />
            <span className="swatch" style={{ background: '#7dd3fc' }} />
            <span className="grow">
              <strong>Flood scenario</strong>
              <small>{HAS_TERRAIN_TOKEN ? 'Water plane over the terrain' : '3D terrain required'}</small>
            </span>
          </label>
          {p.flood.on && (
            <>
              <input className="range" type="range" min={0} max={60} step={1} value={p.flood.level} aria-label="Water level"
                onChange={(e) => p.onFlood({ ...p.flood, level: Number(e.target.value) })} />
              <div className="note">Level {p.flood.level} m · simulation, not a forecast</div>
            </>
          )}
        </div>
        <div className={`layer ${HAS_TERRAIN_TOKEN ? '' : 'disabled'}`}>
          <div className="row">
            <span className="grow">
              <strong>Terrain exaggeration</strong>
              <small>{HAS_TERRAIN_TOKEN ? `${p.exaggeration.toFixed(1)}x` : 'Set VITE_CESIUM_TOKEN to enable terrain'}</small>
            </span>
          </div>
          <input className="range" type="range" min={1} max={8} step={0.5} value={p.exaggeration} disabled={!HAS_TERRAIN_TOKEN}
            aria-label="Terrain exaggeration" onChange={(e) => p.onExaggeration(Number(e.target.value))} />
        </div>
      </section>
    </aside>
  )
}
