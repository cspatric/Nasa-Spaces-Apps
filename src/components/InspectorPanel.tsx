import type { LonLat, Pin } from './CesiumMap'

interface Props {
  inspected: LonLat | null
  pins: Pin[]
  selectedPinId: string | null
  onSavePin: () => void
  onSelectPin: (id: string) => void
  onRemovePin: (id: string) => void
  onClear: () => void
}

const SERIES = [
  { k: 'NISAR', sub: 'L-band HH, HV', unit: 'dB' },
  { k: 'OPERA', sub: 'C-band VV, VH', unit: 'dB' },
  { k: 'Rain', sub: 'IMERG', unit: 'mm/day' },
  { k: 'Max temperature', sub: 'MERRA-2', unit: '°C' },
  { k: 'Soil moisture', sub: 'SMAP, NISAR SME2', unit: 'm³/m³' },
  { k: 'Surface water', sub: 'OPERA DSWx', unit: 'class' },
]

const fmt = (n: number, d = 4) => n.toFixed(d)

export default function InspectorPanel(p: Props) {
  return (
    <aside className="panel right glass">
      <section>
        <h3>Point inspector</h3>
        {p.inspected ? (
          <>
            <div className="coords">
              <div><small>Latitude</small><strong>{fmt(p.inspected.lat)}°</strong></div>
              <div><small>Longitude</small><strong>{fmt(p.inspected.lon)}°</strong></div>
            </div>
            <div className="actions">
              <button className="primary" onClick={p.onSavePin}>Save pin</button>
              <button onClick={p.onClear}>Clear</button>
            </div>
          </>
        ) : (
          <p className="empty">Click anywhere on the globe to inspect a point.</p>
        )}
        <ul className="series">
          {SERIES.map((s) => (
            <li key={s.k}>
              <div>
                <strong>{s.k}</strong>
                <small>{s.sub}</small>
              </div>
              <span className="pill">no data yet</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Saved pins <span className="count">{p.pins.length}</span></h3>
        {p.pins.length === 0 ? (
          <p className="empty">Pins you save appear here and on the map.</p>
        ) : (
          <ul className="pins">
            {p.pins.map((pin) => (
              <li key={pin.id} className={pin.id === p.selectedPinId ? 'sel' : ''}>
                <button className="link" onClick={() => p.onSelectPin(pin.id)}>
                  <strong>{pin.label}</strong>
                  <small>{fmt(pin.lat, 3)}°, {fmt(pin.lon, 3)}°</small>
                </button>
                <button className="x" aria-label={`Remove ${pin.label}`} onClick={() => p.onRemovePin(pin.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Main changes and insights</h3>
        <div className="skeleton"><i /><i /><i className="short" /></div>
        <p className="empty">Change maps and insights will appear here once the first scenes are processed.</p>
      </section>
    </aside>
  )
}
