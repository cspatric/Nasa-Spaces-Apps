import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { FlyRequest, LonLat, OverlayState, Pin } from './components/CesiumMap'
import InspectorPanel from './components/InspectorPanel'
import LayerPanel from './components/LayerPanel'
import Timeline from './components/Timeline'
import TopBar from './components/TopBar'
import { DEMO_MS, LATEST_IMAGERY, OVERLAYS, TIMELINE_DAYS, type BaseId, type CameraPreset, type OverlayId } from './lib/catalog'
import { imageryMs, indexFromMs, msFromIndex } from './lib/dates'

// CesiumJS is heavy: load it after the interface paints.
const CesiumMap = lazy(() => import('./components/CesiumMap'))

const initialOverlays = Object.fromEntries(
  OVERLAYS.map((o) => [o.id, { on: false, opacity: o.opacity }]),
) as OverlayState

export default function App() {
  const [baseId, setBaseId] = useState<BaseId>('modis')
  const [overlays, setOverlays] = useState<OverlayState>(initialOverlays)
  const [index, setIndex] = useState(indexFromMs(Math.min(DEMO_MS, LATEST_IMAGERY)))
  const [committed, setCommitted] = useState(index)
  const [playing, setPlaying] = useState(false)
  const [inspected, setInspected] = useState<LonLat | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [flyTo, setFlyTo] = useState<FlyRequest | null>(null)
  const [flood, setFlood] = useState({ on: false, level: 20 })
  const [exaggeration, setExaggeration] = useState(2)
  const tick = useRef(0)

  // Imagery follows the slider after a short pause, so dragging does not reload tiles on every step.
  useEffect(() => {
    const t = setTimeout(() => setCommitted(index), 280)
    return () => clearTimeout(t)
  }, [index])

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setIndex((i) => {
        if (i + 12 >= TIMELINE_DAYS) {
          setPlaying(false)
          return TIMELINE_DAYS
        }
        return i + 12
      })
    }, 1600)
    return () => clearInterval(t)
  }, [playing])

  const fly = (p: { lon: number; lat: number; height: number }) =>
    setFlyTo({ tick: ++tick.current, lon: p.lon, lat: p.lat, height: p.height })

  const imgMs = useMemo(() => imageryMs(committed), [committed])
  const clamped = msFromIndex(index) > LATEST_IMAGERY

  const savePin = () => {
    if (!inspected) return
    const id = String(Date.now())
    setPins((ps) => [...ps, { ...inspected, id, label: `Pin ${ps.length + 1}` }])
    setSelectedPinId(id)
  }

  return (
    <div className="app">
      <Suspense fallback={<div className="loading">Loading globe…</div>}>
      <CesiumMap
        baseId={baseId}
        overlays={overlays}
        imageryMs={imgMs}
        inspected={inspected}
        pins={pins}
        selectedPinId={selectedPinId}
        flyTo={flyTo}
        flood={flood}
        exaggeration={exaggeration}
        creditsId="credits"
        onPick={(p) => {
          setInspected(p)
          setSelectedPinId(null)
        }}
      />
      </Suspense>
      <TopBar onFly={(p: CameraPreset) => fly(p)} />
      <LayerPanel
        baseId={baseId}
        onBase={setBaseId}
        overlays={overlays}
        onOverlay={(id: OverlayId, patch) => setOverlays((o) => ({ ...o, [id]: { ...o[id], ...patch } }))}
        flood={flood}
        onFlood={setFlood}
        exaggeration={exaggeration}
        onExaggeration={setExaggeration}
      />
      <InspectorPanel
        inspected={inspected}
        pins={pins}
        selectedPinId={selectedPinId}
        onSavePin={savePin}
        onSelectPin={(id) => {
          setSelectedPinId(id)
          const pin = pins.find((x) => x.id === id)
          if (pin) fly({ ...pin, height: 60_000 })
        }}
        onRemovePin={(id) => setPins((ps) => ps.filter((x) => x.id !== id))}
        onClear={() => setInspected(null)}
      />
      <Timeline
        index={index}
        onIndex={(i) => {
          setPlaying(false)
          setIndex(i)
        }}
        playing={playing}
        onPlay={() => {
          if (!playing && index >= TIMELINE_DAYS) setIndex(0)
          setPlaying((v) => !v)
        }}
        clamped={clamped}
      />
      <div id="credits" className="credits" />
    </div>
  )
}
