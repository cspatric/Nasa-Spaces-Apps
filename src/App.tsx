import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Area, CameraCommand, FlyRequest, LonLat, OverlayState, Pin } from './lib/types'
import Assistant from './components/Assistant'
import Hud from './components/Hud'
import InspectorPanel, { type Tab } from './components/InspectorPanel'
import LayerPanel from './components/LayerPanel'
import Timeline from './components/Timeline'
import TopBar from './components/TopBar'
import type { Place } from './components/SearchBox'
import { CITY_3D_ZOOM, DEMO_MS, LATEST_IMAGERY, OVERLAYS, TIMELINE_DAYS, type BaseId, type CameraPreset, type OverlayId } from './lib/catalog'
import type { City } from './lib/cities'
import { imageryMs, indexFromMs, msFromIndex, overlayStatus } from './lib/dates'
import { useLiveSeries } from './lib/live'
import { hoverStore } from './lib/hover'
import type { Action } from './lib/assistant'
import { DEFAULT_PARAMS, type Disaster, type DisasterKind, type DisasterParams, type ZoneStats } from './lib/disasters'
import { useForecast, type ForecastResult } from './lib/forecast'
import { marksFor } from './lib/forecastMarks'
import { useRegions, type RegionInfo } from './lib/regions'
import { useI18n } from './lib/i18n'
import { sound } from './lib/sound'
import { useRain } from './lib/rain'

// The map is the heaviest part: load it after the interface paints.
const MapView = lazy(() => import('./components/MapView'))
const MiniMap = lazy(() => import('./components/MiniMap'))

const initialOverlays = Object.fromEntries(
  OVERLAYS.map((o) => [o.id, { on: false, opacity: o.opacity }]),
) as OverlayState

/** Size (km), the radar window (m) and the center of an area; a rectangle drawn on a tilted map is measured by its ground corners. */
function sizeOf(a: Area) {
  const c = a.corners
  const lat = c ? c.reduce((s, p) => s + p[1], 0) / 4 : (a.north + a.south) / 2
  const lon = c ? c.reduce((s, p) => s + p[0], 0) / 4 : (a.east + a.west) / 2
  const km = (p: [number, number], q: [number, number]) => Math.hypot((q[0] - p[0]) * 111.32 * Math.cos((lat * Math.PI) / 180), (q[1] - p[1]) * 110.57)
  const w = c ? km(c[0], c[1]) : (a.east - a.west) * 111.32 * Math.cos((lat * Math.PI) / 180)
  const h = c ? km(c[1], c[2]) : (a.north - a.south) * 110.57
  return { w, h, lon, lat, windowM: Math.min(5000, Math.max(500, (Math.min(w, h) * 1000) / 2)) }
}

export default function App() {
  const { t } = useI18n()
  const [baseId, setBaseId] = useState<BaseId>('satellite')
  const [overlays, setOverlays] = useState<OverlayState>(initialOverlays)
  const [index, setIndex] = useState(indexFromMs(Math.min(DEMO_MS, LATEST_IMAGERY)))
  const [committed, setCommitted] = useState(index)
  const [playing, setPlaying] = useState(false)
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
  const [selectMode, setSelectMode] = useState(false)
  const [area, setArea] = useState<Area | null>(null)
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

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      if (hoverStore.get().loading) return // wait until the imagery of the current date is on screen
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

  const fly = (p: { lon: number; lat: number; zoom: number; pitch?: number; bearing?: number }) => {
    sound.whoosh()
    setFlyTo({ tick: ++tick.current, lon: p.lon, lat: p.lat, zoom: p.zoom, pitch: p.pitch ?? 60, bearing: p.bearing ?? 20 })
  }

  // Series are read from the backend only for the days around the timeline date, when a point is picked.
  const dateMs = msFromIndex(committed)
  const areaKm = useMemo(() => (area ? sizeOf(area) : null), [area])
  const windowM = areaKm?.windowM ?? 500
  const live = useLiveSeries(inspected, dateMs, LATEST_IMAGERY, windowM)
  const rain = useRain(inspected, dateMs, LATEST_IMAGERY)
  const { state: forecast, run: runForecast } = useForecast(inspected, windowM)

  const imgMs = useMemo(() => imageryMs(committed), [committed])
  // Layers with no real data for the date (not flown yet, or a scenario): not drawn, and marked in the legend
  const blockedKey = OVERLAYS.filter((o) => overlayStatus(o, dateMs) !== 'ok').map((o) => o.id).join(',')
  const blocked = useMemo(() => (blockedKey ? blockedKey.split(',') : []), [blockedKey])
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
  const mapArea = area ?? (region ? { west: region.info.bounds[0], south: region.info.bounds[1], east: region.info.bounds[2], north: region.info.bounds[3] } : null)

  const onArea = (a: Area) => {
    const { w, h, lon, lat } = sizeOf(a)
    setSelectMode(false)
    setRegion(null)
    setSelectedPinId(null)
    sound.ping()
    if (Math.max(w, h) < 0.4) { // a click, not a drag
      setArea(null)
      setInspected({ lon, lat })
      return
    }
    setArea(a)
    setInspected({ lon, lat })
  }

  const openRegion = async (id: string | null) => {
    if (id === null) { setRegion(null); return }
    const info = regionList.find((r) => r.id === id)
    const data = info ? await loadRegion(id) : null
    if (!info || !data) return
    setRegion({ info, data })
    setArea(null)
    setInspected(null)
    setTab('forecast')
    fly({ lon: info.center[0], lat: info.center[1], zoom: info.zoom, pitch: 25, bearing: 0 })
  }

  const startDisaster = (kind: DisasterKind, params: DisasterParams) => {
    const center = inspected ?? hoverStore.get().view ?? { lon: -60.02, lat: -3.12 }
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
      else if (a.type === 'layer') setOverlays((o) => ({ ...o, [a.id]: { ...o[a.id], on: a.on } }))
      else if (a.type === 'allLayers') setOverlays((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ...v, on: a.on }])) as OverlayState)
      else if (a.type === 'region') void openRegion(a.id)
      else if (a.type === 'forecast') { setTab('forecast'); runForecast() }
      else if (a.type === 'wind') setWind(a.on)
      else if (a.type === 'year') { const i = indexFromMs(Date.UTC(a.year, 6, 1)); setPlaying(false); setIndex(Math.min(TIMELINE_DAYS, Math.max(0, i))); setCommitted(Math.min(TIMELINE_DAYS, Math.max(0, i))) }
      else if (a.type === 'clear') { setDisaster(null); setDStats(null); setInspected(null); setArea(null); setRegion(null) }
      else if (a.type === 'disaster') {
        const params = { ...DEFAULT_PARAMS, ...dParams, ...a.params }
        setDKind(a.kind)
        setDParams(params)
        startDisaster(a.kind, params)
      }
    }
  }
  const assistantContext = [
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
        selectMode={selectMode}
        area={mapArea}
        onArea={onArea}
        marks={marks}
        onPick={(p) => {
          sound.ping()
          setInspected(p)
          setArea(null)
          setRegion(null)
          setSelectedPinId(null)
        }}
      />
      </Suspense>
      <TopBar
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
        area={area}
        areaKm={areaKm}
        selectMode={selectMode}
        onSelectMode={setSelectMode}
        live={live}
        rain={rain}
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
        onClear={() => { setInspected(null); setArea(null) }}
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
        selecting={selectMode}
        onSelect={() => setSelectMode((v) => !v)}
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
      <div className="credits">
        {t('Sentinel-2 cloudless © EOX · NASA GIBS, GPM IMERG · ASF NISAR and OPERA · Open-Meteo · AWS Terrain Tiles · © OpenStreetMap contributors · MapLibre')}
      </div>
    </div>
  )
}
