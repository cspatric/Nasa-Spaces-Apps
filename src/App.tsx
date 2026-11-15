import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { CameraCommand, FlyRequest, LonLat, OverlayState, Outline, Pin } from './lib/types'
import Assistant from './components/Assistant'
import Link from './components/Link'
import Hud from './components/Hud'
import InspectorPanel, { type Tab } from './components/InspectorPanel'
import LayerPanel from './components/LayerPanel'
import Timeline from './components/Timeline'
import Toast, { type ToastMessage } from './components/Toast'
import { useFinishMessages } from './lib/finishMessages'
import TopBar from './components/TopBar'
import type { Place } from './components/SearchBox'
import { CITY_3D_ZOOM, DEMO_MS, LATEST_IMAGERY, OVERLAYS, TIMELINE_DAYS, type BaseId, type CameraPreset, type OverlayId } from './lib/catalog'
import type { City } from './lib/cities'
import { imageryMs, indexFromMs, msFromIndex, overlayStatus, useBlockedLayers } from './lib/dates'
import { useAnalysis } from './lib/analysis'
import { hoverStore } from './lib/hover'
import type { Action } from './lib/assistant'
import { DEFAULT_PARAMS, type Disaster, type DisasterKind, type DisasterParams, type ZoneStats } from './lib/disasters'
import { useForecast, type ForecastResult } from './lib/forecast'
import { marksFor } from './lib/forecastMarks'
import { useRegions, type RegionInfo } from './lib/regions'
import { useI18n } from './lib/i18n'
import { sound } from './lib/sound'

// The map is the heaviest part: load it after the interface paints.
const MapView = lazy(() => import('./components/MapView'))
const MiniMap = lazy(() => import('./components/MiniMap'))

const initialOverlays = Object.fromEntries(
  OVERLAYS.map((o) => [o.id, { on: false, opacity: o.opacity }]),
) as OverlayState

/** Ground window (m) around the point that the radar is averaged over. */
const WINDOW_M = 500

export default function App() {
  const { t } = useI18n()
  const [baseId, setBaseId] = useState<BaseId>('satellite')
  const [overlays, setOverlays] = useState<OverlayState>(initialOverlays)
  const [index, setIndex] = useState(indexFromMs(Math.min(DEMO_MS, LATEST_IMAGERY)))
  const [committed, setCommitted] = useState(index)
  const [inspected, setInspected] = useState<LonLat | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [flyTo, setFlyTo] = useState<FlyRequest | null>(null)
  const [command, setCommand] = useState<CameraCommand | null>(null)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [cities, setCities] = useState(true)
  const [buildings, setBuildings] = useState(true)
  const [wind, setWind] = useState(false)
  const [windLive, setWindLive] = useState<boolean | null>(null)
  const [exaggeration, setExaggeration] = useState(2.6)
  const tick = useRef(0)
  const [dKind, setDKind] = useState<DisasterKind>('earthquake')
  const [dParams, setDParams] = useState<DisasterParams>(DEFAULT_PARAMS)
  const [disaster, setDisaster] = useState<Disaster | null>(null)
  const [dStats, setDStats] = useState<ZoneStats[] | null>(null)
  const [tab, setTab] = useState<Tab>('data')
  const [region, setRegion] = useState<{ info: RegionInfo; data: ForecastResult } | null>(null)
  const [fcYear, setFcYear] = useState(2028)
  const { list: regionList, load: loadRegion } = useRegions()

  // Interface sounds: a tick on buttons, a two-note blip on switches
  useEffect(() => {
    const down = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.('button, [role=menuitem], [role=option]')) sound.click()
    }
    const change = (e: Event) => {
      const el = e.target as HTMLInputElement
      if (el.type === 'checkbox') sound.toggle(el.checked)
    }
    document.addEventListener('pointerdown', down)
    document.addEventListener('change', change)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('change', change)
    }
  }, [])

  // Imagery follows the slider after a short pause, so dragging does not reload tiles on every step.
  useEffect(() => {
    const t = setTimeout(() => setCommitted(index), 450)
    return () => clearTimeout(t)
  }, [index])

  const fly = (p: { lon: number; lat: number; zoom: number; pitch?: number; bearing?: number }) => {
    sound.whoosh()
    setFlyTo({ tick: ++tick.current, lon: p.lon, lat: p.lat, zoom: p.zoom, pitch: p.pitch ?? 60, bearing: p.bearing ?? 20 })
  }

  // Series are read from the backend only for the days around the timeline date, when a point is picked.
  const dateMs = msFromIndex(committed)
  const windowM = WINDOW_M
  const { state: analysis, run: runAnalysis, cancel: cancelAnalysis } = useAnalysis(inspected, windowM)
  const { state: forecast, run: runForecast, cancel: cancelForecast } = useForecast(inspected, windowM)

  // While data is processed (the analysis or a forecast) the place cannot change: nothing else may replace it.
  const busy = analysis.running || forecast.status === 'loading'
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const notifyBlocked = () => {
    setToast({ id: `blocked-${Date.now()}`, level: 'warning', lines: [{ text: 'Data is being processed. Wait for it to end, or cancel it, to choose another place.' }] })
  }
  const cancelAll = () => { cancelAnalysis(); cancelForecast() }

  // Say when an analysis or a forecast ends, and how
  useFinishMessages(analysis.outcome, forecast, setToast)

  const imgMs = useMemo(() => imageryMs(committed), [committed])
  // Layers with no real data for the date (not flown yet, or a scenario): not drawn, and marked in the legend
  const blocked = useBlockedLayers(dateMs)
  const clamped = msFromIndex(index) > LATEST_IMAGERY

  // The forecast on the map: a label per point (or per sample place of a region), for the chosen year
  const timelineYear = new Date(dateMs).getUTCFullYear()
  const [seenYear, setSeenYear] = useState(timelineYear)
  if (seenYear !== timelineYear) { // the timeline entering 2027 to 2030 picks that year on the map (adjusted while rendering, not in an effect)
    setSeenYear(timelineYear)
    if (timelineYear >= 2027) setFcYear(Math.min(2030, timelineYear))
  }
  const shownResult = region ? region.data : forecast.result
  const marks = useMemo(() => marksFor(shownResult, region ? null : inspected, fcYear), [shownResult, region, inspected, fcYear])
  const outline: Outline | null = region ? { west: region.info.bounds[0], south: region.info.bounds[1], east: region.info.bounds[2], north: region.info.bounds[3] } : null

  const openRegion = async (id: string | null) => {
    if (id === null) { setRegion(null); return }
    if (busy) { notifyBlocked(); return }
    const info = regionList.find((r) => r.id === id)
    const data = info ? await loadRegion(id) : null
    if (!info || !data) return
    setRegion({ info, data })
    setInspected(null)
    setTab('forecast')
    fly({ lon: info.center[0], lat: info.center[1], zoom: info.zoom, pitch: 25, bearing: 0 })
  }

  const startDisaster = (kind: DisasterKind, params: DisasterParams, at?: { lon: number; lat: number }) => {
    const center = at ?? inspected ?? hoverStore.get().view ?? { lon: -60.02, lat: -3.12 }
    setDStats(null)
    setDisaster({ tick: ++tick.current, kind, center: { lon: center.lon, lat: center.lat }, params })
    sound.alert()
    if (kind === 'earthquake') sound.quake(params.magnitude)
    else if (kind === 'flood') sound.flood()
    else if (kind === 'wildfire') sound.fire()
    else sound.storm()
  }

  // The assistant bar (button or Ctrl/Cmd+K): what it asks the map to do
  const [assistantOpen, setAssistantOpen] = useState(false)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setAssistantOpen((v) => !v) }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  const runActions = (actions: Action[]) => {
    for (const a of actions) {
      if (a.type === 'fly') fly({ lon: a.lon, lat: a.lat, zoom: a.zoom })
      else if (a.type === 'layer') setOverlays((o) => (a.id in o ? { ...o, [a.id]: { ...o[a.id], on: a.on } } : o))
      else if (a.type === 'tab') { setRightOpen(true); setTab(a.tab) }
      else if (a.type === 'base') setBaseId(a.id)
      else if (a.type === 'allLayers') setOverlays((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ...v, on: a.on }])) as OverlayState)
      else if (a.type === 'region') void openRegion(a.id)
      else if (a.type === 'forecast') { setTab('forecast'); runForecast() }
      else if (a.type === 'wind') setWind(a.on)
      else if (a.type === 'year') { const i = indexFromMs(Date.UTC(a.year, 6, 1)); setIndex(Math.min(TIMELINE_DAYS, Math.max(0, i))); setCommitted(Math.min(TIMELINE_DAYS, Math.max(0, i))) }
      else if (a.type === 'clear') { setDisaster(null); setDStats(null); if (busy) notifyBlocked(); else { setInspected(null); setRegion(null) } }
      else if (a.type === 'disaster') {
        const params = { ...DEFAULT_PARAMS, ...dParams, ...a.params }
        setDKind(a.kind)
        setDParams(params)
        startDisaster(a.kind, params, a.lon !== undefined && a.lat !== undefined ? { lon: a.lon, lat: a.lat } : undefined)
      }
    }
  }
  const assistantContext = [
    `Layers on: ${OVERLAYS.filter((o) => overlays[o.id as OverlayId].on).map((o) => o.id).join(', ') || 'none'}. Air currents: ${wind ? 'on' : 'off'}. Base map: ${baseId}. Panel tab: ${tab}`,
    regionList.length ? `Ready-made regions: ${regionList.map((r) => `${r.id}${r.ready ? '' : ' (being prepared)'}`).join(', ')}` : '',
    inspected ? `Selected place: ${inspected.lat.toFixed(3)}, ${inspected.lon.toFixed(3)}` : 'No place selected',
    region ? `Region open: ${region.info.name}, overall risk ${region.data.risk?.overall.level ?? 'unknown'} (${region.data.risk?.overall.main ?? 'none'}), place ${region.data.risk?.overall.place ?? ''}` : '',
    forecast.result?.risk?.available ? `Forecast of the selected place: overall risk ${forecast.result.risk.overall.level} (${forecast.result.risk.overall.main})` : '',
    `Timeline date: ${new Date(dateMs).toISOString().slice(0, 10)}`,
  ].filter(Boolean).join('. ')

  const savePin = () => {
    if (!inspected) return
    const id = String(Date.now())
    setPins((ps) => [...ps, { ...inspected, id, label: t('Pin {n}', { n: ps.length + 1 }) }])
    setSelectedPinId(id)
  }

  return (
    <div className="app">
      <Suspense fallback={<div className="loading">Loading globe…</div>}>
      <MapView
        baseId={baseId}
        overlays={overlays}
        imageryMs={imgMs}
        inspected={inspected}
        pins={pins}
        selectedPinId={selectedPinId}
        flyTo={flyTo}
        command={command}
        buildings={buildings}
        wind={wind}
        onWind={setWindLive}
        cities={cities}
        blocked={blocked}
        disaster={disaster}
        onDisasterStats={setDStats}
        inspectLevel={forecast.result?.risk?.available ? forecast.result.risk.overall.level : null}
        exaggeration={exaggeration}
        outline={outline}
        marks={marks}
        locked={busy}
        onBlocked={notifyBlocked}
        onPick={(p) => {
          sound.ping()
          setInspected(p)
                setRegion(null)
          setSelectedPinId(null)
        }}
      />
      </Suspense>
      <TopBar
        locked={busy}
        onAssistant={() => setAssistantOpen(true)}
        onFly={(p: CameraPreset) => fly(p)}
        onCity={(c: City) => fly({ lon: c.lon, lat: c.lat, zoom: CITY_3D_ZOOM, bearing: c.bearing })}
        onPlace={(p: Place) => {
          setInspected({ lon: p.lon, lat: p.lat })
          setSelectedPinId(null)
          fly(p)
        }}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onLeft={() => setLeftOpen((v) => !v)}
        onRight={() => setRightOpen((v) => !v)}
      />
      <LayerPanel
        open={leftOpen}
        baseId={baseId}
        onBase={setBaseId}
        overlays={overlays}
        onOverlay={(id: OverlayId, patch) => setOverlays((o) => ({ ...o, [id]: { ...o[id], ...patch } }))}
        cities={cities}
        onCities={setCities}
        buildings={buildings}
        onBuildings={setBuildings}
        wind={wind}
        onWindToggle={setWind}
        exaggeration={exaggeration}
        onExaggeration={setExaggeration}
        disaster={{
          kind: dKind, params: dParams, running: disaster !== null, stats: dStats,
          droughtScore: forecast.result?.risk?.risks.find((r) => r.id === 'drought_fire')?.score ?? null,
          hasPoint: inspected !== null,
          onKind: setDKind, onParams: setDParams,
          onRun: () => startDisaster(dKind, dParams),
          onClear: () => { setDisaster(null); setDStats(null) },
        }}
      />
      <InspectorPanel
        open={rightOpen}
        tab={tab}
        onTab={setTab}
        region={region}
        regions={regionList}
        onRegion={(id) => void openRegion(id)}
        fcYear={fcYear}
        onFcYear={setFcYear}
        analysis={analysis}
        busy={busy}
        onAnalyze={runAnalysis}
        onCancel={cancelAll}
        forecast={forecast}
        onForecast={runForecast}
        nowMs={msFromIndex(index)}
        inspected={inspected}
        pins={pins}
        selectedPinId={selectedPinId}
        onSavePin={savePin}
        onSelectPin={(id) => {
          setSelectedPinId(id)
          const pin = pins.find((x) => x.id === id)
          if (pin) fly({ lon: pin.lon, lat: pin.lat, zoom: 12.4 })
        }}
        onRemovePin={(id) => setPins((ps) => ps.filter((x) => x.id !== id))}
        onClear={() => setInspected(null)}
      />
      <Suspense fallback={null}>
        <MiniMap
          overlays={overlays}
          blocked={blocked}
          imageryMs={imgMs}
          inspected={inspected}
          onGo={(p) => fly({ lon: p.lon, lat: p.lat, zoom: Math.max(hoverStore.get().zoom, 7.5), pitch: 60 })}
        />
      </Suspense>
      {assistantOpen && <Assistant onClose={() => setAssistantOpen(false)} ctx={{ regions: regionList, hasPoint: inspected !== null }} context={assistantContext} run={runActions} />}
      <Hud
        active={OVERLAYS.filter((o) => overlays[o.id as OverlayId].on)}
        blocked={blocked}
        wind={windLive === null ? null : windLive ? 'live' : 'typical'}
        scenario={overlayStatus({}, dateMs) === 'scenario'}
        onZoomIn={() => setCommand({ tick: ++tick.current, type: 'zoomIn' })}
        onZoomOut={() => setCommand({ tick: ++tick.current, type: 'zoomOut' })}
        onNorth={() => setCommand({ tick: ++tick.current, type: 'north' })}
        onTilt={() => setCommand({ tick: ++tick.current, type: 'tilt' })}
      />
      <Timeline
        index={index}
        onIndex={setIndex}
        clamped={clamped}
      />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <div className="credits">
        {t('Sentinel-2 cloudless © EOX · NASA GIBS, GPM IMERG · ASF NISAR and OPERA · Open-Meteo · AWS Terrain Tiles · © OpenStreetMap contributors · MapLibre')}
        {' · '}<Link to="/tecnico">{t('Data and methods')}</Link>
      </div>
    </div>
  )
}
